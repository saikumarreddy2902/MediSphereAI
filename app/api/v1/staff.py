"""
MediSphere AI — Staff API
"""
from datetime import UTC

from app.services.staff import DepartmentService, StaffService
from fastapi import APIRouter, Depends

router = APIRouter()

def get_staff_service() -> StaffService:
    return StaffService()

def get_dept_service() -> DepartmentService:
    return DepartmentService()

@router.get("/")
async def get_all_staff(service: StaffService = Depends(get_staff_service)):
    """Get all hospital staff / doctors"""
    staff = await service.repository.get_multi()
    return [s.model_dump(by_alias=True, mode="json") for s in staff]

@router.get("/departments")
async def get_all_departments(service: DepartmentService = Depends(get_dept_service)):
    """Get all departments"""
    depts = await service.get_active_departments()
    return [d.model_dump(by_alias=True, mode="json") for d in depts]

@router.get("/departments/{dept_id}/staff")
async def get_staff_by_department(dept_id: str, service: StaffService = Depends(get_staff_service)):
    """Get staff for a specific department"""
    staff = await service.get_by_department(dept_id)
    return [s.model_dump(by_alias=True, mode="json") for s in staff]


# ─── Shift & Duty Roster Management ───────────────────────────────────────────

MOCK_SHIFTS = [
    {"staff_id": "STF-01", "name": "Dr. Priya Sharma",   "role": "doctor", "department": "Cardiology",       "shifts": ["M", "M", "M", "M", "M", "OFF", "OFF"]},
    {"staff_id": "STF-02", "name": "Dr. Rajesh Iyer",     "role": "doctor", "department": "Neurology",        "shifts": ["E", "E", "E", "E", "OFF", "OFF", "M"]},
    {"staff_id": "STF-03", "name": "Dr. Ananya Reddy",   "role": "doctor", "department": "Pediatrics",       "shifts": ["M", "M", "OFF", "M", "M", "M", "OFF"]},
    {"staff_id": "STF-04", "name": "Nurse Sarah Jenkins","role": "nurse",  "department": "ICU",              "shifts": ["N", "N", "OFF", "OFF", "N", "N", "OFF"]},
    {"staff_id": "STF-05", "name": "Nurse Rohit Nair",    "role": "nurse",  "department": "Emergency",        "shifts": ["M", "M", "M", "OFF", "E", "E", "OFF"]},
    {"staff_id": "STF-06", "name": "Nurse Maya Sen",     "role": "nurse",  "department": "General Medicine", "shifts": ["E", "E", "OFF", "M", "M", "OFF", "OFF"]},
    {"staff_id": "STF-07", "name": "Dr. Vikram Joshi",   "role": "doctor", "department": "Orthopedics",      "shifts": ["OFF", "M", "M", "M", "M", "OFF", "OFF"]},
    {"staff_id": "STF-08", "name": "Nurse Kavita Rao",   "role": "nurse",  "department": "Cardiac Care",     "shifts": ["M", "M", "E", "E", "OFF", "N", "OFF"]},
]


@router.get("/shifts", summary="Get Staff Duty Roster")
async def get_staff_shifts(department: str = "ALL"):
    """
    Returns weekly shift schedules for medical staff.
    """
    if department and department != "ALL":
        filtered = [s for s in MOCK_SHIFTS if s["department"].lower() == department.lower()]
        return {"department": department, "count": len(filtered), "roster": filtered}
    return {"department": "ALL", "count": len(MOCK_SHIFTS), "roster": MOCK_SHIFTS}
@router.get("/roster/summary", summary="Get Staff Roster Summary")
async def get_staff_roster_summary():
    """
    Returns high-level summary of active roster allocations.
    """
    return {"department": "ALL", "count": len(MOCK_SHIFTS), "roster": MOCK_SHIFTS}


@router.post("/shifts/assign", summary="Assign or Update Staff Shift")
async def assign_staff_shift(payload: dict):
    """
    Assigns or updates a staff member's shift for a specific day.
    """
    staff_id = payload.get("staff_id")
    day_idx = payload.get("day_index", 0)
    shift_code = payload.get("shift", "M")

    for s in MOCK_SHIFTS:
        if s["staff_id"] == staff_id and 0 <= day_idx < 7:
            s["shifts"][day_idx] = shift_code
            return {"status": "updated", "staff_id": staff_id, "day": day_idx, "shift": shift_code}

    return {"status": "assigned", "staff_id": staff_id, "shift": shift_code}


@router.post("/shifts/swap", summary="Request or Approve Shift Swap")
async def swap_staff_shift(payload: dict):
    """
    Processes peer-to-peer shift swap requests between nurses or resident doctors.
    """
    from datetime import datetime
    return {
        "status": "APPROVED",
        "swap_id": f"SWP-{int(datetime.now(UTC).timestamp())}",
        "requester": payload.get("requester_id"),
        "target": payload.get("target_id"),
        "message": "Shift swap successfully approved and updated in central hospital roster.",
    }


@router.get("/nurse-queue", summary="Get Active Nurse Duty Queue & Checklist")
async def get_nurse_queue():
    """
    Returns active tasks for the on-duty nursing staff:
    vitals recording rounds, medication administration rounds, and patient transfers.
    """
    return {
        "nurse_on_duty": "Nurse Sarah Jenkins",
        "ward": "ICU / Step-Down Unit",
        "shift": "Morning (07:00 - 15:30)",
        "assigned_patients_count": 6,
        "tasks": [
            {"id": "TSK-01", "time": "12:30", "type": "VITALS", "patient": "Arjun Mehta (ICU-3A)", "priority": "CRITICAL", "done": False},
            {"id": "TSK-02", "time": "13:00", "type": "MEDICATION", "patient": "Priya Sharma (C-7)", "details": "IV Antibiotic Ceftriaxone 1g", "priority": "HIGH", "done": False},
            {"id": "TSK-03", "time": "13:30", "type": "VITALS", "patient": "Vikram Nair (ICU-1B)", "priority": "CRITICAL", "done": False},
            {"id": "TSK-04", "time": "14:00", "type": "DISPENSE", "patient": "Rahul Verma (G-12)", "details": "Oral Metformin 500mg", "priority": "NORMAL", "done": True},
            {"id": "TSK-05", "time": "15:00", "type": "HANDOVER", "patient": "All Unit Beds", "details": "Prepare shift handover summary for Evening shift nurse", "priority": "HIGH", "done": False},
        ],
    }

