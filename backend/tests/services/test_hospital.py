"""
MediSphere AI — Services Tests
"""

import pytest
from app.services.hospital import PatientService


@pytest.mark.asyncio
async def test_patient_service_registration(db_client):
    """Test PatientService register logic"""
    service = PatientService()
    
    # 1. Register a new patient
    new_patient_data = {
        "first_name": "Test",
        "last_name": "Patient",
        "date_of_birth": "1990-01-01",
        "gender": "MALE",
        "contact_number": "+15550000000",
        "address": "123 Test St",
        "blood_group": "O+"
    }
    
    patient = await service.register_patient(new_patient_data)
    
    assert patient is not None
    assert patient.first_name == "Test"
    assert patient.version == 1
    
    # 2. Duplicate registration should raise a 400 Bad Request
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as excinfo:
        await service.register_patient(new_patient_data)
        
    assert excinfo.value.status_code == 400
    assert "already exists" in str(excinfo.value.detail)

    # 3. Clean up
    await service.delete(patient.id)
