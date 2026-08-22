"""
MediSphere AI — Appointment Schemas

Request/response Pydantic models for Appointment API endpoints.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    """Schema for booking a new appointment."""
    patient_id: str = Field(..., description="Patient MongoDB ObjectId")
    doctor_id: str = Field(..., description="Doctor MongoDB ObjectId")
    department_id: str = Field(..., description="Department MongoDB ObjectId")
    appointment_date: datetime = Field(..., examples=["2026-09-01T10:00:00"])
    reason: str = Field(..., min_length=3, examples=["Annual cardiac checkup"])
    type: str = Field(default="GENERAL", pattern="^(GENERAL|FOLLOW_UP|SURGERY)$")
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    """Schema for rescheduling or updating an appointment."""
    appointment_date: Optional[datetime] = None
    reason: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(GENERAL|FOLLOW_UP|SURGERY)$")
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    """Appointment record returned by API responses."""
    id: str = Field(alias="_id")
    patient_id: str
    doctor_id: str
    department_id: str
    appointment_date: datetime
    reason: str
    type: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}
