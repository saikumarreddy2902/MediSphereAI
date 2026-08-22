"""
MediSphere AI — Laboratory API Tests
"""
import pytest
from fastapi.testclient import TestClient


def test_get_lab_stats(client: TestClient):
    """GET /api/v1/laboratory/stats returns performance metrics."""
    response = client.get("/api/v1/laboratory/stats")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_list_lab_orders(client: TestClient):
    """GET /api/v1/laboratory/orders returns paginated orders."""
    response = client.get("/api/v1/laboratory/orders")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "orders" in data
    assert isinstance(data["orders"], list)


def test_filter_orders_by_status(client: TestClient):
    """GET /api/v1/laboratory/orders?status=ordered filters by status."""
    response = client.get("/api/v1/laboratory/orders", params={"status": "ordered"})
    assert response.status_code == 200
    data = response.json()
    assert "orders" in data


def test_get_critical_orders(client: TestClient):
    """GET /api/v1/laboratory/critical returns critical pending orders."""
    response = client.get("/api/v1/laboratory/critical")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_test_catalog(client: TestClient):
    """GET /api/v1/laboratory/tests returns test catalog."""
    response = client.get("/api/v1/laboratory/tests")
    assert response.status_code == 200
    data = response.json()
    assert "tests" in data
    assert isinstance(data["tests"], list)
    assert len(data["tests"]) > 0
