"""
MediSphere AI — Pytest Configuration

Uses mongomock-motor for fully offline, self-contained unit tests.
No external MongoDB Atlas connection required — tests run in CI without network access.
"""
import os
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "ci-test-secret-key-32chars-minimum-enterprise")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017")
os.environ.setdefault("DATABASE_NAME", "medisphere_test_db")

import asyncio
import os
import sys
from collections.abc import AsyncGenerator, Generator
from contextlib import asynccontextmanager
from unittest.mock import MagicMock, patch

# Prevent heavy ML/PyTorch model downloads during unit tests
if "sentence_transformers" not in sys.modules:
    mock_st = MagicMock()
    mock_st.SentenceTransformer = MagicMock()
    sys.modules["sentence_transformers"] = mock_st

import mongomock_motor
try:
    from mongomock.database import Database as MockDatabase
    _orig_lcn = MockDatabase.list_collection_names
    def _patched_lcn(self, *args, **kwargs):
        kwargs.pop("authorizedCollections", None)
        kwargs.pop("nameOnly", None)
        return _orig_lcn(self, *args, **kwargs)
    MockDatabase.list_collection_names = _patched_lcn
except Exception:
    pass

try:
    from app.core.vector_store import vector_store
    vector_store.is_active = False
    from app.agents.base_agent import BaseAgent
    async def _mock_query_llm_rag(self, current_data):
        raise ConnectionError("Ollama offline in unit test mode")
    BaseAgent.query_llm_rag = _mock_query_llm_rag
except Exception:
    pass

import pytest
from app.models.audit import AuditLog
from app.models.finance import Bill, InsuranceClaim
from app.models.hospital import Department, Doctor, Patient
from app.models.laboratory import LabOrder
from app.models.medical_record import MedicalRecord
from app.models.notification import Notification
from app.models.operations import Appointment, Bed, EmergencyCase
from app.models.prescription import Prescription
from app.models.resources import Equipment, Medicine, MedicineInventory
from app.models.user import Permission, Role, User
from beanie import init_beanie
from fastapi.testclient import TestClient

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
async def db_client() -> AsyncGenerator:
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


@asynccontextmanager
async def noop_lifespan(app):
    yield

try:
    from app.main import app as fastapi_app
    fastapi_app.router.lifespan_context = noop_lifespan
except Exception:
    pass

@pytest.fixture(scope="function")
def client() -> Generator[TestClient]:
    """
    Provides a FastAPI sync test client.
    Note: For async endpoint tests, use httpx.AsyncClient with db_client fixture instead.
    """
    # Patch MongoDB connection to use in-memory mock during app startup
    with patch("app.database.connection.connect_to_mongo", return_value=None), \
         patch("app.core.cache.cache.connect", return_value=None), \
         patch("app.agents.orchestrator.AgentOrchestrator.start", return_value=None):
        from app.api.deps import get_current_user
        from app.main import app

        mock_mongo = mongomock_motor.AsyncMongoMockClient()
        init_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(init_loop)
        init_loop.run_until_complete(
            init_beanie(
                database=mock_mongo["medisphere_test_db"],
                document_models=TEST_DOCUMENT_MODELS,
            )
        )

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
        init_loop.close()
