"""
Tests for api/routers/crypto.py.

Covers:
  - /api/crypto/quotes returns prices for known coin ids
  - /api/crypto/quotes omits coins with no data (no synthetic error entries)
  - /api/crypto/quotes returns {} for empty ids
  - /api/crypto/quotes returns cached result without hitting the network
  - /api/crypto/list returns top coins
  - /api/crypto/list returns cached result without hitting the network
  - _fetch_crypto_quotes / _fetch_crypto_list return {} / [] on network error
"""
from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def _urlopen_response(payload: dict | list) -> MagicMock:
    fake_response = MagicMock()
    fake_response.read.return_value = json.dumps(payload).encode()
    fake_response.__enter__ = lambda s: s
    fake_response.__exit__ = MagicMock(return_value=False)
    return fake_response


class TestCryptoQuotesEndpoint:
    def test_returns_prices_for_known_ids(self):
        payload = {
            "bitcoin": {"brl": 350000.0, "brl_24h_change": 1.5},
            "ethereum": {"brl": 12000.0, "brl_24h_change": -0.8},
        }
        with patch("api.routers.crypto.cache_get", return_value=None):
            with patch("api.routers.crypto.cache_set"):
                with patch("api.routers.crypto.urllib.request.urlopen", return_value=_urlopen_response(payload)):
                    r = client.get("/api/crypto/quotes?ids=bitcoin,ethereum")

        assert r.status_code == 200
        data = r.json()
        assert data["bitcoin"]["price"] == 350000.0
        assert data["bitcoin"]["change24h"] == 1.5
        assert data["ethereum"]["price"] == 12000.0

    def test_omits_coins_with_no_brl_data(self):
        payload = {"bitcoin": {"brl": 350000.0}, "unknowncoin": {}}
        with patch("api.routers.crypto.cache_get", return_value=None):
            with patch("api.routers.crypto.cache_set"):
                with patch("api.routers.crypto.urllib.request.urlopen", return_value=_urlopen_response(payload)):
                    r = client.get("/api/crypto/quotes?ids=bitcoin,unknowncoin")

        assert r.status_code == 200
        data = r.json()
        assert "bitcoin" in data
        assert "unknowncoin" not in data

    def test_empty_ids_returns_empty_dict(self):
        r = client.get("/api/crypto/quotes?ids=")
        assert r.status_code == 200
        assert r.json() == {}

    def test_returns_cached_result_without_network_call(self):
        cached = {"bitcoin": {"price": 1.0, "change24h": 0.0}}
        with patch("api.routers.crypto.cache_get", return_value=cached):
            with patch("api.routers.crypto.urllib.request.urlopen") as mock_urlopen:
                r = client.get("/api/crypto/quotes?ids=bitcoin")

        assert r.status_code == 200
        assert r.json() == cached
        mock_urlopen.assert_not_called()

    def test_defaults_change24h_to_zero_when_missing(self):
        payload = {"bitcoin": {"brl": 350000.0}}
        with patch("api.routers.crypto.cache_get", return_value=None):
            with patch("api.routers.crypto.cache_set"):
                with patch("api.routers.crypto.urllib.request.urlopen", return_value=_urlopen_response(payload)):
                    r = client.get("/api/crypto/quotes?ids=bitcoin")

        assert r.json()["bitcoin"]["change24h"] == 0.0


class TestCryptoListEndpoint:
    def test_returns_top_coins(self):
        payload = [
            {"id": "bitcoin", "symbol": "btc", "name": "Bitcoin"},
            {"id": "ethereum", "symbol": "eth", "name": "Ethereum"},
        ]
        with patch("api.routers.crypto.cache_get", return_value=None):
            with patch("api.routers.crypto.cache_set"):
                with patch("api.routers.crypto.urllib.request.urlopen", return_value=_urlopen_response(payload)):
                    r = client.get("/api/crypto/list")

        assert r.status_code == 200
        data = r.json()
        assert data[0] == {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin"}

    def test_returns_cached_result_without_network_call(self):
        cached = [{"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin"}]
        with patch("api.routers.crypto.cache_get", return_value=cached):
            with patch("api.routers.crypto.urllib.request.urlopen") as mock_urlopen:
                r = client.get("/api/crypto/list")

        assert r.status_code == 200
        assert r.json() == cached
        mock_urlopen.assert_not_called()


class TestFetchHelpers:
    def test_fetch_crypto_quotes_returns_empty_on_network_error(self):
        from api.routers.crypto import _fetch_crypto_quotes

        with patch("api.routers.crypto.urllib.request.urlopen", side_effect=Exception("timeout")):
            assert _fetch_crypto_quotes(["bitcoin"]) == {}

    def test_fetch_crypto_quotes_returns_empty_for_no_ids(self):
        from api.routers.crypto import _fetch_crypto_quotes

        assert _fetch_crypto_quotes([]) == {}

    def test_fetch_crypto_list_returns_empty_on_network_error(self):
        from api.routers.crypto import _fetch_crypto_list

        with patch("api.routers.crypto.urllib.request.urlopen", side_effect=Exception("timeout")):
            assert _fetch_crypto_list() == []
