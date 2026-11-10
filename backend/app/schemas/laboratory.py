"""
MediSphere AI — Laboratory Schemas

Request/response Pydantic models for Laboratory diagnostic order endpoints.
"""
from datetime import datetime

from pydantic import BaseModel, Field


class LabOrderCreate(BaseModel):
    """Schema for ordering a new laboratory test."""
    patient_id: str = Field(..., description="Patient MongoDB ObjectId")
    patient_name: str = Field(..., min_length=2, examples=["John Doe"])
    test_name: str = Field(..., min_length=2, examples=["Complete Blood Count"])
    test_code: str = Field(..., min_length=2, examples=["LAB-CBC"])
    category: str = Field(..., examples=["Hematology"])
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    cost: float = Field(..., gt=0, examples=[250.0])
    ordered_by: str = Field(..., examples=["Dr. Smith"])


class LabOrderUpdate(BaseModel):
    """Schema for updating laboratory test status, result, or flags."""
    status: str | None = Field(
        None,
        pattern="^(ordered|sample_collected|in_progress|completed|critical_reported)$"
    )
    priority: str | None = Field(None, pattern="^(low|medium|high|critical)$")
    is_critical: bool | None = None
    turnaround_hours: float | None = Field(None, ge=0)
    result_available: bool | None = None
    result_value: str | None = None    # Recorded result value (e.g. "12.5 g/dL")
    result_unit: str | None = None     # Unit of measurement (e.g. "g/dL")
    result_notes: str | None = None    # Pathologist notes


class LabOrderResponse(BaseModel):
    """
    Lab order record returned by API responses.

    Uses `from_attributes=True` so Beanie ODM documents (which expose `.id`
    as a `PydanticObjectId`) are automatically coerced to `str`.
    """
    id: str | None = None
    order_id: str
    patient_id: str
    patient_name: str
    test_name: str
    test_code: str
    category: str
    ordered_at: datetime
    status: str
    priority: str
    is_critical: bool
    turnaround_hours: float
    expected_ready: datetime
    cost: float
    ordered_by: str
    result_available: bool
    result_value: str | None = None
    result_unit: str | None = None
    result_notes: str | None = None
    created_at: datetime | None = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }
