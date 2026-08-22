"""
MediSphere AI — Health Endpoint Tests
"""
from fastapi.testclient import TestClient

def test_health_endpoint(client: TestClient):
    """Test the load balancer health check."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] in ["ok", "healthy"]

def test_liveness_probe(client: TestClient):
    """Test the Kubernetes liveness probe."""
    response = client.get("/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}

def test_readiness_probe(client: TestClient):
    """Test the Kubernetes readiness probe."""
    response = client.get("/ready")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    # Can be 'ready' or 'not_ready' depending on if the DB is booted,
    # but it shouldn't 500 error.
    assert data["status"] in ["ready", "not_ready"]
