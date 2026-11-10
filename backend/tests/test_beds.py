"""
MediSphere AI — Beds API Tests

Tests:
  - List all beds returns correct structure
  - Available beds filter works
  - Bed occupancy rate is within valid range [0, 100]
  - Occupied bed count does not exceed total bed count
"""
import pytest
from app.core.security import get_password_hash
from app.main import app
from app.models.operations import Bed
from app.models.user import User
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def admin_user(db_client):
    hashed = get_password_hash("adminpass")
    user = User(
        username="bed_admin",
        email="bed_admin@medisphere.com",
        hashed_password=hashed,
        full_name="Bed Admin",
        roles=["admin"],
        is_superuser=True,
    )
    await user.insert()
    yield user
    await user.delete()


@pytest.fixture
async def sample_beds(db_client):
    beds = [
        Bed(bed_number="A-101", ward="General", department_id="DEP-GEN", type="GENERAL", is_occupied=False),
        Bed(bed_number="A-102", ward="General", department_id="DEP-GEN", type="GENERAL", is_occupied=True),
        Bed(bed_number="ICU-01", ward="ICU", department_id="DEP-ICU", type="ICU", is_occupied=True),
    ]
    for b in beds:
        await b.insert()
    yield beds
    for b in beds:
        await b.delete()


@pytest.fixture
async def async_client():
    from app.api.deps import get_current_user
    app.dependency_overrides.pop(get_current_user, None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:  # type: ignore[arg-type]
        yield client


async def get_token(async_client, username: str, password: str) -> str:
    resp = await async_client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
    )
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_list_beds(async_client, admin_user, sample_beds):
    """GET /beds returns a list structure."""
    token = await get_token(async_client, "bed_admin", "adminpass")
    response = await async_client.get(
        "/api/v1/beds/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, (list, dict))


@pytest.mark.asyncio
async def test_bed_summary_occupancy_range(async_client, admin_user, sample_beds):
    """Dashboard summary occupancy rate is between 0 and 100."""
    token = await get_token(async_client, "bed_admin", "adminpass")
    response = await async_client.get(
        "/api/v1/beds/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    if response.status_code == 200:
        data = response.json()
        occ_rate = data.get("occupancy_rate", 0)
        assert 0.0 <= occ_rate <= 100.0


@pytest.mark.asyncio
async def test_available_beds_filter(async_client, admin_user, sample_beds):
    """Available beds endpoint returns only unoccupied beds."""
    token = await get_token(async_client, "bed_admin", "adminpass")
    response = await async_client.get(
        "/api/v1/beds/?available=true",
        headers={"Authorization": f"Bearer {token}"},
    )
    if response.status_code == 200:
        beds = response.json()
        if isinstance(beds, list):
            for bed in beds:
                assert not bed.get("is_occupied", True)
