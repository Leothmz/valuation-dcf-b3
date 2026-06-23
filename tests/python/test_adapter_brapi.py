"""
Tests for api/adapters/brapi.py — all HTTP I/O mocked, no network calls.
"""
import json
from unittest.mock import patch, MagicMock
from api.adapters.brapi import fetch_quote


def _mock_response(payload: dict):
    cm = MagicMock()
    cm.read.return_value = json.dumps(payload).encode()
    ctx = MagicMock()
    ctx.__enter__.return_value = cm
    return ctx


def test_fetch_quote_returns_stock_quote_on_success():
    payload = {
        "results": [
            {
                "symbol": "PETR4",
                "longName": "Petroleo Brasileiro SA Pfd",
                "regularMarketPrice": 39.17,
                "regularMarketChangePercent": 0.95,
                "fiftyTwoWeekHigh": 50.69,
                "fiftyTwoWeekLow": 29.31,
                "marketCap": 528623424144.0,
            }
        ]
    }
    with patch("urllib.request.urlopen", return_value=_mock_response(payload)):
        quote = fetch_quote("PETR4")

    assert quote is not None
    assert quote.ticker == "PETR4"
    assert quote.name == "Petroleo Brasileiro SA Pfd"
    assert quote.price == 39.17
    assert quote.changePercent == 0.95
    assert quote.fiftyTwoWeekHigh == 50.69
    assert quote.marketCap == 528623424144.0
    # brapi's free quote endpoint has no ROE/payout/net income data
    assert quote.roe is None
    assert quote.payout is None
    assert quote.netIncomeHistory == []


def test_fetch_quote_strips_sa_suffix():
    payload = {"results": [{"symbol": "PETR4", "regularMarketPrice": 39.17}]}
    with patch("urllib.request.urlopen", return_value=_mock_response(payload)) as mock_open:
        fetch_quote("PETR4.SA")
    called_url = mock_open.call_args[0][0]
    assert called_url.endswith("/quote/PETR4")


def test_fetch_quote_returns_none_on_network_error():
    with patch("urllib.request.urlopen", side_effect=OSError("timed out")):
        assert fetch_quote("PETR4") is None


def test_fetch_quote_returns_none_on_empty_results():
    with patch("urllib.request.urlopen", return_value=_mock_response({"results": []})):
        assert fetch_quote("INVALID") is None


def test_fetch_quote_returns_none_when_price_missing():
    payload = {"results": [{"symbol": "PETR4", "regularMarketPrice": None}]}
    with patch("urllib.request.urlopen", return_value=_mock_response(payload)):
        assert fetch_quote("PETR4") is None
