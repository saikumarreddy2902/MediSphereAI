"""
MediSphere AI — Prescription Model

Structured prescription document linking a doctor's medication order to a patient.
Supports multi-medication prescriptions, dispensing status, and renewal tracking.
"""
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app.models.base import BaseDocument


class PrescribedMedication(BaseModel):
    """Single medication line item within a prescription."""
    medicine_name: str
    medicine_id: Optional[str] = None       # Links to Medicine inventory if matched
    dosage: str                              # e.g. "500mg"
    frequency: str                           # e.g. "twice daily", "every 8 hours"
    duration_days: int
    route: str = "oral"                      # oral | IV | topical | inhaled | etc.
    special_instructions: Optional[str] = None
    is_dispensed: bool = False
    dispensed_at: Optional[datetime] = None


class Prescription(BaseDocument):
    """
    Full prescription document issued by a doctor for a patient.

    Lifecycle: DRAFT → ACTIVE → DISPENSED / CANCELLED / EXPIRED
    """
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None

    medications: List[PrescribedMedication] = []

    diagnosis: Optional[str] = None         # Brief reason / diagnosis note
    notes: Optional[str] = None             # Pharmacist / doctor notes

    status: str = "ACTIVE"                  # ACTIVE | DISPENSED | CANCELLED | EXPIRED
    is_renewable: bool = False
    renewal_count: int = 0
    max_renewals: int = 0

    issued_at: datetime = None              # type: ignore[assignment]
    expires_at: Optional[datetime] = None
    dispensed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancelled_reason: Optional[str] = None

    def __init__(self, **data):
        if "issued_at" not in data or data["issued_at"] is None:
            data["issued_at"] = datetime.now(timezone.utc)
        super().__init__(**data)

    class Settings:
        name = "prescriptions"
        indexes = [
            "patient_id",
            "doctor_id",
            "status",
            "issued_at",
        ]
