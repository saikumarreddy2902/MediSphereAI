"""
MediSphere AI — Laboratory API
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.services.laboratory import LaboratoryService
from app.schemas.laboratory import LabOrderCreate, LabOrderUpdate, LabOrderResponse
from app.mock.data_generator import LAB_TESTS

router = APIRouter()

def get_lab_service() -> LaboratoryService:
    return LaboratoryService()

@router.get("/orders")
async def list_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(60, le=200),
    service: LaboratoryService = Depends(get_lab_service)
):
    """List lab orders with optional filtering"""
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
        
    orders = await service.repository.get_multi(skip=skip, limit=limit, query=query)
    total = await service.repository.count(query=query)
    # The frontend expects a dictionary {"total": count, "orders": [...]} or just a list. Let's return {"total": total, "orders": orders}
    return {"total": total, "orders": orders}

@router.get("/stats")
async def get_stats(service: LaboratoryService = Depends(get_lab_service)):
    """Get laboratory performance metrics and status breakdown"""
    return await service.get_lab_stats()

@router.get("/critical", response_model=List[LabOrderResponse])
async def get_critical_tests(service: LaboratoryService = Depends(get_lab_service)):
    """Get all critical lab orders that are pending resolution"""
    query = {"is_critical": True, "status": {"$ne": "completed"}}
    return await service.repository.get_multi(query=query)

@router.get("/tests")
async def list_test_catalog():
    """Get laboratory test catalog with costs and turnaround times"""
    return {"tests": LAB_TESTS}

@router.post("/orders", response_model=LabOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_order(
    order_in: LabOrderCreate,
    service: LaboratoryService = Depends(get_lab_service)
):
    """Create a new diagnostic lab order"""
    import random
    order_id = f"LAB-{random.randint(10000, 99999)}"
    
    # Calculate expected ready date
    # Look up test turnaround in hours or default to 2.0 hours
    turnaround = 2.0
    for test in LAB_TESTS:
        if test["code"] == order_in.test_code:
            turnaround = test["turnaround"]
            break
            
    now = datetime.now(timezone.utc)
    expected_ready = now + timedelta(hours=float(turnaround))
    
    order_dict = order_in.model_dump()
    order_dict["order_id"] = order_id
    order_dict["ordered_at"] = now
    order_dict["expected_ready"] = expected_ready
    order_dict["status"] = "ordered"
    order_dict["turnaround_hours"] = turnaround
    order_dict["is_critical"] = (order_in.priority == "critical")
    order_dict["result_available"] = False
    
    return await service.repository.create(order_dict)

@router.put("/orders/{order_id}", response_model=LabOrderResponse)
async def update_lab_order(
    order_id: str,
    order_update: LabOrderUpdate,
    service: LaboratoryService = Depends(get_lab_service)
):
    """Update lab order status, turnaround time or results"""
    order = await service.get_or_404(order_id)
    return await service.repository.update(order, order_update.model_dump(exclude_unset=True))
