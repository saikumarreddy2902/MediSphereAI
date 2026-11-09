"""
MediSphere AI — Vitals Telemetry API Integration Tests
"""
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.api.deps import get_current_user

def _mock_nurse_user():
    user = MagicMock()
    user.id = "usr-nurse-01"
    user.username = "nurse_sarah"
    user.role = "nurse"
    user.roles = ["nurse"]
    user.is_active = True
    user.is_superuser = False
    return user

def test_get_all_vitals_telemetry(client: TestClient):
    """Retrieving real-time monitored ward patients telemetry."""
    app.dependency_overrides[get_current_user] = _mock_nurse_user
    try:
        response = client.get("/api/v1/vitals")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["count"] > 0
        first = data["data"][0]
        assert "current" in first
        assert "heart_rate" in first["current"]
        assert "spo2" in first["current"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_get_patient_vitals_history(client: TestClient):
    """Retrieving trend history points for a specific patient."""
    app.dependency_overrides[get_current_user] = _mock_nurse_user
    try:
        response = client.get("/api/v1/vitals/P-001?points=10")
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        assert len(data["history"]) == 10
        assert "thresholds" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_record_patient_vitals(client: TestClient):
    """Nurse records check-in vital signs with threshold alerting."""
    app.dependency_overrides[get_current_user] = _mock_nurse_user
    try:
        payload = {
            "heart_rate": 138,
            "systolic": 165,
            "diastolic": 102,
            "spo2": 91,
            "temperature": 39.1,
            "respiratory_rate": 26,
            "notes": "Patient experiencing high fever and tachycardia"
        }
        response = client.post("/api/v1/vitals/P-001", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "recorded"
        assert data["critical_alert"] is True
        assert len(data["alerts_triggered"]) > 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_active_vitals_alarms(client: TestClient):
    """Querying all active clinical threshold alarms."""
    app.dependency_overrides[get_current_user] = _mock_nurse_user
    try:
        response = client.get("/api/v1/vitals/alerts/active")
        assert response.status_code == 200
        data = response.json()
        assert "active_alarm_count" in data
        assert "alarms" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)
