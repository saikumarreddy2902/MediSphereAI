"""
MediSphere AI — Core Hospital Models
"""
from datetime import date

from app.models.base import BaseDocument
from beanie import Indexed


class Department(BaseDocument):
    name: Indexed(str, unique=True)
    code: Indexed(str, unique=True)
    head_doctor_id: str | None = None
    capacity: int = 0
    current_occupancy: int = 0
    
    class Settings:
        name = "departments"


class Doctor(BaseDocument):
    user_id: Indexed(str, unique=True)  # Links to User
    specialization: str
    department_id: str
    license_number: str
    consultation_fee: float
    availability_status: str = "AVAILABLE"  # AVAILABLE, ON_LEAVE, IN_SURGERY
    
    class Settings:
        name = "doctors"


class Patient(BaseDocument):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    contact_number: str
    email: str | None = None
    address: str
    blood_group: str
    medical_history: list[str] = []
    allergies: list[str] = []
    emergency_contact: dict = {}
    
    class Settings:
        name = "patients"
        indexes = [
            [("first_name", 1), ("last_name", 1)],
            "contact_number"
        ]
