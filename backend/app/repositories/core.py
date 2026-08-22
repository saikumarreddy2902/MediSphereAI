"""
MediSphere AI — Core Repositories
"""
from typing import List, Optional
from app.repositories.base import BaseRepository
from app.models.user import User, Role, Permission
from app.models.hospital import Patient, Doctor, Department
from app.models.operations import Appointment, Bed, EmergencyCase
from app.models.resources import Medicine, MedicineInventory, Equipment
from app.models.finance import Bill, InsuranceClaim
from app.models.laboratory import LabOrder


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)
        
    async def get_by_email(self, email: str) -> Optional[User]:
        return await self.get_by_field("email", email)
        
    async def get_by_username(self, username: str) -> Optional[User]:
        return await self.get_by_field("username", username)


class PatientRepository(BaseRepository[Patient]):
    def __init__(self):
        super().__init__(Patient)
        
    async def search_by_name(self, name_query: str, skip: int = 0, limit: int = 20) -> List[Patient]:
        # MongoDB regex search for first or last name
        query = {
            "$or": [
                {"first_name": {"$regex": name_query, "$options": "i"}},
                {"last_name": {"$regex": name_query, "$options": "i"}}
            ]
        }
        return await self.get_multi(skip=skip, limit=limit, query=query)


class DoctorRepository(BaseRepository[Doctor]):
    def __init__(self):
        super().__init__(Doctor)
        
    async def get_by_department(self, dept_id: str) -> List[Doctor]:
        return await self.model.find({"department_id": dept_id}).to_list()


class BedRepository(BaseRepository[Bed]):
    def __init__(self):
        super().__init__(Bed)
        
    async def get_available_beds(self, ward: str = None) -> List[Bed]:
        query = {"is_occupied": False}
        if ward:
            query["ward"] = ward
        return await self.model.find(query).to_list()


class EmergencyCaseRepository(BaseRepository[EmergencyCase]):
    def __init__(self):
        super().__init__(EmergencyCase)
        
    async def get_active_cases(self) -> List[EmergencyCase]:
        # Outcomes other than ADMITTED, DISCHARGED, DECEASED, TRANSFERRED are considered active
        return await self.model.find({"outcome": None}).sort("-triage_level").to_list()


class BillRepository(BaseRepository[Bill]):
    def __init__(self):
        super().__init__(Bill)
        
    async def get_pending_bills(self) -> List[Bill]:
        return await self.model.find({"payment_status": {"$in": ["PENDING", "PARTIAL"]}}).to_list()


class AppointmentRepository(BaseRepository[Appointment]):
    def __init__(self):
        super().__init__(Appointment)
        
    async def get_by_doctor(self, doctor_id: str) -> List[Appointment]:
        return await self.model.find({"doctor_id": doctor_id}).to_list()
        
    async def get_by_patient(self, patient_id: str) -> List[Appointment]:
        return await self.model.find({"patient_id": patient_id}).to_list()


class MedicineRepository(BaseRepository[Medicine]):
    def __init__(self):
        super().__init__(Medicine)
        
    async def get_by_category(self, category: str) -> List[Medicine]:
        return await self.model.find({"category": category}).to_list()


class MedicineInventoryRepository(BaseRepository[MedicineInventory]):
    def __init__(self):
        super().__init__(MedicineInventory)
        
    async def get_by_medicine(self, medicine_id: str) -> List[MedicineInventory]:
        return await self.model.find({"medicine_id": medicine_id}).to_list()


class EquipmentRepository(BaseRepository[Equipment]):
    def __init__(self):
        super().__init__(Equipment)
        
    async def get_by_department(self, department_id: str) -> List[Equipment]:
        return await self.model.find({"department_id": department_id}).to_list()


class InsuranceClaimRepository(BaseRepository[InsuranceClaim]):
    def __init__(self):
        super().__init__(InsuranceClaim)
        
    async def get_by_status(self, status: str) -> List[InsuranceClaim]:
        return await self.model.find({"claim_status": status}).to_list()


class LabOrderRepository(BaseRepository[LabOrder]):
    def __init__(self):
        super().__init__(LabOrder)
        
    async def get_by_status(self, status: str) -> List[LabOrder]:
        return await self.model.find({"status": status}).to_list()
