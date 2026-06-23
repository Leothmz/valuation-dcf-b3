"""
brapi.dev adapter — fallback price source when yfinance fails (network error,
rate limit, etc). Only covers price-level fields the free quote endpoint
exposes; ROE/payout/net income history stay None (yfinance-only data).

Returns None on any failure — never raises. Callers fall back to this only
after their primary source already failed.
"""

from __future__ import annotations

import json
import urllib.request

from api.models import StockQuote

_BRAPI_BASE = "https://brapi.dev/api"


def fetch_quote(ticker: str) -> StockQuote | None:
    symbol = ticker.upper().replace(".SA", "")
    url = f"{_BRAPI_BASE}/quote/{symbol}"
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        return None

    results = data.get("results") or []
    if not results:
        return None
    r = results[0]
    price = r.get("regularMarketPrice")
    if price is None:
        return None

    return StockQuote(
        ticker=symbol,
        name=r.get("longName") or r.get("shortName") or symbol,
        price=price,
        changePercent=r.get("regularMarketChangePercent", 0),
        fiftyTwoWeekHigh=r.get("fiftyTwoWeekHigh"),
        fiftyTwoWeekLow=r.get("fiftyTwoWeekLow"),
        marketCap=r.get("marketCap"),
    )
