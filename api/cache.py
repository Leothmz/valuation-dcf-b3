from __future__ import annotations
import os
from pathlib import Path
import diskcache

QUOTES_TTL = 300        # 5 minutes
FUNDAMENTALS_TTL = 21600  # 6 hours
MARKET_TTL = 3600       # 1 hour

_cache_dir = Path(os.environ.get("CACHE_DIR", Path.home() / ".cache" / "valuation"))
_cache: diskcache.Cache | None = None


def get_cache() -> diskcache.Cache:
    global _cache
    if _cache is None:
        _cache_dir.mkdir(parents=True, exist_ok=True)
        _cache = diskcache.Cache(str(_cache_dir))
    return _cache


def cache_get(key: str) -> dict | None:
    return get_cache().get(key)


def cache_set(key: str, data: dict, ttl: int) -> None:
    get_cache().set(key, data, expire=ttl)


def cache_delete(key: str) -> None:
    get_cache().delete(key)


def cache_close() -> None:
    global _cache
    if _cache is not None:
        _cache.close()
        _cache = None
