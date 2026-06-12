from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    from api.main import app
    return TestClient(app)


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_openapi_schema_loads(client):
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    schema = resp.json()
    assert "paths" in schema
    # Verify all expected routes exist
    paths = schema["paths"]
    assert "/health" in paths
    assert "/api/quote/{ticker}" in paths
    assert "/api/fundamentals/{ticker}" in paths
    assert "/api/batch/quotes" in paths
    assert "/api/batch/fundamentals" in paths
    assert "/api/fii/{ticker}" in paths
    assert "/api/cdi" in paths
    assert "/api/exchange/{pair}" in paths
    assert "/api/portfolio/history" in paths


def test_all_routers_registered(client):
    """Verify all routers are included in main app."""
    from api.main import app
    route_paths = {r.path for r in app.routes}
    assert "/health" in route_paths
    assert "/api/quote/{ticker}" in route_paths
    assert "/api/fii/{ticker}" in route_paths
    assert "/api/cdi" in route_paths
    assert "/api/portfolio/history" in route_paths
