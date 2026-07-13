import random
from datetime import date, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from ..models.msme import MSME, MSMETimeseries, MSMEUnstructuredSignal

# Set random seed for basic reproducible randomization outside of hero MSMEs
np.random.seed(42)
random.seed(42)

def generate_synthetic_data(db: Session, count_per_segment: int = 5, clear_db: bool = True):
    segments = ["retail", "manufacturing", "services"]
    
    # 1. Clean up existing data if requested (useful for reset, but skip for bulk appending)
    if clear_db:
        db.query(MSMEUnstructuredSignal).delete()
        db.query(MSMETimeseries).delete()
        db.query(MSME).delete()
        db.commit()

    end_date = date.today()
    start_date = end_date - timedelta(days=14*30) # 14 months

    date_range = pd.date_range(start=start_date, end=end_date, freq='W') # Weekly data

    # Helper function to generate a single MSME
    def create_msme(name, segment, is_hero=False, is_stressed=False, seed=None):
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
        
        onboarded_at = start_date - timedelta(days=random.randint(30, 365))
        msme = MSME(name=name, segment=segment, onboarded_at=onboarded_at, is_defaulted_12m=is_stressed)
        db.add(msme)
        db.commit()
        db.refresh(msme)

        # Baseline parameters
        base_revenue = np.random.uniform(100000, 500000)
        revenue_noise = base_revenue * 0.1
        base_payroll = random.randint(5, 50)
        
        stress_start_idx = random.randint(int(len(date_range) * 0.4), int(len(date_range) * 0.6)) if is_stressed else len(date_range)

        # Generate timeseries
        for i, current_date in enumerate(date_range):
            # Seasonality and noise
            seasonality = np.sin(i * np.pi / 26) * (base_revenue * 0.05) # 6-month cycle
            current_revenue = base_revenue + seasonality + np.random.normal(0, revenue_noise)
            
            # Apply stress
            if is_stressed and i >= stress_start_idx:
                stress_factor = (i - stress_start_idx) / (len(date_range) - stress_start_idx) # 0 to 1
                current_revenue *= (1 - (stress_factor * 0.6)) # Up to 60% drop
                current_payroll = max(1, int(base_payroll * (1 - (stress_factor * 0.5))))
                gst_prob = max(0.1, 0.9 - stress_factor) # filing on time drops
            else:
                current_payroll = base_payroll
                gst_prob = 0.95

            # Derived metrics
            upi_in = current_revenue * np.random.uniform(0.4, 0.8)
            upi_out = upi_in * np.random.uniform(0.7, 1.1)
            gst_filed_on_time = random.random() < gst_prob

            ts = MSMETimeseries(
                msme_id=msme.id,
                date=current_date.date(),
                revenue=max(0, current_revenue),
                upi_in=max(0, upi_in),
                upi_out=max(0, upi_out),
                gst_filed_on_time=gst_filed_on_time,
                payroll_count=current_payroll
            )
            db.add(ts)

            # Unstructured Signals (sparse)
            if random.random() < 0.1: # 10% chance per week
                if is_stressed and i >= stress_start_idx:
                    sentiment = np.random.uniform(-1.0, -0.2)
                    texts = [
                        "Late payment reported to bureau",
                        "GST notice issued for delayed filing",
                        "Supplier complaint about delayed invoices",
                        "Key employee departure noted"
                    ]
                else:
                    sentiment = np.random.uniform(0.2, 1.0)
                    texts = [
                        "Positive vendor review",
                        "On-time loan EMI payment",
                        "New contract signed",
                        "Compliance audit passed"
                    ]
                
                sig = MSMEUnstructuredSignal(
                    msme_id=msme.id,
                    date=current_date.date(),
                    source=random.choice(["news", "legal", "bureau"]),
                    sentiment_score=sentiment,
                    raw_text=random.choice(texts)
                )
                db.add(sig)

        db.commit()
        return msme

    # 1. Create Hand-tuned Hero MSMEs (only if clearing DB, to avoid duplicates)
    if clear_db:
        hero_retail = create_msme("Apex Retail Solutions", "retail", is_hero=True, is_stressed=True, seed=101)
        hero_mfg = create_msme("Zenith Manufacturing Co", "manufacturing", is_hero=True, is_stressed=True, seed=102)
        hero_services = create_msme("Nexus Tech Services", "services", is_hero=True, is_stressed=False, seed=103)
    
    # 2. Create Random MSMEs
    for segment in segments:
        for _ in range(count_per_segment):
            is_stressed = random.random() < 0.3 # 30% stress injection
            name = f"{segment.capitalize()} {random.choice(['Enterprises', 'Corp', 'LLC', 'Traders', 'Ventures'])} {random.randint(100, 999)}"
            create_msme(name, segment, is_hero=False, is_stressed=is_stressed)
    
    return {"message": f"Synthetic data generated successfully. (Clear DB: {clear_db}, Count per segment: {count_per_segment})"}
