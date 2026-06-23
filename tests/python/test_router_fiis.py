from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


@pytest.fixture
def client():
    from api.main import app
    return TestClient(app)


@pytest.fixture
def sample_fii():
    from api.models import FIIData, DividendEntry
    return FIIData(
        ticker="HGLG11",
        name="CSHG Logística",
        price=165.0,
        dy=0.09,
        pvp=0.95,
        dpa=14.85,
        segmento="Logística",
        ffoYield=0.10,
        vacancia=0.03,
        numImoveis=28,
        dividends=[DividendEntry(date="2024-01-15", amount=1.24)],
    )


def test_fii_returns_200(client, sample_fii):
    with patch("api.routers.fiis.get_fii", return_value=sample_fii):
        resp = client.get("/api/fii/HGLG11")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ticker"] == "HGLG11"
    assert data["segmento"] == "Logística"


def test_fii_not_found_returns_404(client):
    with patch("api.routers.fiis.get_fii", side_effect=ValueError("NOT_FOUND")):
        resp = client.get("/api/fii/INVALID")
    assert resp.status_code == 404
    assert resp.json()["detail"]["code"] == "NOT_FOUND"


def test_fii_no_yfinance_returns_503(client):
    with patch("api.routers.fiis.get_fii", side_effect=ImportError("NO_YFINANCE")):
        resp = client.get("/api/fii/HGLG11")
    assert resp.status_code == 503
    assert resp.json()["detail"]["code"] == "NO_YFINANCE"


def test_fii_includes_dividends(client, sample_fii):
    with patch("api.routers.fiis.get_fii", return_value=sample_fii):
        resp = client.get("/api/fii/HGLG11")
    data = resp.json()
    assert isinstance(data["dividends"], list)
    assert data["dividends"][0]["amount"] == 1.24


def test_fii_nullable_fields(client):
    from api.models import FIIData
    minimal_fii = FIIData(ticker="XPTO11", price=50.0)
    with patch("api.routers.fiis.get_fii", return_value=minimal_fii):
        resp = client.get("/api/fii/XPTO11")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ffoYield"] is None
    assert data["segmento"] is None


def test_batch_fii_returns_list(client, sample_fii):
    with patch("api.routers.fiis.get_fii", return_value=sample_fii):
        resp = client.get("/api/batch/fii?tickers=HGLG11,MXRF11")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_batch_fii_empty_tickers(client):
    resp = client.get("/api/batch/fii?tickers=")
    assert resp.status_code == 200
    assert resp.json() == []


def test_batch_fii_skips_errors(client, sample_fii):
    def side_effect(ticker):
        if ticker == "HGLG11":
            return sample_fii
        raise ValueError("NOT_FOUND")

    with patch("api.routers.fiis.get_fii", side_effect=side_effect):
        resp = client.get("/api/batch/fii?tickers=HGLG11,INVALID")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
