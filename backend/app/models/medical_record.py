"""
MediSphere AI — Medical Record Model

Structured medical record document supporting multiple clinical record types:
diagnosis history, medication history, procedures, allergies, and attachments.
"""
from typing import List, Optional
from datetime import datetime, date
from app.models.base import BaseDocument


class MedicalRecord(BaseDocument):
    """
    Structured clinical record attached to a patient.

    Types:
        DIAGNOSIS   — clinical diagnosis with ICD code
        MEDICATION  — prescribed medication or treatment plan
        PROCEDURE   — surgical or clinical procedure
        ALLERGY     — documented allergy or adverse reaction
        VITALS      — vital sign observation (BP, HR, temp, weight)
        NOTE        — general clinical note or discharge summary
        LAB_RESULT  — linked to a LabOrder result
        IMAGING     — radiology / imaging report
    """
    patient_id: str
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None

    record_type: str                          # see Types above
    title: str
    description: str
    icd_code: Optional[str] = None           # ICD-10 code for diagnosis records
    severity: Optional[str] = None           # mild | moderate | severe | critical
    date_of_record: date
    is_active: bool = True                   # False = resolved/historical

    # Linked resources
    appointment_id: Optional[str] = None
    lab_order_id: Optional[str] = None

    # Attachments (file URLs / presigned S3 links)
    attachments: List[str] = []

    # Timestamps inherited from BaseDocument via Field(default_factory=utc_now)
    # No custom __init__ needed — BaseDocument handles created_at and updated_at

    class Settings:
        name = "medical_records"
        indexes = [
            "patient_id",
            "doctor_id",
            "record_type",
            "date_of_record",
        ]
