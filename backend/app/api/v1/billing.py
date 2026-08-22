"""
MediSphere AI — Billing API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.services.finance import BillingService
from app.schemas.billing import BillCreate, BillResponse, BillingStats

router = APIRouter()

def get_billing_service() -> BillingService:
    return BillingService()

@router.get("/stats", response_model=BillingStats)
async def get_billing_stats(service: BillingService = Depends(get_billing_service)):
    """Get overall billing and revenue statistics"""
    return await service.get_revenue_summary()

@router.get("/pending", response_model=List[BillResponse])
async def get_pending_bills(service: BillingService = Depends(get_billing_service)):
    """Get all pending or partially paid bills"""
    return await service.get_pending_bills()

@router.get("/", response_model=List[BillResponse])
async def list_bills(
    patient_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: BillingService = Depends(get_billing_service)
):
    """List bills with optional filtering by patient and payment status"""
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    if payment_status:
        query["payment_status"] = payment_status
    return await service.repository.get_multi(skip=skip, limit=limit, query=query)

@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill(
    bill_id: str,
    service: BillingService = Depends(get_billing_service)
):
    """Get a specific bill by ID"""
    return await service.get_or_404(bill_id)

@router.post("/", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(
    bill_in: BillCreate,
    service: BillingService = Depends(get_billing_service)
):
    """Create a new bill"""
    # Generate unique invoice number
    import random
    from datetime import datetime
    invoice_num = f"INV-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    
    bill_dict = bill_in.model_dump()
    bill_dict["invoice_number"] = invoice_num
    bill_dict["payment_status"] = "PENDING"
    bill_dict["amount_paid"] = 0.0
    
    return await service.repository.create(bill_dict)

@router.post("/{bill_id}/pay", response_model=BillResponse)
async def record_payment(
    bill_id: str,
    amount: float = Query(..., gt=0),
    service: BillingService = Depends(get_billing_service)
):
    """Record a payment towards a bill"""
    bill = await service.get_or_404(bill_id)
    new_paid = bill.amount_paid + amount
    
    if new_paid >= bill.total_amount:
        status_update = "PAID"
        new_paid = bill.total_amount
    else:
        status_update = "PARTIAL"
        
    update_data = {
        "amount_paid": new_paid,
        "payment_status": status_update
    }
    return await service.repository.update(bill, update_data)
