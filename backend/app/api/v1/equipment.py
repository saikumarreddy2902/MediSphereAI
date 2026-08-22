"""
MediSphere AI — Equipment API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.services.resources import EquipmentService
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentResponse

router = APIRouter()

def get_equipment_service() -> EquipmentService:
    return EquipmentService()

@router.get("/", response_model=List[EquipmentResponse])
async def get_all_equipment(
    department_id: Optional[str] = None,
    operational_status: Optional[str] = None,
    service: EquipmentService = Depends(get_equipment_service)
):
    """Get all hospital equipment with optional filtering"""
    query = {}
    if department_id:
        query["department_id"] = department_id
    if operational_status:
        query["operational_status"] = operational_status
    return await service.repository.get_multi(query=query)

@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def register_equipment(
    eq_in: EquipmentCreate,
    service: EquipmentService = Depends(get_equipment_service)
):
    """Register a new piece of medical equipment"""
    # Check if equipment serial number already registered
    existing = await service.repository.get_by_field("serial_number", eq_in.serial_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this serial number already exists"
        )
    return await service.create(eq_in)

@router.get("/maintenance", response_model=List[EquipmentResponse])
async def get_maintenance_due(service: EquipmentService = Depends(get_equipment_service)):
    """Get equipment needing maintenance soon or currently in maintenance"""
    return await service.get_maintenance_due()

@router.put("/{eq_id}", response_model=EquipmentResponse)
async def update_equipment_status(
    eq_id: str,
    eq_update: EquipmentUpdate,
    service: EquipmentService = Depends(get_equipment_service)
):
    """Update equipment status or maintenance schedules"""
    return await service.update(eq_id, eq_update)
