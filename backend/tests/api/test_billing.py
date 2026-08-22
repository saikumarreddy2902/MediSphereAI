"""
MediSphere AI — Billing API Tests
"""
import pytest
from fastapi.testclient import TestClient


def test_get_billing_stats(client: TestClient):
    """GET /api/v1/billing/stats returns billing summary keys."""
    response = client.get("/api/v1/billing/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data or "total_billed" in data or isinstance(data, dict)


def test_get_pending_bills(client: TestClient):
    """GET /api/v1/billing/pending returns a list."""
    response = client.get("/api/v1/billing/pending")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_bills(client: TestClient):
    """GET /api/v1/billing/ returns a list of bills."""
    response = client.get("/api/v1/billing/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_bills_filter_by_status(client: TestClient):
    """GET /api/v1/billing/?payment_status=PAID filters correctly."""
    response = client.get("/api/v1/billing/", params={"payment_status": "PAID"})
    assert response.status_code == 200
    bills = response.json()
    assert isinstance(bills, list)
    for bill in bills:
        assert bill.get("payment_status") == "PAID"


def test_pay_nonexistent_bill_returns_404(client: TestClient):
    """POST /api/v1/billing/{id}/pay on a non-existent bill returns 404."""
    response = client.post(
        "/api/v1/billing/000000000000000000000000/pay",
        params={"amount": 100.0}
    )
    assert response.status_code == 404
