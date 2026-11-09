"""
MediSphere AI — Medical Records Service

Business logic layer for patient medical record management.
Wraps repository operations with validation, access control helpers,
and audit utilities for the Medical Records API.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.models.medical_record import MedicalRecord
from app.models.audit import AuditLog


class MedicalRecordsService:
    """
    Service layer for medical record CRUD and analytics.

    All write operations persist an AuditLog entry to maintain
    a complete, tamper-evident history of clinical record changes.
    """

    async def list_by_patient(
        self,
        patient_id: str,
        record_type: Optional[str] = None,
        active_only: bool = True,
    ) -> List[MedicalRecord]:
        """Return all medical records for a patient with optional filters."""
        query: Dict[str, Any] = {"patient_id": patient_id}
        if record_type:
            query["record_type"] = record_type
        if active_only:
            query["is_active"] = True
        return await MedicalRecord.find(query).sort("-date_of_record").to_list()

    async def get_by_id(self, record_id: str) -> Optional[MedicalRecord]:
        """Fetch a single record by ObjectId string."""
        return await MedicalRecord.get(record_id)

    async def create(
        self,
        patient_id: str,
        doctor_id: str,
        data: Dict[str, Any],
    ) -> MedicalRecord:
        """Create and persist a new medical record with audit trail."""
        record = MedicalRecord(
            patient_id=patient_id,
            doctor_id=doctor_id,
            **data,
        )
        await record.insert()

        await AuditLog(
            user_id=doctor_id,
            username=doctor_id,
            action="CREATE_MEDICAL_RECORD",
            resource="medical_record",
            resource_id=str(record.id),
            outcome="SUCCESS",
            detail=f"Created {record.record_type} record for patient {patient_id}",
        ).insert()

        return record

    async def deactivate(
        self,
        record_id: str,
        patient_id: str,
        actor_id: str,
        actor_username: str,
    ) -> bool:
        """
        Soft-delete (deactivate) a medical record.
        Records are never physically deleted — only marked inactive.
        """
        record = await MedicalRecord.get(record_id)
        if not record or record.patient_id != patient_id:
            return False

        record.is_active = False
        await record.save()

        await AuditLog(
            user_id=actor_id,
            username=actor_username,
            action="DEACTIVATE_MEDICAL_RECORD",
            resource="medical_record",
            resource_id=record_id,
            outcome="SUCCESS",
            detail=f"Deactivated record for patient {patient_id}",
        ).insert()

        return True

    async def get_record_summary(self, patient_id: str) -> Dict[str, Any]:
        """Return a summary count of record types for a patient."""
        all_records = await MedicalRecord.find(
            {"patient_id": patient_id, "is_active": True}
        ).to_list()

        type_counts: Dict[str, int] = {}
        for r in all_records:
            type_counts[r.record_type] = type_counts.get(r.record_type, 0) + 1

        return {
            "patient_id": patient_id,
            "total_active": len(all_records),
            "by_type": type_counts,
        }
