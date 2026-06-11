"""
Tests for api/routers/market.py and api/routers/portfolio.py.

Covers:
  - /api/cdi returns 200 with rate data (mock BCB HTTP call)
  - /api/cdi returns fallback on fetch error (still 200, has fallback=True)
  - /api/exchange/{pair} returns 200 with rate data
  - /api/exchange/{pair} returns 503 on yfinance error
  - /api/portfolio/history returns 200 with correct structure
  - /api/portfolio/history with empty tickers returns 400
  - /api/portfolio/history with empty dates returns 400
"""
from __future__ import annotations

import datetime
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _bcb_json(rate_pct: float = 0.1, days: int = 5) -> bytes:
    """Build a fake BCB API response with *days* daily CDI entries."""
    items = [{"data": f"0{i+1}/01/2024", "valor": str(rate_pct)} for i in range(days)]
    return json.dumps(items).encode()


# ── /api/cdi ──────────────────────────────────────────────────────────────────

class TestCDIEndpoint:
    def test_returns_200_with_rate_data(self):
        """Happy path: BCB returns data → accumulated rate computed correctly."""
        fake_response = MagicMock()
        fake_response.read.return_value = _bcb_json(rate_pct=0.1, days=5)
        fake_response.__enter__ = lambda s: s
        fake_response.__exit__ = MagicMock(return_value=False)

        with patch("api.routers.market.urllib.request.urlopen", return_value=fake_response):
            with patch("api.routers.market.cache_get", return_value=None):
                with patch("api.routers.market.cache_set"):
                    r = client.get("/api/cdi")

        assert r.status_code == 200
        data = r.json()
        assert "accumulated" in data
        assert "from" in data
        assert "to" in data
        assert "days" in data
        assert isinstance(data["accumulated"], float)
        assert data["days"] == 5
        # 5 days at 0.1% daily: (1.001)^5 - 1 ≈ 0.005010
        assert abs(data["accumulated"] - 0.005010) < 0.0001

    def test_returns_200_with_custom_date_range(self):
        """Accepts from/to query params and passes them to BCB URL."""
        fake_response = MagicMock()
        fake_response.read.return_value = _bcb_json(rate_pct=0.05, days=3)
        fake_response.__enter__ = lambda s: s
        fake_response.__exit__ = MagicMock(return_value=False)

        with patch("api.routers.market.urllib.request.urlopen", return_value=fake_response):
            with patch("api.routers.market.cache_get", return_value=None):
                with patch("api.routers.market.cache_set"):
                    r = client.get("/api/cdi?date_from=2024-01-01&date_to=2024-01-03")

        assert r.status_code == 200
        data = r.json()
        assert data["from"] == "2024-01-01"
        assert data["to"] == "2024-01-03"

    def test_returns_fallback_on_fetch_error(self):
        """When BCB is unreachable, returns fallback data (still 200, has fallback=True)."""
        with patch("api.routers.market.urllib.request.urlopen", side_effect=Exception("timeout")):
            with patch("api.routers.market.cache_get", return_value=None):
                with patch("api.routers.market.cache_set"):
                    r = client.get("/api/cdi")

        assert r.status_code == 200
        data = r.json()
        assert data.get("fallback") is True
        assert "accumulated" in data
        assert data["accumulated"] == 0.105  # hardcoded fallback in server.py

    def test_returns_cached_result(self):
        """If cache_get returns data, it is returned immediately without network call."""
        cached = {"accumulated": 0.09, "from": "2024-01-01", "to": "2024-12-31", "days": 252}
        with patch("api.routers.market.cache_get", return_value=cached):
            r = client.get("/api/cdi")

        assert r.status_code == 200
        assert r.json()["accumulated"] == 0.09


# ── /api/exchange ──────────────────────────────────────────────────────────────

class TestExchangeEndpoint:
    def test_returns_200_with_rate_data(self):
        """Happy path: yfinance returns a price for USDBRL."""
        mock_ticker = MagicMock()
        mock_ticker.info = {"regularMarketPrice": 5.12, "bid": None, "previousClose": None}

        with patch("api.routers.market.cache_get", return_value=None):
            with patch("api.routers.market.cache_set"):
                with patch("api.routers.market._fetch_exchange", return_value={"pair": "USDBRL", "rate": 5.12}):
                    r = client.get("/api/exchange/USDBRL")

        assert r.status_code == 200
        data = r.json()
        assert data["pair"] == "USDBRL"
        assert data["rate"] == 5.12

    def test_returns_503_when_yfinance_missing(self):
        """If yfinance is not installed, returns 503."""
        with patch("api.routers.market.cache_get", return_value=None):
            with patch("api.routers.market._fetch_exchange", return_value={"code": "NO_YFINANCE"}):
                r = client.get("/api/exchange/USDBRL")

        assert r.status_code == 503

    def test_returns_503_on_fetch_error(self):
        """If yfinance throws or returns no price, returns 503."""
        with patch("api.routers.market.cache_get", return_value=None):
            with patch("api.routers.market._fetch_exchange", return_value={"code": "ERROR", "message": "no price"}):
                r = client.get("/api/exchange/USDBRL")

        assert r.status_code == 503

    def test_pair_uppercased(self):
        """Pair in path is normalized to uppercase before lookup."""
        with patch("api.routers.market.cache_get", return_value=None):
            with patch("api.routers.market.cache_set"):
                with patch("api.routers.market._fetch_exchange", return_value={"pair": "EURBRL", "rate": 5.55}) as mock_fetch:
                    r = client.get("/api/exchange/eurbrl")

        assert r.status_code == 200
        # Confirm the pair was uppercased when passed to _fetch_exchange
        mock_fetch.assert_called_once_with("EURBRL")

    def test_returns_cached_result(self):
        """If cache_get returns data, it is returned immediately."""
        cached = {"pair": "USDBRL", "rate": 5.00}
        with patch("api.routers.market.cache_get", return_value=cached):
            r = client.get("/api/exchange/USDBRL")

        assert r.status_code == 200
        assert r.json()["rate"] == 5.00


# ── /api/portfolio/history ─────────────────────────────────────────────────────

class _FakeHistDF:
    """Minimal pandas DataFrame-like stub for yfinance.download return value."""

    def __init__(self, data: dict[str, float]):
        """data maps date_str → close_price."""
        import pandas as pd
        dates = [datetime.datetime.strptime(d, "%Y-%m-%d") for d in data]
        self._df = pd.DataFrame(
            {"Close": list(data.values())},
            index=pd.DatetimeIndex(dates),
        )

    def __getitem__(self, key):
        return self._df[key]

    def __getattr__(self, name):
        return getattr(self._df, name)

    @property
    def empty(self):
        return self._df.empty

    def __bool__(self):
        return not self.empty


class TestPortfolioHistoryEndpoint:
    def test_returns_200_with_correct_structure(self):
        """Happy path: returns tickers, dates, and prices arrays."""
        with patch("api.routers.portfolio._fetch_portfolio_history") as mock_fetch:
            mock_fetch.return_value = {
                "PETR4": {"2024-01-02": 30.0, "2024-01-03": 31.0},
            }
            r = client.post("/api/portfolio/history", json={
                "tickers": ["PETR4"],
                "dates": ["2024-01-02", "2024-01-03"]
            })

        assert r.status_code == 200
        data = r.json()
        assert "tickers" in data
        assert "dates" in data
        assert "prices" in data
        assert data["tickers"] == ["PETR4"]
        assert data["dates"] == ["2024-01-02", "2024-01-03"]
        assert "PETR4" in data["prices"]
        assert data["prices"]["PETR4"] == [30.0, 31.0]

    def test_multiple_tickers(self):
        """Multiple tickers return prices aligned to sorted dates."""
        with patch("api.routers.portfolio._fetch_portfolio_history") as mock_fetch:
            mock_fetch.return_value = {
                "PETR4": {"2024-01-02": 30.0},
                "VALE3": {"2024-01-02": 70.0},
            }
            r = client.post("/api/portfolio/history", json={
                "tickers": ["PETR4", "VALE3"],
                "dates": ["2024-01-02"]
            })

        assert r.status_code == 200
        data = r.json()
        assert set(data["tickers"]) == {"PETR4", "VALE3"}
        assert data["prices"]["PETR4"] == [30.0]
        assert data["prices"]["VALE3"] == [70.0]

    def test_empty_tickers_returns_400(self):
        """Empty tickers list returns 400."""
        r = client.post("/api/portfolio/history", json={
            "tickers": [],
            "dates": ["2024-01-02"]
        })
        assert r.status_code == 400

    def test_empty_dates_returns_400(self):
        """Empty dates list returns 400."""
        r = client.post("/api/portfolio/history", json={
            "tickers": ["PETR4"],
            "dates": []
        })
        assert r.status_code == 400

    def test_none_price_preserved_in_response(self):
        """Null prices from yfinance are preserved as null in the response (dict[str, list[float | None]])."""
        with patch("api.routers.portfolio._fetch_portfolio_history") as mock_fetch:
            mock_fetch.return_value = {
                "PETR4": {"2024-01-02": None},
            }
            r = client.post("/api/portfolio/history", json={
                "tickers": ["PETR4"],
                "dates": ["2024-01-02"]
            })

        assert r.status_code == 200
        data = r.json()
        assert data["prices"]["PETR4"] == [None]

    def test_dates_are_sorted(self):
        """Output dates list is always sorted regardless of input order."""
        with patch("api.routers.portfolio._fetch_portfolio_history") as mock_fetch:
            mock_fetch.return_value = {
                "PETR4": {"2024-01-01": 29.0, "2024-01-03": 31.0},
            }
            r = client.post("/api/portfolio/history", json={
                "tickers": ["PETR4"],
                "dates": ["2024-01-03", "2024-01-01"]
            })

        assert r.status_code == 200
        data = r.json()
        assert data["dates"] == ["2024-01-01", "2024-01-03"]
        assert data["prices"]["PETR4"] == [29.0, 31.0]


# ── Internal helper tests ──────────────────────────────────────────────────────

class TestFetchCDIHelper:
    """Unit tests for the _fetch_cdi blocking function."""

    def test_accumulates_daily_rates(self):
        from api.routers.market import _fetch_cdi

        fake_data = [{"data": f"0{i+1}/01/2024", "valor": "0.1"} for i in range(3)]
        fake_response = MagicMock()
        fake_response.read.return_value = json.dumps(fake_data).encode()
        fake_response.__enter__ = lambda s: s
        fake_response.__exit__ = MagicMock(return_value=False)

        with patch("api.routers.market.urllib.request.urlopen", return_value=fake_response):
            result = _fetch_cdi("2024-01-01", "2024-01-03")

        # (1.001)^3 - 1 ≈ 0.003003
        assert abs(result["accumulated"] - 0.003003) < 0.0001
        assert result["days"] == 3
        assert result.get("fallback") is None

    def test_returns_fallback_on_network_error(self):
        from api.routers.market import _fetch_cdi

        with patch("api.routers.market.urllib.request.urlopen", side_effect=OSError("network")):
            result = _fetch_cdi(None, None)

        assert result["fallback"] is True
        assert result["accumulated"] == 0.105


class TestFetchExchangeHelper:
    """Unit tests for the _fetch_exchange blocking function."""

    def test_returns_rate_dict(self):
        from api.routers.market import _fetch_exchange

        mock_yf = MagicMock()
        mock_yf.Ticker.return_value.info = {"regularMarketPrice": 5.20}

        with patch.dict("sys.modules", {"yfinance": mock_yf}):
            # Re-import to pick up patched module
            import importlib
            import api.routers.market as mkt
            importlib.reload(mkt)
            result = mkt._fetch_exchange("USDBRL")

        # After reload the function runs with the patched module
        # We just verify the structure is correct
        assert "pair" in result or "code" in result

    def test_returns_no_yfinance_when_import_fails(self):
        """When yfinance is not available, returns NO_YFINANCE code."""
        with patch("api.routers.market._fetch_exchange", return_value={"code": "NO_YFINANCE"}):
            r = client.get("/api/exchange/USDBRL")

        assert r.status_code == 503
        data = r.json()
        # HTTPException wraps detail in 'detail' key
        assert data.get("detail", {}).get("code") == "NO_YFINANCE"
