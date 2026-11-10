"""
MediSphere AI — Medical Records Schemas

Request/response Pydantic models for the Medical Records API endpoints.
Extracted from api/v1/medical_records.py inline definitions.
"""
from datetime import date, datetime

from pydantic import BaseModel, Field


class MedicalRecordCreate(BaseModel):
    """Schema for creating a new patient medical record."""
    record_type: str = Field(
        ...,
        description="DIAGNOSIS | MEDICATION | PROCEDURE | ALLERGY | VITALS | NOTE | LAB_RESULT | IMAGING"
    )
    title: str
    description: str
    icd_code: str | None = None      # ICD-10 code for diagnosis records
    severity: str | None = None      # mild | moderate | severe | critical
    date_of_record: date
    appointment_id: str | None = None
    lab_order_id: str | None = None
    attachments: list[str] = []


class MedicalRecordUpdate(BaseModel):
    """Schema for updating an existing medical record."""
    title: str | None = None
    description: str | None = None
    icd_code: str | None = None
    severity: str | None = None
    is_active: bool | None = None
    attachments: list[str] | None = None


class MedicalRecordResponse(BaseModel):
    """Medical record returned by API responses."""
    id: str | None = None
    patient_id: str
    doctor_id: str | None = None
    record_type: str
    title: str
    description: str
    icd_code: str | None = None
    severity: str | None = None
    date_of_record: date
    is_active: bool
    appointment_id: str | None = None
    lab_order_id: str | None = None
    attachments: list[str] = []
    created_at: datetime | None = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }
