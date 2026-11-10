"""
MediSphere AI — Prescription Model

Structured prescription document linking a doctor's medication order to a patient.
Supports multi-medication prescriptions, dispensing status, and renewal tracking.
"""
from datetime import UTC, datetime

from app.models.base import BaseDocument
from pydantic import BaseModel


class PrescribedMedication(BaseModel):
    """Single medication line item within a prescription."""
    medicine_name: str
    medicine_id: str | None = None       # Links to Medicine inventory if matched
    dosage: str                              # e.g. "500mg"
    frequency: str                           # e.g. "twice daily", "every 8 hours"
    duration_days: int
    route: str = "oral"                      # oral | IV | topical | inhaled | etc.
    special_instructions: str | None = None
    is_dispensed: bool = False
    dispensed_at: datetime | None = None


class Prescription(BaseDocument):
    """
    Full prescription document issued by a doctor for a patient.

    Lifecycle: DRAFT → ACTIVE → DISPENSED / CANCELLED / EXPIRED
    """
    patient_id: str
    doctor_id: str
    appointment_id: str | None = None

    medications: list[PrescribedMedication] = []

    diagnosis: str | None = None         # Brief reason / diagnosis note
    notes: str | None = None             # Pharmacist / doctor notes

    status: str = "ACTIVE"                  # ACTIVE | DISPENSED | CANCELLED | EXPIRED
    is_renewable: bool = False
    renewal_count: int = 0
    max_renewals: int = 0

    issued_at: datetime = None              # type: ignore[assignment]
    expires_at: datetime | None = None
    dispensed_at: datetime | None = None
    cancelled_at: datetime | None = None
    cancelled_reason: str | None = None

    def __init__(self, **data):
        if "issued_at" not in data or data["issued_at"] is None:
            data["issued_at"] = datetime.now(UTC)
        super().__init__(**data)

    class Settings:
        name = "prescriptions"
        indexes = [
            "patient_id",
            "doctor_id",
            "status",
            "issued_at",
        ]
