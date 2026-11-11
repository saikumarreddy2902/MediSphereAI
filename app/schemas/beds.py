"""
MediSphere AI — Bed Schemas

Request/response Pydantic models for the Bed Intelligence API endpoints.
"""
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
    ward: str | None = None
    department_id: str | None = None
    type: str | None = None
    last_maintenance_date: datetime | None = None


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
    current_patient_id: str | None = None
    last_maintenance_date: datetime | None = None
    created_at: datetime | None = None

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
    icu: WardStats | None = None
    emergency: WardStats | None = None
    general: WardStats | None = None
    private: WardStats | None = None
    pediatric: WardStats | None = None
    maternity: WardStats | None = None
