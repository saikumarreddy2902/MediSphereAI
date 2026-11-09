"""
MediSphere AI — Prescription Schemas

Request/response Pydantic models for the Prescriptions API endpoints.
Extracted from api/v1/prescriptions.py to enforce clean architecture —
API layer should only import from schemas, never define them inline.
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class PrescribedMedicationIn(BaseModel):
    """Single medication line item for prescription creation."""
    medicine_name: str
    medicine_id: Optional[str] = None
    dosage: str
    frequency: str
    duration_days: int
    route: str = "oral"
    special_instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    """Schema for creating a new prescription."""
    patient_id: str
    appointment_id: Optional[str] = None
    medications: List[PrescribedMedicationIn]
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    is_renewable: bool = False
    max_renewals: int = 0
    valid_days: int = 30  # Prescription valid for N days from issue


class PrescriptionResponse(BaseModel):
    """Prescription record returned by API responses."""
    id: Optional[str] = None
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    medications: List[dict]
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    status: str
    is_renewable: bool
    renewal_count: int = 0
    max_renewals: int = 0
    issued_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    dispensed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancelled_reason: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


class DrugInteractionWarning(BaseModel):
    """Drug-drug interaction warning returned by the validate endpoint."""
    severity: str          # "critical" | "moderate" | "low"
    drug_a: str
    drug_b: str
    description: str


class ValidateRequest(BaseModel):
    """Request body for the medication validation endpoint."""
    medications: List[PrescribedMedicationIn]
    patient_allergies: Optional[List[str]] = None


class PrescriptionRenewRequest(BaseModel):
    """Request body for the prescription renewal endpoint."""
    valid_days: int = 30   # How many days to extend validity
    notes: Optional[str] = None
