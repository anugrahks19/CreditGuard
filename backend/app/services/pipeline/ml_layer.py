import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score, confusion_matrix, precision_recall_fscore_support
from ...models.msme import MSME
from .decomposition import decompose_msme_series
from .changepoint import detect_changepoints
from .cusum import calculate_cusum_stress
import time

def extract_features(msme: MSME):
    """Extracts ML features for a single MSME from its raw data."""
    if not msme.timeseries:
        return None
        
    decomp_res = decompose_msme_series(msme.timeseries)
    cps_res = detect_changepoints(msme.timeseries)
    cusum_res = calculate_cusum_stress(msme.timeseries)
    
    # Simple unstructured sentiment proxy
    avg_sentiment = 0.0
    if msme.unstructured_signals:
        avg_sentiment = np.mean([s.sentiment_score for s in msme.unstructured_signals])
        
    # Segment encoding (one-hot approximation or just ordinal for simplicity, let's do ordinal)
    segment_map = {"retail": 0, "manufacturing": 1, "services": 2}
    segment_val = segment_map.get(msme.segment, 0)
    
    # Calculate average negative residual from decomposition
    recent_residuals = [r["residual"] for r in decomp_res[-12:]] if len(decomp_res) >= 12 else [0]
    avg_neg_residual = abs(min(0, np.mean(recent_residuals)))
    
    # Find lead time (if stressed and breached)
    lead_time_months = 0
    if msme.is_defaulted_12m:
        breach_idx = -1
        for i, c in enumerate(cusum_res["history"]):
            if c["stress"] >= cusum_res["critical_threshold"]:
                breach_idx = i
                break
        
        if breach_idx != -1:
            # Months between breach and end of timeseries
            lead_time_weeks = len(cusum_res["history"]) - breach_idx
            lead_time_months = lead_time_weeks / 4.0
            
    return {
        "features": [
            cusum_res["current_stress"],
            len(cps_res), # Number of regime shifts
            avg_neg_residual,
            avg_sentiment,
            segment_val
        ],
        "label": 1 if msme.is_defaulted_12m else 0,
        "lead_time_months": lead_time_months
    }

def train_and_validate_model(msmes: list[MSME]):
    """Trains a Logistic Regression model and returns validation metrics."""
    X = []
    y = []
    lead_times = []
    
    for msme in msmes:
        data = extract_features(msme)
        if data:
            X.append(data["features"])
            y.append(data["label"])
            if data["label"] == 1 and data["lead_time_months"] > 0:
                lead_times.append(data["lead_time_months"])
                
    if not X or len(set(y)) < 2:
        return {"error": "Not enough data to train. Please generate bulk synthetic data first."}
        
    X = np.array(X)
    y = np.array(y)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    avg_lead_time = np.mean(lead_times) if lead_times else 0.0
    
    return {
        "accuracy": float(acc),
        "auc_roc": float(auc),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": cm,
        "average_lead_time_months": float(avg_lead_time),
        "sample_size": len(X)
    }
