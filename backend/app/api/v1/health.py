"""
MediSphere AI — Health Probes
"""
from fastapi import APIRouter
from app.database.connection import db

router = APIRouter()

@router.get("/health")
async def health_check():
    """Simple health check for load balancers."""
    return {"status": "healthy", "service": "MediSphere AI", "version": "1.0.0"}

@router.get("/live")
async def liveness_probe():
    """Kubernetes liveness probe."""
    return {"status": "alive"}

@router.get("/ready")
async def readiness_probe():
    """Kubernetes readiness probe verifying DB connection."""
    try:
        if db.client:
            await db.client.admin.command('ping')
            return {"status": "ready", "database": "connected"}
        return {"status": "not_ready", "database": "disconnected"}
    except Exception as e:
        return {"status": "not_ready", "database": "error", "message": str(e)}
