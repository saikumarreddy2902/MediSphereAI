"""
MediSphere AI — Equipment Schemas

Request/response Pydantic models for the Equipment Management API endpoints.
"""
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.common import BaseResponse


class EquipmentCreate(BaseModel):
    """Schema for registering new hospital equipment."""
    name: str = Field(..., min_length=2, examples=["Ventilator — Philips V60"])
    serial_number: str = Field(..., min_length=3, examples=["SN-VNT-2026-001"])
    department_id: str = Field(..., description="Department MongoDB ObjectId")
    purchase_date: date = Field(..., examples=["2024-01-15"])
    warranty_expiry: date = Field(..., examples=["2027-01-15"])
    next_maintenance_date: date = Field(..., examples=["2026-09-01"])
    operational_status: str = Field(
        default="OPERATIONAL",
        pattern="^(OPERATIONAL|MAINTENANCE|OUT_OF_ORDER)$"
    )


class EquipmentUpdate(BaseModel):
    """Schema for updating equipment status or maintenance schedule."""
    next_maintenance_date: date | None = None
    operational_status: str | None = Field(
        None,
        pattern="^(OPERATIONAL|MAINTENANCE|OUT_OF_ORDER)$"
    )
    warranty_expiry: date | None = None


class EquipmentResponse(BaseResponse):
    """Equipment record returned by API responses."""
    name: str
    serial_number: str
    department_id: str
    purchase_date: date
    warranty_expiry: date
    next_maintenance_date: date
    operational_status: str
    created_at: datetime | None = None
