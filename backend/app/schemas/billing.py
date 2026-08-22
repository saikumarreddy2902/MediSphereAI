"""
MediSphere AI — Billing Schemas

Request/response Pydantic models for the Revenue Cycle Management API endpoints.
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.schemas.common import BaseResponse


class InvoiceItemSchema(BaseModel):
    """A single line-item on a hospital bill."""
    description: str = Field(..., min_length=2, examples=["ICU Bed - Day 3"])
    quantity: int = Field(..., gt=0, examples=[3])
    unit_price: float = Field(..., gt=0, examples=[8500.0])
    total: float = Field(..., gt=0, examples=[25500.0])

    @model_validator(mode="after")
    def validate_total(self) -> "InvoiceItemSchema":
        expected = round(self.quantity * self.unit_price, 2)
        if abs(self.total - expected) > 0.01:
            raise ValueError(f"total ({self.total}) must equal quantity × unit_price ({expected})")
        return self


class BillCreate(BaseModel):
    """Schema for generating a new patient bill."""
    patient_id: str = Field(..., description="Patient MongoDB ObjectId")
    admission_id: Optional[str] = None
    items: List[InvoiceItemSchema] = Field(..., min_length=1)
    tax: float = Field(default=0.0, ge=0)
    discount: float = Field(default=0.0, ge=0)
    due_date: datetime

    @model_validator(mode="after")
    def compute_totals(self) -> "BillCreate":
        self.subtotal = round(sum(i.total for i in self.items), 2)
        self.total_amount = round(self.subtotal + self.tax - self.discount, 2)
        return self

    subtotal: float = 0.0
    total_amount: float = 0.0


class BillResponse(BaseResponse):
    """Bill record returned by API responses."""
    invoice_number: str
    patient_id: str
    admission_id: Optional[str] = None
    items: List[InvoiceItemSchema]
    subtotal: float
    tax: float
    discount: float
    total_amount: float
    amount_paid: float
    payment_status: str
    due_date: datetime
    created_at: Optional[datetime] = None


class BillingStats(BaseModel):
    """Revenue KPI summary returned by /billing/stats."""
    total_billed: float
    total_collected: float
    pending_amount: float
    collection_rate: float = Field(
        default=0.0,
        description="Percentage of total billed that has been collected"
    )

    @model_validator(mode="after")
    def compute_rate(self) -> "BillingStats":
        if self.total_billed > 0:
            self.collection_rate = round((self.total_collected / self.total_billed) * 100, 2)
        return self
