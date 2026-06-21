from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    from api.main import app
    return TestClient(app)


@pytest.fixture
def sample_quote():
    from api.models import StockQuote, NetIncomeEntry
    return StockQuote(
        ticker="PETR4",
        name="Petrobras",
        price=38.5,
        changePercent=-0.02,
        netIncomeHistory=[NetIncomeEntry(year=2023, netIncome=1e10)],
    )


@pytest.fixture
def sample_fundamentals():
    from api.models import FundamentalsData
    return FundamentalsData(
        ticker="PETR4",
        name="Petrobras",
        price=38.5,
        pl=5.2,
        roe=0.25,
    )


def test_quote_returns_200(client, sample_quote):
    with patch("api.routers.stocks.get_stock_quote", return_value=sample_quote):
        resp = client.get("/api/quote/PETR4")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ticker"] == "PETR4"
    assert data["price"] == 38.5


def test_quote_not_found_returns_404(client):
    with patch("api.routers.stocks.get_stock_quote", side_effect=ValueError("NOT_FOUND")):
        resp = client.get("/api/quote/INVALID")
    assert resp.status_code == 404
    assert resp.json()["detail"]["code"] == "NOT_FOUND"


def test_quote_no_yfinance_returns_503(client):
    with patch("api.routers.stocks.get_stock_quote", side_effect=ImportError("NO_YFINANCE")):
        resp = client.get("/api/quote/PETR4")
    assert resp.status_code == 503
    assert resp.json()["detail"]["code"] == "NO_YFINANCE"


def test_fundamentals_returns_200(client, sample_fundamentals):
    with patch("api.routers.stocks.get_fundamentals", return_value=sample_fundamentals):
        resp = client.get("/api/fundamentals/PETR4")
    assert resp.status_code == 200
    assert resp.json()["ticker"] == "PETR4"


def test_fundamentals_not_found_returns_404(client):
    with patch("api.routers.stocks.get_fundamentals", side_effect=ValueError("NOT_FOUND")):
        resp = client.get("/api/fundamentals/MISSING")
    assert resp.status_code == 404


def test_batch_quotes_returns_list(client, sample_quote):
    with patch("api.routers.stocks.get_stock_quote", return_value=sample_quote):
        resp = client.get("/api/batch/quotes?tickers=PETR4,VALE3")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_batch_quotes_empty_tickers(client):
    resp = client.get("/api/batch/quotes?tickers=")
    assert resp.status_code == 200
    assert resp.json() == []


def test_batch_quotes_skips_errors(client, sample_quote):
    def side_effect(ticker):
        if ticker == "PETR4":
            return sample_quote
        raise ValueError("NOT_FOUND")

    with patch("api.routers.stocks.get_stock_quote", side_effect=side_effect):
        resp = client.get("/api/batch/quotes?tickers=PETR4,INVALID")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_batch_fundamentals_returns_list(client, sample_fundamentals):
    with patch("api.routers.stocks.get_fundamentals", return_value=sample_fundamentals):
        resp = client.get("/api/batch/fundamentals?tickers=PETR4")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_health_still_works(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_dividends_returns_200(client):
    from api.models import DividendEntry

    sample = [
        DividendEntry(date="2024-01-12", amount=0.7),
        DividendEntry(date="2023-07-15", amount=0.6),
    ]
    with patch("api.routers.stocks.get_dividend_history", return_value=sample):
        resp = client.get("/api/dividends/WEGE3")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["date"] == "2024-01-12"
    assert data[0]["amount"] == pytest.approx(0.7)


def test_dividends_empty_returns_200_empty_list(client):
    with patch("api.routers.stocks.get_dividend_history", return_value=[]):
        resp = client.get("/api/dividends/WEGE3")
    assert resp.status_code == 200
    assert resp.json() == []


def test_dividends_no_yfinance_returns_503(client):
    with patch("api.routers.stocks.get_dividend_history", side_effect=ImportError("NO_YFINANCE")):
        resp = client.get("/api/dividends/WEGE3")
    assert resp.status_code == 503
    assert resp.json()["detail"]["code"] == "NO_YFINANCE"
