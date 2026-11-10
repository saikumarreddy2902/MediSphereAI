"""
MediSphere AI — Prescription Schemas

Request/response Pydantic models for the Prescriptions API endpoints.
Extracted from api/v1/prescriptions.py to enforce clean architecture —
API layer should only import from schemas, never define them inline.
"""
from datetime import datetime

from pydantic import BaseModel


class PrescribedMedicationIn(BaseModel):
    """Single medication line item for prescription creation."""
    medicine_name: str
    medicine_id: str | None = None
    dosage: str
    frequency: str
    duration_days: int
    route: str = "oral"
    special_instructions: str | None = None


class PrescriptionCreate(BaseModel):
    """Schema for creating a new prescription."""
    patient_id: str
    appointment_id: str | None = None
    medications: list[PrescribedMedicationIn]
    diagnosis: str | None = None
    notes: str | None = None
    is_renewable: bool = False
    max_renewals: int = 0
    valid_days: int = 30  # Prescription valid for N days from issue


class PrescriptionResponse(BaseModel):
    """Prescription record returned by API responses."""
    id: str | None = None
    patient_id: str
    doctor_id: str
    appointment_id: str | None = None
    medications: list[dict]
    diagnosis: str | None = None
    notes: str | None = None
    status: str
    is_renewable: bool
    renewal_count: int = 0
    max_renewals: int = 0
    issued_at: datetime | None = None
    expires_at: datetime | None = None
    dispensed_at: datetime | None = None
    cancelled_at: datetime | None = None
    cancelled_reason: str | None = None

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
    medications: list[PrescribedMedicationIn]
    patient_allergies: list[str] | None = None


class PrescriptionRenewRequest(BaseModel):
    """Request body for the prescription renewal endpoint."""
    valid_days: int = 30   # How many days to extend validity
    notes: str | None = None
