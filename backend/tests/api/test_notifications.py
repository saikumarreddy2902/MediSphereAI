"""
MediSphere AI — Notifications API Tests
"""
import pytest
from fastapi.testclient import TestClient

def test_get_notifications_endpoint(client: TestClient):
    """Test getting notification list."""
    response = client.get("/api/v1/notifications/")
    assert response.status_code in [200, 401]

def test_mark_all_notifications_read(client: TestClient):
    """Test marking all notifications as read."""
    response = client.post("/api/v1/notifications/mark-all-read")
    assert response.status_code in [200, 401]
