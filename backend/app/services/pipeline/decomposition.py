import pandas as pd
from statsmodels.tsa.seasonal import STL

def perform_stl_decomposition(df: pd.DataFrame, column: str, period: int = 13):
    """
    Performs STL decomposition on a time series column.
    Returns the dataframe with trend, seasonal, and residual columns added.
    """
    if len(df) < 2 * period:
        # Fallback if series is too short
        period = max(3, len(df) // 3)
        
    stl = STL(df[column], period=period, robust=True)
    res = stl.fit()
    
    return res.trend, res.seasonal, res.resid

def decompose_msme_series(timeseries: list):
    """
    Takes a list of MSMETimeseries objects and decomposes revenue and upi_in.
    """
    if not timeseries:
        return []

    # Sort by date
    timeseries = sorted(timeseries, key=lambda x: x.date)
    dates = [ts.date for ts in timeseries]
    
    df = pd.DataFrame({
        'revenue': [ts.revenue for ts in timeseries],
        'upi_in': [ts.upi_in for ts in timeseries]
    }, index=pd.to_datetime(dates))
    
    # Forward fill any missing just in case
    df = df.ffill().fillna(0)
    
    # Decompose Revenue
    rev_trend, rev_seasonal, rev_resid = perform_stl_decomposition(df, 'revenue')
    
    # Decompose UPI In
    upi_trend, upi_seasonal, upi_resid = perform_stl_decomposition(df, 'upi_in')
    
    # Construct output
    result = []
    for i, date in enumerate(dates):
        result.append({
            "date": date,
            "revenue": df['revenue'].iloc[i],
            "revenue_trend": rev_trend.iloc[i],
            "revenue_seasonal": rev_seasonal.iloc[i],
            "revenue_residual": rev_resid.iloc[i],
            "upi_in": df['upi_in'].iloc[i],
            "upi_in_trend": upi_trend.iloc[i],
            "upi_in_seasonal": upi_seasonal.iloc[i],
            "upi_in_residual": upi_resid.iloc[i],
        })
        
    return result
