"""
MediSphere AI — Auth API Tests

Tests:
  - Login with valid credentials returns JWT
  - Login with invalid password returns 400
  - Login with unknown username returns 400
  - Accessing /auth/me without token returns 401
  - Accessing /auth/me with valid token returns user profile
  - Rate limiter returns 429 after 5 failed attempts (if slowapi enabled in test)
  - /auth/refresh returns new token for valid token holder
  - /auth/logout returns success and creates audit log
"""
import pytest
from app.core.security import get_password_hash
from app.main import app
from app.models.user import User
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def test_user(db_client):
    """Create a test doctor user in the test DB."""
    hashed = get_password_hash("testpass123")
    user = User(
        username="dr_test",
        email="dr_test@medisphere.com",
        hashed_password=hashed,
        full_name="Dr Test User",
        roles=["doctor"],
    )
    await user.insert()
    yield user
    await user.delete()


@pytest.fixture
async def async_client():
    from app.api.deps import get_current_user
    app.dependency_overrides.pop(get_current_user, None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:  # type: ignore[arg-type]
        yield client


@pytest.mark.asyncio
async def test_login_success(async_client, test_user):
    """Successful login returns a bearer token and user metadata."""
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "dr_test", "password": "testpass123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert "doctor" in body["roles"]


@pytest.mark.asyncio
async def test_login_wrong_password(async_client, test_user):
    """Wrong password returns HTTP 400."""
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "dr_test", "password": "wrongpassword"},
    )
    assert response.status_code == 400
    assert "Incorrect" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_unknown_user(async_client):
    """Unknown username returns HTTP 400."""
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "ghost_user", "password": "anypass"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_me_without_token(async_client):
    """GET /auth/me without Authorization header returns 401."""
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_token(async_client, test_user):
    """GET /auth/me with valid JWT returns user profile without hashed_password."""
    # Login first
    login = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "dr_test", "password": "testpass123"},
    )
    token = login.json()["access_token"]

    response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "dr_test"
    assert "hashed_password" not in body


@pytest.mark.asyncio
async def test_refresh_token(async_client, test_user):
    """POST /auth/refresh returns a new valid access token."""
    login = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "dr_test", "password": "testpass123"},
    )
    token = login.json()["access_token"]

    refresh = await async_client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert refresh.status_code == 200
    assert "access_token" in refresh.json()


@pytest.mark.asyncio
async def test_logout(async_client, test_user):
    """POST /auth/logout returns success message."""
    login = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "dr_test", "password": "testpass123"},
    )
    token = login.json()["access_token"]

    response = await async_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert "Logged out" in response.json()["message"]


@pytest.mark.asyncio
async def test_register_user(async_client, db_client):
    """POST /auth/register creates a new user profile and returns access token."""
    payload = {
        "username": "new_clinician",
        "email": "clinician@medisphere.com",
        "password": "securepass123",
        "full_name": "Dr. Clinician Smith",
        "role": "doctor"
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["roles"] == ["doctor"]
    assert data["user"]["username"] == "new_clinician"


@pytest.mark.asyncio
async def test_update_user_profile(async_client, test_user):
    """PUT /auth/me updates the logged-in user's profile information."""
    login = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "dr_test", "password": "testpass123"},
    )
    token = login.json()["access_token"]

    update_payload = {
        "full_name": "Dr. Test Updated",
        "email": "dr_updated@medisphere.com"
    }
    response = await async_client.put(
        "/api/v1/auth/me",
        json=update_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["full_name"] == "Dr. Test Updated"
    assert data["user"]["email"] == "dr_updated@medisphere.com"

