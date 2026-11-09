"""
MediSphere AI — Audit Log API Integration Tests
"""
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.api.deps import get_current_user

def _mock_admin_user():
    user = MagicMock()
    user.id = "usr-admin-01"
    user.username = "admin"
    user.role = "admin"
    user.roles = ["admin"]
    user.is_active = True
    user.is_superuser = True
    return user

def _mock_patient_user():
    user = MagicMock()
    user.id = "usr-patient-01"
    user.username = "patient_user"
    user.role = "patient"
    user.roles = ["patient"]
    user.is_active = True
    user.is_superuser = False
    return user

def test_audit_logs_admin_access(client: TestClient):
    """Admin users must be allowed to retrieve audit trail logs."""
    app.dependency_overrides[get_current_user] = _mock_admin_user
    try:
        response = client.get("/api/v1/audit/logs")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "total" in data
        assert len(data["logs"]) > 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_audit_logs_unauthorized_role_denied(client: TestClient):
    """Patient accounts must be blocked with 403 Forbidden when requesting audit logs."""
    app.dependency_overrides[get_current_user] = _mock_patient_user
    try:
        response = client.get("/api/v1/audit/logs")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_audit_summary_endpoint(client: TestClient):
    """Admin compliance dashboard summary metrics."""
    app.dependency_overrides[get_current_user] = _mock_admin_user
    try:
        response = client.get("/api/v1/audit/summary")
        assert response.status_code == 200
        data = response.json()
        assert "compliance_status" in data
        assert "total_events_today" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_record_audit_event(client: TestClient):
    """Recording an immutable security event."""
    app.dependency_overrides[get_current_user] = _mock_admin_user
    try:
        payload = {
            "action": "VIEW",
            "resource": "patient_file",
            "resource_id": "P-0041",
            "outcome": "SUCCESS",
            "detail": "Test record access event"
        }
        response = client.post("/api/v1/audit/log", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] in ["recorded", "recorded_in_memory"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_audit_csv_export(client: TestClient):
    """Exporting audit logs as CSV."""
    app.dependency_overrides[get_current_user] = _mock_admin_user
    try:
        response = client.get("/api/v1/audit/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        assert "ID,Timestamp,User" in response.text
    finally:
        app.dependency_overrides.pop(get_current_user, None)
