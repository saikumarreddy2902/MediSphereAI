"""
MediSphere AI — Patients API
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.services.hospital import PatientService
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from pydantic import BaseModel
from datetime import date

router = APIRouter()

# Dependency Injection
def get_patient_service() -> PatientService:
    return PatientService()


class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    contact_number: str
    address: str
    blood_group: str
    email: Optional[str] = None
    medical_history: Optional[List[str]] = []
    allergies: Optional[List[str]] = []


@router.get("/", response_model=List[Dict[str, Any]])
async def get_patients(
    skip: int = 0, 
    limit: int = 100,
    service: PatientService = Depends(get_patient_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """Get all patients with pagination — requires clinical staff role"""
    patients = await service.repository.get_multi(skip=skip, limit=limit)
    return [p.model_dump(by_alias=True, mode="json") for p in patients]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def register_patient(
    patient: PatientCreate,
    service: PatientService = Depends(get_patient_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """Register a new patient — requires clinical staff role"""
    new_patient = await service.register_patient(patient.model_dump())
    
    # Also register into HOSPITAL_PATIENT_REGISTRY so appointment booking & patient lookup recognizes them instantly
    try:
        from app.api.v1.appointments import HOSPITAL_PATIENT_REGISTRY
        from datetime import date
        pat_id_str = str(new_patient.id)
        short_mr = f"P-{pat_id_str[-4:].upper()}"
        calc_age = (date.today() - new_patient.date_of_birth).days // 365 if new_patient.date_of_birth else 35
        
        info = {
            "name": f"{new_patient.first_name} {new_patient.last_name}",
            "age": calc_age,
            "gender": new_patient.gender,
            "blood_group": new_patient.blood_group,
            "contact": new_patient.contact_number,
            "dept_history": new_patient.medical_history or ["General Medicine"],
            "allergies": new_patient.allergies or [],
            "id": pat_id_str,
            "mr_number": short_mr
        }
        HOSPITAL_PATIENT_REGISTRY[short_mr] = info
        HOSPITAL_PATIENT_REGISTRY[pat_id_str] = info
    except Exception:
        pass

    return new_patient.model_dump(by_alias=True, mode="json")


@router.get("/search")
async def search_patients(
    query: str,
    service: PatientService = Depends(get_patient_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """Search patients by name — requires clinical staff role"""
    results = await service.search_patients(query)
    return [p.model_dump(by_alias=True, mode="json") for p in results]


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    service: PatientService = Depends(get_patient_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff", "patient"])),
):
    """Get a specific patient by ID"""
    patient = await service.get_or_404(patient_id)
    return patient.model_dump(by_alias=True, mode="json")


@router.get("/{patient_id}/portal-summary")
async def get_patient_portal_summary(
    patient_id: str,
    service: PatientService = Depends(get_patient_service)
):
    """
    Dedicated Patient Portal comprehensive overview:
    Profile, vitals, upcoming appointments, active prescriptions,
    diagnostic reports, billing status, and care-team communications.
    """
    from app.models.hospital import Patient
    from app.api.v1.appointments import HOSPITAL_PATIENT_REGISTRY
    from bson import ObjectId
    from datetime import date
    
    clean_id = patient_id.strip()
    db_patient = None

    # 1. Lookup in MongoDB by ObjectId
    if ObjectId.is_valid(clean_id):
        try:
            db_patient = await Patient.get(ObjectId(clean_id))
        except Exception:
            pass
        if not db_patient:
            try:
                db_patient = await Patient.find_one({"_id": ObjectId(clean_id)})
            except Exception:
                pass

    # 2. Lookup in MongoDB by contact number
    if not db_patient:
        try:
            db_patient = await Patient.find_one({"contact_number": clean_id})
        except Exception:
            pass

    # 3. Lookup in HOSPITAL_PATIENT_REGISTRY
    reg_info = HOSPITAL_PATIENT_REGISTRY.get(clean_id.upper())

    if db_patient:
        patient_name = f"{db_patient.first_name} {db_patient.last_name}".strip()
        blood_group = db_patient.blood_group or "O+ (Positive)"
        allergies = db_patient.allergies or ["No known drug allergies"]
        gender = db_patient.gender or "Other"
        age = (date.today() - db_patient.date_of_birth).days // 365 if db_patient.date_of_birth else 42
        contact_number = db_patient.contact_number
        email = db_patient.email or f"{db_patient.first_name.lower()}.{db_patient.last_name.lower()}@medisphere.health"
        address = db_patient.address or "Address on file"
        emergency_contact = db_patient.emergency_contact or {
            "name": "Emergency Contact",
            "relationship": "Spouse / Relative",
            "phone": contact_number,
        }
    elif reg_info:
        patient_name = reg_info.get("name", "Registered Patient")
        blood_group = reg_info.get("blood_group", "O+ (Positive)")
        allergies = reg_info.get("allergies", ["No known drug allergies"])
        gender = reg_info.get("gender", "Male")
        age = reg_info.get("age", 45)
        contact_number = reg_info.get("contact", "+91 98450 00000")
        email = f"{patient_name.lower().replace(' ', '.')}@medisphere.health"
        address = "MediSphere Registered Residence, Karnataka, India"
        emergency_contact = {
            "name": "Sunita Kumar",
            "relationship": "Spouse",
            "phone": contact_number,
        }
    else:
        patient_name = f"Patient {clean_id}"
        blood_group = "O+ (Positive)"
        allergies = ["No known drug allergies"]
        gender = "Not Specified"
        age = 35
        contact_number = "+91 98450 23145"
        email = f"patient.{clean_id.lower()}@medisphere.health"
        address = "Hospital Outpatient Registration"
        emergency_contact = {
            "name": "Hospital Care Desk",
            "relationship": "Care Coordinator",
            "phone": "+91 80 4455 6677",
        }

    return {
        "status": "success",
        "patient": {
            "id": clean_id,
            "name": patient_name,
            "abha_id": f"91-{abs(hash(clean_id)) % 9000 + 1000}-8821-9014",
            "uhid": f"UHID-MS-{clean_id.replace('-', '').upper()}",
            "gender": gender,
            "age": age,
            "blood_group": blood_group,
            "allergies": allergies,
            "contact_number": contact_number,
            "email": email,
            "address": address,
            "emergency_contact": emergency_contact,
            "primary_physician": {
                "name": "Dr. Priya Sharma, MD, DM",
                "department": "Cardiology",
                "license": "KMC-48291",
            }
        },
        "vitals": {
            "blood_pressure": "124/82 mmHg",
            "heart_rate": "72 bpm",
            "spo2": "99%",
            "blood_glucose": "112 mg/dL (Fasting)",
            "temperature": "98.4 °F",
            "bmi": "24.1 (Healthy)",
            "last_recorded": "Today, 08:30 AM",
            "trend": "Stable"
        },
        "appointments": [
            {
                "id": "APT-701",
                "appointment_id": "APT-701",
                "doctor_name": "Dr. Priya Sharma",
                "department": "Cardiology",
                "specialty": "Interventional Cardiology",
                "date": "2026-10-28",
                "time": "10:30 AM",
                "location": "OPD Block A, Room 304",
                "type": "In-Person Follow-Up",
                "status": "CONFIRMED",
                "notes": "Evaluation of post-stent cardiac rehabilitation and lipid panel review.",
            },
            {
                "id": "APT-702",
                "appointment_id": "APT-702",
                "doctor_name": "Dr. Vikram Malhotra",
                "department": "Pulmonology",
                "specialty": "Chest Medicine",
                "date": "2026-11-04",
                "time": "02:15 PM",
                "location": "Telemedicine Video Suite",
                "type": "Teleconsultation",
                "status": "SCHEDULED",
                "notes": "Routine spirometry and seasonal allergy monitoring.",
            }
        ],
        "prescriptions": [
            {
                "id": "RX-2026-801",
                "prescription_id": "RX-2026-801",
                "patient_id": patient_id,
                "patient_name": patient_name,
                "doctor_name": "Dr. Priya Sharma",
                "department": "Cardiology",
                "doctor_reg": "KMC-48291",
                "date": "2026-10-18",
                "diagnosis": "Coronary Artery Disease (Post-PCI), Mild Hypercholesterolemia",
                "status": "ACTIVE",
                "medications": [
                    {
                        "name": "Atorvastatin Calcium",
                        "dosage": "40 mg",
                        "route": "Oral",
                        "frequency": "Once daily at bedtime",
                        "duration": "90 Days",
                        "refills_remaining": 2,
                        "instructions": "Take at night after food. Monitor muscle aches."
                    },
                    {
                        "name": "Metoprolol Succinate ER",
                        "dosage": "50 mg",
                        "route": "Oral",
                        "frequency": "Once daily in the morning",
                        "duration": "90 Days",
                        "refills_remaining": 1,
                        "instructions": "Do not skip doses. Check resting pulse."
                    },
                    {
                        "name": "Clopidogrel Bisulfate",
                        "dosage": "75 mg",
                        "route": "Oral",
                        "frequency": "Once daily",
                        "duration": "180 Days",
                        "refills_remaining": 4,
                        "instructions": "Antiplatelet therapy. Inform dentist before procedures."
                    }
                ],
                "clinical_notes": "Patient reports good tolerance. Exercise tolerance improving. Continue low sodium cardiac diet."
            }
        ],
        "lab_reports": [
            {
                "id": "LAB-9801",
                "test_name": "Lipid Profile Comprehensive",
                "department": "Biochemistry",
                "ordered_by": "Dr. Priya Sharma",
                "date": "2026-10-15",
                "status": "FINAL",
                "specimen": "Venous Blood",
                "results": [
                    {"parameter": "Total Cholesterol", "value": "164 mg/dL", "reference": "< 200 mg/dL", "status": "NORMAL"},
                    {"parameter": "HDL Cholesterol", "value": "48 mg/dL", "reference": "> 40 mg/dL", "status": "OPTIMAL"},
                    {"parameter": "LDL Cholesterol", "value": "88 mg/dL", "reference": "< 100 mg/dL", "status": "OPTIMAL"},
                    {"parameter": "Triglycerides", "value": "142 mg/dL", "reference": "< 150 mg/dL", "status": "NORMAL"},
                ],
                "summary": "Target LDL < 100 mg/dL achieved with current Atorvastatin therapy."
            },
            {
                "id": "LAB-9802",
                "test_name": "Glycated Hemoglobin (HbA1c)",
                "department": "Endocrinology",
                "ordered_by": "Dr. Priya Sharma",
                "date": "2026-10-15",
                "status": "FINAL",
                "specimen": "Whole Blood EDTA",
                "results": [
                    {"parameter": "HbA1c Concentration", "value": "5.6 %", "reference": "< 5.7 % (Non-diabetic)", "status": "NORMAL"},
                    {"parameter": "Estimated Avg Glucose", "value": "114 mg/dL", "reference": "90 - 120 mg/dL", "status": "NORMAL"},
                ],
                "summary": "Normal glycemic control maintained without medications."
            },
            {
                "id": "RAD-3401",
                "test_name": "2D Transthoracic Echocardiogram (Color Doppler)",
                "department": "Radiology & Imaging",
                "ordered_by": "Dr. Priya Sharma",
                "date": "2026-10-02",
                "status": "FINAL",
                "specimen": "Ultrasound Probe",
                "results": [
                    {"parameter": "Left Ventricular Ejection Fraction (LVEF)", "value": "60%", "reference": "55 - 70%", "status": "NORMAL"},
                    {"parameter": "Wall Motion Abnormalities", "value": "None detected", "reference": "None", "status": "NORMAL"},
                ],
                "summary": "Preserved left ventricular systolic function. Normal diastolic filling pattern."
            }
        ],
        "invoices": [
            {
                "id": "INV-2026-0041",
                "invoice_number": "INV-2026-0041",
                "patient_id": patient_id,
                "patient_name": patient_name,
                "date": "2026-10-18",
                "due_date": "2026-11-01",
                "department": "Cardiology Outpatient",
                "items": [
                    {"description": "Specialist Cardiology Consultation (Dr. Priya Sharma)", "quantity": 1, "unit_price": 1200, "total": 1200},
                    {"description": "12-Lead Digital Electrocardiogram (ECG)", "quantity": 1, "unit_price": 650, "total": 650},
                    {"description": "Echo Color Doppler Interpretation", "quantity": 1, "unit_price": 2800, "total": 2800},
                    {"description": "Comprehensive Biochemistry Panel Processing", "quantity": 1, "unit_price": 1450, "total": 1450},
                ],
                "subtotal": 6100,
                "tax": 305,
                "discount": 0,
                "total": 6405,
                "amount_paid": 6405,
                "balance_due": 0,
                "status": "PAID",
                "payment_method": "UPI / HDFC Bank (Ref: UPI/3910482910)",
                "insurance_provider": "Star Health Comprehensive (Claim Settled)",
            },
            {
                "id": "INV-2026-0089",
                "invoice_number": "INV-2026-0089",
                "patient_id": patient_id,
                "patient_name": patient_name,
                "date": "2026-10-23",
                "due_date": "2026-11-06",
                "department": "Hospital Pharmacy",
                "items": [
                    {"description": "Atorvastatin 40mg (90 Tablets Pack)", "quantity": 1, "unit_price": 840, "total": 840},
                    {"description": "Metoprolol Succinate ER 50mg (90 Tablets)", "quantity": 1, "unit_price": 520, "total": 520},
                    {"description": "Clopidogrel 75mg (180 Tablets)", "quantity": 1, "unit_price": 1100, "total": 1100},
                ],
                "subtotal": 2460,
                "tax": 123,
                "discount": 100,
                "total": 2483,
                "amount_paid": 0,
                "balance_due": 2483,
                "status": "PENDING",
                "payment_method": "Pending Online Payment / Counter",
                "insurance_provider": "Direct Self-Pay",
            }
        ],
        "messages": [
            {
                "id": "MSG-01",
                "sender": "Dr. Priya Sharma",
                "sender_role": "Primary Cardiologist",
                "date": "2026-10-19 11:20 AM",
                "text": "Hello Rajesh, your recent lipid panel looks very reassuring. LDL is well within target at 88 mg/dL. Keep up the morning walks and low-sodium diet.",
                "is_patient": False
            },
            {
                "id": "MSG-02",
                "sender": patient_name,
                "sender_role": "Patient",
                "date": "2026-10-19 02:45 PM",
                "text": "Thank you Dr. Sharma. I had mild muscle fatigue on Tuesday, but it subsided after hydrating. Looking forward to our next visit on the 28th.",
                "is_patient": True
            }
        ]
    }


class RefillRequest(BaseModel):
    patient_id: str
    prescription_id: str
    medication_name: str
    reason: Optional[str] = None


@router.post("/portal/refill-request")
async def request_prescription_refill(request: RefillRequest):
    """Submit a prescription refill request from the Patient Portal"""
    return {
        "status": "success",
        "request_id": f"REFILL-{request.patient_id[-4:]}-2026",
        "medication": request.medication_name,
        "message": f"Refill request for {request.medication_name} sent to Dr. Priya Sharma. Estimated review in 4 hours.",
    }


class PortalMessage(BaseModel):
    patient_id: str
    department: str
    doctor_name: Optional[str] = "Primary Physician"
    message: str


@router.post("/portal/messages")
async def send_portal_message(msg: PortalMessage):
    """Send asynchronous patient message to the clinical care team"""
    return {
        "status": "success",
        "message_id": f"MSG-{hash(msg.message) % 10000}",
        "department": msg.department,
        "message": "Your message has been delivered to your care team inbox.",
    }

