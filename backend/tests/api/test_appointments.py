"""
MediSphere AI — Appointments API Tests
"""
from fastapi.testclient import TestClient


def test_get_appointments_endpoint(client: TestClient):
    """Test getting appointments list."""
    response = client.get("/api/v1/appointments/")
    assert response.status_code == 200
    data = response.json()
    assert "appointments" in data
    assert "total" in data

def test_patient_lookup_endpoint(client: TestClient):
    """Test looking up patient by Hospital MR Number."""
    response = client.get("/api/v1/appointments/patient-lookup/P-0041")
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == "P-0041"
    assert data["patient_name"] == "Rajesh Kumar"
    assert data["blood_group"] == "B+"

def test_doctors_availability_endpoint(client: TestClient):
    """Test getting doctor availability and free slots for a department."""
    response = client.get("/api/v1/appointments/doctors-availability?department=Cardiology")
    assert response.status_code == 200
    data = response.json()
    assert data["department"] == "Cardiology"
    assert len(data["doctors"]) > 0
    assert "free_slots_count" in data["doctors"][0]
    assert "available_slots" in data["doctors"][0]

def test_agent_book_appointment_endpoint(client: TestClient):
    """Test AI agent booking doctor with free time in their department."""
    payload = {
        "patient_id": "P-0041",
        "department": "Cardiology",
        "appointment_date": "2026-10-20",
        "time_window": "MORNING",
        "reason": "Chest tightness routine assessment",
        "appointment_type": "IN_PERSON"
    }
    response = client.post("/api/v1/appointments/agent-book", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == "P-0041"
    assert data["patient_name"] == "Rajesh Kumar"
    assert data["department"] == "Cardiology"
    assert data["doctor_name"] is not None
    assert "ai_agent_allocation_summary" in data
    assert "verified open slot" in data["ai_agent_allocation_summary"] or "Selected" in data["ai_agent_allocation_summary"]

def test_agent_book_multi_departments_endpoint(client: TestClient):
    """Test AI agent multi-department doctor allocation with sequenced free slots."""
    payload = {
        "patient_id": "P-0042",
        "departments": ["Neurology", "Orthopedics"],
        "appointment_date": "2026-10-21",
        "time_window": "ANY",
        "reason": "Comprehensive neuro and joint review"
    }
    response = client.post("/api/v1/appointments/agent-book-multi", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_booked"] == 2
    assert data["patient_id"] == "P-0042"
    assert len(data["appointments"]) == 2
    assert data["appointments"][0]["department"] == "Neurology"
    assert data["appointments"][1]["department"] == "Orthopedics"

