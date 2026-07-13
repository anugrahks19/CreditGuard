def generate_shap_explanations(feature_contributions: dict):
    """
    Given the exact feature contributions to the risk score from the fusion layer,
    formats them into a SHAP-style array for the frontend.
    
    In a true ML model, this would call shap.TreeExplainer, but for our deterministic
    weighted ensemble, the exact contribution is mathematically known instantly.
    
    Positive SHAP value here means it increased risk (lowered health).
    Negative would mean it decreased risk (improved health).
    """
    
    explanations = []
    
    # feature_contributions are already weighted risk contributions (0.0 to weight)
    for feature_name, risk_val in feature_contributions.items():
        # SHAP value representation: 
        # Since Health Score is 100 - (risk * 100), 
        # the SHAP value on the Health Score is exactly -(risk_val * 100)
        
        health_impact = -(risk_val * 100)
        
        # Only include features that actually moved the needle
        if abs(health_impact) > 0.1:
            # Prettify names
            pretty_name = feature_name.replace('_', ' ').title()
            
            explanations.append({
                "feature_name": pretty_name,
                "shap_value": round(health_impact, 2)
            })
            
    # Sort by absolute magnitude of impact
    explanations.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    
    return explanations
