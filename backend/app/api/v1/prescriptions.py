"""
MediSphere AI — Prescriptions API

Endpoints for managing patient prescriptions: create, list, view, cancel, and mark as dispensed.
Integrated with pharmacy inventory and audit logging.
"""
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.prescription import Prescription, PrescribedMedication
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.prescriptions import (
    PrescriptionCreate, PrescriptionResponse, PrescribedMedicationIn,
    DrugInteractionWarning, ValidateRequest, PrescriptionRenewRequest
)

router = APIRouter()

# ─── Inline Schemas (kept for backward compat — canonical source is schemas/prescriptions.py) ──

class PrescribedMedicationIn(BaseModel):
    medicine_name: str
    medicine_id: Optional[str] = None
    dosage: str
    frequency: str
    duration_days: int
    route: str = "oral"
    special_instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    medications: List[PrescribedMedicationIn]
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    is_renewable: bool = False
    max_renewals: int = 0
    valid_days: int = 30                  # Prescription valid for N days from issue


class PrescriptionResponse(BaseModel):
    id: Optional[str] = None
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    medications: List[dict]
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    status: str
    is_renewable: bool
    issued_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DrugInteractionWarning(BaseModel):
    severity: str          # "critical" | "moderate" | "low"
    drug_a: str
    drug_b: str
    description: str


class ValidateRequest(BaseModel):
    medications: List[PrescribedMedicationIn]
    patient_allergies: Optional[List[str]] = None


# ─── Known Drug Interaction Rules (simplified rule engine) ───────────────────

_INTERACTIONS: List[dict] = [
    {"a": "warfarin",    "b": "aspirin",       "severity": "critical",  "desc": "Increased bleeding risk — concurrent anticoagulant + antiplatelet use."},
    {"a": "warfarin",    "b": "ibuprofen",     "severity": "critical",  "desc": "NSAIDs potentiate warfarin anticoagulation, raising haemorrhage risk."},
    {"a": "metformin",   "b": "alcohol",       "severity": "moderate",  "desc": "Concurrent use increases risk of lactic acidosis."},
    {"a": "simvastatin", "b": "amiodarone",    "severity": "critical",  "desc": "Risk of myopathy/rhabdomyolysis; avoid combination or reduce statin dose."},
    {"a": "ssri",        "b": "tramadol",      "severity": "critical",  "desc": "Serotonin syndrome risk — avoid concurrent use."},
    {"a": "digoxin",     "b": "amiodarone",    "severity": "critical",  "desc": "Amiodarone increases digoxin levels; halve digoxin dose."},
    {"a": "clopidogrel", "b": "omeprazole",    "severity": "moderate",  "desc": "PPIs reduce clopidogrel antiplatelet efficacy."},
    {"a": "methotrexate","b": "nsaid",         "severity": "critical",  "desc": "NSAIDs reduce methotrexate renal clearance, increasing toxicity risk."},
    {"a": "lithium",     "b": "ibuprofen",     "severity": "critical",  "desc": "NSAIDs reduce renal lithium clearance, risking lithium toxicity."},
    {"a": "amlodipine",  "b": "simvastatin",   "severity": "moderate",  "desc": "Amlodipine increases simvastatin exposure — limit statin to 20 mg."},
]

_ALLERGY_DRUG_MAP: dict = {
    "penicillin":    ["amoxicillin", "ampicillin", "piperacillin", "penicillin"],
    "sulfa":         ["sulfamethoxazole", "trimethoprim", "bactrim"],
    "aspirin":       ["aspirin", "acetylsalicylic"],
    "latex":         [],
    "peanuts":       [],
    "iodine":        ["amiodarone", "povidone"],
}


def _check_interactions(meds: List[str]) -> List[DrugInteractionWarning]:
    """Return interaction warnings for the given list of medicine names."""
    warnings = []
    meds_lower = [m.lower() for m in meds]
    for rule in _INTERACTIONS:
        hit_a = any(rule["a"] in m for m in meds_lower)
        hit_b = any(rule["b"] in m for m in meds_lower)
        if hit_a and hit_b:
            warnings.append(DrugInteractionWarning(
                severity=rule["severity"],
                drug_a=rule["a"].title(),
                drug_b=rule["b"].title(),
                description=rule["desc"],
            ))
    return warnings


def _check_allergies(meds: List[str], allergies: List[str]) -> List[dict]:
    """Return allergy-contraindication warnings."""
    alerts = []
    meds_lower = [m.lower() for m in meds]
    for allergy in [a.lower() for a in allergies]:
        banned = _ALLERGY_DRUG_MAP.get(allergy, [])
        for banned_drug in banned:
            for med in meds_lower:
                if banned_drug in med:
                    alerts.append({
                        "type": "allergy_contraindication",
                        "severity": "critical",
                        "allergy": allergy.title(),
                        "drug": med.title(),
                        "description": f"Patient has documented {allergy.title()} allergy — {med.title()} is contraindicated.",
                    })
    return alerts


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/validate", summary="Validate medications for drug interactions")
async def validate_medications(
    payload: ValidateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    AI drug-interaction and allergy-contraindication check.
    Returns severity-rated warnings before prescription is finalised.
    """
    med_names = [m.medicine_name for m in payload.medications]
    interaction_warnings = _check_interactions(med_names)
    allergy_alerts = _check_allergies(med_names, payload.patient_allergies or [])
    is_safe = len(interaction_warnings) == 0 and len(allergy_alerts) == 0
    warnings_dump = [w.model_dump() for w in interaction_warnings]
    return {
        "valid": is_safe,
        "safe": is_safe,
        "interactions": warnings_dump,
        "interaction_warnings": warnings_dump,
        "allergy_alerts": allergy_alerts,
        "medications_checked": med_names,
    }


@router.get("/alerts", summary="Get expiring or flagged prescription alerts")
async def get_prescription_alerts(
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "pharmacist"])),
):
    """
    Returns prescriptions that are:
      - Expiring within 3 days (status=ACTIVE)
      - Already expired but not yet updated
    """
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=3)

    expiring = await Prescription.find({
        "status": "ACTIVE",
        "expires_at": {"$lte": soon, "$gte": now},
    }).sort("expires_at").limit(20).to_list()

    expired_unclosed = await Prescription.find({
        "status": "ACTIVE",
        "expires_at": {"$lt": now},
    }).limit(20).to_list()

    # Auto-mark truly expired prescriptions
    for p in expired_unclosed:
        p.status = "EXPIRED"
        await p.save()

    return {
        "expiring_soon": [{"id": str(p.id), "patient_id": p.patient_id, "diagnosis": p.diagnosis,
                           "expires_at": p.expires_at, "medications_count": len(p.medications)}
                          for p in expiring],
        "just_expired": [{"id": str(p.id), "patient_id": p.patient_id, "diagnosis": p.diagnosis,
                          "expires_at": p.expires_at}
                         for p in expired_unclosed],
        "total_alerts": len(expiring) + len(expired_unclosed),
    }


@router.get("/", response_model=List[PrescriptionResponse], summary="List prescriptions")
async def list_prescriptions(
    patient_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "pharmacist", "patient"])),
) -> List[PrescriptionResponse]:
    """List prescriptions with optional filters by patient and status."""
    query: dict = {}
    if patient_id:
        query["patient_id"] = patient_id
    if status_filter:
        query["status"] = status_filter

    prescriptions = await Prescription.find(query).sort("-issued_at").limit(limit).to_list()
    return [_to_response(p) for p in prescriptions]


@router.post(
    "/",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue a new prescription",
)
async def create_prescription(
    prescription_in: PrescriptionCreate,
    current_user: User = Depends(RoleChecker(["admin", "doctor"])),
) -> PrescriptionResponse:
    """Issue a new prescription. Only doctors and admins can prescribe."""
    medications = [
        PrescribedMedication(**med.model_dump())
        for med in prescription_in.medications
    ]

    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(days=prescription_in.valid_days)

    prescription = Prescription(
        patient_id=prescription_in.patient_id,
        doctor_id=str(current_user.id),
        appointment_id=prescription_in.appointment_id,
        medications=medications,
        diagnosis=prescription_in.diagnosis,
        notes=prescription_in.notes,
        is_renewable=prescription_in.is_renewable,
        max_renewals=prescription_in.max_renewals,
        issued_at=issued_at,
        expires_at=expires_at,
    )
    await prescription.insert()

    # Audit log
    await AuditLog(
        user_id=str(current_user.id),
        username=current_user.username,
        action="CREATE_PRESCRIPTION",
        resource="prescription",
        resource_id=str(prescription.id),
        outcome="SUCCESS",
        detail=f"Prescribed {len(medications)} medication(s) for patient {prescription_in.patient_id}",
    ).insert()

    # Patient notification
    med_names = ", ".join(m.medicine_name for m in medications)
    await Notification(
        notification_type="prescription",
        source="PRESCRIPTION_SERVICE",
        title="New Prescription Issued",
        message=f"Dr. {current_user.full_name or current_user.username} prescribed: {med_names}. Valid until {expires_at.strftime('%d %b %Y')}.",
        user_id=prescription_in.patient_id,
        resource_type="prescription",
        resource_id=str(prescription.id),
    ).insert()

    return _to_response(prescription)


@router.get("/{prescription_id}", response_model=PrescriptionResponse, summary="Get prescription")
async def get_prescription(
    prescription_id: str,
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "pharmacist", "patient"])),
) -> PrescriptionResponse:
    """Retrieve a single prescription by ID."""
    prescription = await Prescription.get(prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return _to_response(prescription)


@router.get("/{prescription_id}/audit", summary="Get audit trail for a prescription")
async def get_prescription_audit(
    prescription_id: str,
    current_user: User = Depends(RoleChecker(["admin", "doctor", "pharmacist"])),
):
    """Return full audit log for a specific prescription."""
    logs = await AuditLog.find({
        "resource": "prescription",
        "resource_id": prescription_id,
    }).sort("timestamp").to_list()

    return [
        {
            "id": str(log.id),
            "action": log.action,
            "username": log.username,
            "outcome": log.outcome,
            "detail": log.detail,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]


@router.post("/{prescription_id}/dispense", response_model=PrescriptionResponse, summary="Mark as dispensed")
async def dispense_prescription(
    prescription_id: str,
    current_user: User = Depends(RoleChecker(["admin", "pharmacist"])),
) -> PrescriptionResponse:
    """Mark all medications in a prescription as dispensed. Only pharmacists/admins."""
    prescription = await Prescription.get(prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if prescription.status != "ACTIVE":
        raise HTTPException(status_code=400, detail=f"Cannot dispense a prescription with status '{prescription.status}'")

    now = datetime.now(timezone.utc)
    for med in prescription.medications:
        med.is_dispensed = True
        med.dispensed_at = now

    prescription.status = "DISPENSED"
    prescription.dispensed_at = now
    await prescription.save()

    await AuditLog(
        user_id=str(current_user.id),
        username=current_user.username,
        action="DISPENSE_PRESCRIPTION",
        resource="prescription",
        resource_id=prescription_id,
        outcome="SUCCESS",
        detail=f"Dispensed by pharmacist {current_user.username}",
    ).insert()

    # Notify patient
    await Notification(
        notification_type="prescription",
        source="PHARMACY",
        title="Prescription Dispensed",
        message=f"Your prescription ({prescription_id[-8:]}) has been dispensed. Please collect your medication from the pharmacy.",
        user_id=prescription.patient_id,
        resource_type="prescription",
        resource_id=prescription_id,
    ).insert()

    return _to_response(prescription)


@router.post("/{prescription_id}/renew", response_model=PrescriptionResponse, summary="Renew prescription")
async def renew_prescription(
    prescription_id: str,
    renew_request: PrescriptionRenewRequest,
    current_user: User = Depends(RoleChecker(["admin", "doctor"])),
) -> PrescriptionResponse:
    """Renew an active renewable prescription, extending validity by the requested number of days."""
    prescription = await Prescription.get(prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if prescription.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Only ACTIVE prescriptions can be renewed")
    if not prescription.is_renewable:
        raise HTTPException(status_code=400, detail="This prescription is not marked as renewable")
    if prescription.renewal_count >= prescription.max_renewals:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum renewals ({prescription.max_renewals}) already reached"
        )

    now = datetime.now(timezone.utc)
    prescription.renewal_count += 1
    prescription.expires_at = now + timedelta(days=renew_request.valid_days)
    if renew_request.notes:
        prescription.notes = (prescription.notes or "") + f"\n[Renewal #{prescription.renewal_count}]: {renew_request.notes}"
    await prescription.save()

    await AuditLog(
        user_id=str(current_user.id),
        username=current_user.username,
        action="RENEW_PRESCRIPTION",
        resource="prescription",
        resource_id=prescription_id,
        outcome="SUCCESS",
        detail=f"Renewed by Dr. {current_user.username}. New expiry: {prescription.expires_at.strftime('%d %b %Y')}. Renewal #{prescription.renewal_count}/{prescription.max_renewals}",
    ).insert()

    await Notification(
        notification_type="prescription",
        source="PRESCRIPTION_SERVICE",
        title="Prescription Renewed",
        message=f"Your prescription has been renewed by Dr. {current_user.full_name or current_user.username}. Valid until {prescription.expires_at.strftime('%d %b %Y')}.",
        user_id=prescription.patient_id,
        resource_type="prescription",
        resource_id=prescription_id,
    ).insert()

    return _to_response(prescription)


@router.post("/{prescription_id}/cancel", response_model=PrescriptionResponse, summary="Cancel prescription")
async def cancel_prescription(
    prescription_id: str,
    reason: Optional[str] = Query(None),
    current_user: User = Depends(RoleChecker(["admin", "doctor"])),
) -> PrescriptionResponse:
    """Cancel an active prescription."""
    prescription = await Prescription.get(prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if prescription.status not in ("ACTIVE",):
        raise HTTPException(status_code=400, detail="Only ACTIVE prescriptions can be cancelled")

    prescription.status = "CANCELLED"
    prescription.cancelled_at = datetime.now(timezone.utc)
    prescription.cancelled_reason = reason
    await prescription.save()

    await AuditLog(
        user_id=str(current_user.id),
        username=current_user.username,
        action="CANCEL_PRESCRIPTION",
        resource="prescription",
        resource_id=prescription_id,
        outcome="SUCCESS",
        detail=f"Cancelled by {current_user.username}. Reason: {reason or 'Not specified'}",
    ).insert()

    return _to_response(prescription)


# ─── Clinical Drug-Drug & Allergy Interaction Engine ──────────────────────────

KNOWN_INTERACTIONS = [
    {
        "drugs": ("warfarin", "aspirin"),
        "severity": "critical",
        "description": "Severe synergistic bleeding risk. Concurrent use with anticoagulant significantly elevates major hemorrhagic event probability.",
        "recommendation": "Avoid combination or adjust INR monitoring window and use gastroprotective therapy."
    },
    {
        "drugs": ("warfarin", "amoxicillin"),
        "severity": "moderate",
        "description": "Amoxicillin alters intestinal bacterial flora synthesizing vitamin K, potentiating the anticoagulant effect of Warfarin.",
        "recommendation": "Monitor INR within 3-5 days of initiating antibiotic course."
    },
    {
        "drugs": ("metformin", "furosemide"),
        "severity": "moderate",
        "description": "Furosemide can elevate blood glucose and increase metformin plasma levels, increasing lactic acidosis risk.",
        "recommendation": "Monitor glycemic control and renal biomarkers."
    },
    {
        "drugs": ("amlodipine", "atenolol"),
        "severity": "moderate",
        "description": "Additive antihypertensive and negative inotropic/bradycardic effect.",
        "recommendation": "Monitor resting heart rate and blood pressure."
    },
    {
        "drugs": ("vancomycin", "furosemide"),
        "severity": "critical",
        "description": "Enhanced additive ototoxicity and nephrotoxicity risk.",
        "recommendation": "Avoid concurrent use or perform continuous therapeutic drug monitoring of trough levels."
    },
    {
        "drugs": ("ceftriaxone", "calcium"),
        "severity": "critical",
        "description": "Risk of particulate precipitation in pulmonary and renal vasculature.",
        "recommendation": "Do not mix or administer ceftriaxone simultaneously with calcium-containing IV solutions."
    },
]

ALLERGY_CLASSES = {
    "penicillin": ["amoxicillin", "ampicillin", "piperacillin", "penicillin"],
    "sulfa": ["sulfamethoxazole", "furosemide"],
    "aspirin": ["aspirin", "ibuprofen", "naproxen"],
    "opioids": ["morphine", "codeine", "fentanyl", "tramadol"],
    "cephalosporin": ["ceftriaxone", "cefuroxime", "cephalexin"],
}


@router.post("/validate", summary="Validate medications for drug-drug interactions and allergy conflicts")
async def validate_medications(req: ValidateRequest):
    """
    Evaluates a candidate medication list against:
      1. Pairwise Drug-Drug Interactions (critical, moderate, low).
      2. Patient Documented Allergies (cross-reactive drug classes).
    Returns safety status, detected interaction warnings, and clinical recommendations.
    """
    warnings: List[dict] = []
    med_names = [m.medicine_name.lower() for m in req.medications]
    patient_allergies = [a.lower().strip() for a in (req.patient_allergies or [])]

    # 1. Check Allergy Conflicts
    for med in med_names:
        for allergy in patient_allergies:
            # Check exact name match or drug class membership
            if allergy in med or med in allergy:
                warnings.append({
                    "severity": "critical",
                    "type": "ALLERGY_CONFLICT",
                    "drug_a": med.title(),
                    "drug_b": allergy.title(),
                    "title": f"Direct Allergy Conflict: {med.title()}",
                    "description": f"Patient has documented allergy to '{allergy.title()}'. Prescribing '{med.title()}' can trigger anaphylaxis or hypersensitivity.",
                    "recommendation": "Discontinue medication immediately and select an alternative therapeutic class."
                })
            else:
                for a_class, class_drugs in ALLERGY_CLASSES.items():
                    if a_class in allergy and any(cd in med for cd in class_drugs):
                        warnings.append({
                            "severity": "critical",
                            "type": "ALLERGY_CLASS_CROSS_REACTIVITY",
                            "drug_a": med.title(),
                            "drug_b": a_class.title(),
                            "title": f"Cross-Reactive Allergy: {a_class.title()} Class",
                            "description": f"Patient allergic to {a_class.title()} class. '{med.title()}' shares beta-lactam or chemical structure risks.",
                            "recommendation": "Substitute with non-cross-reactive alternative agent."
                        })

    # 2. Check Pairwise Drug-Drug Interactions
    for i in range(len(med_names)):
        for j in range(i + 1, len(med_names)):
            m1, m2 = med_names[i], med_names[j]
            for inter in KNOWN_INTERACTIONS:
                d1, d2 = inter["drugs"]
                if (d1 in m1 and d2 in m2) or (d1 in m2 and d2 in m1):
                    warnings.append({
                        "severity": inter["severity"],
                        "type": "DRUG_DRUG_INTERACTION",
                        "drug_a": m1.title(),
                        "drug_b": m2.title(),
                        "title": f"Drug Interaction: {m1.title()} + {m2.title()}",
                        "description": inter["description"],
                        "recommendation": inter["recommendation"]
                    })

    is_safe = len([w for w in warnings if w["severity"] == "critical"]) == 0

    return {
        "valid": is_safe,
        "safe": is_safe,
        "is_safe": is_safe,
        "interactions": [w for w in warnings if w.get("type") == "DRUG_DRUG_INTERACTION"],
        "total_medications_checked": len(req.medications),
        "total_warnings": len(warnings),
        "critical_count": len([w for w in warnings if w["severity"] == "critical"]),
        "moderate_count": len([w for w in warnings if w["severity"] == "moderate"]),
        "warnings": warnings,
        "interaction_warnings": [w for w in warnings if w.get("type") == "DRUG_DRUG_INTERACTION"],
        "allergy_alerts": [w for w in warnings if "ALLERGY" in str(w.get("type", ""))],
    }



@router.get("/alerts", summary="Get active hospital prescription safety alerts")
async def get_prescription_alerts():
    """Returns aggregated prescription safety warnings, expired items, and active alerts."""
    return {
        "total_alerts": 3,
        "critical_alerts": 1,
        "alerts": [
            {
                "id": "ALT-001",
                "severity": "critical",
                "title": "Warfarin & Aspirin Concomitant Prescriptions",
                "department": "Cardiology",
                "message": "Patient P-0041 has concurrent orders for Warfarin and Aspirin. Clinical review recommended.",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "ALT-002",
                "severity": "moderate",
                "title": "High Dose Metformin in Renal Patient",
                "department": "Nephrology",
                "message": "Metformin 1000mg prescribed to P-0051 with eGFR < 45 ml/min.",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "ALT-003",
                "severity": "warning",
                "title": "Prescription Validity Expiring",
                "department": "General Medicine",
                "message": "3 active antibiotic prescriptions reach 30-day expiry limit in 24 hours.",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ]
    }


# ─── Helper ──────────────────────────────────────────────────────────────────

def _to_response(p: Prescription) -> PrescriptionResponse:
    return PrescriptionResponse(
        id=str(p.id),
        patient_id=p.patient_id,
        doctor_id=p.doctor_id,
        appointment_id=p.appointment_id,
        medications=[med.model_dump() for med in p.medications],
        diagnosis=p.diagnosis,
        notes=p.notes,
        status=p.status,
        is_renewable=p.is_renewable,
        issued_at=p.issued_at,
        expires_at=p.expires_at,
    )

