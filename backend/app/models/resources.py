"""
MediSphere AI — Pharmacy and Equipment Models
"""
from datetime import date

from app.models.base import BaseDocument
from beanie import Indexed


class Medicine(BaseDocument):
    name: Indexed(str, unique=True)
    manufacturer: str
    category: str
    description: str | None = None
    unit_price: float
    requires_prescription: bool = True
    
    class Settings:
        name = "medicines"


class MedicineInventory(BaseDocument):
    medicine_id: Indexed(str)
    batch_number: str
    quantity: int
    expiry_date: Indexed(date)
    supplier: str
    
    class Settings:
        name = "medicine_inventory"
        indexes = [
            [("medicine_id", 1), ("expiry_date", 1)]
        ]


class Equipment(BaseDocument):
    name: Indexed(str)
    serial_number: Indexed(str, unique=True)
    department_id: str
    purchase_date: date
    warranty_expiry: date
    next_maintenance_date: Indexed(date)
    operational_status: str = "OPERATIONAL"  # OPERATIONAL, MAINTENANCE, OUT_OF_ORDER
    
    class Settings:
        name = "equipment"
