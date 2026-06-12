import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.responses import JSONResponse

from api.middleware import RateLimitMiddleware, RATE_LIMIT_REQUESTS, _rate_windows


@pytest.fixture
def app_with_limiter():
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware)

    @app.get("/api/data")
    async def data():
        return {"ok": True}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


@pytest.fixture(autouse=True)
def clear_rate_windows():
    _rate_windows.clear()
    yield
    _rate_windows.clear()


def test_requests_within_limit_pass(app_with_limiter):
    client = TestClient(app_with_limiter)
    for _ in range(RATE_LIMIT_REQUESTS):
        resp = client.get("/api/data")
        assert resp.status_code == 200


def test_request_over_limit_returns_429(app_with_limiter):
    client = TestClient(app_with_limiter)
    for _ in range(RATE_LIMIT_REQUESTS):
        client.get("/api/data")
    resp = client.get("/api/data")
    assert resp.status_code == 429
    assert resp.json()["error"] == "rate_limit_exceeded"
    assert resp.json()["retry_after"] == 60


def test_non_api_path_not_rate_limited(app_with_limiter):
    client = TestClient(app_with_limiter)
    # Exhaust the API limit
    for _ in range(RATE_LIMIT_REQUESTS + 5):
        client.get("/api/data")
    # Non-API path should still work
    resp = client.get("/health")
    assert resp.status_code == 200


def test_rate_limit_error_shape(app_with_limiter):
    client = TestClient(app_with_limiter)
    for _ in range(RATE_LIMIT_REQUESTS + 1):
        resp = client.get("/api/data")
    assert resp.status_code == 429
    body = resp.json()
    assert "error" in body
    assert "retry_after" in body
