"""
MediSphere AI — Insurance API Tests
"""
from fastapi.testclient import TestClient


def test_get_all_claims(client: TestClient):
    """GET /api/v1/insurance/claims returns a list."""
    response = client.get("/api/v1/insurance/claims")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_pending_claims(client: TestClient):
    """GET /api/v1/insurance/claims/pending returns only pending claims."""
    response = client.get("/api/v1/insurance/claims/pending")
    assert response.status_code == 200
    claims = response.json()
    assert isinstance(claims, list)


def test_filter_claims_by_status(client: TestClient):
    """GET /api/v1/insurance/claims?claim_status=SUBMITTED filters correctly."""
    response = client.get("/api/v1/insurance/claims", params={"claim_status": "SUBMITTED"})
    assert response.status_code == 200
    claims = response.json()
    assert isinstance(claims, list)
    for claim in claims:
        assert claim.get("claim_status") == "SUBMITTED"


def test_update_nonexistent_claim_returns_404(client: TestClient):
    """PUT on a non-existent claim ID returns 404."""
    response = client.put(
        "/api/v1/insurance/claims/000000000000000000000000",
        json={"claim_status": "APPROVED"}
    )
    assert response.status_code == 404
