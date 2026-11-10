"""
MediSphere AI — Pharmacy Schemas

Request/response Pydantic models for Medicine and Inventory API endpoints.
"""
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.common import BaseResponse

# ─── Medicine ────────────────────────────────────────────────────────────────

class MedicineCreate(BaseModel):
    """Schema for adding a new medicine to the formulary."""
    name: str = Field(..., min_length=2, max_length=200, examples=["Paracetamol 500mg"])
    manufacturer: str = Field(..., examples=["Sun Pharma"])
    category: str = Field(..., examples=["Analgesic"])
    description: str | None = None
    unit_price: float = Field(..., gt=0, examples=[12.50])
    requires_prescription: bool = True


class MedicineUpdate(BaseModel):
    """Schema for updating medicine master data."""
    manufacturer: str | None = None
    category: str | None = None
    description: str | None = None
    unit_price: float | None = Field(None, gt=0)
    requires_prescription: bool | None = None


class MedicineResponse(BaseResponse):
    """Medicine record returned by API responses."""
    name: str
    manufacturer: str
    category: str
    description: str | None = None
    unit_price: float
    requires_prescription: bool
    created_at: datetime | None = None


# ─── Medicine Inventory ───────────────────────────────────────────────────────

class InventoryCreate(BaseModel):
    """Schema for adding a new inventory batch."""
    medicine_id: str = Field(..., description="Medicine MongoDB ObjectId")
    batch_number: str = Field(..., examples=["BATCH-2026-001"])
    quantity: int = Field(..., gt=0, examples=[500])
    expiry_date: date = Field(..., examples=["2028-12-31"])
    supplier: str = Field(..., examples=["MedLine Distributors"])


class InventoryResponse(BaseResponse):
    """Inventory batch record returned by API responses."""
    medicine_id: str
    batch_number: str
    quantity: int
    expiry_date: date
    supplier: str
    created_at: datetime | None = None


class InventoryAlertResponse(BaseModel):
    """Low-stock or near-expiry alert item."""
    medicine_id: str
    medicine_name: str
    current_quantity: int
    threshold: int
    days_until_expiry: int | None = None
    alert_type: str  # LOW_STOCK | NEAR_EXPIRY
