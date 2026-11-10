"""
MediSphere AI — Emergency API Tests
"""
from fastapi.testclient import TestClient


def test_get_emergency_cases_endpoint(client: TestClient):
    """Test getting active emergency cases."""
    response = client.get("/api/v1/emergency/")
    assert response.status_code in [200, 401]
