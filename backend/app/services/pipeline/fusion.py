import numpy as np

# Segment-specific weight calibration
SEGMENT_WEIGHTS = {
    "retail": {
        "cusum_stress": 0.40,
        "changepoint_flags": 0.30,
        "residual_drop": 0.20,
        "unstructured_sentiment": 0.10
    },
    "manufacturing": {
        "cusum_stress": 0.35,
        "changepoint_flags": 0.25,
        "residual_drop": 0.30,
        "unstructured_sentiment": 0.10
    },
    "services": {
        "cusum_stress": 0.30,
        "changepoint_flags": 0.20,
        "residual_drop": 0.20,
        "unstructured_sentiment": 0.30
    }
}

def compute_fusion_score(segment: str, decomp_res: list, changepoints: list, cusum_res: list, unstructured: list):
    """
    Combines the signals into a single health_score and pd_12m.
    Returns the final score metrics and the raw feature contributions for explainability.
    """
    weights = SEGMENT_WEIGHTS.get(segment.lower(), SEGMENT_WEIGHTS["retail"])
    
    # Extract latest signals (simulate "current" state at the end of the timeseries)
    
    # 1. CUSUM Stress (0 to 10 scale roughly)
    latest_stress = cusum_res[-1]['stress_value'] if cusum_res else 0.0
    stress_feature_val = min(1.0, latest_stress / 10.0) # Normalize to 0-1 (1 is max stress)
    
    # 2. Changepoints (Penalty based on recent significant negative shifts)
    recent_cps = [cp for cp in changepoints if "drop" in cp["description"].lower() or "shift" in cp["description"].lower()]
    cp_feature_val = min(1.0, len(recent_cps) * 0.5) # Max out at 2 recent negative shifts
    
    # 3. Residual Drop (Are we currently in a negative residual slump?)
    latest_resid = decomp_res[-1]['revenue_residual'] if decomp_res else 0.0
    # If residual is highly negative, it's a slump
    resid_feature_val = 1.0 if latest_resid < -10000 else (0.5 if latest_resid < -5000 else 0.0)
    
    # 4. Unstructured Sentiment (Negative sentiment is bad)
    recent_sentiment = [s.sentiment_score for s in unstructured]
    avg_sent = np.mean(recent_sentiment) if recent_sentiment else 0.5
    sent_feature_val = 1.0 if avg_sent < -0.2 else 0.0
    
    # Compute combined risk score (0 to 1, where 1 is highest risk)
    risk_score = (
        (stress_feature_val * weights["cusum_stress"]) +
        (cp_feature_val * weights["changepoint_flags"]) +
        (resid_feature_val * weights["residual_drop"]) +
        (sent_feature_val * weights["unstructured_sentiment"])
    )
    
    # Health score is inverse of risk (0-100)
    health_score = max(0.0, min(100.0, (1.0 - risk_score) * 100))
    
    # PD_12m (Probability of default) - non-linear mapping from risk
    pd_12m = min(0.99, max(0.01, (risk_score ** 2) * 0.8)) # Caps at 80% if risk is 1.0
    
    # Return scores and raw feature values for explainability
    return {
        "health_score": round(health_score, 1),
        "pd_12m": round(pd_12m, 3),
        "segment_calibration_version": "v1.0",
        "features": {
            "cusum_stress": stress_feature_val * weights["cusum_stress"],
            "changepoint_flags": cp_feature_val * weights["changepoint_flags"],
            "residual_drop": resid_feature_val * weights["residual_drop"],
            "unstructured_sentiment": sent_feature_val * weights["unstructured_sentiment"]
        }
    }
