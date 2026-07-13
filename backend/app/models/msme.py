from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.database import Base

class MSME(Base):
    __tablename__ = "msme"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    segment = Column(String, index=True) # retail, manufacturing, services
    onboarded_at = Column(Date)
    is_defaulted_12m = Column(Boolean, default=False) # Ground truth for ML validation

    timeseries = relationship("MSMETimeseries", back_populates="msme")
    unstructured_signals = relationship("MSMEUnstructuredSignal", back_populates="msme")
    scores = relationship("MSMEScore", back_populates="msme")
    changepoints = relationship("MSMEChangepoint", back_populates="msme")


class MSMETimeseries(Base):
    __tablename__ = "msme_timeseries"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(Integer, ForeignKey("msme.id"))
    date = Column(Date, index=True)
    revenue = Column(Float)
    upi_in = Column(Float)
    upi_out = Column(Float)
    gst_filed_on_time = Column(Boolean)
    payroll_count = Column(Integer)

    msme = relationship("MSME", back_populates="timeseries")


class MSMEUnstructuredSignal(Base):
    __tablename__ = "msme_unstructured_signals"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(Integer, ForeignKey("msme.id"))
    date = Column(Date, index=True)
    source = Column(String)
    sentiment_score = Column(Float)
    raw_text = Column(String)

    msme = relationship("MSME", back_populates="unstructured_signals")


class MSMEScore(Base):
    __tablename__ = "msme_scores"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(Integer, ForeignKey("msme.id"))
    computed_at = Column(DateTime, default=datetime.utcnow)
    health_score = Column(Float)
    pd_12m = Column(Float)
    segment_calibration_version = Column(String)

    msme = relationship("MSME", back_populates="scores")
    explanations = relationship("MSMEScoreExplanation", back_populates="score")


class MSMEScoreExplanation(Base):
    __tablename__ = "msme_score_explanations"

    id = Column(Integer, primary_key=True, index=True)
    score_id = Column(Integer, ForeignKey("msme_scores.id"))
    feature_name = Column(String)
    shap_value = Column(Float)

    score = relationship("MSMEScore", back_populates="explanations")


class MSMEChangepoint(Base):
    __tablename__ = "msme_changepoints"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(Integer, ForeignKey("msme.id"))
    date = Column(Date)
    confidence = Column(Float)
    description = Column(String)

    msme = relationship("MSME", back_populates="changepoints")
