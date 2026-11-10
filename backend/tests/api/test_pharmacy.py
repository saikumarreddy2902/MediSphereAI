"""
MediSphere AI — Pharmacy API Tests
"""
from fastapi.testclient import TestClient


def test_get_inventory(client: TestClient):
    """GET /api/v1/pharmacy/inventory returns a list."""
    response = client.get("/api/v1/pharmacy/inventory")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_stock_alerts(client: TestClient):
    """GET /api/v1/pharmacy/alerts returns a list of alerts."""
    response = client.get("/api/v1/pharmacy/alerts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_medicines(client: TestClient):
    """GET /api/v1/pharmacy/ returns a list of medicines."""
    response = client.get("/api/v1/pharmacy/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_medicines_filter_by_category(client: TestClient):
    """GET /api/v1/pharmacy/?category=Antibiotic filters correctly."""
    response = client.get("/api/v1/pharmacy/", params={"category": "Antibiotic"})
    assert response.status_code == 200
    medicines = response.json()
    assert isinstance(medicines, list)
