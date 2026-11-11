"""
MediSphere AI — Medical Records API

Provides CRUD endpoints for structured patient medical records.
Access is governed by RBAC: doctors and admins can create/update;
nurses and admins can read; patients cannot access via this API directly.
"""
from datetime import date, datetime

from app.api.deps import RoleChecker, enforce_department_scope
from app.models.audit import AuditLog
from app.models.medical_record import MedicalRecord
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

router = APIRouter()

# ─── Schemas ────────────────────────────────────────────────────────────────

class MedicalRecordCreate(BaseModel):
    record_type: str
    title: str
    description: str
    icd_code: str | None = None
    severity: str | None = None
    date_of_record: date
    department_id: str | None = None
    appointment_id: str | None = None
    lab_order_id: str | None = None
    attachments: list[str] = []


class MedicalRecordResponse(BaseModel):
    id: str | None = None
    patient_id: str
    doctor_id: str | None
    department_id: str | None = None
    record_type: str
    title: str
    description: str
    icd_code: str | None
    severity: str | None
    date_of_record: date
    is_active: bool
    created_at: datetime | None


    class Config:
        from_attributes = True


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[MedicalRecordResponse],
    summary="List all medical records across patients",
)
async def list_all_records(
    record_type: str | None = Query(None, description="Filter by record type"),
    patient_id: str | None = Query(None, description="Filter by patient ID"),
    department_id: str | None = Query(None, description="Filter by department (enforces Department RBAC)"),
    limit: int = Query(50, ge=1, le=200),
    active_only: bool = Query(True),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "head_nurse", "staff"])),
) -> list[MedicalRecordResponse]:
    """List medical records and clinical reports across patients with Department RBAC scoping."""
    # Enforce department scoping for clinical staff
    scoped_dept = enforce_department_scope(current_user, department_id)

    query: dict = {}
    if patient_id:
        query["patient_id"] = patient_id
    if record_type:
        query["record_type"] = record_type
    if active_only:
        query["is_active"] = True
    if scoped_dept:
        query["$or"] = [
            {"department_id": scoped_dept},
            {"doctor_id": str(current_user.id)}
        ]

    records = await MedicalRecord.find(query).sort("-date_of_record").limit(limit).to_list()
    return [MedicalRecordResponse(
        id=str(r.id),
        patient_id=r.patient_id,
        doctor_id=r.doctor_id,
        department_id=r.department_id,
        record_type=r.record_type,
        title=r.title,
        description=r.description,
        icd_code=r.icd_code,
        severity=r.severity,
        date_of_record=r.date_of_record,
        is_active=r.is_active,
        created_at=r.created_at,
    ) for r in records]


@router.get(
    "/patients/{patient_id}/records",
    response_model=list[MedicalRecordResponse],
    summary="List all medical records for a patient",
)
async def list_patient_records(
    patient_id: str,
    record_type: str | None = Query(None, description="Filter by record type"),
    department_id: str | None = Query(None, description="Filter by department (enforces Department RBAC)"),
    active_only: bool = Query(True),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "head_nurse", "staff"])),
) -> list[MedicalRecordResponse]:
    """Return all medical records for a patient, scoped to user's assigned department if restricted."""
    scoped_dept = enforce_department_scope(current_user, department_id)

    query: dict = {"patient_id": patient_id}
    if record_type:
        query["record_type"] = record_type
    if active_only:
        query["is_active"] = True
    if scoped_dept:
        query["$or"] = [
            {"department_id": scoped_dept},
            {"doctor_id": str(current_user.id)}
        ]

    records = await MedicalRecord.find(query).sort("-date_of_record").to_list()
    return [MedicalRecordResponse(
        id=str(r.id),
        patient_id=r.patient_id,
        doctor_id=r.doctor_id,
        department_id=r.department_id,
        record_type=r.record_type,
        title=r.title,
        description=r.description,
        icd_code=r.icd_code,
        severity=r.severity,
        date_of_record=r.date_of_record,
        is_active=r.is_active,
        created_at=r.created_at,
    ) for r in records]


@router.post(
    "/patients/{patient_id}/records",
    response_model=MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new clinical report / medical record for a patient",
)
async def create_patient_record(
    patient_id: str,
    record_in: MedicalRecordCreate,
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "head_nurse"])),
) -> MedicalRecordResponse:
    """Create and persist a new medical report with Department RBAC tagging."""
    # Enforce department assignment
    assigned_dept = enforce_department_scope(current_user, record_in.department_id) or current_user.department_id

    data = record_in.model_dump()
    data["department_id"] = assigned_dept

    record = MedicalRecord(
        patient_id=patient_id,
        doctor_id=str(current_user.id),
        **data,
    )
    await record.insert()

    # Persist audit log entry
    await AuditLog(
        user_id=str(current_user.id),
        username=current_user.username,
        action="CREATE_MEDICAL_RECORD",
        resource="medical_record",
        resource_id=str(record.id),
        outcome="SUCCESS",
        detail=f"Created {record.record_type} report for patient {patient_id} in department '{assigned_dept}' by {current_user.roles[0] if current_user.roles else 'staff'}",
    ).insert()

    return MedicalRecordResponse(
        id=str(record.id),
        patient_id=record.patient_id,
        doctor_id=record.doctor_id,
        department_id=record.department_id,
        record_type=record.record_type,
        title=record.title,
        description=record.description,
        icd_code=record.icd_code,
        severity=record.severity,
        date_of_record=record.date_of_record,
        is_active=record.is_active,
        created_at=record.created_at,
    )



@router.delete(
    "/patients/{patient_id}/records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete (deactivate) a medical record",
)
async def deactivate_record(
    patient_id: str,
    record_id: str,
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "head_nurse"])),
) -> None:
    """Soft-deletes a medical record by setting is_active=False. Records are never hard-deleted."""
    record = await MedicalRecord.get(record_id)
    if not record or record.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Medical record not found")

    record.is_active = False
    await record.save()

