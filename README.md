Overview
Hospital readmissions within 30 days are costly and often preventable. This project builds a machine learning pipeline that:

Predicts whether a diabetic patient will be readmitted within 30 days.

Provides explanations using SHAP values – why a particular patient is at high or low risk.

Optimises the decision threshold to balance the cost of missing a readmission (false negative) vs. false alarms (false positive).

Exposes a REST API (FastAPI) and a React dashboard for easy use by clinicians or care teams.

The model achieves 74.5% recall on the test set, meaning it catches nearly 3 out of 4 high‑risk patients while keeping false alerts manageable.

 Features
✅ End‑to‑end ML pipeline – from raw CSV to production‑ready model.

✅ Stacking ensemble – XGBoost + RandomForest with a logistic regression meta‑learner.

✅ Cost‑based threshold tuning – minimise total cost (10 × FN + 1 × FP).

✅ SHAP explanations – understand which features drove each prediction.

✅ Feature engineering – create long_stay, high_risk, frequent_visitor, elderly_with_prior, complex_case and many more.

✅ FastAPI backend – /predict, /predict_single, /shap_explain, /health.

✅ React frontend – intuitive forms, risk visualisation, SHAP waterfall list.

✅ Production ready – CORS enabled, model serialised with joblib.

📊 Dataset
The model is trained on the Diabetes 130-US hospitals dataset (1999–2008), containing ~100,000 encounters of diabetic patients.
Original source: UCI Machine Learning Repository.

Key preprocessing steps (already applied in model.py):

Drop redundant columns (weight, payer_code, medical_specialty, several drug columns).

Remove invalid discharge dispositions and unknown gender.

Map readmitted to binary: {'>30', 'NO'} → 0, '<30' → 1.

Handle missing diagnostic codes (? → 'Unknown').

Create medication flags (_steady, _down, _up) for 15 diabetes drugs.

Group ICD‑9 diagnosis codes into 9 clinical categories (Circulatory, Respiratory, Diabetes, etc.).

Engineer new features: labs_per_day, total_visits, complex_case, chronic_problem, age_A1C, etc.

After cleaning and filtering, the final dataset contains ~65,000 encounters.

🧠 Methodology
1. Feature Engineering (Train‑only to avoid leakage)
Feature Group	Examples
Medication	num_meds_steady, num_meds_changed, insulin_steady
Visit history	total_visits, has_prior_inpatient, frequent_visitor
Risk indicators	high_risk (ER>0 or inpatient>1), chronic_problem
Length of stay	long_stay (> median 4 days), labs_per_day
Demographics	age (numeric), is_elderly, elderly_with_prior
Clinical	A1Cresult (numeric), max_glu_serum, complex_case
Diagnosis groups	One‑hot encoded diag_1_group, diag_2_group, diag_3_group
Interactions	age_A1C, age_num_meds

Model Architecture
StackingClassifier(
    estimators=[
        ('xgb', XGBClassifier(...)),      # tuned with RandomizedSearchCV
        ('rf',  RandomForestClassifier(...))  # tuned with class_weight='balanced_subsample'
    ],
    final_estimator=LogisticRegression(class_weight='balanced')
)
Base models: XGBoost and RandomForest – both capture non‑linear interactions and handle class imbalance.

Meta‑learner: Logistic Regression that optimally combines the two base models’ probability outputs.

. Imbalance Handling
The dataset is imbalanced (≈2.5:1 majority class).
We use:

scale_pos_weight in XGBoost (imbalance ratio × 1.5).

class_weight='balanced_subsample' in RandomForest.

class_weight='balanced' in the final logistic regression.

Cost‑sensitive threshold tuning on the validation set (cost of FN = 10, cost of FP = 1).

Threshold Optimisation
Instead of the default 0.5, we find the threshold that minimises:
Total Cost = FN × 10 + FP × 1
The best threshold is typically around 0.23–0.30, which increases recall (catches more readmissions) at the expense of precision.

Explainability with SHAP
We use the XGBoost model (one of the base models) to generate SHAP values.
The API returns the top 10 features that pushed the prediction higher or lower, along with their SHAP contributions.

 Model Performance
Metric	Value
Recall	74.5%
Precision	15.3%
F1 Score	0.25
ROC‑AUC	0.72
True Negatives: 3893 (correctly predicted no readmission)

False Positives: 2500 (alerted but no readmission)

False Negatives: 291 (missed readmission – costly)

True Positives: 848 (correctly identified readmission)

SHAP Explainability – Example
For a patient predicted as high risk (probability > threshold), the API returns:
"shap_explanation": [
  {"feature": "number_inpatient", "shap_value": 0.12, "impact": "increased", "value": 4},
  {"feature": "insulin_steady",    "shap_value": -0.08, "impact": "decreased", "value": 1},
  {"feature": "age",               "shap_value": 0.06, "impact": "increased", "value": 85},
  ...
]

Tech Stack
Component	Technology
ML Pipeline	Python, Pandas, Scikit‑learn, XGBoost
Explainability	SHAP
API	FastAPI, Uvicorn, Joblib
Frontend	React 18, React Router, TailwindCSS

Installation & Setup
Prerequisites
Python 3.8+ and pip

Node.js 16+ and npm

1. Clone the repository
2. git clone https://github.com/yourusername/diabetic-readmission-predictor.git
cd diabetic-readmission-predictor

2. Backend setup (FastAPI + ML)
3. # Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt
requirements.txt (example – adjust as needed):
pandas
numpy
scikit-learn
xgboost
shap
joblib
fastapi
uvicorn
matplotlib
seaborn

3. Train the model (produces .pkl files)
 python model.py

This will generate:

stacking_model.pkl – the trained stacking classifier

best_threshold.pkl – cost‑optimal threshold

shap_explainer.pkl – SHAP explainer for XGBoost

feature_names.pkl – list of feature columns used during training

4. Start the FastAPI server
5.  Frontend setup (React)

cd frontend   # or wherever your React app lives (adjust path)
npm install
npm start

API Endpoints
Method	Endpoint	Description
GET	/	Health check & welcome message
GET	/health	Returns {"status": "healthy", "model_loaded": true}
POST	/predict	Upload CSV file → batch predictions
POST	/predict_single	JSON patient data → single prediction
POST	/shap_explain	JSON patient data → prediction + SHAP explanation

Example /predict_single request body:

{
  "race": "Caucasian",
  "gender": "Male",
  "age": "[70-80)",
  "time_in_hospital": 6,
  "num_lab_procedures": 45,
  "num_medications": 18,
  "number_outpatient": 1,
  "number_emergency": 0,
  "number_inpatient": 2,
  "number_diagnoses": 9,
  "change": "Ch",
  "diabetesMed": "Yes",
  "A1Cresult": ">7",
  "max_glu_serum": ">200",
  "diag_1": "250.00",
  "diag_2": "401.9",
  "diag_3": "780.2"
}

Example response:
{
  "prediction": 1,
  "probability": 0.67,
  "threshold": 0.23,
  "risk_label": "HIGH RISK - Readmission <30 days"
}

 Frontend:
<img width="1340" height="625" alt="project 2" src="https://github.com/user-attachments/assets/c3327d6c-90db-44ab-83c9-14a4e7ca1d51" />
<img width="1347" height="628" alt="proejct 2" src="https://github.com/user-attachments/assets/243c07fe-15c1-4bdf-ad21-fbaaa8719da9" />
<img width="1351" height="636" alt="project 2 2" src="https://github.com/user-attachments/assets/202e635c-b3b8-4373-92c5-8f23e601e1d0" />
<img width="1351" height="625" alt="proejct 2 3" src="https://github.com/user-attachments/assets/3efcc498-67d8-41a2-af5e-1a7f8d84f5ca" />
<img width="1347" height="633" alt="proejct 2 4" src="https://github.com/user-attachments/assets/f6dffaf8-4b3b-4b27-b5ab-5c8407d0ce37" />
<img width="1338" height="631" alt="proejct 2 5" src="https://github.com/user-attachments/assets/3671afb6-f148-4d24-8adb-4bc1e0b30be6" />

 Project Structure
 .
├── model.py                # Training, EDA, feature engineering, saving models
├── app.py                  # FastAPI server, preprocessing, endpoints
├── requirements.txt        # Python dependencies
├── diabetic_data.csv       # Dataset (not included, download separately)
├── stacking_model.pkl      # Serialised stacking model (generated)
├── best_threshold.pkl      # Threshold (generated)
├── shap_explainer.pkl      # SHAP explainer (generated)
├── feature_names.pkl       # Feature list (generated)
└── frontend/               # React application
    ├── public/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Predict.jsx
    │   │   └── Interpret.jsx
    │   ├── contexts/
    │   │   └── PredictionContext.jsx
    │   └── App.css
    ├── package.json
    └── ...






