"""
MediSphere AI — Resource Service Unit Tests (Pharmacy & Equipment)
"""
import pytest
from app.models.resources import Equipment, Medicine
from app.services.resources import EquipmentService, PharmacyService
from motor.motor_asyncio import AsyncIOMotorClient


@pytest.mark.asyncio
async def test_list_medicines_returns_list(db_client: AsyncIOMotorClient):
    """PharmacyService returns a list of Medicine documents."""
    service = PharmacyService()
    medicines = await service.repository.get_multi()

    assert isinstance(medicines, list)
    for med in medicines:
        assert isinstance(med, Medicine)


@pytest.mark.asyncio
async def test_medicines_have_required_fields(db_client: AsyncIOMotorClient):
    """All medicine documents should have name, category, and unit_price."""
    service = PharmacyService()
    medicines = await service.repository.get_multi(limit=10)

    for med in medicines:
        assert med.name
        assert med.category
        assert med.unit_price >= 0


@pytest.mark.asyncio
async def test_get_inventory_alerts_returns_list(db_client: AsyncIOMotorClient):
    """PharmacyService.get_inventory_alerts() returns a list of alerts."""
    service = PharmacyService()
    alerts = await service.get_inventory_alerts()

    assert isinstance(alerts, list)
    for alert in alerts:
        assert alert.alert_type in ["LOW_STOCK", "NEAR_EXPIRY"]


@pytest.mark.asyncio
async def test_list_equipment_returns_list(db_client: AsyncIOMotorClient):
    """EquipmentService returns a list of Equipment documents."""
    service = EquipmentService()
    equipment = await service.repository.get_multi()

    assert isinstance(equipment, list)
    for eq in equipment:
        assert isinstance(eq, Equipment)


@pytest.mark.asyncio
async def test_equipment_have_required_fields(db_client: AsyncIOMotorClient):
    """All equipment documents should have name, serial_number, and operational_status."""
    service = EquipmentService()
    equipment = await service.repository.get_multi(limit=10)

    for eq in equipment:
        assert eq.name
        assert eq.serial_number
        assert eq.operational_status


@pytest.mark.asyncio
async def test_get_maintenance_due_returns_list(db_client: AsyncIOMotorClient):
    """EquipmentService.get_maintenance_due() returns a list of Equipment."""
    service = EquipmentService()
    due = await service.get_maintenance_due()

    assert isinstance(due, list)
    for eq in due:
        assert isinstance(eq, Equipment)
