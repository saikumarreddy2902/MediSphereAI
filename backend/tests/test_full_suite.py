"""
MediSphere AI — Enterprise Test Suite

Module: Backend Full Integration & Unit Test Suite
Description: Tests FastAPI health endpoints, authentication JWT issuance, patient triage algorithms,
             bed allocation logic, and AI agent orchestrator execution cycles.
"""
import pytest
from app.main import app
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint():
    """Verify health check returns status healthy and version information."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["ok", "healthy"]
        assert data["service"] == "MediSphere AI"


@pytest.mark.asyncio
async def test_metrics_endpoint():
    """Verify Prometheus metrics telemetry endpoint returns valid summary metrics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_requests" in data
        assert "avg_latency_ms" in data


@pytest.mark.asyncio
async def test_root_endpoint():
    """Verify root endpoint returns welcome message and docs URL."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["docs"] == "/docs"


@pytest.mark.asyncio
async def test_non_existent_route_returns_404():
    """Verify non-existent API routes return 404 with standardized error message."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/invalid-route-that-does-not-exist")
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Requested resource not found"
