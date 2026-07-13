from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from ...db.database import get_db
from ...models.msme import MSME, MSMEScore, MSMEScoreExplanation, MSMEChangepoint
from ...services.synthetic_generator import generate_synthetic_data
from ...services.pipeline.decomposition import decompose_msme_series
from ...services.pipeline.changepoint import detect_changepoints
from ...services.pipeline.cusum import calculate_cusum_stress
from ...services.pipeline.fusion import compute_fusion_score
from ...services.pipeline.explainability import generate_shap_explanations

router = APIRouter()

@router.post("/generate-bulk")
def generate_bulk_synthetic(
    count_per_segment: int = Query(200, description="Number of random MSMEs to generate per segment for ML bulk training"),
    db: Session = Depends(get_db)
):
    """Seeds the database with a massive synthetic dataset for ML validation."""
    return generate_synthetic_data(db, count_per_segment, clear_db=False)

@router.post("/generate-synthetic")
def generate_synthetic(
    count_per_segment: int = Query(5, description="Number of random MSMEs to generate per segment"),
    db: Session = Depends(get_db)
):
    """Seeds the database with synthetic MSMEs and time series data."""
    return generate_synthetic_data(db, count_per_segment, clear_db=True)

@router.get("/")
def list_msmes(db: Session = Depends(get_db)):
    """List all MSMEs in the portfolio, including their latest score and velocity."""
    msmes = db.query(MSME).all()
    result = []
    for msme in msmes:
        scores = db.query(MSMEScore).filter(MSMEScore.msme_id == msme.id).order_by(desc(MSMEScore.computed_at)).limit(2).all()
        
        latest_score = scores[0] if len(scores) > 0 else None
        prev_score = scores[1] if len(scores) > 1 else latest_score
        
        delta_score = 0.0
        if latest_score and prev_score and latest_score.id != prev_score.id:
            delta_score = latest_score.health_score - prev_score.health_score

        msme_dict = {
            "id": msme.id,
            "name": msme.name,
            "segment": msme.segment,
            "onboarded_at": msme.onboarded_at,
            "health_score": latest_score.health_score if latest_score else None,
            "pd_12m": latest_score.pd_12m if latest_score else None,
            "delta_score": delta_score
        }
        result.append(msme_dict)
    return result

@router.get("/{msme_id}/decomposition")
def get_decomposition(msme_id: int, db: Session = Depends(get_db)):
    msme = db.query(MSME).filter(MSME.id == msme_id).first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")
    return decompose_msme_series(msme.timeseries)

@router.get("/{msme_id}/changepoints")
def get_changepoints(msme_id: int, db: Session = Depends(get_db)):
    msme = db.query(MSME).filter(MSME.id == msme_id).first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")
    return detect_changepoints(msme.timeseries)

@router.get("/{msme_id}/stress")
def get_stress(msme_id: int, db: Session = Depends(get_db)):
    msme = db.query(MSME).filter(MSME.id == msme_id).first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")
    return calculate_cusum_stress(msme.timeseries)

@router.get("/{msme_id}/score")
def get_score(msme_id: int, db: Session = Depends(get_db)):
    score = db.query(MSMEScore).filter(MSMEScore.msme_id == msme_id).order_by(desc(MSMEScore.computed_at)).first()
    if not score:
        raise HTTPException(status_code=404, detail="Score not computed yet")
        
    explanations = db.query(MSMEScoreExplanation).filter(MSMEScoreExplanation.score_id == score.id).all()
    
    return {
        "health_score": score.health_score,
        "pd_12m": score.pd_12m,
        "computed_at": score.computed_at,
        "explanations": [{"feature_name": e.feature_name, "shap_value": e.shap_value} for e in explanations]
    }

@router.post("/{msme_id}/recompute")
def recompute_pipeline(msme_id: int, db: Session = Depends(get_db)):
    msme = db.query(MSME).filter(MSME.id == msme_id).first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")
        
    # 1. Run Pipeline Layers
    decomp_res = decompose_msme_series(msme.timeseries)
    cps_res = detect_changepoints(msme.timeseries)
    cusum_res = calculate_cusum_stress(msme.timeseries)
    
    # 2. Fusion & Explainability
    fusion_output = compute_fusion_score(msme.segment, decomp_res, cps_res, cusum_res, msme.unstructured_signals)
    shap_explanations = generate_shap_explanations(fusion_output["features"])
    
    # 3. Persist Changepoints
    db.query(MSMEChangepoint).filter(MSMEChangepoint.msme_id == msme_id).delete()
    for cp in cps_res:
        db.add(MSMEChangepoint(
            msme_id=msme_id,
            date=cp["date"],
            confidence=cp["confidence"],
            description=cp["description"]
        ))
        
    # 4. Persist Score & Explanations
    new_score = MSMEScore(
        msme_id=msme_id,
        health_score=fusion_output["health_score"],
        pd_12m=fusion_output["pd_12m"],
        segment_calibration_version=fusion_output["segment_calibration_version"],
        computed_at=datetime.utcnow()
    )
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    
    for exp in shap_explanations:
        db.add(MSMEScoreExplanation(
            score_id=new_score.id,
            feature_name=exp["feature_name"],
            shap_value=exp["shap_value"]
        ))
        
    db.commit()
    
    return {"message": "Pipeline recomputed successfully", "score": new_score.health_score}
