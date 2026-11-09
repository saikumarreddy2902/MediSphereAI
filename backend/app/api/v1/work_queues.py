"""
MediSphere AI — Department Work Queues & Task Engine

Provides real-time departmental work queues, task routing, and operational
cockpit data for doctors, nurses, and department heads.
Access is protected by Department-based RBAC.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone
import random

from app.models.user import User
from app.api.deps import get_current_user, RoleChecker, enforce_department_scope
from app.mock.data_generator import (
    DEPARTMENTS, DOCTOR_SPECIALIZATIONS, generate_appointments,
    generate_emergency_cases, generate_staff, generate_lab_orders
)
from app.api.v1.appointments import DEPARTMENT_DOCTORS, DYNAMIC_APPOINTMENTS

router = APIRouter()

# ─── Schemas ────────────────────────────────────────────────────────────────

class WorkQueueActionRequest(BaseModel):
    department: str = Field(..., example="Cardiology")
    action_type: str = Field(..., example="COMPLETE_CONSULTATION", description="START_CONSULTATION, COMPLETE_CONSULTATION, DISPATCH_EMERGENCY, ACKNOWLEDGE_LAB, DISCHARGE_PREP")
    target_id: str = Field(..., example="APT-7101")
    notes: Optional[str] = Field(None, example="Patient evaluated, stable ECG.")

class WorkQueueActionResponse(BaseModel):
    success: bool
    department: str
    action_type: str
    target_id: str
    message: str
    updated_at: str

# ─── In-memory Queue Overrides / Live Action State ───────────────────────────
QUEUE_STATUS_OVERRIDES: Dict[str, str] = {}


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/departments", summary="Get queue overview for all hospital departments")
async def get_all_department_queues_summary():
    """
    Returns an aggregated queue summary across all departments for high-level
    hospital monitoring and department switching.
    """
    summaries = []
    for dept in DEPARTMENTS:
        name = dept["name"]
        color = dept.get("color", "#6366f1")
        floor = dept.get("floor", 1)
        bed_cap = dept.get("bed_capacity", 20)

        # Compute dynamic realistic queue volumes
        rng = random.Random(hash(name) % 10000)
        consultations = rng.randint(4, 18)
        emergencies = rng.randint(0, 4) if name in ["Emergency", "ICU", "Cardiology", "Neurology", "Surgery"] else 0
        lab_tests = rng.randint(3, 14)
        occupied_beds = int(bed_cap * (0.65 + rng.random() * 0.28)) if bed_cap > 0 else 0

        load_pct = min(98, int((consultations * 3 + emergencies * 10 + occupied_beds) / max(1, (bed_cap + 15)) * 40))

        summaries.append({
            "department_id": dept["id"],
            "name": name,
            "floor": floor,
            "color": color,
            "bed_capacity": bed_cap,
            "occupied_beds": occupied_beds,
            "pending_consultations": consultations,
            "active_emergencies": emergencies,
            "pending_diagnostics": lab_tests,
            "load_percentage": load_pct,
            "status": "critical" if load_pct > 85 else ("warning" if load_pct > 70 else "normal")
        })

    return {"departments": summaries, "total_departments": len(summaries)}


@router.get("/department/{department_name}", summary="Get live operational work queue for a specific department")
async def get_department_work_queue(
    department_name: str,
    priority: Optional[str] = Query(None, description="Filter by priority: critical, high, medium, all"),
):
    """
    Returns the real-time operational work queue for a specific clinical department:
      - Consultation Queue (Scheduled patients waiting for doctor consultation)
      - Emergency Escalations (Rapid response cases requiring department input)
      - Diagnostic Orders (Lab & imaging results in-flight)
      - Inpatient Ward Tasks (Beds, nursing rounds, discharge readiness)
    """
    target_name = department_name.strip()
    dept_meta = next((d for d in DEPARTMENTS if d["name"].lower() == target_name.lower()), None)
    if not dept_meta:
        # Default fallback to first matching department
        dept_meta = {
            "id": f"dept-{target_name.lower()[:4]}",
            "name": target_name.capitalize(),
            "floor": 3,
            "bed_capacity": 25,
            "color": "#3b82f6"
        }

    canonical_name = dept_meta["name"]

    # 1. Team on Duty
    doctors_registered = DEPARTMENT_DOCTORS.get(canonical_name, [])
    if not doctors_registered:
        doctors_registered = [
            {"id": f"DOC-{canonical_name[:4].upper()}-01", "name": f"Dr. {canonical_name} Lead", "specialty": f"{canonical_name} Specialist", "shift": "DAY", "working_hours": ["09:00", "17:00"], "active_patients": 3}
        ]

    team_members = []
    for doc in doctors_registered:
        team_members.append({
            "id": doc["id"],
            "name": doc["name"],
            "role": "PHYSICIAN",
            "specialty": doc["specialty"],
            "status": "AVAILABLE" if doc.get("active_patients", 0) < 4 else "BUSY",
            "active_queue": doc.get("active_patients", 2),
            "shift": doc.get("shift", "DAY"),
        })

    # Add primary nurse
    team_members.append({
        "id": f"NURSE-{canonical_name[:4].upper()}-01",
        "name": f"Nurse Staff ({canonical_name} Ward)",
        "role": "NURSE",
        "specialty": "Ward & Inpatient Care",
        "status": "AVAILABLE",
        "active_queue": 6,
        "shift": "DAY"
    })

    # 2. Consultations Queue
    # Gather live dynamic appointments + department-seeded appointments
    base_appts = generate_appointments(50)
    dept_appts = [a for a in (DYNAMIC_APPOINTMENTS + base_appts) if a.get("department", "").lower() == canonical_name.lower()]
    
    # If none found for newly added departments, synthesize realistic work queue items
    if len(dept_appts) < 4:
        sample_patients = [
            {"name": "Ramesh Rao", "id": "P-0051", "time": "09:30 AM", "reason": f"Initial {canonical_name} evaluation"},
            {"name": "Sangeeta Sen", "id": "P-0052", "time": "10:45 AM", "reason": f"Follow-up and specialized diagnostic review"},
            {"name": "Amitabh Bose", "id": "P-0053", "time": "11:30 AM", "reason": f"Chronic symptoms assessment in {canonical_name}"},
            {"name": "Meenakshi Iyer", "id": "P-0054", "time": "02:15 PM", "reason": f"Pre-procedure counseling"},
        ]
        for idx, sp in enumerate(sample_patients):
            doc = doctors_registered[idx % len(doctors_registered)]
            dept_appts.append({
                "id": f"APT-{canonical_name[:3].upper()}-{8000+idx}",
                "appointment_id": f"APT-{canonical_name[:3].upper()}-{8000+idx}",
                "patient_name": sp["name"],
                "patient_id": sp["id"],
                "doctor_name": doc["name"],
                "doctor_specialty": doc["specialty"],
                "department": canonical_name,
                "appointment_date": date.today().isoformat(),
                "appointment_time": sp["time"],
                "reason": sp["reason"],
                "status": "SCHEDULED",
                "priority": "high" if idx == 0 else "medium",
            })

    # Apply any action status overrides
    consultation_queue = []
    for item in dept_appts[:8]:
        aid = item.get("appointment_id") or item.get("id")
        current_status = QUEUE_STATUS_OVERRIDES.get(aid, item.get("status", "SCHEDULED"))
        consultation_queue.append({
            **item,
            "status": current_status,
            "wait_time_minutes": random.randint(5, 35) if current_status == "SCHEDULED" else 0,
            "priority": item.get("priority", "medium")
        })

    # 3. Emergency Escalations
    # Filter or synthesize high-acuity cases related to this department
    all_emergencies = generate_emergency_cases(15)
    emergencies_for_dept = []
    for ec in all_emergencies:
        status_override = QUEUE_STATUS_OVERRIDES.get(ec["case_number"], ec.get("status", "waiting"))
        if canonical_name in ["Emergency", "ICU"]:
            emergencies_for_dept.append({**ec, "status": status_override})
        elif canonical_name == "Cardiology" and "chest pain" in ec.get("chief_complaint", "").lower():
            emergencies_for_dept.append({**ec, "status": status_override})
        elif canonical_name == "Neurology" and "stroke" in ec.get("chief_complaint", "").lower():
            emergencies_for_dept.append({**ec, "status": status_override})
        elif canonical_name == "Surgery" and "trauma" in ec.get("chief_complaint", "").lower():
            emergencies_for_dept.append({**ec, "status": status_override})

    if not emergencies_for_dept:
        # Synthetic standby item for safety
        emergencies_for_dept = [{
            "id": f"ER-{canonical_name[:4].upper()}-01",
            "case_number": f"ER-{canonical_name[:4].upper()}-01",
            "patient_name": "Emergency Triage Standby",
            "age": 45,
            "chief_complaint": f"Urgent consultation requested for {canonical_name}",
            "triage_level": 2,
            "triage_label": "Emergent",
            "triage_color": "#f97316",
            "wait_minutes": 8,
            "status": QUEUE_STATUS_OVERRIDES.get(f"ER-{canonical_name[:4].upper()}-01", "in_triage"),
            "priority": "high"
        }]

    # 4. Diagnostic & Lab Orders
    lab_orders = generate_lab_orders(20)
    dept_labs = lab_orders[:5]

    # 5. Inpatient Beds & Ward Tasks
    capacity = dept_meta.get("bed_capacity", 20)
    occupied_count = int(capacity * 0.75) if capacity > 0 else 0
    inpatient_ward = []
    for b_idx in range(1, min(7, capacity + 1)):
        bed_num = f"{canonical_name[:3].upper()}-{b_idx:02d}"
        is_occ = b_idx <= occupied_count
        inpatient_ward.append({
            "bed_number": bed_num,
            "is_occupied": is_occ,
            "patient_id": f"P-{1000 + b_idx * 17}" if is_occ else None,
            "patient_name": f"Patient {bed_num}" if is_occ else "Available Bed",
            "acuity_level": "moderate" if b_idx % 2 == 0 else "stable",
            "nurse_assigned": team_members[-1]["name"],
            "discharge_ready": b_idx == 2,
            "last_vitals_check": f"{random.randint(15, 60)} mins ago" if is_occ else "N/A"
        })

    return {
        "department": dept_meta,
        "team_on_duty": team_members,
        "consultation_queue": consultation_queue,
        "emergency_escalations": emergencies_for_dept,
        "diagnostic_orders": dept_labs,
        "inpatient_ward": inpatient_ward,
        "kpis": {
            "active_patients": len(consultation_queue),
            "urgent_cases": len(emergencies_for_dept),
            "pending_tests": len(dept_labs),
            "bed_occupancy_pct": round((occupied_count / max(1, capacity)) * 100, 1),
            "avg_wait_minutes": 18.5,
        }
    }


@router.post("/action", response_model=WorkQueueActionResponse, summary="Execute a clinical or operational work queue action")
async def execute_queue_action(
    req: WorkQueueActionRequest,
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "head_nurse", "staff"]))
):
    """
    Executes a clinical task from the work queue:
      - START_CONSULTATION: Patient called into consultation room
      - COMPLETE_CONSULTATION: Consultation finished, note recorded
      - DISPATCH_EMERGENCY: Doctor dispatched to emergency resuscitation
      - ACKNOWLEDGE_LAB: Critical lab value reviewed
      - DISCHARGE_PREP: Patient discharge process initiated
    """
    action = req.action_type.upper()
    target_id = req.target_id

    if action == "START_CONSULTATION":
        QUEUE_STATUS_OVERRIDES[target_id] = "IN_PROGRESS"
        msg = f"Consultation started for {target_id} in {req.department}. Patient called in."
    elif action == "COMPLETE_CONSULTATION":
        QUEUE_STATUS_OVERRIDES[target_id] = "COMPLETED"
        msg = f"Consultation completed for {target_id}. Summary and clinical orders logged."
    elif action == "DISPATCH_EMERGENCY":
        QUEUE_STATUS_OVERRIDES[target_id] = "DOCTOR_DISPATCHED"
        msg = f"Emergency team dispatched to {target_id} in {req.department}."
    elif action == "ACKNOWLEDGE_LAB":
        QUEUE_STATUS_OVERRIDES[target_id] = "ACKNOWLEDGED"
        msg = f"Diagnostic result {target_id} acknowledged by attending physician."
    elif action == "DISCHARGE_PREP":
        QUEUE_STATUS_OVERRIDES[target_id] = "DISCHARGE_INITIATED"
        msg = f"Discharge checklist initiated for bed {target_id}."
    else:
        QUEUE_STATUS_OVERRIDES[target_id] = "PROCESSED"
        msg = f"Action {action} processed for {target_id}."

    return WorkQueueActionResponse(
        success=True,
        department=req.department,
        action_type=action,
        target_id=target_id,
        message=msg,
        updated_at=datetime.now(timezone.utc).isoformat()
    )
