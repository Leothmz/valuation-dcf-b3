import os
import time
import pytest
from api.cache import cache_get, cache_set, cache_delete, cache_close, QUOTES_TTL


@pytest.fixture(autouse=True)
def isolated_cache(tmp_path, monkeypatch):
    monkeypatch.setenv("CACHE_DIR", str(tmp_path / "test_cache"))
    # Reset singleton so each test gets fresh cache pointed at tmp_path
    import api.cache as cache_mod
    cache_mod._cache = None
    yield
    cache_close()
    cache_mod._cache = None


def test_set_and_get_round_trip():
    cache_set("key1", {"value": 42}, QUOTES_TTL)
    result = cache_get("key1")
    assert result == {"value": 42}


def test_missing_key_returns_none():
    result = cache_get("nonexistent_key")
    assert result is None


def test_expired_key_returns_none():
    cache_set("key_expire", {"v": 1}, ttl=1)
    time.sleep(1.1)
    result = cache_get("key_expire")
    assert result is None


def test_delete_removes_key():
    cache_set("key_del", {"x": 1}, QUOTES_TTL)
    cache_delete("key_del")
    assert cache_get("key_del") is None


def test_ttl_constants_correct():
    assert QUOTES_TTL == 300
    from api.cache import FUNDAMENTALS_TTL, MARKET_TTL
    assert FUNDAMENTALS_TTL == 21600
    assert MARKET_TTL == 3600
