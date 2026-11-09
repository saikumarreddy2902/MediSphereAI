"""
MediSphere AI — Pytest Configuration

Uses mongomock-motor for fully offline, self-contained unit tests.
No external MongoDB Atlas connection required — tests run in CI without network access.
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import patch
from fastapi.testclient import TestClient

import mongomock_motor
from beanie import init_beanie

from app.models.user import User, Role, Permission
from app.models.hospital import Patient, Doctor, Department
from app.models.operations import Appointment, Bed, EmergencyCase
from app.models.resources import Medicine, MedicineInventory, Equipment
from app.models.finance import Bill, InsuranceClaim
from app.models.laboratory import LabOrder
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.notification import Notification
from app.models.audit import AuditLog

# All Beanie document models to register in the test database
TEST_DOCUMENT_MODELS = [
    User, Role, Permission,
    Patient, Doctor, Department,
    Appointment, Bed, EmergencyCase,
    Medicine, MedicineInventory, Equipment,
    Bill, InsuranceClaim, LabOrder,
    MedicalRecord, Prescription, Notification, AuditLog,
]


@pytest.fixture(scope="function")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_client(event_loop) -> AsyncGenerator:
    """
    Provides a fully in-memory MongoDB client using mongomock-motor.
    No real Atlas connection needed — works fully offline in CI.
    """
    client = mongomock_motor.AsyncMongoMockClient()
    await init_beanie(
        database=client["medisphere_test_db"],
        document_models=TEST_DOCUMENT_MODELS,
    )
    yield client
    # No explicit teardown needed — in-memory client is discarded automatically


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """
    Provides a FastAPI sync test client.
    Note: For async endpoint tests, use httpx.AsyncClient with db_client fixture instead.
    """
    # Patch MongoDB connection to use in-memory mock during app startup
    with patch("app.database.connection.connect_to_mongo", return_value=None), \
         patch("app.core.cache.cache.connect", return_value=None), \
         patch("app.agents.orchestrator.AgentOrchestrator.start", return_value=None):
        from app.main import app
        from app.api.deps import get_current_user

        mock_mongo = mongomock_motor.AsyncMongoMockClient()
        init_loop = asyncio.new_event_loop()
        init_loop.run_until_complete(
            init_beanie(
                database=mock_mongo["medisphere_test_db"],
                document_models=TEST_DOCUMENT_MODELS,
            )
        )
        init_loop.close()

        mock_user = User(
            username="test_clinician",
            email="clinician@medisphere.com",
            hashed_password="mock_hashed_password",
            full_name="Dr. Test Clinician",
            roles=["admin", "doctor", "nurse", "billing", "pharmacist"],
            is_superuser=True,
            is_active=True,
        )
        app.dependency_overrides[get_current_user] = lambda: mock_user
        with TestClient(app) as c:
            yield c
        app.dependency_overrides.pop(get_current_user, None)
