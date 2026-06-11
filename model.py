import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.metrics import (confusion_matrix, f1_score, recall_score,
                              precision_score, roc_auc_score, classification_report)
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV  # optional, for probability calibration
from xgboost import XGBClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import shap
import joblib

# 1. Load and initial cleaning
diabetes_data = pd.read_csv("diabetic_data.csv")
print("Original shape:", diabetes_data.shape)

cols_to_drop = ['weight', 'payer_code', 'medical_specialty', 'encounter_id',
                'patient_nbr', 'acetohexamide', 'troglitazone', 'tolbutamide',
                'examide', 'citoglipton', 'glimepiride-pioglitazone',
                'metformin-rosiglitazone', 'metformin-pioglitazone']
diabetes_data = diabetes_data.drop(columns=cols_to_drop, errors='ignore')

if 'race' in diabetes_data.columns:
    diabetes_data['race'] = diabetes_data['race'].replace('?', 'Unknown')
for col in ['diag_1', 'diag_2', 'diag_3']:
    if col in diabetes_data.columns:
        diabetes_data[col] = diabetes_data[col].replace('?', 'Unknown')

# Remove specific discharge dispositions and unknown gender
diabetes_data = diabetes_data[~diabetes_data['discharge_disposition_id'].isin([11,13,14,19,20,21])]
diabetes_data = diabetes_data[diabetes_data['readmitted'].notna()]
diabetes_data = diabetes_data[diabetes_data['gender'] != 'Unknown/Invalid']
diabetes_data.reset_index(drop=True, inplace=True)

print(f"Data retained: {len(diabetes_data)/101766*100:.1f}%")

# 2. Exploratory Data Analysis (EDA) – unchanged
missing = diabetes_data.isnull().sum().sort_values(ascending=False)
print(missing[missing > 0])

# Age distribution
sns.histplot(diabetes_data['age'], bins=10)
plt.title("Age Distribution of Patients")
plt.show()

# Readmission distribution
sns.countplot(x='readmitted', data=diabetes_data)
plt.title("Distribution of Readmission")
plt.xlabel("Readmitted")
plt.ylabel("Count")
plt.show()

# Readmission by gender
sns.countplot(x='gender', hue='readmitted', data=diabetes_data)
plt.title("Readmission by Gender")
plt.show()

# Medication change vs readmission
sns.countplot(x='change', hue='readmitted', data=diabetes_data)
plt.title("Medication Change vs Readmission")
plt.show()

# Diabetes medication vs readmission
sns.countplot(x='diabetesMed', hue='readmitted', data=diabetes_data)
plt.title("Diabetes Medication vs Readmission")
plt.legend(title='Readmitted', labels=['No readmission', 'Readmitted <30 days', 'Readmitted >30 days'])
plt.show()

# Numerical feature distributions
num_cols = ['time_in_hospital','num_lab_procedures','num_medications','number_diagnoses']
for col in num_cols:
    sns.histplot(diabetes_data[col], bins=20)
    plt.title(f"Distribution of {col}")
    plt.show()

# Hospital stay vs readmission
sns.boxplot(x='readmitted', y='time_in_hospital', data=diabetes_data)
plt.title("Hospital Stay vs Readmission")
plt.show()

# Diagnoses count vs readmission
sns.boxplot(x='readmitted', y='number_diagnoses', data=diabetes_data)
plt.title("Diagnoses Count vs Readmission")
plt.show()

# Age group vs readmission
sns.countplot(x='age', hue='readmitted', data=diabetes_data)
plt.xticks(rotation=45)
plt.title("Age Group vs Readmission")
plt.show()

# Correlation matrix
age_mapping_eda = {
    '[0-10)': 5, '[10-20)': 15, '[20-30)': 25, '[30-40)': 35, '[40-50)': 45,
    '[50-60)': 55, '[60-70)': 65, '[70-80)': 75, '[80-90)': 85, '[90-100)': 95
}
diabetes_data['age_numeric'] = diabetes_data['age'].map(age_mapping_eda)
corr_vars = ['time_in_hospital', 'num_lab_procedures', 'num_medications', 'number_diagnoses',
             'number_inpatient', 'number_emergency', 'number_outpatient', 'age_numeric']
corr_matrix = diabetes_data[corr_vars].corr(method='pearson')
plt.figure(figsize=(10,8))
sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap='coolwarm', square=True, linewidths=0.5)
plt.title("Correlation of Hospital Utilization and Age")
plt.yticks(rotation=0)
plt.tight_layout()
plt.show()

diabetes_data.drop('age_numeric', axis=1, inplace=True)

# 3. Prepare target variable

diabetes_data['readmitted'] = diabetes_data['readmitted'].replace({'>30': 0, 'NO': 0, '<30': 1})

# 4. Train/Test split (early)
X = diabetes_data.drop(['readmitted'], axis=1)
y = diabetes_data['readmitted']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
y_train = y_train.astype(int)
y_test = y_test.astype(int)

# 5. Feature Engineering (using train only)
def preprocess_features(X_train, X_test):
    """
    Apply all feature transformations using statistics from X_train.
    Returns transformed X_train and X_test.
    """
    X_train = X_train.copy()
    X_test = X_test.copy()

    # A1C and glucose mapping
    for df in [X_train, X_test]:
        if 'A1Cresult' in df.columns:
            df['A1Cresult'] = pd.to_numeric(df['A1Cresult'].replace({'Norm': 0, '>7': 1, '>8': 2, 'None': -1}), errors='coerce').fillna(-1).astype('float64')
        if 'max_glu_serum' in df.columns:
            df['max_glu_serum'] = pd.to_numeric(df['max_glu_serum'].replace({'Norm': 0, '>200': 1, '>300': 2, 'None': -1}), errors='coerce').fillna(-1).astype('float64')

    # Medication columns: create binary flags for Steady, Down, Up
    meds = ['metformin', 'repaglinide', 'nateglinide', 'chlorpropamide', 'glimepiride',
            'glipizide', 'glyburide', 'pioglitazone', 'rosiglitazone', 'acarbose',
            'miglitol', 'insulin', 'glyburide-metformin', 'tolazamide', 'glipizide-metformin']
    for df in [X_train, X_test]:
        for col in meds:
            if col in df.columns:
                df[f'{col}_steady'] = (df[col] == 'Steady').astype(int)
                df[f'{col}_down'] = (df[col] == 'Down').astype(int)
                df[f'{col}_up'] = (df[col] == 'Up').astype(int)
                df.drop(columns=[col], inplace=True)

    # Aggregate medication indicators
    for df in [X_train, X_test]:
        med_steady_cols = [c for c in df.columns if c.endswith('_steady')]
        med_down_cols   = [c for c in df.columns if c.endswith('_down')]
        med_up_cols     = [c for c in df.columns if c.endswith('_up')]
        df['num_meds_steady'] = df[med_steady_cols].sum(axis=1)
        df['num_meds_down']   = df[med_down_cols].sum(axis=1)
        df['num_meds_up']     = df[med_up_cols].sum(axis=1)
        df['num_meds_changed'] = df[med_up_cols + med_down_cols].sum(axis=1)

    # Gender (already binary)
    for df in [X_train, X_test]:
        df['gender'] = df['gender'].map({'Male': 1, 'Female': 0})

    # Change and diabetesMed
    for df in [X_train, X_test]:
        df['change'] = df['change'].map({'Ch': 1, 'No': 0})
        df['diabetesMed'] = df['diabetesMed'].map({'Yes': 1, 'No': 0})

    # Diagnosis grouping
    diagnosis_groups = {
        'Circulatory': [(390, 459), (785, 785)],
        'Respiratory': [(460, 519), (786, 786)],
        'Digestive':   [(520, 579), (787, 787)],
        'Diabetes':    [(250, 250)],
        'Injury':      [(800, 999)],
        'Musculoskeletal': [(710, 739)],
        'Genitourinary':   [(580, 629), (788, 788)],
        'Neoplasms':   [(140, 239)],
        'Mental':      [(290, 319)]
    }
    def map_diag(code):
        code = str(code).strip()
        if code in ['?', 'Unknown', 'unknown', 'na', 'nan', '']:
            return 'Unknown'
        if code.startswith(('E', 'V')):
            return 'Other'
        try:
            code_int = int(float(code.split('.')[0]))
        except:
            return 'Unknown'
        for group, ranges in diagnosis_groups.items():
            for start, end in ranges:
                if start <= code_int <= end:
                    return group
        return 'Other'

    for df in [X_train, X_test]:
        for col in ['diag_1', 'diag_2', 'diag_3']:
            if col in df.columns:
                df[f'{col}_group'] = df[col].apply(map_diag)
                df.drop(columns=[col], inplace=True)

    # Age mapping
    age_mapping = {
        '[0-10)': 5, '[10-20)': 15, '[20-30)': 25, '[30-40)': 35, '[40-50)': 45,
        '[50-60)': 55, '[60-70)': 65, '[70-80)': 75, '[80-90)': 85, '[90-100)': 95
    }
    for df in [X_train, X_test]:
        df['age'] = df['age'].map(age_mapping).fillna(0)

    # Additional features (using train statistics for thresholds)
    median_stay = X_train['time_in_hospital'].median()
    for df in [X_train, X_test]:
        df['long_stay'] = (df['time_in_hospital'] > median_stay).astype(int)

    for df in [X_train, X_test]:
        df['high_risk'] = ((df['number_emergency'] > 0) | (df['number_inpatient'] > 1)).astype(int)
        df['total_visits'] = df['number_inpatient'] + df['number_outpatient'] + df['number_emergency']
        df['frequent_visitor'] = (df['total_visits'] >= 3).astype(int)
        df['labs_per_day'] = df['num_lab_procedures'] / (df['time_in_hospital'] + 1)
        df['has_prior_inpatient'] = (df['number_inpatient'] > 0).astype(int)
        df['is_elderly'] = (df['age'] >= 70).astype(int)
        df['elderly_with_prior'] = df['is_elderly'] * df['has_prior_inpatient']
        df['total_meds'] = df['num_meds_steady'] + df['num_meds_down'] + df['num_meds_up']
        df['complex_case'] = ((df['total_meds'] >= 10) & (df['time_in_hospital'] >= 5)).astype(int)
        df['chronic_problem'] = ((df['number_emergency'] > 0) & (df['number_inpatient'] > 0)).astype(int)
        if 'A1Cresult' in df.columns and pd.api.types.is_numeric_dtype(df['A1Cresult'].dtype) and pd.api.types.is_numeric_dtype(df['age'].dtype):
            df['age_A1C'] = (df['age'] * df['A1Cresult']).astype('float64')
        df['age_num_meds'] = df['age'] * df['total_meds']
        if 'num_procedures' in df.columns:
            df['total_procedures_meds'] = df['num_procedures'] + df['num_medications']

    # One-hot encoding (exclude gender because it's already numeric)
    categorical_cols = ['race', 'diag_1_group', 'diag_2_group', 'diag_3_group']
    X_train = pd.get_dummies(X_train, columns=categorical_cols, drop_first=True, dtype=int)
    X_test  = pd.get_dummies(X_test,  columns=categorical_cols, drop_first=True, dtype=int)

    # Align test columns with train
    missing_cols = set(X_train.columns) - set(X_test.columns)
    for col in missing_cols:
        X_test[col] = 0
    X_test = X_test[X_train.columns]

    # Force all remaining object columns to numeric (safety net)
    obj_cols_train = X_train.select_dtypes(include=['object']).columns
    if len(obj_cols_train) > 0:
        print(f"Converting object columns in train: {list(obj_cols_train)}")
        for col in obj_cols_train:
            X_train[col] = pd.to_numeric(X_train[col], errors='coerce').fillna(0).astype('int32')
    
    obj_cols_test = X_test.select_dtypes(include=['object']).columns
    if len(obj_cols_test) > 0:
        print(f"Converting object columns in test: {list(obj_cols_test)}")
        for col in obj_cols_test:
            X_test[col] = pd.to_numeric(X_test[col], errors='coerce').fillna(0).astype('int32')

    print(f"Final X_train object dtypes count: {(X_train.dtypes == 'object').sum()}")
    if (X_train.dtypes == 'object').sum() > 0:
        raise ValueError("Object dtypes still present in X_train!")

    return X_train, X_test

# Apply preprocessing
X_train, X_test = preprocess_features(X_train, X_test)
print(f"Training set shape: {X_train.shape}")
print(f"Test set shape: {X_test.shape}")

# 6. Split training into train + validation
X_train, X_val, y_train, y_val = train_test_split(
    X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
)
y_train = y_train.astype(int)
y_val = y_val.astype(int)

# 7. Model training and tuning
imbalance_ratio = len(y_train[y_train==0]) / len(y_train[y_train==1])
print(f"Imbalance ratio: {imbalance_ratio:.2f}:1")

# XGBoost hyperparameter tuning
xgb_param_dist = {
    'n_estimators': [300, 400, 500],
    'max_depth': [3, 4, 5],
    'learning_rate': [0.03, 0.05, 0.07],
    'gamma': [0, 0.5, 1],
    'min_child_weight': [3, 5, 7],
    'subsample': [0.7, 0.8],
    'colsample_bytree': [0.7, 0.8]
}
xgb_random = RandomizedSearchCV(
    estimator=XGBClassifier(scale_pos_weight=imbalance_ratio * 1.5, random_state=42,
                            eval_metric='logloss', n_jobs=-1),
    param_distributions=xgb_param_dist,
    n_iter=20, scoring='f1', cv=3, verbose=1, random_state=42, n_jobs=-1
)
xgb_random.fit(X_train, y_train)
print("Best XGB params:", xgb_random.best_params_)
xgb_model = xgb_random.best_estimator_

# Random Forest hyperparameter tuning (with class_weight='balanced_subsample')
rf_param_dist = {
    'n_estimators': [200, 300, 400],
    'max_depth': [8, 10, 12],
    'min_samples_split': [5, 10, 15],
    'min_samples_leaf': [1, 2, 4]
}
rf_random = RandomizedSearchCV(
    estimator=RandomForestClassifier(class_weight='balanced_subsample', random_state=42, n_jobs=-1),
    param_distributions=rf_param_dist,
    n_iter=15, scoring='f1', cv=3, verbose=1, random_state=42, n_jobs=-1
)
rf_random.fit(X_train, y_train)
print("Best RF params:", rf_random.best_params_)
rf_model = rf_random.best_estimator_

# Stacking with class_weight='balanced' for final logistic regression
base_models = [
    ('xgb', xgb_model),
    ('rf', rf_model)
]
stacking_clf = StackingClassifier(
    estimators=base_models,
    final_estimator=LogisticRegression(C=1.0, class_weight='balanced', random_state=42),
    cv=3,
    stack_method='predict_proba'
)
stacking_clf.fit(X_train, y_train)

# 8. Cost-based threshold tuning on validation set

y_probs_val = stacking_clf.predict_proba(X_val)[:, 1]

cost_fn = 10   # cost of missing a readmission (false negative)
cost_fp = 1    # cost of a false alarm (false positive)
best_thresh = 0
min_cost = np.inf
for t in np.arange(0.10, 0.60, 0.01):
    y_pred_t = (y_probs_val >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_val, y_pred_t).ravel()
    total_cost = fn * cost_fn + fp * cost_fp
    if total_cost < min_cost:
        min_cost = total_cost
        best_thresh = t
print(f"Best threshold (cost-based): {best_thresh:.2f} (cost={min_cost:.2f})")

# 9. Final evaluation on test set
y_probs_test = stacking_clf.predict_proba(X_test)[:, 1]
y_pred_test = (y_probs_test >= best_thresh).astype(int)

recall = recall_score(y_test, y_pred_test)
precision = precision_score(y_test, y_pred_test, zero_division=0)
f1 = f1_score(y_test, y_pred_test)
roc_auc = roc_auc_score(y_test, y_probs_test)
cm = confusion_matrix(y_test, y_pred_test)

print("\n" + "="*50)
print("FINAL RESULTS (Stacking Model)")
print("="*50)
print(f"Threshold: {best_thresh:.4f}")
print("Confusion Matrix:")
print(cm)
print("\nClassification Report:")
print(classification_report(y_test, y_pred_test))
print(f"\nRecall: {recall:.4f}, Precision: {precision:.4f}, F1: {f1:.4f}, ROC-AUC: {roc_auc:.4f}")

# 10. SHAP explanation (optional)

explainer = shap.Explainer(xgb_model, X_train)
shap_values = explainer(X_val)  # use validation set to avoid overfitting
shap.summary_plot(shap_values, X_val)

# Optionally prune low‑importance features (e.g., keep top 50)
feature_importance = np.abs(shap_values.values).mean(axis=0)
top_n = 50
top_features_idx = np.argsort(feature_importance)[-top_n:]
top_features = X_train.columns[top_features_idx]
print(f"\nKeeping top {top_n} features: {list(top_features)}")

# 11. Save model, threshold, SHAP explainer for API
joblib.dump(stacking_clf, 'stacking_model.pkl')
joblib.dump(best_thresh, 'best_threshold.pkl')
joblib.dump(explainer, 'shap_explainer.pkl')
joblib.dump(list(X_train.columns), 'feature_names.pkl')
print("Model, threshold, SHAP explainer, and features saved for API.")
