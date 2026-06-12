from __future__ import annotations
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def app():
    from api.main import app as fastapi_app
    return fastapi_app


@pytest.fixture(scope="session")
def client(app):
    return TestClient(app)
