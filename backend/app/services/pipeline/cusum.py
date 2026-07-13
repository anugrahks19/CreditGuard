import numpy as np

def calculate_cusum_stress(timeseries: list):
    """
    Implements a CUSUM (Cumulative Sum) stress accumulation.
    Tracks negative deviations in revenue and payroll, and missed GST filings.
    Uses asymmetric decay to act as an early-warning 'stress meter'.
    """
    if not timeseries:
        return []
        
    timeseries = sorted(timeseries, key=lambda x: x.date)
    dates = [ts.date for ts in timeseries]
    
    revenue = np.array([ts.revenue for ts in timeseries])
    payroll = np.array([ts.payroll_count for ts in timeseries])
    gst_compliance = np.array([1 if ts.gst_filed_on_time else 0 for ts in timeseries])
    
    # We need a baseline to compute deviations. We'll use a rolling window or the first N weeks.
    # For a robust baseline in a short series, expanding window is safe.
    
    stress_scores = []
    current_stress = 0.0
    
    # Hyperparameters for CUSUM
    decay_factor = 0.85 # Stress bleeds off by 15% each week if things are good
    stress_threshold = 2.0 # Arbitrary threshold for flagging
    
    for i in range(len(timeseries)):
        if i < 10:
            # Baseline establishing period (first 10 weeks)
            stress_scores.append({
                "date": dates[i],
                "stress_value": 0.0,
                "is_stressed": False
            })
            continue
            
        # Baseline means from history
        baseline_rev = np.mean(revenue[:i])
        baseline_rev_std = np.std(revenue[:i]) if np.std(revenue[:i]) > 0 else 1.0
        
        baseline_pay = np.mean(payroll[:i])
        baseline_gst = np.mean(gst_compliance[:i])
        
        # Current values
        curr_rev = revenue[i]
        curr_pay = payroll[i]
        curr_gst = gst_compliance[i]
        
        # Standardized deviations (worsening direction is positive stress)
        # Revenue drop is bad
        rev_dev = (baseline_rev - curr_rev) / baseline_rev_std
        rev_stress = max(0, rev_dev - 0.5) # Allow 0.5 std dev noise buffer
        
        # Payroll drop is bad
        pay_stress = max(0, baseline_pay - curr_pay) * 0.5 
        
        # GST non-compliance is bad
        gst_stress = 1.0 if (curr_gst == 0 and baseline_gst > 0.5) else 0.0
        
        # Accumulate
        weekly_stress_inc = (rev_stress * 1.5) + (pay_stress * 1.0) + (gst_stress * 2.0)
        
        # Asymmetric decay: only decay if no new stress
        if weekly_stress_inc < 0.1:
            current_stress *= decay_factor
        else:
            current_stress += weekly_stress_inc
            
        stress_scores.append({
            "date": dates[i],
            "stress_value": round(current_stress, 2),
            "is_stressed": current_stress >= stress_threshold
        })
        
    return stress_scores
