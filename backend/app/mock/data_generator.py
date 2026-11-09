"""
MediSphere AI — Realistic Mock Data Generator
Generates consistent, seeded hospital simulation data for all modules.
"""
import random
import uuid
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from faker import Faker

fake = Faker()
rng = random.Random(42)  # Seeded for reproducibility

# ─── Constants ────────────────────────────────────────────────────────────────

DEPARTMENTS = [
    {"id": "dept-001", "name": "Emergency",         "floor": 1, "bed_capacity": 40, "color": "#ef4444"},
    {"id": "dept-002", "name": "ICU",               "floor": 2, "bed_capacity": 20, "color": "#8b5cf6"},
    {"id": "dept-003", "name": "General Medicine",  "floor": 3, "bed_capacity": 60, "color": "#3b82f6"},
    {"id": "dept-004", "name": "Surgery",           "floor": 3, "bed_capacity": 30, "color": "#f59e0b"},
    {"id": "dept-005", "name": "Pediatrics",        "floor": 4, "bed_capacity": 25, "color": "#10b981"},
    {"id": "dept-006", "name": "Cardiology",        "floor": 4, "bed_capacity": 20, "color": "#f43f5e"},
    {"id": "dept-007", "name": "Orthopedics",       "floor": 5, "bed_capacity": 25, "color": "#0ea5e9"},
    {"id": "dept-008", "name": "Gynecology",        "floor": 5, "bed_capacity": 20, "color": "#d946ef"},
    {"id": "dept-009", "name": "Neurology",         "floor": 6, "bed_capacity": 15, "color": "#6366f1"},
    {"id": "dept-010", "name": "Oncology",          "floor": 6, "bed_capacity": 20, "color": "#84cc16"},
    {"id": "dept-011", "name": "Laboratory",        "floor": 1, "bed_capacity": 0,  "color": "#14b8a6"},
    {"id": "dept-012", "name": "Pharmacy",          "floor": 1, "bed_capacity": 0,  "color": "#fb923c"},
    {"id": "dept-013", "name": "Radiology",         "floor": 2, "bed_capacity": 0,  "color": "#a78bfa"},
    {"id": "dept-014", "name": "Outpatient",        "floor": 1, "bed_capacity": 0,  "color": "#60a5fa"},
    {"id": "dept-015", "name": "Nephrology",        "floor": 5, "bed_capacity": 20, "color": "#06b6d4"},
    {"id": "dept-016", "name": "Pulmonology",       "floor": 4, "bed_capacity": 20, "color": "#14b8a6"},
    {"id": "dept-017", "name": "Gastroenterology",  "floor": 3, "bed_capacity": 20, "color": "#eab308"},
    {"id": "dept-018", "name": "Ophthalmology",     "floor": 2, "bed_capacity": 15, "color": "#a855f7"},
    {"id": "dept-019", "name": "Psychiatry",        "floor": 6, "bed_capacity": 25, "color": "#ec4899"},
]

DOCTOR_SPECIALIZATIONS = [
    "Emergency Medicine", "Intensive Care", "General Medicine", "Surgery",
    "Pediatrics", "Cardiology", "Orthopedics", "Gynecology", "Neurology", "Oncology",
    "Nephrology & Renal Transplant", "Pulmonology & Critical Care",
    "Gastroenterology & Hepatology", "Ophthalmology & Vitreoretinal",
    "Psychiatry & Behavioral Health",
]


MEDICINES = [
    {"code": "MED-001", "name": "Paracetamol 500mg",       "category": "Analgesic",      "stock": 2400, "min": 500,  "cost": 2.50},
    {"code": "MED-002", "name": "Amoxicillin 250mg",       "category": "Antibiotic",     "stock": 1800, "min": 400,  "cost": 8.00},
    {"code": "MED-003", "name": "Metformin 500mg",         "category": "Antidiabetic",   "stock": 890,  "min": 300,  "cost": 5.50},
    {"code": "MED-004", "name": "Atenolol 50mg",           "category": "Cardiovascular", "stock": 145,  "min": 200,  "cost": 12.00},
    {"code": "MED-005", "name": "Omeprazole 20mg",         "category": "Antacid",        "stock": 620,  "min": 300,  "cost": 7.00},
    {"code": "MED-006", "name": "Amlodipine 5mg",          "category": "Cardiovascular", "stock": 430,  "min": 200,  "cost": 15.00},
    {"code": "MED-007", "name": "Ceftriaxone 1g Injection","category": "Antibiotic",     "stock": 78,   "min": 100,  "cost": 45.00},
    {"code": "MED-008", "name": "Morphine 10mg Injection", "category": "Analgesic",      "stock": 52,   "min": 80,   "cost": 35.00},
    {"code": "MED-009", "name": "Insulin Regular 100IU",   "category": "Antidiabetic",   "stock": 67,   "min": 150,  "cost": 120.00},
    {"code": "MED-010", "name": "Salbutamol Inhaler",      "category": "Respiratory",    "stock": 190,  "min": 200,  "cost": 25.00},
    {"code": "MED-011", "name": "Warfarin 5mg",            "category": "Anticoagulant",  "stock": 340,  "min": 100,  "cost": 18.00},
    {"code": "MED-012", "name": "Dexamethasone 4mg",       "category": "Steroid",        "stock": 230,  "min": 150,  "cost": 22.00},
    {"code": "MED-013", "name": "Furosemide 40mg",         "category": "Diuretic",       "stock": 410,  "min": 200,  "cost": 8.00},
    {"code": "MED-014", "name": "Vancomycin 500mg",        "category": "Antibiotic",     "stock": 38,   "min": 60,   "cost": 180.00},
    {"code": "MED-015", "name": "Ondansetron 4mg",         "category": "Antiemetic",     "stock": 560,  "min": 200,  "cost": 12.00},
]

EQUIPMENT_LIST = [
    {"id": "EQ-001", "name": "MRI Scanner",           "category": "Imaging",        "dept": "Radiology",    "utilization": 87, "status": "operational",  "risk": 0.12},
    {"id": "EQ-002", "name": "CT Scanner",            "category": "Imaging",        "dept": "Radiology",    "utilization": 92, "status": "operational",  "risk": 0.18},
    {"id": "EQ-003", "name": "Ventilator Unit A",     "category": "Life Support",   "dept": "ICU",          "utilization": 75, "status": "in_use",       "risk": 0.08},
    {"id": "EQ-004", "name": "Ventilator Unit B",     "category": "Life Support",   "dept": "ICU",          "utilization": 60, "status": "in_use",       "risk": 0.10},
    {"id": "EQ-005", "name": "Defibrillator",         "category": "Emergency",      "dept": "Emergency",    "utilization": 45, "status": "operational",  "risk": 0.05},
    {"id": "EQ-006", "name": "X-Ray Machine",         "category": "Imaging",        "dept": "Radiology",    "utilization": 78, "status": "operational",  "risk": 0.22},
    {"id": "EQ-007", "name": "Ultrasound Scanner",    "category": "Imaging",        "dept": "Radiology",    "utilization": 65, "status": "operational",  "risk": 0.09},
    {"id": "EQ-008", "name": "ECG Machine",           "category": "Cardiac",        "dept": "Cardiology",   "utilization": 55, "status": "operational",  "risk": 0.07},
    {"id": "EQ-009", "name": "Dialysis Machine",      "category": "Renal",          "dept": "ICU",          "utilization": 70, "status": "maintenance",  "risk": 0.35},
    {"id": "EQ-010", "name": "Infusion Pump Set",     "category": "Infusion",       "dept": "General Medicine","utilization": 82,"status": "in_use",      "risk": 0.11},
    {"id": "EQ-011", "name": "Surgical Robot",        "category": "Surgery",        "dept": "Surgery",      "utilization": 40, "status": "operational",  "risk": 0.15},
    {"id": "EQ-012", "name": "Patient Monitor Array", "category": "Monitoring",     "dept": "ICU",          "utilization": 95, "status": "in_use",       "risk": 0.06},
    {"id": "EQ-013", "name": "Anesthesia Machine",    "category": "Anesthesia",     "dept": "Surgery",      "utilization": 50, "status": "operational",  "risk": 0.08},
    {"id": "EQ-014", "name": "Blood Gas Analyzer",    "category": "Laboratory",     "dept": "Laboratory",   "utilization": 72, "status": "operational",  "risk": 0.14},
    {"id": "EQ-015", "name": "Endoscopy System",      "category": "Endoscopy",      "dept": "Surgery",      "utilization": 55, "status": "faulty",       "risk": 0.75},
    {"id": "EQ-016", "name": "Hemodialysis Array",    "category": "Renal",          "dept": "Nephrology",   "utilization": 88, "status": "operational",  "risk": 0.10},
    {"id": "EQ-017", "name": "Bronchoscopy Video Cart","category": "Pulmonary",     "dept": "Pulmonology",  "utilization": 64, "status": "operational",  "risk": 0.12},
    {"id": "EQ-018", "name": "HD Colonoscopy Suite",  "category": "Endoscopy",      "dept": "Gastroenterology","utilization": 76,"status": "operational", "risk": 0.09},
    {"id": "EQ-019", "name": "Phacoemulsifier & OCT", "category": "Ophthalmic",     "dept": "Ophthalmology","utilization": 58, "status": "operational",  "risk": 0.08},
    {"id": "EQ-020", "name": "TMS Neuromodulator",    "category": "Neuromodulation","dept": "Psychiatry",    "utilization": 42, "status": "operational",  "risk": 0.05},
]


LAB_TESTS = [
    {"code": "LAB-CBC", "name": "Complete Blood Count",    "category": "Hematology",    "turnaround": 1.5, "cost": 250},
    {"code": "LAB-LFT", "name": "Liver Function Test",     "category": "Biochemistry",  "turnaround": 3.0, "cost": 450},
    {"code": "LAB-KFT", "name": "Kidney Function Test",    "category": "Biochemistry",  "turnaround": 3.0, "cost": 350},
    {"code": "LAB-BSG", "name": "Blood Sugar (Fasting)",   "category": "Biochemistry",  "turnaround": 1.0, "cost": 100},
    {"code": "LAB-HBA", "name": "HbA1c",                   "category": "Biochemistry",  "turnaround": 4.0, "cost": 600},
    {"code": "LAB-TSH", "name": "Thyroid Profile (TSH)",   "category": "Endocrinology", "turnaround": 6.0, "cost": 800},
    {"code": "LAB-ECG", "name": "ECG Analysis",            "category": "Cardiology",    "turnaround": 0.5, "cost": 300},
    {"code": "LAB-URN", "name": "Urine Analysis",          "category": "Microbiology",  "turnaround": 2.0, "cost": 150},
    {"code": "LAB-CUL", "name": "Blood Culture",           "category": "Microbiology",  "turnaround": 48.0,"cost": 900},
    {"code": "LAB-CRP", "name": "C-Reactive Protein",      "category": "Immunology",    "turnaround": 2.0, "cost": 350},
    {"code": "LAB-XRY", "name": "Chest X-Ray",             "category": "Radiology",     "turnaround": 1.0, "cost": 500},
    {"code": "LAB-MRI", "name": "Brain MRI",               "category": "Radiology",     "turnaround": 2.0, "cost": 4500},
    {"code": "LAB-CTS", "name": "CT Scan - Abdomen",       "category": "Radiology",     "turnaround": 1.5, "cost": 3500},
    {"code": "LAB-D2D", "name": "D-Dimer",                 "category": "Hematology",    "turnaround": 2.0, "cost": 1200},
    {"code": "LAB-TRP", "name": "Troponin I",              "category": "Cardiology",    "turnaround": 1.0, "cost": 1800},
]

CHIEF_COMPLAINTS = [
    "Chest pain", "Shortness of breath", "Fever and chills", "Abdominal pain",
    "Headache", "Dizziness", "Back pain", "Nausea and vomiting", "Leg swelling",
    "Palpitations", "Cough", "Sore throat", "Joint pain", "Fatigue",
    "High blood pressure", "Diabetic emergency", "Trauma", "Allergic reaction",
    "Seizure", "Stroke symptoms",
]

INSURANCE_PROVIDERS = [
    "Star Health Insurance", "HDFC ERGO Health", "Max Bupa",
    "New India Assurance", "Oriental Insurance", "National Insurance",
    "Bajaj Allianz", "Religare Health", "Aditya Birla Health",
]

# ─── Generator Functions ─────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now()

def _days_ago(n: int) -> datetime:
    return _now() - timedelta(days=n)

def _hours_ago(n: float) -> datetime:
    return _now() - timedelta(hours=n)

def _hours_from_now(n: float) -> datetime:
    return _now() + timedelta(hours=n)

def rand_float(lo: float, hi: float, decimals: int = 1) -> float:
    return round(rng.uniform(lo, hi), decimals)

def rand_int(lo: int, hi: int) -> int:
    return rng.randint(lo, hi)

def rand_choice(lst):
    return rng.choice(lst)

# ─── KPI Data ─────────────────────────────────────────────────────────────────

def get_hospital_kpis() -> Dict[str, Any]:
    return {
        "average_waiting_time": rand_float(18, 42, 1),          # minutes
        "patient_throughput": rand_int(280, 420),                # per day
        "bed_occupancy_rate": rand_float(72, 94, 1),             # %
        "icu_utilization": rand_float(68, 96, 1),                # %
        "doctor_utilization": rand_float(74, 91, 1),             # %
        "nurse_utilization": rand_float(78, 95, 1),              # %
        "medicine_availability": rand_float(84, 97, 1),          # %
        "equipment_utilization": rand_float(65, 88, 1),          # %
        "emergency_response_time": rand_float(4, 12, 1),         # minutes
        "daily_revenue": rand_float(580000, 920000, 0),          # INR
        "operational_cost": rand_float(380000, 560000, 0),       # INR
        "insurance_approval_rate": rand_float(72, 88, 1),        # %
        "patient_satisfaction": rand_float(78, 93, 1),           # %
        "hospital_performance_score": rand_float(74, 92, 1),     # %
        "active_emergencies": rand_int(4, 18),
        "available_beds": rand_int(35, 85),
        "total_beds": 275,
        "patients_today": rand_int(280, 430),
        "admissions_today": rand_int(35, 65),
        "discharges_today": rand_int(28, 58),
        "surgeries_today": rand_int(8, 22),
        "lab_tests_pending": rand_int(45, 120),
        "prescriptions_pending": rand_int(30, 80),
        "pending_bills": rand_int(120, 280),
        "insurance_claims_pending": rand_int(45, 90),
        "staff_on_duty": rand_int(180, 260),
        "timestamp": _now().isoformat(),
    }

# ─── Patients ─────────────────────────────────────────────────────────────────

def generate_patients(count: int = 50) -> List[Dict]:
    patients = []
    statuses = ["registered", "waiting", "in_consultation", "in_lab", "in_pharmacy", "in_billing", "discharged", "admitted"]
    status_weights = [5, 20, 20, 15, 15, 10, 10, 5]

    for i in range(count):
        pid = f"PAT-{str(i+1001).zfill(5)}"
        status = rng.choices(statuses, weights=status_weights, k=1)[0]
        dept = rand_choice(DEPARTMENTS[:10])
        age = rand_int(15, 85)
        dob = date.today() - timedelta(days=age*365 + rand_int(0, 364))
        patients.append({
            "id": str(uuid.uuid4()),
            "patient_id": pid,
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
            "age": age,
            "date_of_birth": dob.isoformat(),
            "gender": rand_choice(["male", "female"]),
            "blood_group": rand_choice(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
            "phone": fake.phone_number()[:15],
            "email": fake.email(),
            "status": status,
            "department": dept["name"],
            "department_id": dept["id"],
            "chief_complaint": rand_choice(CHIEF_COMPLAINTS),
            "insurance_provider": rand_choice(INSURANCE_PROVIDERS + [None, None]),
            "wait_time_minutes": rand_int(5, 90) if status in ["waiting", "in_consultation"] else None,
            "registration_time": _hours_ago(rand_float(0.5, 8.0)).isoformat(),
            "total_visits": rand_int(1, 20),
            "priority": rand_choice(["low", "medium", "high", "critical"]),
        })
    return patients

# ─── Beds ─────────────────────────────────────────────────────────────────────

def generate_beds() -> List[Dict]:
    beds = []
    bed_types = [
        ("ICU",       20,  "icu",       "#8b5cf6"),
        ("Emergency", 40,  "emergency", "#ef4444"),
        ("General",   120, "general",   "#3b82f6"),
        ("Private",   50,  "private",   "#f59e0b"),
        ("Pediatric", 25,  "pediatric", "#10b981"),
        ("Maternity", 20,  "maternity", "#d946ef"),
    ]
    for ward_name, count, btype, color in bed_types:
        occupied = int(count * rand_float(0.60, 0.95))
        for i in range(count):
            bid = len(beds) + 1
            is_occupied = i < occupied
            beds.append({
                "id": str(uuid.uuid4()),
                "bed_number": f"{ward_name[:3].upper()}-{str(i+1).zfill(3)}",
                "ward": ward_name,
                "bed_type": btype,
                "color": color,
                "status": "occupied" if is_occupied else ("maintenance" if i == count-1 else "available"),
                "patient_name": f"{fake.first_name()} {fake.last_name()}" if is_occupied else None,
                "patient_id": f"PAT-{rand_int(1001,1500)}" if is_occupied else None,
                "admitted_at": _days_ago(rand_int(0, 7)).isoformat() if is_occupied else None,
                "expected_discharge": _hours_from_now(rand_float(6, 72)).isoformat() if is_occupied else None,
                "doctor": f"Dr. {fake.last_name()}" if is_occupied else None,
                "floor": rand_int(1, 6),
            })
    return beds

def get_bed_summary() -> Dict:
    totals = {"icu": 20, "emergency": 40, "general": 120, "private": 50, "pediatric": 25, "maternity": 20}
    result = {}
    for k, v in totals.items():
        occupied = int(v * rand_float(0.62, 0.94))
        result[k] = {
            "total": v, "occupied": occupied, "available": v - occupied,
            "occupancy_rate": round(occupied / v * 100, 1),
        }
    result["total"] = {
        "total": 275,
        "occupied": sum(r["occupied"] for r in result.values()),
        "available": 275 - sum(r["occupied"] for r in result.values()),
    }
    return result

# ─── Emergency ────────────────────────────────────────────────────────────────

def generate_emergency_cases(count: int = 20) -> List[Dict]:
    cases = []
    triage_labels = {1: "Resuscitation", 2: "Emergent", 3: "Urgent", 4: "Semi-Urgent", 5: "Non-Urgent"}
    triage_colors = {1: "#ef4444", 2: "#f97316", 3: "#f59e0b", 4: "#22c55e", 5: "#6b7280"}
    arrival_modes = ["Ambulance", "Walk-in", "Self", "Police", "Referred"]
    statuses = ["waiting", "in_triage", "in_treatment", "admitted", "discharged", "critical"]
    status_weights = [30, 20, 25, 10, 10, 5]

    for i in range(count):
        triage = rng.choices([1, 2, 3, 4, 5], weights=[5, 15, 35, 30, 15], k=1)[0]
        arrival = _hours_ago(rand_float(0, 6))
        status = rng.choices(statuses, weights=status_weights, k=1)[0]
        wait_mins = rand_int(2, 180) if status == "waiting" else rand_int(0, 30)
        cases.append({
            "id": str(uuid.uuid4()),
            "case_number": f"ER-{str(i+2001).zfill(5)}",
            "patient_name": f"{fake.first_name()} {fake.last_name()}",
            "age": rand_int(5, 90),
            "gender": rand_choice(["Male", "Female"]),
            "chief_complaint": rand_choice(CHIEF_COMPLAINTS),
            "triage_level": triage,
            "triage_label": triage_labels[triage],
            "triage_color": triage_colors[triage],
            "arrival_time": arrival.isoformat(),
            "arrival_mode": rand_choice(arrival_modes),
            "status": status,
            "wait_minutes": wait_mins,
            "assigned_doctor": f"Dr. {fake.last_name()}" if status not in ["waiting"] else None,
            "vital_signs": {
                "bp_systolic": rand_int(90, 180),
                "bp_diastolic": rand_int(60, 110),
                "heart_rate": rand_int(55, 130),
                "temperature": round(rng.uniform(36.0, 40.5), 1),
                "spo2": rand_int(88, 100),
                "respiratory_rate": rand_int(12, 30),
            },
            "priority": "critical" if triage <= 2 else ("high" if triage == 3 else "medium"),
        })
    cases.sort(key=lambda x: x["triage_level"])
    return cases

# ─── Staff ────────────────────────────────────────────────────────────────────

def generate_staff(count: int = 60) -> List[Dict]:
    roles = ["doctor", "nurse", "technician", "pharmacist", "lab_technician", "admin"]
    role_weights = [20, 40, 15, 10, 10, 5]
    shifts = ["morning", "afternoon", "night", "on_call"]
    staff_list = []

    for i in range(count):
        role = rng.choices(roles, weights=role_weights, k=1)[0]
        dept = rand_choice(DEPARTMENTS[:10])
        workload = rand_float(40, 98, 1)
        on_duty = rng.random() > 0.3
        staff_list.append({
            "id": str(uuid.uuid4()),
            "employee_id": f"EMP-{str(i+1001).zfill(5)}",
            "name": f"{'Dr. ' if role=='doctor' else ''}{fake.first_name()} {fake.last_name()}",
            "role": role,
            "specialization": rand_choice(DOCTOR_SPECIALIZATIONS) if role == "doctor" else None,
            "department": dept["name"],
            "department_id": dept["id"],
            "shift": rand_choice(shifts),
            "is_on_duty": on_duty,
            "workload_score": workload,
            "workload_level": "critical" if workload > 90 else ("high" if workload > 75 else ("medium" if workload > 50 else "low")),
            "patients_assigned": rand_int(0, 12) if on_duty else 0,
            "years_experience": rand_int(1, 25),
            "phone": fake.phone_number()[:15],
            "email": fake.email(),
        })
    return staff_list

# ─── Pharmacy ─────────────────────────────────────────────────────────────────

def get_pharmacy_inventory() -> List[Dict]:
    inventory = []
    for med in MEDICINES:
        stock = med["stock"] + rand_int(-50, 50)
        min_stock = med["min"]
        is_low = stock < min_stock
        is_critical = stock < min_stock * 0.5
        expiry = date.today() + timedelta(days=rand_int(30, 700))
        expiry_days = (expiry - date.today()).days

        inventory.append({
            **med,
            "current_stock": max(0, stock),
            "is_low_stock": is_low,
            "is_critical_stock": is_critical,
            "expiry_date": expiry.isoformat(),
            "expiry_days": expiry_days,
            "expiry_status": "expired" if expiry_days < 0 else ("critical" if expiry_days < 30 else ("warning" if expiry_days < 90 else "ok")),
            "unit_cost": med["cost"],
            "total_value": round(max(0, stock) * med["cost"], 2),
            "monthly_consumption": rand_int(200, 1500),
            "days_remaining": max(0, round(max(0, stock) / max(1, rand_int(10, 80)), 1)),
            "status": "critical" if is_critical else ("low" if is_low else "ok"),
        })
    return inventory

# ─── Laboratory ───────────────────────────────────────────────────────────────

def generate_lab_orders(count: int = 60) -> List[Dict]:
    orders = []
    statuses = ["ordered", "sample_collected", "in_progress", "completed", "critical_reported"]
    status_weights = [20, 20, 25, 30, 5]

    for i in range(count):
        test = rand_choice(LAB_TESTS)
        status = rng.choices(statuses, weights=status_weights, k=1)[0]
        ordered_at = _hours_ago(rand_float(0, 12))
        turnaround = test["turnaround"] + rand_float(-0.5, 2.0)
        is_critical = rng.random() < 0.08
        orders.append({
            "id": str(uuid.uuid4()),
            "order_id": f"LAB-{str(i+3001).zfill(5)}",
            "patient_name": f"{fake.first_name()} {fake.last_name()}",
            "patient_id": f"PAT-{rand_int(1001, 1500)}",
            "test_name": test["name"],
            "test_code": test["code"],
            "category": test["category"],
            "ordered_at": ordered_at.isoformat(),
            "status": status,
            "priority": "critical" if is_critical else rand_choice(["low", "medium", "high"]),
            "is_critical": is_critical,
            "turnaround_hours": round(turnaround, 1),
            "expected_ready": (ordered_at + timedelta(hours=turnaround)).isoformat(),
            "cost": test["cost"],
            "ordered_by": f"Dr. {fake.last_name()}",
            "result_available": status == "completed" or status == "critical_reported",
        })
    return orders

# ─── Billing ──────────────────────────────────────────────────────────────────

def generate_bills(count: int = 60) -> List[Dict]:
    bills = []
    statuses = ["pending", "partially_paid", "paid", "overdue", "disputed", "insurance_pending"]
    status_weights = [30, 20, 25, 10, 5, 10]

    for i in range(count):
        total = round(rng.uniform(2000, 85000), 2)
        insurance_covered = round(total * rand_float(0, 0.8), 2) if rng.random() > 0.4 else 0
        discount = round(total * rand_float(0, 0.1), 2)
        paid = round(rng.uniform(0, total - insurance_covered), 2) if rng.random() > 0.3 else 0
        pending = max(0, total - insurance_covered - discount - paid)
        status = rng.choices(statuses, weights=status_weights, k=1)[0]
        is_flagged = rng.random() < 0.07

        bills.append({
            "id": str(uuid.uuid4()),
            "bill_number": f"BILL-{str(i+4001).zfill(5)}",
            "patient_name": f"{fake.first_name()} {fake.last_name()}",
            "patient_id": f"PAT-{rand_int(1001, 1500)}",
            "total_amount": total,
            "paid_amount": paid,
            "pending_amount": round(pending, 2),
            "insurance_covered": insurance_covered,
            "discount_amount": discount,
            "status": status,
            "payment_method": rand_choice(["Cash", "Card", "UPI", "Insurance", "NEFT"]),
            "created_at": _days_ago(rand_int(0, 30)).isoformat(),
            "insurance_provider": rand_choice(INSURANCE_PROVIDERS) if insurance_covered > 0 else None,
            "is_flagged": is_flagged,
            "anomaly_reason": rand_choice(["Duplicate charge detected", "Unusually high billing", "Unmatched service code"]) if is_flagged else None,
            "department": rand_choice(DEPARTMENTS[:10])["name"],
        })
    return bills

# ─── Insurance Claims ─────────────────────────────────────────────────────────

def generate_insurance_claims(count: int = 40) -> List[Dict]:
    claims = []
    statuses = ["submitted", "under_review", "approved", "rejected", "pending_documents"]
    status_weights = [25, 30, 25, 10, 10]

    for i in range(count):
        amount = round(rng.uniform(5000, 120000), 2)
        status = rng.choices(statuses, weights=status_weights, k=1)[0]
        approved_amount = round(amount * rand_float(0.6, 1.0), 2) if status == "approved" else None
        approval_prob = rand_float(0.4, 0.95) if status not in ["approved", "rejected"] else (0.95 if status == "approved" else 0.05)

        claims.append({
            "id": str(uuid.uuid4()),
            "claim_number": f"CLM-{str(i+5001).zfill(5)}",
            "patient_name": f"{fake.first_name()} {fake.last_name()}",
            "patient_id": f"PAT-{rand_int(1001, 1500)}",
            "insurance_provider": rand_choice(INSURANCE_PROVIDERS),
            "policy_number": f"POL-{rand_int(100000, 999999)}",
            "claim_amount": amount,
            "approved_amount": approved_amount,
            "status": status,
            "approval_probability": approval_prob,
            "submitted_at": _days_ago(rand_int(0, 60)).isoformat(),
            "department": rand_choice(DEPARTMENTS[:10])["name"],
            "documents_required": rng.sample(["Discharge Summary", "Lab Reports", "Doctor Certificate", "Original Bills", "ID Proof"], rand_int(0, 3)) if status == "pending_documents" else [],
            "rejection_reason": rand_choice(["Policy lapsed", "Pre-existing condition", "Treatment not covered", "Incomplete documentation"]) if status == "rejected" else None,
        })
    return claims

# ─── Appointments ─────────────────────────────────────────────────────────────

def generate_appointments(count: int = 80) -> List[Dict]:
    appts = []
    statuses = ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]
    status_weights = [20, 25, 15, 25, 10, 5]
    types = ["OPD", "Follow-up", "Emergency", "Specialist", "Teleconsult"]

    for i in range(count):
        dept = rand_choice(DEPARTMENTS[:10])
        status = rng.choices(statuses, weights=status_weights, k=1)[0]
        offset_hours = rand_float(-4, 8)
        scheduled = _hours_from_now(offset_hours)
        no_show_risk = rand_float(0.05, 0.45)

        appts.append({
            "id": str(uuid.uuid4()),
            "appointment_id": f"APT-{str(i+6001).zfill(5)}",
            "patient_name": f"{fake.first_name()} {fake.last_name()}",
            "patient_id": f"PAT-{rand_int(1001, 1500)}",
            "doctor": f"Dr. {fake.last_name()}",
            "department": dept["name"],
            "scheduled_at": scheduled.isoformat(),
            "duration_minutes": rand_choice([15, 20, 30, 45, 60]),
            "type": rand_choice(types),
            "status": status,
            "chief_complaint": rand_choice(CHIEF_COMPLAINTS),
            "no_show_risk": no_show_risk,
            "no_show_risk_level": "high" if no_show_risk > 0.35 else ("medium" if no_show_risk > 0.2 else "low"),
            "priority": rand_choice(["low", "medium", "high"]),
        })
    return appts

# ─── Analytics / Time-Series ──────────────────────────────────────────────────

def get_hourly_patient_flow(hours: int = 24) -> List[Dict]:
    data = []
    base_now = _now()
    for h in range(hours, 0, -1):
        ts = base_now - timedelta(hours=h)
        hour = ts.hour
        # Simulate realistic hospital traffic patterns
        multiplier = 1.0
        if 8 <= hour <= 12:
            multiplier = 1.5   # Morning peak
        elif 14 <= hour <= 18:
            multiplier = 1.3   # Afternoon peak
        elif 0 <= hour <= 6:
            multiplier = 0.4   # Night quiet
        data.append({
            "time": ts.strftime("%H:%M"),
            "registrations": int(rand_int(8, 25) * multiplier),
            "consultations": int(rand_int(6, 20) * multiplier),
            "discharges": int(rand_int(3, 12) * multiplier),
            "emergencies": int(rand_int(1, 6) * multiplier),
        })
    return data

def get_daily_revenue(days: int = 30) -> List[Dict]:
    data = []
    base = _now()
    for d in range(days, 0, -1):
        day = base - timedelta(days=d)
        is_weekend = day.weekday() >= 5
        revenue = rand_float(480000, 950000, 0)
        cost = rand_float(320000, 580000, 0)
        if is_weekend:
            revenue *= 0.75
            cost *= 0.80
        data.append({
            "date": day.strftime("%b %d"),
            "revenue": revenue,
            "cost": cost,
            "profit": round(revenue - cost, 0),
        })
    return data

def get_department_performance() -> List[Dict]:
    perfs = []
    for dept in DEPARTMENTS[:10]:
        perfs.append({
            "department": dept["name"],
            "efficiency_score": rand_float(60, 97, 1),
            "patient_satisfaction": rand_float(68, 96, 1),
            "bed_utilization": rand_float(55, 98, 1),
            "avg_wait_time": rand_float(8, 45, 1),
            "revenue_contribution": rand_float(5, 25, 1),
            "color": dept["color"],
        })
    return perfs

def get_predictive_data() -> Dict:
    """7-day predictions for key metrics."""
    days = []
    base = _now()
    for d in range(7):
        day = base + timedelta(days=d)
        days.append({
            "date": day.strftime("%b %d"),
            "predicted_patients": rand_int(280, 480),
            "predicted_icu_occupancy": rand_float(65, 98, 1),
            "predicted_emergency_cases": rand_int(45, 120),
            "predicted_medicine_demand": rand_int(800, 1500),
            "confidence": rand_float(78, 96, 1),
        })
    return {
        "next_7_days": days,
        "peak_day": days[rand_int(0, 6)]["date"],
        "risk_level": rand_choice(["low", "medium", "high"]),
    }

# ─── Recommendations ──────────────────────────────────────────────────────────

RECOMMENDATION_TEMPLATES = [
    {
        "agent": "Emergency Response Agent",
        "category": "Emergency",
        "priority": "critical",
        "title": "Add extra emergency physician during peak hours (8AM–12PM)",
        "description": "Emergency department wait times have increased 34% over the last 2 hours. Current physician-to-patient ratio is 1:8, above the 1:6 safe threshold. Recommend deploying Dr. Sharma and Dr. Patel from afternoon shift to morning.",
        "impact": "Reduce wait time by ~18 minutes",
    },
    {
        "agent": "Bed Intelligence Agent",
        "category": "Bed Management",
        "priority": "high",
        "title": "Initiate discharge planning for 12 long-stay patients",
        "description": "12 general ward patients have exceeded the expected Length of Stay (LOS) by >48 hours. Early discharge with home care could free 12 beds and reduce overcrowding by 8%.",
        "impact": "Free 12 beds, save ₹1.2L in bed costs",
    },
    {
        "agent": "Pharmacy Intelligence Agent",
        "category": "Pharmacy",
        "priority": "high",
        "title": "Reorder Ceftriaxone 1g — stock critically low (78 units remaining)",
        "description": "Ceftriaxone injection stock is at 78 units, below the minimum threshold of 100. Current consumption rate is 15 units/day. Estimated stock-out in 5 days. Recommended reorder: 500 units from Prime Medical Suppliers.",
        "impact": "Prevent stock-out, avoid treatment delays",
    },
    {
        "agent": "Staff Allocation Agent",
        "category": "Staffing",
        "priority": "high",
        "title": "ICU nurse shortage predicted for tonight (10PM–6AM shift)",
        "description": "3 ICU nurses have called out sick. Current ICU patient count is 17 with only 4 nurses scheduled. Safe ratio is 1:2. Recommend calling in 2 on-call nurses from the pool.",
        "impact": "Maintain safe nurse:patient ratio",
    },
    {
        "agent": "Appointment Optimization Agent",
        "category": "Scheduling",
        "priority": "medium",
        "title": "Reschedule 8 elective procedures to reduce Thursday congestion",
        "description": "Thursday has 42% above-average patient volume predicted. Moving 8 elective orthopedic procedures to Tuesday or Wednesday will balance load and reduce average wait times by 22 minutes.",
        "impact": "Reduce wait time by 22 min on Thursday",
    },
    {
        "agent": "Revenue Optimization Agent",
        "category": "Revenue",
        "priority": "medium",
        "title": "₹4.2L in insurance claims require immediate documentation",
        "description": "12 insurance claims totaling ₹4.2L are at risk of rejection due to missing documentation. Claims for Star Health (₹1.8L) and HDFC ERGO (₹1.4L) require discharge summaries within 3 days.",
        "impact": "Recover ₹4.2L in pending claims",
    },
    {
        "agent": "Equipment Agent",
        "category": "Equipment",
        "priority": "high",
        "title": "Endoscopy system maintenance required — failure risk 75%",
        "description": "Predictive maintenance model indicates 75% failure probability for Endoscopy System (EQ-015) within 72 hours based on usage patterns and vibration anomalies. Schedule maintenance before next procedure batch.",
        "impact": "Prevent unplanned downtime",
    },
    {
        "agent": "Patient Flow Agent",
        "category": "Patient Flow",
        "priority": "medium",
        "title": "Open second OPD registration desk — queue exceeds 45 patients",
        "description": "Current OPD queue has 47 patients with only 1 registration desk active. Average wait is 28 minutes. Opening desk 2 will reduce wait to ~14 minutes and improve patient satisfaction scores.",
        "impact": "Reduce OPD wait by 14 min",
    },
    {
        "agent": "Laboratory Intelligence Agent",
        "category": "Laboratory",
        "priority": "high",
        "title": "8 critical lab results pending >4 hours — escalation required",
        "description": "8 lab results marked as critical (Troponin, D-Dimer, Blood Culture) have been pending for more than 4 hours without physician acknowledgment. Automated escalation to department heads recommended.",
        "impact": "Prevent delayed treatment for critical patients",
    },
    {
        "agent": "Predictive Analytics Agent",
        "category": "Forecasting",
        "priority": "medium",
        "title": "High patient surge predicted this weekend — prepare capacity",
        "description": "Based on historical patterns, seasonal trends, and weather data, a 28% increase in emergency and OPD visits is predicted this weekend. Recommend pre-positioning staff and ensuring bed availability.",
        "impact": "Proactively handle weekend surge",
    },
]

def get_recommendations() -> List[Dict]:
    recs = []
    for i, tmpl in enumerate(RECOMMENDATION_TEMPLATES):
        recs.append({
            "id": str(uuid.uuid4()),
            **tmpl,
            "is_acknowledged": rng.random() > 0.75,
            "created_at": _hours_ago(rand_float(0, 24)).isoformat(),
            "expires_at": _hours_from_now(rand_float(4, 48)).isoformat(),
        })
    return recs

# ─── Agents Status ────────────────────────────────────────────────────────────

AGENT_DEFINITIONS = [
    {"name": "Executive Decision Agent",      "key": "executive",      "icon": "🎯", "category": "Intelligence"},
    {"name": "Patient Flow Agent",            "key": "patient_flow",   "icon": "🚶", "category": "Operations"},
    {"name": "Appointment Optimization Agent","key": "appointment",    "icon": "📅", "category": "Scheduling"},
    {"name": "Bed Intelligence Agent",        "key": "beds",           "icon": "🛏️",  "category": "Resources"},
    {"name": "Emergency Response Agent",      "key": "emergency",      "icon": "🚨", "category": "Emergency"},
    {"name": "Staff Allocation Agent",        "key": "staff",          "icon": "👨‍⚕️",  "category": "Staffing"},
    {"name": "Laboratory Intelligence Agent", "key": "laboratory",     "icon": "🔬", "category": "Clinical"},
    {"name": "Pharmacy Intelligence Agent",   "key": "pharmacy",       "icon": "💊", "category": "Supply"},
    {"name": "Medical Equipment Agent",       "key": "equipment",      "icon": "⚙️",  "category": "Maintenance"},
    {"name": "Billing Intelligence Agent",    "key": "billing",        "icon": "💰", "category": "Finance"},
    {"name": "Insurance Agent",               "key": "insurance",      "icon": "📋", "category": "Finance"},
    {"name": "Revenue Optimization Agent",    "key": "revenue",        "icon": "📈", "category": "Finance"},
    {"name": "Predictive Analytics Agent",    "key": "predictive",     "icon": "🔮", "category": "Intelligence"},
    {"name": "Root Cause Analysis Agent",     "key": "root_cause",     "icon": "🔍", "category": "Intelligence"},
    {"name": "Recommendation Agent",          "key": "recommendation", "icon": "💡", "category": "Intelligence"},
]

def get_agents_status() -> List[Dict]:
    statuses = ["running", "idle", "error"]
    status_weights = [50, 45, 5]
    result = []
    for agent in AGENT_DEFINITIONS:
        status = rng.choices(statuses, weights=status_weights, k=1)[0]
        last_run = _hours_ago(rand_float(0, 2))
        result.append({
            **agent,
            "id": str(uuid.uuid4()),
            "status": status,
            "last_run": last_run.isoformat(),
            "run_count_today": rand_int(10, 200),
            "avg_runtime_ms": rand_int(120, 2500),
            "recommendations_generated": rand_int(0, 12),
            "alerts_raised": rand_int(0, 5),
            "last_output_summary": f"Analyzed {rand_int(50, 500)} data points, generated {rand_int(1, 5)} recommendations.",
            "health_score": rand_float(85, 100, 1) if status != "error" else rand_float(0, 50, 1),
        })
    return result
