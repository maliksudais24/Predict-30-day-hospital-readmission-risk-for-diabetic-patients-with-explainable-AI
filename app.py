from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import joblib
import io
import numpy as np
from typing import List, Dict
import uvicorn

app = FastAPI(title="Diabetic Readmission Predictor")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and threshold
try:
    model = joblib.load('stacking_model.pkl')
    threshold = joblib.load('best_threshold.pkl')
    shap_explainer = joblib.load('shap_explainer.pkl')
    feature_names = joblib.load('feature_names.pkl')
    print(f"Model loaded. Threshold: {threshold}, Features: {len(feature_names)}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    threshold = 0.5
    shap_explainer = None
    feature_names = []

def preprocess_features_api(patient_df):
    # \"\"\"
    # Ported from model.py - preprocess single patient row to full feature vector.
    # Uses fixed med list (assume No for missing -> Steady=0, etc.), train median, no train stats needed.
    # \"\"\"
    df = patient_df.copy()
    
    # SAFE NUMERIC CONVERSION FIRST - Fix TypeError root cause
    numeric_fields = [
        'time_in_hospital', 'num_lab_procedures', 'num_medications', 
        'number_outpatient', 'number_emergency', 'number_inpatient', 
        'number_diagnoses'
    ]
    for field in numeric_fields:
        if field in df.columns:
            df[field] = pd.to_numeric(df[field], errors='coerce').fillna(0).astype(float)
    
    # Early age mapping (before other processing)
    age_mapping = {'[0-10)':5,'[10-20)':15,'[20-30)':25,'[30-40)':35,'[40-50)':45,
                   '[50-60)':55,'[60-70)':65,'[70-80)':75,'[80-90)':85,'[90-100)':95}
    if 'age' in df.columns:
        df['age'] = df['age'].map(age_mapping).fillna(0).astype(float)
    
    # Input validation
    time_hosp = df.iloc[0].get('time_in_hospital', 0)
    if time_hosp < 0 or time_hosp > 100:
        raise ValueError("time_in_hospital must be between 0-100")
    print(f"DEBUG: Input validation passed. time_in_hospital={time_hosp}")
    
    # A1C and glucose
    if 'A1Cresult' in df.columns:
        df['A1Cresult'] = pd.to_numeric(df['A1Cresult'].replace({'Norm': 0, '>7': 1, '>8': 2, 'None': -1}), errors='coerce').fillna(-1)
    if 'max_glu_serum' in df.columns:
        df['max_glu_serum'] = pd.to_numeric(df['max_glu_serum'].replace({'Norm': 0, '>200': 1, '>300': 2, 'None': -1}), errors='coerce').fillna(-1)
    
    # Fixed meds list - create flags (assume missing=No -> no flags)
    meds = ['metformin', 'repaglinide', 'nateglinide', 'chlorpropamide', 'glimepiride',
            'glipizide', 'glyburide', 'pioglitazone', 'rosiglitazone', 'acarbose',
            'miglitol', 'insulin', 'glyburide-metformin', 'tolazamide', 'glipizide-metformin']
    for col in meds:
        if col in df.columns:
            df[f'{col}_steady'] = (df[col] == 'Steady').astype(int)
            df[f'{col}_down'] = (df[col] == 'Down').astype(int)
            df[f'{col}_up'] = (df[col] == 'Up').astype(int)
            df.drop(columns=[col], inplace=True)
    
    # Med aggregates
    med_steady_cols = [c for c in df.columns if c.endswith('_steady')]
    med_down_cols = [c for c in df.columns if c.endswith('_down')]
    med_up_cols = [c for c in df.columns if c.endswith('_up')]
    df['num_meds_steady'] = df[med_steady_cols].sum(axis=1) if len(med_steady_cols) > 0 else 0
    df['num_meds_down'] = df[med_down_cols].sum(axis=1) if len(med_down_cols) > 0 else 0
    df['num_meds_up'] = df[med_up_cols].sum(axis=1) if len(med_up_cols) > 0 else 0
    changed_cols = med_up_cols + med_down_cols
    df['num_meds_changed'] = df[changed_cols].sum(axis=1) if len(changed_cols) > 0 else 0
    print(f"DEBUG: Med cols - steady:{len(med_steady_cols)}, down:{len(med_down_cols)}, up:{len(med_up_cols)}")
    
    # Basic maps
    if 'gender' in df: df['gender'] = df['gender'].map({'Male': 1, 'Female': 0}).fillna(0)
    if 'change' in df: df['change'] = df['change'].map({'Ch': 1, 'No': 0}).fillna(0)
    if 'diabetesMed' in df: df['diabetesMed'] = df['diabetesMed'].map({'Yes': 1, 'No': 0}).fillna(0)
    
    # Diagnosis grouping (assume Unknown if missing) - INDENT FIXED
    diagnosis_groups = {
        'Circulatory': [(390, 459), (785, 785)], 'Respiratory': [(460, 519), (786, 786)],
        'Digestive': [(520, 579), (787, 787)], 'Diabetes': [(250, 250)],
        'Injury': [(800, 999)], 'Musculoskeletal': [(710, 739)],
        'Genitourinary': [(580, 629), (788, 788)], 'Neoplasms': [(140, 239)],
        'Mental': [(290, 319)]
    }
    
    def map_diag(code):
        code = str(code).strip()
        if code in ['?', 'Unknown', 'V', 'E', '', 'nan']:
            return 'Unknown'
        try:
            code_clean = str(code).split('.')[0].strip()
            code_int = int(float(code_clean))
            for group, ranges in diagnosis_groups.items():
                for start, end in ranges:
                    if start <= code_int <= end: 
                        return group
            return 'Other'
        except:
            return 'Unknown'
    
    for col in ['diag_1', 'diag_2', 'diag_3']:
        if col in df.columns:
            df[f'{col}_group'] = df[col].apply(map_diag)
            df.drop(columns=[col], inplace=True)
    
    # Age numeric
    age_mapping = {'[0-10)':5,'[10-20)':15,'[20-30)':25,'[30-40)':35,'[40-50)':45,
                   '[50-60)':55,'[60-70)':65,'[70-80)':75,'[80-90)':85,'[90-100)':95}
    if 'age' in df: df['age'] = df['age'].map(age_mapping).fillna(0)
    
    # Engineered features (fixed median_stay ~4 from typical data)
    median_stay = 4
    df['long_stay'] = (df.get('time_in_hospital', 0) > median_stay).astype(int)
    num_emerg = df.get('number_emergency', pd.Series([0.0], index=df.index))
    num_inpat = df.get('number_inpatient', pd.Series([0.0], index=df.index))
    df['high_risk'] = ((num_emerg > 0) | (num_inpat > 1)).astype(int)
    df['total_visits'] = num_inpat + df.get('number_outpatient', pd.Series([0.0], index=df.index)) + num_emerg
    df['frequent_visitor'] = (df['total_visits'] >= 3).astype(int)
    num_lab = df.get('num_lab_procedures', pd.Series([0.0], index=df.index))
    num_hosp = df.get('time_in_hospital', pd.Series([1.0], index=df.index))
    df['labs_per_day'] = num_lab / num_hosp
    df['has_prior_inpatient'] = (num_inpat > 0).astype(int)
    print(f"DEBUG: high_risk:{df['high_risk'].iloc[0]}, frequent_visitor:{df['frequent_visitor'].iloc[0]}")
    df['is_elderly'] = (df['age'] >= 70).astype(int)
    df['elderly_with_prior'] = df['is_elderly'] * df['has_prior_inpatient']
    df['total_meds'] = df['num_meds_steady'] + df['num_meds_down'] + df['num_meds_up']
    num_hosp = df.get('time_in_hospital', pd.Series([0.0], index=df.index))
    df['complex_case'] = ((df['total_meds'] >= 10) & (num_hosp >= 5)).astype(int)
    num_emerg = df.get('number_emergency', pd.Series([0.0], index=df.index))
    num_inpat = df.get('number_inpatient', pd.Series([0.0], index=df.index))
    df['chronic_problem'] = ((num_emerg > 0) & (num_inpat > 0)).astype(int)
    print(f"DEBUG: Engineered - complex_case:{df['complex_case'].iloc[0]}, chronic_problem:{df['chronic_problem'].iloc[0]}")
    if 'A1Cresult' in df.columns: 
        df['A1Cresult'] = pd.to_numeric(df['A1Cresult'], errors='coerce').fillna(-1)
        df['age_A1C'] = (df['age'] * df['A1Cresult']).astype(float)
    df['age_num_meds'] = df['age'] * df['total_meds']
    
    # One-hot categoricals
    cat_cols = ['race', 'diag_1_group', 'diag_2_group', 'diag_3_group']
    for col in cat_cols:
        if col in df.columns:
            dummies = pd.get_dummies(df[col], prefix=col, drop_first=True, dtype=int)
            df = pd.concat([df, dummies], axis=1)
            df.drop(col, axis=1, inplace=True)
    print(f"DEBUG: After categoricals, df shape: {df.shape}")
    
    # Final numeric safety net (most already converted)
    for col in df.columns: 
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Reindex to model features
    df = df.reindex(columns=feature_names, fill_value=0)
    
    return df

@app.get("/")
def read_root():
    return {"message": "Diabetic Readmission API - Upload CSV for predictions"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Run model.py first.")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV is empty")
        
        # Assume preprocessed input or add preprocess_features here
        probs = model.predict_proba(df)[:, 1]
        predictions = (probs >= threshold).astype(int)
        
        results = {
            "predictions": predictions.tolist(),
            "probabilities": probs.tolist(),
            "threshold": float(threshold),
            "n_high_risk": int(np.sum(predictions)),
            "data_shape": df.shape
        }
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_single")
async def predict_single(patient_data: Dict):
    print(f"DEBUG: predict_single called with data keys: {list(patient_data.keys())}")
    """Predict single patient (JSON input)"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        df = preprocess_features_api(pd.DataFrame([patient_data]))
        print(f"DEBUG: Preprocessed df shape: {df.shape}, columns match model: {df.shape[1] == len(feature_names)}")
        
        prob = model.predict_proba(df)[:, 1][0]
        prediction = 1 if prob >= threshold else 0
        
        return {
            "prediction": int(prediction),
            "probability": float(prob),
            "threshold": float(threshold),
            "risk_label": "HIGH RISK - Readmission <30 days" if prediction == 1 else "LOW RISK"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/shap_explain")
async def shap_explain(patient_data: Dict):
    """SHAP explanation for single patient"""
    if shap_explainer is None or not feature_names:
        raise HTTPException(status_code=500, detail="SHAP not available")
    
    try:
        df = preprocess_features_api(pd.DataFrame([patient_data]))
        shap_values = shap_explainer(df)
        
        # Top 10 features impact
        feature_importance = np.abs(shap_values.values[0])
        top_indices = np.argsort(feature_importance)[-10:][::-1]
        
        explanation = [
            {
                "feature": feature_names[i],
                "shap_value": float(shap_values.values[0][i]),
                "impact": "increased" if shap_values.values[0][i] > 0 else "decreased",
                "value": float(df.iloc[0, i])
            }
            for i in top_indices
        ]
        
        return {
            "shap_explanation": explanation,
            "base_value": float(shap_values.base_values[0]),
            "total_shap": float(np.sum(shap_values.values[0]))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
