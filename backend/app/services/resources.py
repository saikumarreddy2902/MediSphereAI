"""
MediSphere AI — Resources Services (Pharmacy & Equipment)
"""
from typing import List, Dict, Any
from datetime import date, datetime
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.repositories.core import (
    MedicineRepository,
    EquipmentRepository,
    MedicineInventoryRepository
)
from app.models.resources import Medicine, Equipment, MedicineInventory
from app.schemas.pharmacy import InventoryCreate, InventoryAlertResponse


class PharmacyService(BaseService[Medicine]):
    def __init__(self):
        super().__init__(MedicineRepository())
        self.inventory_repository = MedicineInventoryRepository()

    async def add_inventory_batch(self, batch_in: InventoryCreate) -> MedicineInventory:
        """Add a new inventory batch for a medicine."""
        # Verify medicine exists
        medicine = await self.repository.get(batch_in.medicine_id)
        if not medicine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medicine not found"
            )
        return await self.inventory_repository.create(batch_in)

    async def get_inventory_alerts(self) -> List[InventoryAlertResponse]:
        """Get medicines with low-stock or near-expiry batches."""
        alerts = []
        
        # 1. Check low stock levels (aggregate quantities across batches)
        medicines = await self.repository.get_multi(limit=1000)
        for med in medicines:
            batches = await self.inventory_repository.get_by_medicine(str(med.id))
            total_qty = sum(b.quantity for b in batches)
            
            # Use threshold of 200 units as standard threshold
            threshold = 200
            if total_qty < threshold:
                alerts.append(InventoryAlertResponse(
                    medicine_id=str(med.id),
                    medicine_name=med.name,
                    current_quantity=total_qty,
                    threshold=threshold,
                    alert_type="LOW_STOCK"
                ))
                
        # 2. Check near-expiry batches (expiring in < 30 days)
        today = date.today()
        all_batches = await self.inventory_repository.get_multi(limit=1000)
        for batch in all_batches:
            days_left = (batch.expiry_date - today).days
            if days_left < 30:
                medicine = await self.repository.get(batch.medicine_id)
                med_name = medicine.name if medicine else "Unknown Medicine"
                alerts.append(InventoryAlertResponse(
                    medicine_id=batch.medicine_id,
                    medicine_name=med_name,
                    current_quantity=batch.quantity,
                    threshold=0,
                    days_until_expiry=max(0, days_left),
                    alert_type="NEAR_EXPIRY"
                ))
                
        return alerts


class EquipmentService(BaseService[Equipment]):
    def __init__(self):
        super().__init__(EquipmentRepository())

    async def get_maintenance_due(self) -> List[Equipment]:
        """Get equipment due for maintenance."""
        # Equipment due in next 7 days, or already in MAINTENANCE status
        import datetime as dt
        today = date.today()
        week_away = today + dt.timedelta(days=7)
        
        # Operational status is MAINTENANCE or next maintenance date <= week away
        return await self.repository.get_multi(
            query={
                "$or": [
                    {"operational_status": "MAINTENANCE"},
                    {"next_maintenance_date": {"$lte": week_away}}
                ]
            }
        )
