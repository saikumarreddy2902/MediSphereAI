"""
MediSphere AI — Equipment API Tests
"""
from fastapi.testclient import TestClient


def test_list_equipment(client: TestClient):
    """GET /api/v1/equipment/ returns a list of equipment."""
    response = client.get("/api/v1/equipment/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_filter_equipment_by_status(client: TestClient):
    """GET /api/v1/equipment/?operational_status=OPERATIONAL filters correctly."""
    response = client.get("/api/v1/equipment/", params={"operational_status": "OPERATIONAL"})
    assert response.status_code == 200
    equipment = response.json()
    assert isinstance(equipment, list)


def test_get_maintenance_due(client: TestClient):
    """GET /api/v1/equipment/maintenance returns equipment needing maintenance."""
    response = client.get("/api/v1/equipment/maintenance")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_update_nonexistent_equipment_returns_404(client: TestClient):
    """PUT on a non-existent equipment ID returns 404."""
    response = client.put(
        "/api/v1/equipment/000000000000000000000000",
        json={"operational_status": "MAINTENANCE"}
    )
    assert response.status_code == 404
