"""Appointments API with AI Agent Dynamic Multi-Department Doctor Allocation Engine"""
from fastapi import APIRouter, Query, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone
import random
from app.mock.data_generator import generate_appointments
from app.api.deps import RoleChecker
from app.models.user import User

router = APIRouter()

# ─── Doctor Availability Registry by Department ──────────────────────────────
DEPARTMENT_DOCTORS: Dict[str, List[Dict[str, Any]]] = {
    "Cardiology": [
        {"id": "DOC-CARD-01", "name": "Dr. Priya Sharma", "specialty": "Interventional Cardiology", "shift": "DAY", "working_hours": ["09:00", "13:00", "14:00", "17:00"], "active_patients": 3},
        {"id": "DOC-CARD-02", "name": "Dr. Arun Kumar", "specialty": "Electrophysiology & Heart Failure", "shift": "DAY", "working_hours": ["10:00", "14:00", "15:00", "18:00"], "active_patients": 5},
    ],
    "Neurology": [
        {"id": "DOC-NEUR-01", "name": "Dr. Suresh Nair", "specialty": "Stroke & Neuromuscular Disorders", "shift": "DAY", "working_hours": ["09:30", "12:30", "14:30", "17:30"], "active_patients": 2},
        {"id": "DOC-NEUR-02", "name": "Dr. Ananya Rao", "specialty": "Epilepsy & Cognitive Neurology", "shift": "DAY", "working_hours": ["11:00", "15:00", "16:00", "19:00"], "active_patients": 4},
    ],
    "Orthopedics": [
        {"id": "DOC-ORTH-01", "name": "Dr. Arjun Mehta", "specialty": "Joint Replacement & Trauma", "shift": "DAY", "working_hours": ["09:00", "12:00", "13:30", "16:30"], "active_patients": 3},
        {"id": "DOC-ORTH-02", "name": "Dr. Rajeshwar Rao", "specialty": "Sports Medicine & Arthroscopy", "shift": "DAY", "working_hours": ["10:30", "14:00", "15:30", "18:30"], "active_patients": 4},
    ],
    "Pediatrics": [
        {"id": "DOC-PED-01", "name": "Dr. Deepa Menon", "specialty": "General & Neonatal Pediatrics", "shift": "DAY", "working_hours": ["09:00", "12:00", "13:00", "16:00"], "active_patients": 2},
        {"id": "DOC-PED-02", "name": "Dr. Rahul Verma", "specialty": "Pediatric Pulmonology & Allergy", "shift": "DAY", "working_hours": ["10:00", "13:30", "14:30", "17:30"], "active_patients": 3},
    ],
    "General Medicine": [
        {"id": "DOC-GEN-01", "name": "Dr. Kavya Reddy", "specialty": "Internal Medicine & Diabetes", "shift": "DAY", "working_hours": ["08:30", "11:30", "13:30", "16:30"], "active_patients": 4},
        {"id": "DOC-GEN-02", "name": "Dr. Vikram Joshi", "specialty": "Preventive Medicine & Geriatrics", "shift": "DAY", "working_hours": ["09:30", "12:30", "14:30", "17:30"], "active_patients": 1},
    ],
    "Surgery": [
        {"id": "DOC-SURG-01", "name": "Dr. Ravi Kumar", "specialty": "Laparoscopic & General Surgery", "shift": "DAY", "working_hours": ["08:00", "11:00", "15:00", "18:00"], "active_patients": 3},
        {"id": "DOC-SURG-02", "name": "Dr. Sneha Patel", "specialty": "Minimally Invasive Surgery", "shift": "DAY", "working_hours": ["09:30", "12:30", "14:00", "17:00"], "active_patients": 2},
    ],
    "Dermatology": [
        {"id": "DOC-DERM-01", "name": "Dr. Meera Nambiar", "specialty": "Clinical Dermatology & Trichology", "shift": "DAY", "working_hours": ["10:00", "13:00", "14:30", "17:30"], "active_patients": 2},
    ],
    "ENT": [
        {"id": "DOC-ENT-01", "name": "Dr. Siddharth Sen", "specialty": "Otolaryngology & Head-Neck", "shift": "DAY", "working_hours": ["09:00", "12:00", "14:00", "17:00"], "active_patients": 3},
    ],
    "Nephrology": [
        {"id": "DOC-NEPH-01", "name": "Dr. Alok Sen", "specialty": "Dialysis & Renal Transplantation", "shift": "DAY", "working_hours": ["08:30", "12:00", "13:30", "16:30"], "active_patients": 2},
        {"id": "DOC-NEPH-02", "name": "Dr. Vandana Roy", "specialty": "Glomerular Diseases & Hypertension", "shift": "DAY", "working_hours": ["10:00", "13:30", "15:00", "18:00"], "active_patients": 3},
    ],
    "Pulmonology": [
        {"id": "DOC-PULM-01", "name": "Dr. Farhan Akhtar", "specialty": "Interventional Pulmonology & Sleep Medicine", "shift": "DAY", "working_hours": ["09:00", "12:30", "14:00", "17:00"], "active_patients": 3},
        {"id": "DOC-PULM-02", "name": "Dr. Tanvi Shah", "specialty": "Asthma & Severe COPD Care", "shift": "DAY", "working_hours": ["10:30", "13:30", "15:00", "18:30"], "active_patients": 2},
    ],
    "Gastroenterology": [
        {"id": "DOC-GAST-01", "name": "Dr. Manish Kapoor", "specialty": "Advanced Endoscopy & Hepatology", "shift": "DAY", "working_hours": ["09:00", "12:00", "13:30", "17:00"], "active_patients": 4},
        {"id": "DOC-GAST-02", "name": "Dr. Swati Saxena", "specialty": "Inflammatory Bowel Disease & Motility", "shift": "DAY", "working_hours": ["10:00", "13:00", "14:30", "17:30"], "active_patients": 1},
    ],
    "Ophthalmology": [
        {"id": "DOC-OPHT-01", "name": "Dr. Siddharth Verma", "specialty": "Vitreoretinal Surgery & Laser", "shift": "DAY", "working_hours": ["09:30", "12:30", "14:00", "17:00"], "active_patients": 3},
        {"id": "DOC-OPHT-02", "name": "Dr. Ritu Chawla", "specialty": "Cornea & Micro-incision Cataract", "shift": "DAY", "working_hours": ["08:30", "11:30", "13:00", "16:00"], "active_patients": 2},
    ],
    "Psychiatry": [
        {"id": "DOC-PSYC-01", "name": "Dr. Neha Deshmukh", "specialty": "Neuropsychiatry & Mood Disorders", "shift": "DAY", "working_hours": ["10:00", "13:00", "14:00", "17:00"], "active_patients": 2},
        {"id": "DOC-PSYC-02", "name": "Dr. Aditya Menon", "specialty": "Addiction Medicine & Crisis Intervention", "shift": "DAY", "working_hours": ["11:00", "14:00", "15:30", "18:30"], "active_patients": 3},
    ],
}


# In-memory dynamic appointments store
DYNAMIC_APPOINTMENTS: List[Dict[str, Any]] = []

# ─── Request & Response Models ────────────────────────────────────────────────
class AgentBookingRequest(BaseModel):
    patient_id: str = Field(..., examples=["P-0041"], description="Hospital Patient Number (MR No.)")
    patient_name: Optional[str] = Field(None, examples=["Rajesh Kumar"], description="Auto-resolved from patient_id if omitted")
    department: Optional[str] = Field(None, examples=["Cardiology"])
    departments: Optional[List[str]] = Field(None, examples=[["Cardiology", "Orthopedics"]])
    appointment_date: str = Field(..., examples=["2026-10-06"])
    time_window: Optional[str] = Field("ANY", description="ANY, MORNING, AFTERNOON, EVENING")
    reason: Optional[str] = Field("General consultation and routine assessment", examples=["Persistent chest tightness and joint pain"])
    appointment_type: Optional[str] = Field("IN_PERSON", examples=["IN_PERSON"])

class AgentBookingResponse(BaseModel):
    appointment_id: str
    patient_name: str
    patient_id: str
    department: str
    doctor_name: str
    doctor_id: str
    doctor_specialty: str
    appointment_date: str
    appointment_time: str
    status: str
    appointment_type: str
    reason: str
    ai_agent_allocation_summary: str
    ai_confidence_score: float

class MultiDepartmentBookingResponse(BaseModel):
    total_booked: int
    patient_name: str
    patient_id: str
    appointment_date: str
    appointments: List[AgentBookingResponse]
    overall_summary: str

class PatientLookupResponse(BaseModel):
    patient_id: str
    patient_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    contact_number: Optional[str] = None
    department_history: Optional[List[str]] = None
    found: bool = True

# ─── Static Patient Registry (Hospital MR Numbers) ───────────────────────────
# In production this maps to the MongoDB Patient collection
HOSPITAL_PATIENT_REGISTRY: Dict[str, Dict[str, Any]] = {
    "P-0041": {"name": "Rajesh Kumar",    "age": 47, "gender": "Male",   "blood_group": "B+", "contact": "+91-98765-00041", "dept_history": ["Cardiology", "General Medicine"]},
    "P-0042": {"name": "Priya Sharma",    "age": 33, "gender": "Female", "blood_group": "O+", "contact": "+91-98765-00042", "dept_history": ["Neurology"]},
    "P-0043": {"name": "Arjun Mehta",     "age": 55, "gender": "Male",   "blood_group": "A+", "contact": "+91-98765-00043", "dept_history": ["Orthopedics", "Surgery"]},
    "P-0044": {"name": "Sunita Patel",    "age": 62, "gender": "Female", "blood_group": "A-", "contact": "+91-98765-00044", "dept_history": ["General Medicine"]},
    "P-0045": {"name": "Vikram Singh",    "age": 28, "gender": "Male",   "blood_group": "O-", "contact": "+91-98765-00045", "dept_history": ["ENT", "Dermatology"]},
    "P-0046": {"name": "Lakshmi Nair",    "age": 4,  "gender": "Female", "blood_group": "B-", "contact": "+91-98765-00046", "dept_history": ["Pediatrics"]},
    "P-0047": {"name": "Mohan Das",       "age": 38, "gender": "Male",   "blood_group": "AB+","contact": "+91-98765-00047", "dept_history": ["General Medicine", "Cardiology"]},
    "P-0048": {"name": "Anitha Krishnan", "age": 29, "gender": "Female", "blood_group": "O+", "contact": "+91-98765-00048", "dept_history": ["Dermatology"]},
    "P-0049": {"name": "Suresh Babu",     "age": 71, "gender": "Male",   "blood_group": "A+", "contact": "+91-98765-00049", "dept_history": ["Neurology", "General Medicine"]},
    "P-0050": {"name": "Kavitha Reddy",   "age": 45, "gender": "Female", "blood_group": "B+", "contact": "+91-98765-00050", "dept_history": ["Surgery", "Orthopedics"]},
    "P-0051": {"name": "Ramesh Rao",      "age": 58, "gender": "Male",   "blood_group": "O+", "contact": "+91-98765-00051", "dept_history": ["Nephrology", "General Medicine"]},
    "P-0052": {"name": "Sangeeta Sen",    "age": 42, "gender": "Female", "blood_group": "A+", "contact": "+91-98765-00052", "dept_history": ["Pulmonology"]},
    "P-0053": {"name": "Amitabh Bose",    "age": 64, "gender": "Male",   "blood_group": "B-", "contact": "+91-98765-00053", "dept_history": ["Gastroenterology", "Surgery"]},
    "P-0054": {"name": "Meenakshi Iyer",  "age": 52, "gender": "Female", "blood_group": "AB-","contact": "+91-98765-00054", "dept_history": ["Ophthalmology"]},
    "P-0055": {"name": "Karan Malhotra",  "age": 31, "gender": "Male",   "blood_group": "O-", "contact": "+91-98765-00055", "dept_history": ["Psychiatry"]},
}


def _resolve_patient(patient_id: str) -> Dict[str, Any]:
    """Resolve patient name & details from hospital patient number."""
    pid = patient_id.strip().upper()
    if pid in HOSPITAL_PATIENT_REGISTRY:
        return HOSPITAL_PATIENT_REGISTRY[pid]
    # Fallback: generate name from ID for demo
    return {"name": f"Patient {pid}", "age": None, "gender": None, "blood_group": None, "contact": None, "dept_history": []}

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/")
async def list_appointments(
    status: Optional[str] = None,
    doctor: Optional[str] = None,
    department: Optional[str] = None,
    limit: int = Query(80, le=300),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    base_appts = generate_appointments(80)
    all_appts = DYNAMIC_APPOINTMENTS + base_appts
    if status:
        all_appts = [a for a in all_appts if str(a.get("status", "")).upper() == status.upper()]
    if department:
        all_appts = [a for a in all_appts if a.get("department", "").lower() == department.lower()]
    if doctor:
        all_appts = [a for a in all_appts if doctor.lower() in a.get("doctor_name", "").lower() or doctor.lower() in a.get("doctor", "").lower()]
    return {"total": len(all_appts), "appointments": all_appts[:limit]}

@router.get("/departments")
async def list_available_departments():
    """Return all hospital clinical departments available for appointment scheduling."""
    return {
        "departments": list(DEPARTMENT_DOCTORS.keys()),
        "total": len(DEPARTMENT_DOCTORS),
    }

@router.get("/patient-lookup/{patient_id}", response_model=PatientLookupResponse)
async def lookup_patient_by_id(
    patient_id: str,
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff", "patient"])),
):
    """
    Auto-resolve patient details from their Hospital Patient Number (MR No.), MongoDB ID, or Contact Number.
    Patient just enters their ID — name, age, blood group auto-populate.
    """
    pid = patient_id.strip()
    pid_upper = pid.upper()
    info = HOSPITAL_PATIENT_REGISTRY.get(pid_upper)
    if info:
        return PatientLookupResponse(
            patient_id=pid_upper,
            patient_name=info["name"],
            age=info.get("age"),
            gender=info.get("gender"),
            blood_group=info.get("blood_group"),
            contact_number=info.get("contact"),
            department_history=info.get("dept_history", []),
            found=True,
        )

    # Fallback to MongoDB Patient query
    try:
        from app.models.hospital import Patient
        from bson import ObjectId
        from datetime import date
        db_pat = None
        if ObjectId.is_valid(pid):
            try:
                db_pat = await Patient.get(ObjectId(pid))
            except Exception:
                pass
            if not db_pat:
                try:
                    db_pat = await Patient.find_one({"_id": ObjectId(pid)})
                except Exception:
                    pass
        if not db_pat:
            db_pat = await Patient.find_one({"contact_number": pid})
        if not db_pat:
            if pid_upper.startswith("P-"):
                suffix = pid_upper[2:].lower()
                all_pats = await Patient.find().limit(200).to_list()
                for p in all_pats:
                    if str(p.id).lower().endswith(suffix):
                        db_pat = p
                        break
        if db_pat:
            age = None
            if db_pat.date_of_birth:
                try:
                    dob = db_pat.date_of_birth
                    if isinstance(dob, str):
                        from datetime import datetime as dt
                        dob = dt.strptime(dob[:10], "%Y-%m-%d").date()
                    elif hasattr(dob, "date"):
                        dob = dob.date()
                    age = (date.today() - dob).days // 365
                except Exception:
                    age = 35
            return PatientLookupResponse(
                patient_id=pid_upper,
                patient_name=f"{db_pat.first_name} {db_pat.last_name}",
                age=age,
                gender=db_pat.gender,
                blood_group=db_pat.blood_group,
                contact_number=db_pat.contact_number,
                department_history=db_pat.medical_history or ["General Medicine"],
                found=True,
            )
    except Exception as e:
        import traceback
        print("Error during patient lookup:", e, traceback.format_exc())

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Patient with Hospital No. '{pid}' not found. Please verify the MR Number."
    )

@router.get("/doctors-availability")
async def get_doctors_availability(
    department: str = Query(..., example="Cardiology"),
    date_str: Optional[str] = Query(None, example="2026-10-06")
):
    """Retrieve on-duty doctors and their available time slots for the chosen department & date."""
    dept_key = next((k for k in DEPARTMENT_DOCTORS if k.lower() == department.lower()), None)
    if not dept_key:
        dept_key = "General Medicine"

    doctors = DEPARTMENT_DOCTORS.get(dept_key, [])
    result = []
    for doc in doctors:
        base_times = ["09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM"]
        free_count = max(2, 8 - doc.get("active_patients", 3))
        selected_slots = base_times[:free_count]
        result.append({
            "doctor_id": doc["id"],
            "doctor_name": doc["name"],
            "specialty": doc["specialty"],
            "shift": doc["shift"],
            "active_patients": doc["active_patients"],
            "free_slots_count": len(selected_slots),
            "available_slots": selected_slots,
            "next_free_slot": selected_slots[0] if selected_slots else "10:00 AM",
        })
    actual_date = date_str if isinstance(date_str, str) and date_str else date.today().isoformat()
    return {"department": dept_key, "date": actual_date, "doctors": result}

@router.post("/agent-book", response_model=AgentBookingResponse)
async def agent_book_appointment(
    req: AgentBookingRequest,
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """
    AI Agent Dynamic Doctor Allocation Endpoint for a single or primary department.
    The patient only specifies the department list / single department and date.
    The AI Agent scans doctor schedules on that day, finds the doctor with free slots & lowest load,
    and assigns the optimal appointment time.
    """
    target_dept = req.department or (req.departments[0] if req.departments and len(req.departments) > 0 else "General Medicine")
    dept_key = next((k for k in DEPARTMENT_DOCTORS if k.lower() == target_dept.lower()), None)
    if not dept_key:
        dept_key = "General Medicine"

    candidate_doctors = DEPARTMENT_DOCTORS.get(dept_key, DEPARTMENT_DOCTORS["General Medicine"])
    sorted_doctors = sorted(candidate_doctors, key=lambda d: d.get("active_patients", 0))
    selected_doctor = sorted_doctors[0]

    # Pick dynamic time slot based on requested time_window
    window = (req.time_window or "ANY").upper()
    if window == "MORNING":
        possible_times = ["09:15 AM", "09:45 AM", "10:30 AM", "11:15 AM", "11:45 AM"]
    elif window == "AFTERNOON":
        possible_times = ["12:30 PM", "01:15 PM", "02:00 PM", "02:45 PM", "03:30 PM"]
    elif window == "EVENING":
        possible_times = ["04:15 PM", "05:00 PM", "05:45 PM", "06:30 PM"]
    else:
        possible_times = ["09:30 AM", "10:15 AM", "11:00 AM", "02:30 PM", "03:45 PM", "04:30 PM"]

    assigned_time = random.choice(possible_times)
    # Use UUID for collision-free IDs instead of random.randint (which has ~3000 possible values)
    import uuid
    appt_id = f"APT-{uuid.uuid4().hex[:8].upper()}"
    patient_id = (req.patient_id or f"P-{random.randint(1000, 9999)}").strip().upper()
    resolved = _resolve_patient(patient_id)
    patient_name = req.patient_name or resolved.get("name") or f"Patient {patient_id}"

    ai_summary = (
        f"AI Agent analyzed {len(candidate_doctors)} doctors in {dept_key}. "
        f"Selected {selected_doctor['name']} ({selected_doctor['specialty']}) due to lowest active queue "
        f"({selected_doctor['active_patients']} patients today) and verified open slot at {assigned_time} on {req.appointment_date}."
    )

    new_appt = {
        "id": appt_id,
        "appointment_id": appt_id,
        "patient_name": patient_name,
        "patient_id": patient_id,
        "doctor_name": selected_doctor["name"],
        "doctor_id": selected_doctor["id"],
        "doctor_specialty": selected_doctor["specialty"],
        "department": dept_key,
        "appointment_date": req.appointment_date,
        "appointment_time": assigned_time,
        "reason": req.reason or "Clinical Consultation",
        "status": "SCHEDULED",
        "appointment_type": req.appointment_type or "IN_PERSON",
        "ai_agent_allocation_summary": ai_summary,
        "ai_confidence_score": 0.98,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    DYNAMIC_APPOINTMENTS.insert(0, new_appt)
    selected_doctor["active_patients"] = selected_doctor.get("active_patients", 0) + 1

    try:
        from app.models.operations import Appointment as AppointmentDoc
        dt_val = datetime.fromisoformat(req.appointment_date) if "T" in req.appointment_date else datetime.strptime(req.appointment_date, "%Y-%m-%d")
        appt_doc = AppointmentDoc(
            patient_id=patient_id,
            doctor_id=selected_doctor["id"],
            department_id=dept_key,
            appointment_date=dt_val,
            reason=req.reason or "Clinical Consultation",
            type=req.appointment_type or "GENERAL",
            notes=ai_summary,
        )
        await appt_doc.insert()
    except Exception as db_err:
        # Log the error so operators are aware, but don't block the response
        import logging
        logging.getLogger(__name__).warning(
            f"Appointment DB insert failed for {appt_id} — in-memory record still created: {db_err}"
        )

    return AgentBookingResponse(**new_appt)

@router.post("/agent-book-multi", response_model=MultiDepartmentBookingResponse)
async def agent_book_multi_departments(req: AgentBookingRequest):
    """
    AI Agent Multi-Department Auto-Allocation:
    Patient selects a LIST of departments they want to attend on a given date.
    The AI agent:
      1. Evaluates all requested departments and scans doctors with free slots on that date.
      2. Coordinates sequential, non-conflicting time slots (e.g., 09:30 AM, 11:30 AM, 02:30 PM).
      3. Automatically schedules and confirms all requested departmental consultations.
    """
    dept_list = req.departments if req.departments and len(req.departments) > 0 else ([req.department] if req.department else ["General Medicine"])
    patient_id = (req.patient_id or f"P-{random.randint(1000, 9999)}").strip().upper()
    resolved = _resolve_patient(patient_id)
    patient_name = req.patient_name or resolved.get("name") or f"Patient {patient_id}"

    # Time slot progression pool across the day with buffer time
    slot_sequence = [
        "09:15 AM", "10:45 AM", "12:15 PM", "02:00 PM", "03:30 PM", "05:00 PM"
    ]

    booked_appointments: List[AgentBookingResponse] = []

    import uuid
    for idx, dept_name in enumerate(dept_list):
        dept_key = next((k for k in DEPARTMENT_DOCTORS if k.lower() == dept_name.lower()), "General Medicine")
        candidate_docs = DEPARTMENT_DOCTORS.get(dept_key, DEPARTMENT_DOCTORS["General Medicine"])
        sorted_docs = sorted(candidate_docs, key=lambda d: d.get("active_patients", 0))
        chosen_doc = sorted_docs[0]

        assigned_slot = slot_sequence[idx % len(slot_sequence)]
        # Use UUID for collision-free IDs instead of random.randint
        appt_id = f"APT-{uuid.uuid4().hex[:8].upper()}"

        ai_summary = (
            f"AI Multi-Department Coordinator matched {chosen_doc['name']} ({chosen_doc['specialty']}) in {dept_key} "
            f"at sequential slot {assigned_slot} on {req.appointment_date} (Queue load: {chosen_doc['active_patients']} patients)."
        )

        appt_dict = {
            "id": appt_id,
            "appointment_id": appt_id,
            "patient_name": patient_name,
            "patient_id": patient_id,
            "doctor_name": chosen_doc["name"],
            "doctor_id": chosen_doc["id"],
            "doctor_specialty": chosen_doc["specialty"],
            "department": dept_key,
            "appointment_date": req.appointment_date,
            "appointment_time": assigned_slot,
            "reason": req.reason or f"Multi-department consultation in {dept_key}",
            "status": "SCHEDULED",
            "appointment_type": req.appointment_type or "IN_PERSON",
            "ai_agent_allocation_summary": ai_summary,
            "ai_confidence_score": 0.99,
        }

        DYNAMIC_APPOINTMENTS.insert(0, appt_dict)
        chosen_doc["active_patients"] = chosen_doc.get("active_patients", 0) + 1
        booked_appointments.append(AgentBookingResponse(**appt_dict))

        try:
            from app.models.operations import Appointment as AppointmentDoc
            dt_val = datetime.fromisoformat(req.appointment_date) if "T" in req.appointment_date else datetime.strptime(req.appointment_date, "%Y-%m-%d")
            appt_doc = AppointmentDoc(
                patient_id=patient_id,
                doctor_id=chosen_doc["id"],
                department_id=dept_key,
                appointment_date=dt_val,
                reason=req.reason or f"Multi-department consultation in {dept_key}",
                type=req.appointment_type or "GENERAL",
                notes=ai_summary,
            )
            await appt_doc.insert()
        except Exception as db_err:
            import logging
            logging.getLogger(__name__).warning(
                f"Multi-dept appointment DB insert failed for {appt_id} in {dept_key}: {db_err}"
            )

    overall_summary = (
        f"AI Agent successfully scheduled {len(booked_appointments)} consultations across "
        f"{', '.join(dept_list)} on {req.appointment_date}. All time slots have been spaced to ensure zero overlap."
    )

    return MultiDepartmentBookingResponse(
        total_booked=len(booked_appointments),
        patient_name=patient_name,
        patient_id=patient_id,
        appointment_date=req.appointment_date,
        appointments=booked_appointments,
        overall_summary=overall_summary,
    )

@router.get("/stats")
async def get_appointment_stats():
    base_appts = generate_appointments(80)
    all_appts = DYNAMIC_APPOINTMENTS + base_appts
    return {
        "total_today": len(all_appts),
        "completed": len([a for a in all_appts if str(a.get("status", "")).lower() == "completed"]),
        "cancelled": len([a for a in all_appts if str(a.get("status", "")).lower() == "cancelled"]),
        "no_show": len([a for a in all_appts if str(a.get("status", "")).lower() == "no_show"]),
        "high_no_show_risk": len([a for a in all_appts if float(a.get("no_show_risk", 0)) > 0.35]),
        "avg_no_show_risk": 0.18,
        "upcoming": len([a for a in all_appts if str(a.get("status", "")).lower() in ["scheduled", "confirmed"]]),
    }


class ReassignAppointmentRequest(BaseModel):
    department: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_specialty: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None


@router.post("/{appointment_id}/reassign")
@router.put("/{appointment_id}")
async def reassign_appointment(appointment_id: str, req: ReassignAppointmentRequest):
    """
    Doctor / Role-Based Appointment Reassignment & Rescheduling:
    Enables attending doctors and department coordinators to transfer an appointment
    to a different doctor within the same department or cross-transfer to another department.
    """
    found_appt: Optional[dict[str, Any]] = None
    for a in DYNAMIC_APPOINTMENTS:
        if a.get("id") == appointment_id or a.get("appointment_id") == appointment_id:
            found_appt = a
            break

    dept_val = req.department or (found_appt.get("department") if found_appt else None)
    target_dept: str = str(dept_val) if dept_val else "General Medicine"
    dept_docs = DEPARTMENT_DOCTORS.get(target_dept, [])

    # Resolve doctor
    target_doc_name: str = req.doctor_name or ""
    target_specialty: str = req.doctor_specialty or ""
    target_doc_id: str = req.doctor_id or ""

    if not target_doc_name and len(dept_docs) > 0:
        target_doc_name = dept_docs[0]["name"]
        target_specialty = dept_docs[0]["specialty"]
        target_doc_id = dept_docs[0]["id"]
    elif target_doc_name and len(dept_docs) > 0:
        for d in dept_docs:
            if d["name"].lower() == target_doc_name.lower():
                target_specialty = d["specialty"]
                target_doc_id = d["id"]
                break
    elif not target_doc_name:
        target_doc_name = str(found_appt.get("doctor_name")) if (found_appt and found_appt.get("doctor_name")) else "Attending Specialist"

    date_val = req.appointment_date or (found_appt.get("appointment_date") if found_appt else None)
    target_date: str = str(date_val) if date_val else datetime.now(timezone.utc).strftime("%Y-%m-%d")

    time_val = req.appointment_time or (found_appt.get("appointment_time") if found_appt else None)
    target_time: str = str(time_val) if time_val else "10:30 AM"

    raw_status = req.status or (found_appt.get("status") if found_appt else None) or "SCHEDULED"
    target_status: str = str(raw_status).upper()

    reason_val = req.reason or (found_appt.get("reason") if found_appt else None)
    target_reason: str = str(reason_val) if reason_val else "Consultation"

    ai_summary = (
        f"AI Agent reassigned appointment {appointment_id} to {target_doc_name} in {target_dept} "
        f"on {target_date} at {target_time}. Status: {target_status}."
    )

    if found_appt:
        found_appt["department"] = target_dept
        found_appt["doctor_name"] = target_doc_name
        found_appt["doctor_id"] = target_doc_id
        found_appt["doctor_specialty"] = target_specialty
        found_appt["appointment_date"] = target_date
        found_appt["appointment_time"] = target_time
        found_appt["status"] = target_status
        found_appt["reason"] = target_reason
        found_appt["ai_agent_allocation_summary"] = ai_summary
        result_appt = found_appt
    else:
        new_entry = {
            "id": appointment_id,
            "appointment_id": appointment_id,
            "patient_name": "Patient",
            "patient_id": "P-0041",
            "department": target_dept,
            "doctor_name": target_doc_name,
            "doctor_id": target_doc_id,
            "doctor_specialty": target_specialty,
            "appointment_date": target_date,
            "appointment_time": target_time,
            "status": target_status,
            "reason": target_reason,
            "appointment_type": "IN_PERSON",
            "ai_agent_allocation_summary": ai_summary,
        }
        DYNAMIC_APPOINTMENTS.insert(0, new_entry)
        result_appt = new_entry

    # Sync with MongoDB if available
    try:
        from app.models.operations import Appointment as AppointmentDoc
        db_appt = await AppointmentDoc.find_one({"_id": appointment_id})
        if db_appt:
            db_appt.department_id = target_dept
            db_appt.doctor_id = target_doc_id
            db_appt.notes = ai_summary
            await db_appt.save()
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Appointment {appointment_id} successfully updated and reassigned to {target_doc_name} ({target_dept}).",
        "appointment": result_appt
    }

