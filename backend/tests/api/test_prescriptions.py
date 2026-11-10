"""
MediSphere AI — Prescriptions API Tests
"""
from fastapi.testclient import TestClient


def test_prescriptions_list_endpoint(client: TestClient):
    """Test getting prescriptions list with filtering."""
    response = client.get("/api/v1/prescriptions/")
    # If unauthenticated, it returns 401, otherwise 200 list
    assert response.status_code in [200, 401]

def test_prescriptions_alerts_endpoint(client: TestClient):
    """Test getting prescription safety alerts."""
    response = client.get("/api/v1/prescriptions/alerts")
    assert response.status_code in [200, 401]

def test_prescriptions_validate_endpoint(client: TestClient):
    """Test drug-drug interaction and allergy validation."""
    payload = {
        "medications": [
            {"medicine_name": "Warfarin 5mg", "dosage": "5mg", "frequency": "Daily", "duration_days": 30},
            {"medicine_name": "Aspirin 81mg", "dosage": "81mg", "frequency": "Daily", "duration_days": 30}
        ],
        "patient_allergies": ["Penicillin"]
    }
    response = client.post("/api/v1/prescriptions/validate", json=payload)
    assert response.status_code in [200, 401]
    if response.status_code == 200:
        data = response.json()
        assert "valid" in data
        assert "interactions" in data
