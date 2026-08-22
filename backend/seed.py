"""
MediSphere AI — Database Seeding Script

Connects to MongoDB Atlas and populates collections with realistic seed data.
"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, date
from faker import Faker
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from beanie import init_beanie

from app.core.config import settings
from app.core.security import get_password_hash

# Import document models
from app.models.user import User, Role, Permission
from app.models.hospital import Patient, Doctor, Department
from app.models.operations import Appointment, Bed, EmergencyCase
from app.models.resources import Medicine, MedicineInventory, Equipment
from app.models.finance import Bill, InsuranceClaim
from app.models.laboratory import LabOrder

# Import mock data helpers
from app.mock.data_generator import (
    DEPARTMENTS,
    DOCTOR_SPECIALIZATIONS,
    MEDICINES,
    EQUIPMENT_LIST,
    LAB_TESTS,
    INSURANCE_PROVIDERS,
    generate_patients,
    generate_beds,
    generate_emergency_cases,
    generate_staff,
    generate_bills,
    generate_insurance_claims,
    generate_appointments,
    generate_lab_orders,
    get_pharmacy_inventory
)

fake = Faker()
rng = random.Random(42)

async def seed_database():
    print("Connecting to MongoDB Atlas for seeding...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db: AsyncIOMotorDatabase = client[settings.DATABASE_NAME]

    # Initialize Beanie ODM
    await init_beanie(
        database=db,
        document_models=[
            User, Role, Permission,
            Patient, Doctor, Department,
            Appointment, Bed, EmergencyCase,
            Medicine, MedicineInventory, Equipment,
            Bill, InsuranceClaim, LabOrder
        ],
    )
    
    # ─── Clear Collections ──────────────────────────────────────────────────
    print("Clearing existing collections...")
    await User.find_all().delete()
    await Role.find_all().delete()
    await Permission.find_all().delete()
    await Patient.find_all().delete()
    await Doctor.find_all().delete()
    await Department.find_all().delete()
    await Appointment.find_all().delete()
    await Bed.find_all().delete()
    await EmergencyCase.find_all().delete()
    await Medicine.find_all().delete()
    await MedicineInventory.find_all().delete()
    await Equipment.find_all().delete()
    await Bill.find_all().delete()
    await InsuranceClaim.find_all().delete()
    await LabOrder.find_all().delete()
    print("Collections cleared successfully!")

    # ─── Seed Users, Roles & Permissions ─────────────────────────────────────
    print("Seeding Roles and Permissions...")
    perms = [
        Permission(name="read_patients", description="Read patient records"),
        Permission(name="write_patients", description="Write patient records"),
        Permission(name="read_billing", description="Read billing statements"),
        Permission(name="write_billing", description="Manage and verify payments"),
        Permission(name="manage_system", description="Full system access"),
    ]
    for p in perms:
        await p.insert()

    roles = [
        Role(name="admin", description="System Admin", permissions=["read_patients", "write_patients", "read_billing", "write_billing", "manage_system"]),
        Role(name="doctor", description="Medical Doctor", permissions=["read_patients", "write_patients"]),
        Role(name="nurse", description="Clinical Nurse", permissions=["read_patients", "write_patients"]),
    ]
    for r in roles:
        await r.insert()

    print("Seeding Default Admin User...")
    admin_user = User(
        username="admin",
        email="admin@medisphere.com",
        hashed_password=get_password_hash("admin123"),
        full_name="MediSphere Admin User",
        roles=["admin"],
        is_active=True,
        is_superuser=True
    )
    await admin_user.insert()

    # ─── Seed Departments ────────────────────────────────────────────────────
    print("Seeding Departments...")
    dept_map = {}  # maps code -> id
    for d in DEPARTMENTS:
        db_dept = Department(
            name=d["name"],
            code=d["id"],
            capacity=d["bed_capacity"],
            current_occupancy=0
        )
        inserted = await db_dept.insert()
        dept_map[d["name"]] = str(inserted.id)

    # ─── Seed Doctors ────────────────────────────────────────────────────────
    print("Seeding Doctors & Medical Staff...")
    staff_gen = generate_staff(25)
    doctor_ids = []
    
    for s in staff_gen:
        if s["role"] == "doctor":
            # 1. Create a User credentials document for doctor
            doc_user = User(
                username=s["name"].lower().replace(". ", "").replace(" ", "_"),
                email=s["email"],
                hashed_password=get_password_hash("doctor123"),
                full_name=s["name"],
                roles=["doctor"],
                is_active=True,
                is_superuser=False
            )
            inserted_user = await doc_user.insert()
            
            # 2. Create the Doctor details profile
            db_doc = Doctor(
                user_id=str(inserted_user.id),
                specialization=s["specialization"] or "General Medicine",
                department_id=dept_map.get(s["department"], list(dept_map.values())[0]),
                license_number=f"LIC-{rng.randint(10000, 99999)}",
                consultation_fee=float(rng.choice([500, 800, 1200, 1500])),
                availability_status="AVAILABLE"
            )
            inserted_doc = await db_doc.insert()
            doctor_ids.append(str(inserted_doc.id))

    # ─── Seed Patients ───────────────────────────────────────────────────────
    print("Seeding Patients...")
    patients_gen = generate_patients(60)
    patient_ids = []
    
    for p in patients_gen:
        dob_date = datetime.strptime(p["date_of_birth"], "%Y-%m-%d").date()
        db_patient = Patient(
            first_name=p["first_name"],
            last_name=p["last_name"],
            date_of_birth=dob_date,
            gender=p["gender"].upper(),
            contact_number=p["phone"],
            email=p["email"],
            address=fake.address(),
            blood_group=p["blood_group"],
            medical_history=[fake.sentence() for _ in range(rng.randint(0, 3))],
            allergies=[rng.choice(["Penicillin", "Sulfa Drugs", "Peanuts", "Pollen", "Latex"]) for _ in range(rng.randint(0, 2))],
            emergency_contact={
                "name": f"{fake.first_name()} {fake.last_name()}",
                "relation": rng.choice(["Spouse", "Parent", "Sibling", "Child"]),
                "phone": fake.phone_number()[:15]
            }
        )
        inserted_pat = await db_patient.insert()
        patient_ids.append(str(inserted_pat.id))

    # ─── Seed Beds ───────────────────────────────────────────────────────────
    print("Seeding Beds...")
    beds_gen = generate_beds()
    for b in beds_gen:
        db_bed = Bed(
            bed_number=b["bed_number"],
            ward=b["ward"],
            department_id=dept_map.get(b["ward"], list(dept_map.values())[0]),
            type=b["bed_type"].upper(),
            is_occupied=b["status"] == "occupied",
            current_patient_id=rng.choice(patient_ids) if b["status"] == "occupied" else None,
            last_maintenance_date=datetime.now() - timedelta(days=rng.randint(10, 180))
        )
        await db_bed.insert()

    # ─── Seed Emergency Cases ────────────────────────────────────────────────
    print("Seeding Emergency Cases...")
    emerg_gen = generate_emergency_cases(20)
    for ec in emerg_gen:
        db_case = EmergencyCase(
            patient_id=rng.choice(patient_ids) if rng.random() > 0.3 else None,
            triage_level=ec["triage_level"],
            arrival_time=datetime.fromisoformat(ec["arrival_time"]),
            symptoms=ec["chief_complaint"],
            vitals={
                "pulse": ec["vital_signs"]["heart_rate"],
                "bp": f"{ec['vital_signs']['bp_systolic']}/{ec['vital_signs']['bp_diastolic']}",
                "spo2": ec["vital_signs"]["spo2"],
                "temp": ec["vital_signs"]["temperature"],
                "resp_rate": ec["vital_signs"]["respiratory_rate"]
            },
            assigned_doctor_id=rng.choice(doctor_ids) if ec["assigned_doctor"] else None,
            outcome=ec["status"].upper() if ec["status"] in ["admitted", "discharged"] else None
        )
        # Manually bypass index constraint validation
        db_case.status = ec["status"].upper()
        await db_case.insert()

    # ─── Seed Medicines & Inventory ──────────────────────────────────────────
    print("Seeding Medicine Formulary & Inventory...")
    meds_gen = get_pharmacy_inventory()
    for m in meds_gen:
        # Create Medicine Catalog entry
        med_manufacturer = rng.choice(["Sun Pharma", "Cipla", "Dr. Reddy's", "Lupin", "Aurobindo"])
        db_med = Medicine(
            name=m["name"],
            manufacturer=med_manufacturer,
            category=m["category"],
            description=m.get("description", f"Commonly used {m['category']}"),
            unit_price=float(m.get("cost") or m.get("unit_cost") or 10.0),
            requires_prescription=rng.choice([True, False])
        )
        inserted_med = await db_med.insert()
        
        # Create corresponding stock inventory batches (2 batches per medicine)
        for i in range(2):
            exp_date = datetime.strptime(m["expiry_date"], "%Y-%m-%d").date() + timedelta(days=i * 180)
            db_inv = MedicineInventory(
                medicine_id=str(inserted_med.id),
                batch_number=f"BATCH-{m['code']}-{rng.randint(100, 999)}",
                quantity=int(m["current_stock"] / 2),
                expiry_date=exp_date,
                supplier=rng.choice(["Prime Medical Partners", "MedLine Supplies", "Apollo Biotech"])
            )
            await db_inv.insert()

    # ─── Seed Medical Equipment ──────────────────────────────────────────────
    print("Seeding Medical Equipment...")
    for eq in EQUIPMENT_LIST:
        db_eq = Equipment(
            name=eq["name"],
            serial_number=f"SN-{eq['id']}-{rng.randint(1000, 9999)}",
            department_id=dept_map.get(eq["dept"], list(dept_map.values())[0]),
            purchase_date=date.today() - timedelta(days=rng.randint(300, 1500)),
            warranty_expiry=date.today() + timedelta(days=rng.randint(100, 1000)),
            next_maintenance_date=date.today() + timedelta(days=rng.randint(-5, 90)),
            operational_status=eq["status"].upper() if eq["status"] in ["operational", "maintenance"] else "OPERATIONAL"
        )
        await db_eq.insert()

    # ─── Seed Bills & Claims ─────────────────────────────────────────────────
    print("Seeding Bills and Insurance Claims...")
    bills_gen = generate_bills(40)
    for b in bills_gen:
        pat_id = rng.choice(patient_ids)
        
        # Setup Invoice Items list
        items = []
        for i in range(rng.randint(1, 4)):
            qty = rng.randint(1, 5)
            price = float(rng.choice([120, 250, 450, 1200]))
            items.append({
                "description": f"Hospital Service Item {i+1}",
                "quantity": qty,
                "unit_price": price,
                "total": round(qty * price, 2)
            })
        
        subtotal = round(sum(item["total"] for item in items), 2)
        discount = round(subtotal * rng.choice([0.0, 0.05, 0.1]), 2)
        tax = round((subtotal - discount) * 0.05, 2)
        total_amount = round(subtotal - discount + tax, 2)
        
        status = b["status"].upper() if b["status"] in ["pending", "paid", "partially_paid"] else "PENDING"
        paid = total_amount if status == "PAID" else (round(total_amount * 0.4, 2) if status == "PARTIAL" else 0.0)
        
        db_bill = Bill(
            invoice_number=b["bill_number"],
            patient_id=pat_id,
            admission_id=None,
            items=items,
            subtotal=subtotal,
            tax=tax,
            discount=discount,
            total_amount=total_amount,
            amount_paid=paid,
            payment_status=status,
            due_date=datetime.now() + timedelta(days=rng.randint(5, 30))
        )
        inserted_bill = await db_bill.insert()
        
        # Seed an insurance claim if insurance covered
        if b["insurance_covered"] > 0:
            db_claim = InsuranceClaim(
                claim_number=f"CLM-{rng.randint(10000, 99999)}",
                bill_id=str(inserted_bill.id),
                patient_id=pat_id,
                provider_name=rng.choice(INSURANCE_PROVIDERS),
                policy_number=f"POL-{rng.randint(100000, 999999)}",
                claim_amount=float(b["insurance_covered"]),
                approved_amount=float(b["insurance_covered"]) if rng.random() > 0.3 else None,
                claim_status="APPROVED" if rng.random() > 0.3 else "SUBMITTED",
                submission_date=datetime.now() - timedelta(days=rng.randint(1, 15))
            )
            await db_claim.insert()

    # ─── Seed Lab Orders ─────────────────────────────────────────────────────
    print("Seeding Lab Orders...")
    lab_gen = generate_lab_orders(45)
    for lo in lab_gen:
        ordered_dt = datetime.fromisoformat(lo["ordered_at"])
        expected_dt = datetime.fromisoformat(lo["expected_ready"])
        
        db_lo = LabOrder(
            order_id=lo["order_id"],
            patient_name=lo["patient_name"],
            patient_id=rng.choice(patient_ids),
            test_name=lo["test_name"],
            test_code=lo["test_code"],
            category=lo["category"],
            ordered_at=ordered_dt,
            status=lo["status"],
            priority=lo["priority"],
            is_critical=lo["is_critical"],
            turnaround_hours=lo["turnaround_hours"],
            expected_ready=expected_dt,
            cost=lo["cost"],
            ordered_by=lo["ordered_by"],
            result_available=lo["result_available"]
        )
        await db_lo.insert()

    # ─── Seed Appointments ───────────────────────────────────────────────────
    print("Seeding Appointments...")
    appt_gen = generate_appointments(50)
    for a in appt_gen:
        db_appt = Appointment(
            patient_id=rng.choice(patient_ids),
            doctor_id=rng.choice(doctor_ids),
            department_id=rng.choice(list(dept_map.values())),
            appointment_date=datetime.fromisoformat(a["scheduled_at"]),
            reason=a["chief_complaint"],
            type=a["type"].upper().replace("-", "_") if a["type"] in ["OPD", "Follow-up", "Emergency"] else "GENERAL",
            notes=fake.sentence()
        )
        await db_appt.insert()

    print("==================================================")
    print(" DATABASE SEEDING COMPLETED SUCCESSFULY!")
    print(" Seeded:")
    print(f"  - Users: {await User.count()}")
    print(f"  - Doctors: {await Doctor.count()}")
    print(f"  - Patients: {await Patient.count()}")
    print(f"  - Beds: {await Bed.count()}")
    print(f"  - Emergency Cases: {await EmergencyCase.count()}")
    print(f"  - Medicines: {await Medicine.count()} ({await MedicineInventory.count()} stock batches)")
    print(f"  - Equipment: {await Equipment.count()}")
    print(f"  - Bills: {await Bill.count()}")
    print(f"  - Insurance Claims: {await InsuranceClaim.count()}")
    print(f"  - Lab Orders: {await LabOrder.count()}")
    print(f"  - Appointments: {await Appointment.count()}")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(seed_database())
