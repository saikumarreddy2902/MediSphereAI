"""
MediSphere AI — Patient Schemas

Request/response Pydantic models for the Patient API endpoints.
Decoupled from the Beanie `Patient` document model to enforce Clean Architecture.
"""
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class PatientCreate(BaseModel):
    """Schema for registering a new patient."""
    first_name: str = Field(..., min_length=1, max_length=100, examples=["Ravi"])
    last_name: str = Field(..., min_length=1, max_length=100, examples=["Kumar"])
    date_of_birth: date = Field(..., examples=["1985-06-15"])
    gender: str = Field(..., pattern="^(MALE|FEMALE|OTHER)$", examples=["MALE"])
    contact_number: str = Field(..., min_length=10, max_length=15, examples=["9876543210"])
    email: str | None = Field(None, examples=["ravi.kumar@example.com"])
    address: str = Field(..., min_length=5, examples=["42, MG Road, Bengaluru"])
    blood_group: str = Field(..., pattern="^(A|B|AB|O)[+-]$", examples=["O+"])
    medical_history: list[str] = []
    allergies: list[str] = []
    emergency_contact: dict = {}

    @field_validator("contact_number")
    @classmethod
    def validate_contact(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Contact number must contain only digits")
        return v


class PatientUpdate(BaseModel):
    """Schema for partially updating a patient record."""
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    address: str | None = None
    contact_number: str | None = None
    medical_history: list[str] | None = None
    allergies: list[str] | None = None
    emergency_contact: dict | None = None


class PatientResponse(BaseModel):
    """Safe patient data returned by API responses."""
    id: str = Field(alias="_id")
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
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"populate_by_name": True}


class PatientListResponse(BaseModel):
    """Paginated patient list envelope."""
    items: list[PatientResponse]
    total: int
    skip: int
    limit: int
