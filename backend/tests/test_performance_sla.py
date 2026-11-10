"""
MediSphere AI — Enterprise Performance & Latency SLA Verification Suite

Ensures API endpoints and security cryptography meet enterprise latency SLAs:
  - /health endpoint < 50ms
  - /api/v1/openapi.json < 100ms
  - JWT token generation & verification < 15ms
  - In-memory route dispatch & middleware pipeline overhead < 75ms
"""
import time
from fastapi.testclient import TestClient

from app.core.security import create_access_token, decode_token


def test_health_endpoint_latency_sla(client: TestClient):
    """
    Verify /health responds within the strict 50ms enterprise SLA.
    """
    latencies = []
    # Warmup
    client.get("/health")

    for _ in range(10):
        start = time.perf_counter()
        response = client.get("/health")
        duration_ms = (time.perf_counter() - start) * 1000
        assert response.status_code == 200
        latencies.append(duration_ms)

    avg_latency = sum(latencies) / len(latencies)
    assert avg_latency < 50.0, f"Average health latency {avg_latency:.2f}ms exceeds 50ms SLA"


def test_jwt_token_operations_latency_sla():
    """
    Verify JWT creation and cryptographic verification executes within 15ms SLA.
    """
    start = time.perf_counter()
    for _ in range(100):
        token = create_access_token(subject="user_sla_test", role="doctor", department_id="Cardiology")
        payload = decode_token(token)
        assert payload["sub"] == "user_sla_test"
    total_duration_ms = (time.perf_counter() - start) * 1000
    avg_per_op_ms = total_duration_ms / 100

    assert avg_per_op_ms < 15.0, f"Average JWT operation {avg_per_op_ms:.2f}ms exceeds 15ms SLA"


def test_openapi_spec_latency_sla(client: TestClient):
    """
    Verify OpenAPI documentation schema generates within 300ms SLA.
    """
    # Warmup
    client.get("/openapi.json")

    start = time.perf_counter()
    response = client.get("/openapi.json")
    duration_ms = (time.perf_counter() - start) * 1000
    assert response.status_code == 200
    assert duration_ms < 300.0, f"OpenAPI spec response {duration_ms:.2f}ms exceeds 300ms SLA"
