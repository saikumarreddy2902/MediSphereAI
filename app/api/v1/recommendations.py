"""Recommendations API"""

from app.mock.data_generator import get_recommendations
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_recommendations(
    priority: str | None = None,
    category: str | None = None,
    acknowledged: bool | None = None,
):
    recs = get_recommendations()
    if priority:
        recs = [r for r in recs if r["priority"] == priority]
    if category:
        recs = [r for r in recs if r["category"].lower() == category.lower()]
    if acknowledged is not None:
        recs = [r for r in recs if r["is_acknowledged"] == acknowledged]
    return {"total": len(recs), "recommendations": recs}

@router.post("/{rec_id}/acknowledge")
async def acknowledge_recommendation(rec_id: str):
    return {"message": "Recommendation acknowledged", "id": rec_id}

@router.get("/stats")
async def get_stats():
    recs = get_recommendations()
    return {
        "total": len(recs),
        "critical": len([r for r in recs if r["priority"] == "critical"]),
        "high": len([r for r in recs if r["priority"] == "high"]),
        "medium": len([r for r in recs if r["priority"] == "medium"]),
        "acknowledged": len([r for r in recs if r["is_acknowledged"]]),
        "pending": len([r for r in recs if not r["is_acknowledged"]]),
    }
