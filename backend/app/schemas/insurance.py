"""
MediSphere AI — Insurance Schemas

Request/response Pydantic models for the Insurance Claims API endpoints.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import BaseResponse


class InsuranceClaimCreate(BaseModel):
    """Schema for submitting a new insurance claim."""
    bill_id: str = Field(..., description="Bill MongoDB ObjectId this claim is for")
    patient_id: str = Field(..., description="Patient MongoDB ObjectId")
    provider_name: str = Field(..., min_length=2, examples=["Star Health Insurance"])
    policy_number: str = Field(..., min_length=4, examples=["SHI-2026-00123"])
    claim_amount: float = Field(..., gt=0, examples=[45000.0])


class InsuranceClaimUpdate(BaseModel):
    """Schema for updating a claim status (used by insurance admin)."""
    claim_status: Optional[str] = Field(
        None,
        pattern="^(SUBMITTED|IN_REVIEW|APPROVED|REJECTED)$"
    )
    approved_amount: Optional[float] = Field(None, ge=0)
    rejection_reason: Optional[str] = None
    resolution_date: Optional[datetime] = None


class InsuranceClaimResponse(BaseResponse):
    """Insurance claim record returned by API responses."""
    claim_number: str
    bill_id: str
    patient_id: str
    provider_name: str
    policy_number: str
    claim_amount: float
    approved_amount: Optional[float] = None
    claim_status: str
    rejection_reason: Optional[str] = None
    submission_date: datetime
    resolution_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
