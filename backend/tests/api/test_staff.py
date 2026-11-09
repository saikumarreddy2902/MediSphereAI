"""
MediSphere AI — Staff API Tests
"""
import pytest
from fastapi.testclient import TestClient

def test_get_staff_list_endpoint(client: TestClient):
    """Test getting staff roster list."""
    response = client.get("/api/v1/staff/")
    assert response.status_code in [200, 401]

def test_get_staff_roster_summary(client: TestClient):
    """Test getting staff roster summary."""
    response = client.get("/api/v1/staff/roster/summary")
    assert response.status_code in [200, 401]
