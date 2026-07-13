from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ...db.database import get_db
from ...models.msme import MSME, MSMETimeseries, MSMEUnstructuredSignal
# We will reuse the recompute logic from the msme router.
# To avoid circular imports or messy code, we'll import the function directly
from .msme import recompute_pipeline

router = APIRouter()

class GSTPayload(BaseModel):
    msme_id: int
    status: str # "delayed", "defaulted", "filed"

class AAPayload(BaseModel):
    msme_id: int
    shock_type: str # "revenue_drop"

@router.post("/gst-update")
def simulate_gst_update(payload: GSTPayload, db: Session = Depends(get_db)):
    """
    Simulates receiving a webhook from the GST Network.
    If 'delayed' or 'defaulted', it updates the latest timeseries record
    to reflect a missed filing, and triggers a pipeline recompute.
    """
    msme = db.query(MSME).filter(MSME.id == payload.msme_id).first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    if payload.status in ["delayed", "defaulted"]:
        # Find the latest timeseries and mark GST as missed
        latest_ts = db.query(MSMETimeseries).filter(
            MSMETimeseries.msme_id == payload.msme_id
        ).order_by(MSMETimeseries.date.desc()).first()
        
        if latest_ts:
            latest_ts.gst_filed_on_time = False
            db.commit()
            
    # Trigger pipeline recompute
    recompute_pipeline(payload.msme_id, db)
    return {"message": f"GST update applied. Pipeline recomputed for MSME {payload.msme_id}"}

@router.post("/aa-transaction")
def simulate_aa_transaction(payload: AAPayload, db: Session = Depends(get_db)):
    """
    Simulates receiving a webhook from an Account Aggregator (Bank Statement).
    Simulates a sudden cash flow shock.
    """
    msme = db.query(MSME).filter(MSME.id == payload.msme_id).first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    if payload.shock_type == "revenue_drop":
        # Halve the revenue of the latest month to simulate a severe shock
        latest_ts = db.query(MSMETimeseries).filter(
            MSMETimeseries.msme_id == payload.msme_id
        ).order_by(MSMETimeseries.date.desc()).first()
        
        if latest_ts:
            latest_ts.revenue = latest_ts.revenue * 0.5
            latest_ts.upi_in = latest_ts.upi_in * 0.4
            db.commit()
            
            # Also inject a negative unstructured signal
            db.add(MSMEUnstructuredSignal(
                msme_id=payload.msme_id,
                date=datetime.utcnow(),
                source="account_aggregator",
                raw_text="High volume of outward clearing returns (Cheque Bounces) detected.",
                sentiment_score=-0.85
            ))
            db.commit()
            
    # Trigger pipeline recompute
    recompute_pipeline(payload.msme_id, db)
    return {"message": f"AA transaction shock applied. Pipeline recomputed for MSME {payload.msme_id}"}
