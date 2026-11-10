"""
MediSphere AI — Pharmacy API
"""

from app.api.deps import RoleChecker
from app.models.user import User
from app.schemas.pharmacy import (
    InventoryAlertResponse,
    InventoryCreate,
    InventoryResponse,
    MedicineCreate,
    MedicineResponse,
)
from app.services.resources import PharmacyService
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter()

def get_pharmacy_service() -> PharmacyService:
    return PharmacyService()

@router.get("/inventory", response_model=list[InventoryResponse])
async def get_inventory(
    medicine_id: str | None = None,
    service: PharmacyService = Depends(get_pharmacy_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """Get all medicine inventory batches — clinical staff only"""
    query = {}
    if medicine_id:
        query["medicine_id"] = medicine_id
    return await service.inventory_repository.get_multi(query=query)

@router.post("/inventory", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
async def add_inventory_batch(
    batch_in: InventoryCreate,
    service: PharmacyService = Depends(get_pharmacy_service),
    current_user: User = Depends(RoleChecker(["admin", "staff"])),
):
    """Add a new inventory batch to stock — admin/staff only"""
    return await service.add_inventory_batch(batch_in)

@router.get("/alerts", response_model=list[InventoryAlertResponse])
async def get_stock_alerts(
    service: PharmacyService = Depends(get_pharmacy_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """Get low stock and near-expiry alerts — clinical staff only"""
    return await service.get_inventory_alerts()

@router.get("/", response_model=list[MedicineResponse])
async def list_medicines(
    category: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: PharmacyService = Depends(get_pharmacy_service),
    current_user: User = Depends(RoleChecker(["admin", "doctor", "nurse", "staff"])),
):
    """List medicines in the formulary — clinical staff only"""
    query = {}
    if category:
        query["category"] = category
    return await service.repository.get_multi(skip=skip, limit=limit, query=query)

@router.post("/", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine(
    med_in: MedicineCreate,
    service: PharmacyService = Depends(get_pharmacy_service),
    current_user: User = Depends(RoleChecker(["admin", "staff"])),
):
    """Register a new medicine in the formulary"""
    # Check if medicine with same name already exists
    existing = await service.repository.get_by_field("name", med_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medicine already exists in the formulary"
        )
    return await service.create(med_in)
