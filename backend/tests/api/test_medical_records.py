"""
MediSphere AI — Medical Records API Tests
"""
from fastapi.testclient import TestClient


def test_patient_medical_records_endpoint(client: TestClient):
    """Test getting medical records for a patient."""
    fake_patient_id = "650000000000000000000001"
    response = client.get(f"/api/v1/patients/{fake_patient_id}/records")
    assert response.status_code in [200, 401, 404]

def test_medical_record_create_endpoint(client: TestClient):
    """Test creating a new clinical medical record."""
    fake_patient_id = "650000000000000000000001"
    payload = {
        "record_type": "DIAGNOSIS",
        "title": "Type 2 Diabetes Mellitus",
        "description": "Patient presents with elevated fasting blood glucose.",
        "icd_code": "E11.9",
        "severity": "MODERATE",
        "date_of_record": "2026-10-05T00:00:00Z"
    }
    response = client.post(f"/api/v1/patients/{fake_patient_id}/records", json=payload)
    assert response.status_code in [201, 401, 404]
