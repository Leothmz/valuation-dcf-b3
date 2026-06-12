"""
Market data router — /api/cdi and /api/exchange endpoints.

Ports the server.py get_cdi_data() and get_exchange_rate() functions to FastAPI.
Uses asyncio.to_thread for blocking urllib calls. Caches with MARKET_TTL (1 hour).
"""
from __future__ import annotations

import asyncio
import datetime
import json
import urllib.request

from fastapi import APIRouter, HTTPException

from api.cache import cache_get, cache_set, MARKET_TTL

router = APIRouter(prefix="/api", tags=["market"])

_EXCHANGE_TICKERS = {"USDBRL": "USDBRL=X", "EURBRL": "EURBRL=X"}


def _fetch_cdi(date_from: str | None, date_to: str | None) -> dict:
    """Blocking fetch of CDI rate from Banco Central do Brasil API (series 12).

    Returns accumulated rate for the date range, or a fallback value on failure.
    Mirrors server.py get_cdi_data() exactly.
    """
    today = datetime.date.today()
    dt_to = today if date_to is None else datetime.datetime.strptime(date_to, "%Y-%m-%d").date()
    dt_from = (today - datetime.timedelta(days=365)) if date_from is None else datetime.datetime.strptime(date_from, "%Y-%m-%d").date()

    fmt = lambda d: d.strftime("%d/%m/%Y")
    url = (
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados"
        f"?formato=json&dataInicial={fmt(dt_from)}&dataFinal={fmt(dt_to)}"
    )
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        accumulated = 1.0
        for item in data:
            accumulated *= 1 + float(item["valor"]) / 100
        return {
            "accumulated": round(accumulated - 1, 6),
            "from": dt_from.isoformat(),
            "to": dt_to.isoformat(),
            "days": len(data),
        }
    except Exception:
        return {
            "accumulated": 0.105,
            "from": dt_from.isoformat(),
            "to": dt_to.isoformat(),
            "days": 252,
            "fallback": True,
        }


def _fetch_exchange(pair: str) -> dict:
    """Blocking fetch of exchange rate via yfinance.

    Mirrors server.py get_exchange_rate() exactly.
    Returns {"code": "NO_YFINANCE"} or {"code": "ERROR"} on failure.
    """
    try:
        import yfinance as yf
    except ImportError:
        return {"code": "NO_YFINANCE"}

    try:
        yf_ticker = _EXCHANGE_TICKERS.get(pair, pair)
        info = yf.Ticker(yf_ticker).info
        rate = info.get("regularMarketPrice") or info.get("bid") or info.get("previousClose")
        if not rate:
            raise ValueError("no price field")
        return {"pair": pair, "rate": float(rate)}
    except Exception as e:
        return {"code": "ERROR", "message": str(e)}


@router.get("/cdi")
async def cdi(
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict:
    """
    Fetch CDI accumulated rate from Banco Central do Brasil.

    Query params:
      - from: start date (YYYY-MM-DD), defaults to 1 year ago
      - to:   end date (YYYY-MM-DD), defaults to today
    """
    # Build cache key from the resolved date range
    today = datetime.date.today()
    _from = date_from or (today - datetime.timedelta(days=365)).isoformat()
    _to = date_to or today.isoformat()
    cache_key = f"cdi:{_from}:{_to}"

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    result = await asyncio.to_thread(_fetch_cdi, date_from, date_to)

    # Only cache successful (non-fallback) responses
    if not result.get("fallback"):
        cache_set(cache_key, result, MARKET_TTL)
    else:
        # Cache fallback briefly (60s) to avoid hammering BCB on outages
        cache_set(cache_key, result, 60)

    return result


@router.get("/exchange/{pair}")
async def exchange(pair: str) -> dict:
    """
    Fetch exchange rate for a currency pair via yfinance.

    Supported pairs: USDBRL, EURBRL (and any yfinance-compatible pair).
    Returns 503 if yfinance is not installed, or on fetch failure.
    """
    pair = pair.upper()
    cache_key = f"exchange:{pair}"

    cached = cache_get(cache_key)
    if cached is not None:
        if cached.get("code") in ("NO_YFINANCE", "ERROR"):
            raise HTTPException(status_code=503, detail=cached)
        return cached

    result = await asyncio.to_thread(_fetch_exchange, pair)

    if result.get("code") in ("NO_YFINANCE", "ERROR"):
        raise HTTPException(status_code=503, detail=result)

    cache_set(cache_key, result, MARKET_TTL)
    return result
