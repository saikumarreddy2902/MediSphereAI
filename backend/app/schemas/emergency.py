"""
MediSphere AI — Emergency Case Schemas

Request/response Pydantic models for Emergency Response API endpoints.
"""
from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class EmergencyCaseCreate(BaseModel):
    """Schema for registering a new emergency case (walk-in or ambulance)."""
    patient_id: Optional[str] = Field(None, description="May be unknown for unidentified patients")
    triage_level: int = Field(..., ge=1, le=5, description="1=Resuscitation (most urgent) to 5=Non-urgent")
    symptoms: str = Field(..., min_length=3, examples=["Severe chest pain, shortness of breath"])
    vitals: Dict[str, Any] = Field(
        default={},
        examples=[{"bp": "140/90", "heart_rate": 110, "spo2": 94, "temp": 37.2}]
    )
    assigned_doctor_id: Optional[str] = None


class EmergencyCaseUpdate(BaseModel):
    """Schema for updating an active emergency case."""
    triage_level: Optional[int] = Field(None, ge=1, le=5)
    symptoms: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    assigned_doctor_id: Optional[str] = None
    outcome: Optional[str] = Field(
        None,
        pattern="^(ADMITTED|DISCHARGED|DECEASED|TRANSFERRED)$"
    )


class EmergencyCaseResponse(BaseModel):
    """Emergency case data returned by API responses."""
    id: str = Field(alias="_id")
    patient_id: Optional[str] = None
    triage_level: int
    arrival_time: datetime
    symptoms: str
    vitals: Dict[str, Any] = {}
    assigned_doctor_id: Optional[str] = None
    outcome: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}
