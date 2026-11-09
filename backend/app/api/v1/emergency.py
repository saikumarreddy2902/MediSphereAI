"""
MediSphere AI — Emergency API
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from app.services.emergency import EmergencyService
from app.api.deps import RoleChecker
from app.models.user import User

router = APIRouter()

def get_emergency_service() -> EmergencyService:
    return EmergencyService()


class VitalsUpdate(BaseModel):
    heart_rate: int
    blood_pressure: str
    temperature: float
    oxygen_level: int


@router.get("/")
async def get_active_emergencies(
    service: EmergencyService = Depends(get_emergency_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """Get the active emergency triage queue — requires clinical staff role"""
    cases = await service.get_triage_queue()
    return [c.model_dump(by_alias=True, mode="json") for c in cases]


@router.post("/{case_id}/vitals")
async def update_vitals(
    case_id: str,
    vitals: VitalsUpdate,
    service: EmergencyService = Depends(get_emergency_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse"])),
):
    """Update vitals for an emergency case — requires clinical role"""
    case = await service.update_vitals(case_id, vitals.model_dump())
    return case.model_dump(by_alias=True, mode="json")
