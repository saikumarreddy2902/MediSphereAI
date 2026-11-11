"""
MediSphere AI — Staff Schemas

Request/response Pydantic models for Staff Allocation and Rostering API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field


class StaffCreate(BaseModel):
    """Schema for onboarding a new staff member."""
    full_name: str = Field(..., min_length=2, examples=["Dr. Priya Sharma"])
    email: EmailStr = Field(..., examples=["priya.sharma@medisphere.in"])
    role: str = Field(
        ...,
        pattern="^(PHYSICIAN|NURSE|TECHNICIAN|ADMIN|PHARMACIST|RADIOLOGIST|SURGEON)$",
        examples=["NURSE"]
    )
    department_id: str = Field(..., description="Department MongoDB ObjectId")
    license_number: str | None = Field(None, examples=["MCI-2020-12345"])
    shift: str = Field(
        default="DAY",
        pattern="^(DAY|EVENING|NIGHT|ROTATING)$"
    )
    specialization: str | None = None
    contact_number: str = Field(..., min_length=10, max_length=15)


class StaffUpdate(BaseModel):
    """Schema for updating a staff member's assignment or status."""
    department_id: str | None = None
    shift: str | None = Field(None, pattern="^(DAY|EVENING|NIGHT|ROTATING)$")
    specialization: str | None = None
    availability_status: str | None = Field(
        None,
        pattern="^(AVAILABLE|ON_LEAVE|IN_SURGERY|OFF_DUTY)$"
    )


class StaffResponse(BaseModel):
    """Staff member record returned by API responses."""
    id: str = Field(alias="_id")
    full_name: str
    email: str
    role: str
    department_id: str
    license_number: str | None = None
    shift: str
    specialization: str | None = None
    contact_number: str
    availability_status: str = "AVAILABLE"

    model_config = {"populate_by_name": True}


class StaffRosterSummary(BaseModel):
    """High-level staffing KPIs for the dashboard."""
    total_staff: int
    on_duty: int
    on_leave: int
    by_role: dict  # e.g. {"NURSE": 32, "PHYSICIAN": 18, ...}
    nurse_to_patient_ratio: float | None = None
