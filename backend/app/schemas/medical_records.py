"""
MediSphere AI — Medical Records Schemas

Request/response Pydantic models for the Medical Records API endpoints.
Extracted from api/v1/medical_records.py inline definitions.
"""
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field


class MedicalRecordCreate(BaseModel):
    """Schema for creating a new patient medical record."""
    record_type: str = Field(
        ...,
        description="DIAGNOSIS | MEDICATION | PROCEDURE | ALLERGY | VITALS | NOTE | LAB_RESULT | IMAGING"
    )
    title: str
    description: str
    icd_code: Optional[str] = None      # ICD-10 code for diagnosis records
    severity: Optional[str] = None      # mild | moderate | severe | critical
    date_of_record: date
    appointment_id: Optional[str] = None
    lab_order_id: Optional[str] = None
    attachments: List[str] = []


class MedicalRecordUpdate(BaseModel):
    """Schema for updating an existing medical record."""
    title: Optional[str] = None
    description: Optional[str] = None
    icd_code: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    attachments: Optional[List[str]] = None


class MedicalRecordResponse(BaseModel):
    """Medical record returned by API responses."""
    id: Optional[str] = None
    patient_id: str
    doctor_id: Optional[str] = None
    record_type: str
    title: str
    description: str
    icd_code: Optional[str] = None
    severity: Optional[str] = None
    date_of_record: date
    is_active: bool
    appointment_id: Optional[str] = None
    lab_order_id: Optional[str] = None
    attachments: List[str] = []
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }
