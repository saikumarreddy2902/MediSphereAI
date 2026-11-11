"""
MediSphere AI — Appointment Schemas

Request/response Pydantic models for Appointment API endpoints.
"""
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
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    """Schema for rescheduling or updating an appointment."""
    appointment_date: datetime | None = None
    reason: str | None = None
    type: str | None = Field(None, pattern="^(GENERAL|FOLLOW_UP|SURGERY)$")
    notes: str | None = None


class AppointmentResponse(BaseModel):
    """Appointment record returned by API responses."""
    id: str = Field(alias="_id")
    patient_id: str
    doctor_id: str
    department_id: str
    appointment_date: datetime
    reason: str
    type: str
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"populate_by_name": True}
