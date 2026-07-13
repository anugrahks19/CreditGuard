from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import engine, Base
from .api.routers import msme
from .api.routers import webhooks
from .api.routers import ml

# Create DB tables (if they don't exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CreditGuard API",
    description="Backend for MSME Early-Warning Credit Stress Detection",
    version="1.0.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Adjust if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(msme.router, prefix="/msme", tags=["MSME"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(ml.router, prefix="/ml", tags=["Machine Learning Validation"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CreditGuard API"}
