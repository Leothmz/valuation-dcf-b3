"""
Crypto router — /api/crypto/* endpoints, backed by the CoinGecko public API.

No API key required for CoinGecko's free tier (rate-limited, hence the cache).
"""
from __future__ import annotations

import asyncio
import json
import urllib.parse
import urllib.request

from fastapi import APIRouter

from api.cache import cache_get, cache_set, QUOTES_TTL, MARKET_TTL

router = APIRouter(prefix="/api/crypto", tags=["crypto"])

_COINGECKO_BASE = "https://api.coingecko.com/api/v3"


def _fetch_crypto_quotes(coin_ids: list[str]) -> dict[str, dict]:
    """Blocking fetch of price + 24h change for a list of CoinGecko coin ids.

    Returns {coin_id: {"price": float, "change24h": float}}. Missing/failed
    coins are simply absent from the result — callers treat that as no quote.
    """
    if not coin_ids:
        return {}

    ids_param = urllib.parse.quote(",".join(coin_ids))
    url = (
        f"{_COINGECKO_BASE}/simple/price"
        f"?ids={ids_param}&vs_currencies=brl&include_24hr_change=true"
    )
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        return {}

    return {
        coin_id: {
            "price": float(values["brl"]),
            "change24h": float(values.get("brl_24h_change", 0.0)),
        }
        for coin_id, values in data.items()
        if "brl" in values
    }


def _fetch_crypto_list() -> list[dict]:
    """Blocking fetch of the top 50 coins by market cap (id, symbol, name).

    Used to populate a ticker picker on the frontend. Returns [] on failure.
    """
    url = (
        f"{_COINGECKO_BASE}/coins/markets"
        "?vs_currency=brl&order=market_cap_desc&per_page=50&page=1"
    )
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        return []

    return [
        {"id": c["id"], "symbol": c["symbol"].upper(), "name": c["name"]}
        for c in data
        if "id" in c and "symbol" in c and "name" in c
    ]


@router.get("/quotes")
async def crypto_quotes(ids: str) -> dict[str, dict]:
    """
    Batch live quotes for CoinGecko coin ids.

    Query param `ids` is a comma-separated list (e.g. "bitcoin,ethereum").
    Returns {coin_id: {"price": float, "change24h": float}} — coins with no
    quote available (typo, delisted, CoinGecko outage) are simply omitted.
    """
    coin_ids = sorted({c.strip() for c in ids.split(",") if c.strip()})
    if not coin_ids:
        return {}

    cache_key = f"crypto:quotes:{','.join(coin_ids)}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    result = await asyncio.to_thread(_fetch_crypto_quotes, coin_ids)

    if result:
        cache_set(cache_key, result, QUOTES_TTL)
    return result


@router.get("/list")
async def crypto_list() -> list[dict]:
    """Top 50 cryptocurrencies by market cap — id/symbol/name, for a ticker picker."""
    cache_key = "crypto:list"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    result = await asyncio.to_thread(_fetch_crypto_list)

    if result:
        cache_set(cache_key, result, MARKET_TTL)
    return result
