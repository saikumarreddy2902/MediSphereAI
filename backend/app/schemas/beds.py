"""
MediSphere AI — Bed Schemas

Request/response Pydantic models for the Bed Intelligence API endpoints.
"""
from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BedCreate(BaseModel):
    """Schema for registering a new hospital bed."""
    bed_number: str = Field(..., min_length=1, max_length=20, examples=["ICU-01"])
    ward: str = Field(..., examples=["ICU"])
    department_id: str = Field(..., examples=["dept_001"])
    type: str = Field(default="GENERAL", pattern="^(GENERAL|ICU|OXYGEN|VENTILATOR)$")


class BedUpdate(BaseModel):
    """Schema for updating bed metadata."""
    ward: Optional[str] = None
    department_id: Optional[str] = None
    type: Optional[str] = None
    last_maintenance_date: Optional[datetime] = None


class BedAssignRequest(BaseModel):
    """Schema for assigning a bed to a patient."""
    patient_id: str = Field(..., description="The MongoDB ObjectId of the patient to assign")


class BedResponse(BaseModel):
    """Safe bed record returned by API responses."""
    id: str = Field(alias="_id")
    bed_number: str
    ward: str
    department_id: str
    type: str
    is_occupied: bool
    current_patient_id: Optional[str] = None
    last_maintenance_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class WardStats(BaseModel):
    """Occupancy breakdown for a single ward."""
    total: int
    occupied: int
    available: int
    occupancy_rate: float


class BedDashboardSummary(BaseModel):
    """
    Aggregated bed occupancy metrics returned by /beds/summary.
    Includes total counts and per-ward breakdown.
    """
    total: WardStats
    icu: Optional[WardStats] = None
    emergency: Optional[WardStats] = None
    general: Optional[WardStats] = None
    private: Optional[WardStats] = None
    pediatric: Optional[WardStats] = None
    maternity: Optional[WardStats] = None
