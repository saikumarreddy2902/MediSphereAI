"""
MediSphere AI — Operations Models (Appointments, Beds, Emergency)
"""
from datetime import datetime
from typing import Any

from app.models.base import BaseDocument
from beanie import Indexed


class Appointment(BaseDocument):
    patient_id: Indexed(str)
    doctor_id: Indexed(str)
    department_id: str
    appointment_date: Indexed(datetime)
    reason: str
    type: str = "GENERAL"  # GENERAL, FOLLOW_UP, SURGERY
    notes: str | None = None
    
    class Settings:
        name = "appointments"
        indexes = [
            [("doctor_id", 1), ("appointment_date", 1)]
        ]


class Bed(BaseDocument):
    bed_number: Indexed(str, unique=True)
    ward: str
    department_id: str
    type: str = "GENERAL"  # GENERAL, ICU, OXYGEN, VENTILATOR
    is_occupied: bool = False
    current_patient_id: str | None = None
    last_maintenance_date: datetime | None = None
    
    class Settings:
        name = "beds"
        indexes = [
            [("ward", 1), ("is_occupied", 1)]
        ]


class EmergencyCase(BaseDocument):
    patient_id: str | None = None  # Might be unknown initially
    triage_level: int = 1  # 1 (Resuscitation) to 5 (Non-urgent)
    arrival_time: Indexed(datetime)
    symptoms: str
    vitals: dict[str, Any] = {}
    assigned_doctor_id: str | None = None
    outcome: str | None = None  # ADMITTED, DISCHARGED, DECEASED, TRANSFERRED
    
    class Settings:
        name = "emergency_cases"
        indexes = [
            [("triage_level", 1), ("status", 1)]
        ]
