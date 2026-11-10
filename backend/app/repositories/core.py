"""
MediSphere AI — Core Repositories
"""
from typing import Any

from app.models.finance import Bill, InsuranceClaim
from app.models.hospital import Doctor, Patient
from app.models.laboratory import LabOrder
from app.models.operations import Appointment, Bed, EmergencyCase
from app.models.resources import Equipment, Medicine, MedicineInventory
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)
        
    async def get_by_email(self, email: str) -> User | None:
        return await self.get_by_field("email", email)
        
    async def get_by_username(self, username: str) -> User | None:
        return await self.get_by_field("username", username)


class PatientRepository(BaseRepository[Patient]):
    def __init__(self):
        super().__init__(Patient)
        
    async def search_by_name(self, name_query: str, skip: int = 0, limit: int = 20) -> list[Patient]:
        import re
        # Escape all special regex characters to prevent ReDoS / regex injection attacks
        safe_query = re.escape(name_query.strip())
        # MongoDB regex search for first or last name
        query = {
            "$or": [
                {"first_name": {"$regex": safe_query, "$options": "i"}},
                {"last_name": {"$regex": safe_query, "$options": "i"}}
            ]
        }
        return await self.get_multi(skip=skip, limit=limit, query=query)


class DoctorRepository(BaseRepository[Doctor]):
    def __init__(self):
        super().__init__(Doctor)
        
    async def get_by_department(self, dept_id: str) -> list[Doctor]:
        return await self.model.find({"department_id": dept_id}).to_list()


class BedRepository(BaseRepository[Bed]):
    def __init__(self):
        super().__init__(Bed)
        
    async def get_available_beds(self, ward: str | None = None) -> list[Bed]:
        query: dict[str, Any] = {"is_occupied": False}
        if ward:
            query["ward"] = ward
        return await self.model.find(query).to_list()


class EmergencyCaseRepository(BaseRepository[EmergencyCase]):
    def __init__(self):
        super().__init__(EmergencyCase)
        
    async def get_active_cases(self) -> list[EmergencyCase]:
        # Outcomes other than ADMITTED, DISCHARGED, DECEASED, TRANSFERRED are considered active
        return await self.model.find({"outcome": None}).sort("-triage_level").to_list()


class BillRepository(BaseRepository[Bill]):
    def __init__(self):
        super().__init__(Bill)

    async def get_pending_bills(self) -> list[Bill]:
        return await self.model.find({"payment_status": {"$in": ["PENDING", "PARTIAL"]}}).to_list()

    async def get_by_patient(self, patient_id: str) -> list[Bill]:
        return await self.model.find({"patient_id": patient_id}).to_list()

    async def get_revenue_summary(self) -> dict[str, Any]:
        bills = await self.get_multi(limit=10000)
        total_billed = sum(b.total_amount for b in bills)
        total_paid = sum(b.amount_paid for b in bills)
        pending = total_billed - total_paid
        return {
            "total_billed": round(total_billed, 2),
            "total_collected": round(total_paid, 2),
            "pending_amount": round(pending, 2),
        }


class AppointmentRepository(BaseRepository[Appointment]):
    def __init__(self):
        super().__init__(Appointment)

    async def get_by_doctor(self, doctor_id: str) -> list[Appointment]:
        return await self.model.find({"doctor_id": doctor_id}).to_list()

    async def get_by_patient(self, patient_id: str) -> list[Appointment]:
        return await self.model.find({"patient_id": patient_id}).to_list()

    async def get_upcoming(self, limit: int = 50) -> list[Appointment]:
        """Get upcoming scheduled/confirmed appointments, ordered by date."""
        return await self.model.find(
            {"status": {"$in": ["SCHEDULED", "CONFIRMED"]}}
        ).sort("+appointment_date").limit(limit).to_list()

    async def get_by_date(self, date_str: str) -> list[Appointment]:
        """Get all appointments on a specific date (YYYY-MM-DD)."""
        return await self.model.find({"appointment_date": date_str}).to_list()


class MedicineRepository(BaseRepository[Medicine]):
    def __init__(self):
        super().__init__(Medicine)
        
    async def get_by_category(self, category: str) -> list[Medicine]:
        return await self.model.find({"category": category}).to_list()


class MedicineInventoryRepository(BaseRepository[MedicineInventory]):
    def __init__(self):
        super().__init__(MedicineInventory)
        
    async def get_by_medicine(self, medicine_id: str) -> list[MedicineInventory]:
        return await self.model.find({"medicine_id": medicine_id}).to_list()


class EquipmentRepository(BaseRepository[Equipment]):
    def __init__(self):
        super().__init__(Equipment)
        
    async def get_by_department(self, department_id: str) -> list[Equipment]:
        return await self.model.find({"department_id": department_id}).to_list()


class InsuranceClaimRepository(BaseRepository[InsuranceClaim]):
    def __init__(self):
        super().__init__(InsuranceClaim)

    async def get_by_status(self, status: str) -> list[InsuranceClaim]:
        return await self.model.find({"claim_status": status}).to_list()

    async def get_by_patient(self, patient_id: str) -> list[InsuranceClaim]:
        return await self.model.find({"patient_id": patient_id}).to_list()


class LabOrderRepository(BaseRepository[LabOrder]):
    def __init__(self):
        super().__init__(LabOrder)

    async def get_by_status(self, status: str) -> list[LabOrder]:
        return await self.model.find({"status": status}).to_list()

    async def get_by_patient(self, patient_id: str) -> list[LabOrder]:
        return await self.model.find({"patient_id": patient_id}).to_list()

    async def get_pending_review(self) -> list[LabOrder]:
        """Get lab orders with results that are awaiting review."""
        return await self.model.find(
            {"status": {"$in": ["COMPLETED", "RESULT_AVAILABLE"]}}
        ).sort("-created_at").to_list()
