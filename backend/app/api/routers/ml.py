from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...models.msme import MSME
from ...services.pipeline.ml_layer import train_and_validate_model

router = APIRouter()

@router.post("/train-and-validate")
def train_model(db: Session = Depends(get_db)):
    """Trains the ML validation layer and returns performance metrics."""
    msmes = db.query(MSME).all()
    metrics = train_and_validate_model(msmes)
    return metrics
