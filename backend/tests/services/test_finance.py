"""
MediSphere AI — Finance Service Unit Tests
"""
import pytest
from app.models.finance import Bill, InsuranceClaim
from app.services.finance import BillingService, InsuranceService
from motor.motor_asyncio import AsyncIOMotorClient


@pytest.mark.asyncio
async def test_get_revenue_summary_returns_dict(db_client: AsyncIOMotorClient):
    """BillingService.get_revenue_summary() returns dict with revenue keys."""
    service = BillingService()
    result = await service.get_revenue_summary()

    assert isinstance(result, dict)
    assert "total_billed" in result
    assert "total_collected" in result
    assert "pending_amount" in result


@pytest.mark.asyncio
async def test_revenue_pending_equals_billed_minus_collected(db_client: AsyncIOMotorClient):
    """pending_amount should equal total_billed - total_collected."""
    service = BillingService()
    result = await service.get_revenue_summary()

    assert pytest.approx(result["pending_amount"], abs=0.01) == (
        result["total_billed"] - result["total_collected"]
    )


@pytest.mark.asyncio
async def test_get_pending_bills_returns_list(db_client: AsyncIOMotorClient):
    """BillingService.get_pending_bills() returns a list of Bill documents."""
    service = BillingService()
    bills = await service.get_pending_bills()

    assert isinstance(bills, list)
    for bill in bills:
        assert isinstance(bill, Bill)


@pytest.mark.asyncio
async def test_pending_bills_are_not_fully_paid(db_client: AsyncIOMotorClient):
    """All pending bills should have status PENDING or PARTIAL, not PAID."""
    service = BillingService()
    bills = await service.get_pending_bills()

    for bill in bills:
        assert bill.payment_status in ["PENDING", "PARTIAL"]


@pytest.mark.asyncio
async def test_get_pending_claims_returns_list(db_client: AsyncIOMotorClient):
    """InsuranceService.get_pending_claims() returns a list of InsuranceClaim documents."""
    service = InsuranceService()
    claims = await service.get_pending_claims()

    assert isinstance(claims, list)
    for claim in claims:
        assert isinstance(claim, InsuranceClaim)


@pytest.mark.asyncio
async def test_pending_claims_have_valid_status(db_client: AsyncIOMotorClient):
    """All pending claims should have status SUBMITTED or IN_REVIEW."""
    service = InsuranceService()
    claims = await service.get_pending_claims()

    for claim in claims:
        assert claim.claim_status in ["SUBMITTED", "IN_REVIEW"]
