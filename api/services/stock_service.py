from __future__ import annotations
from api.models import StockQuote, FundamentalsData, DividendEntry
from api.cache import cache_get, cache_set, QUOTES_TTL, FUNDAMENTALS_TTL
import api.adapters.yfinance_adapter as yf_adapter
import api.adapters.investidor10 as i10_adapter
import api.adapters.brapi as brapi_adapter


def get_stock_quote(ticker: str) -> StockQuote:
    """Fetch stock quote: try cache first, then yfinance (richer data — ROE,
    payout, net income history), falling back to brapi (price-only) if
    yfinance fails outright (network error, rate limit, etc)."""
    key = f"quote:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return StockQuote(**cached)

    try:
        quote = yf_adapter.fetch_stock(ticker)
    except Exception:
        quote = brapi_adapter.fetch_quote(ticker)
        if quote is None:
            raise

    # Enrich net income history from investidor10 (overwrites for years >= 2021)
    i10_history = i10_adapter.fetch_net_income(ticker)
    if i10_history:
        # Build dict of i10 data by year for fast lookup
        i10_by_year = {e.year: e for e in i10_history}
        merged = []
        for entry in quote.netIncomeHistory:
            if entry.year in i10_by_year and entry.year >= 2021:
                merged.append(i10_by_year[entry.year])
            else:
                merged.append(entry)
        # Add any years in i10 not in yfinance (only years >= 2021)
        existing_years = {e.year for e in quote.netIncomeHistory}
        for entry in i10_history:
            if entry.year not in existing_years and entry.year >= 2021:
                merged.append(entry)
        merged.sort(key=lambda e: e.year, reverse=True)
        quote = quote.model_copy(update={"netIncomeHistory": merged[:5]})

    cache_set(key, quote.model_dump(), QUOTES_TTL)
    return quote


def get_fundamentals(ticker: str) -> FundamentalsData:
    """Fetch fundamentals: try cache first, then yfinance."""
    key = f"fundamentals:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return FundamentalsData(**cached)

    data = yf_adapter.fetch_fundamentals(ticker)
    cache_set(key, data.model_dump(), FUNDAMENTALS_TTL)
    return data


def get_dividend_history(ticker: str) -> list[DividendEntry]:
    """Fetch full dividend history: try cache first, then yfinance."""
    key = f"dividends:{ticker.upper()}"
    cached = cache_get(key)
    if cached is not None:
        return [DividendEntry(**d) for d in cached]

    data = yf_adapter.fetch_dividend_history(ticker)
    cache_set(key, [d.model_dump() for d in data], FUNDAMENTALS_TTL)
    return data
