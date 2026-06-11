"""
Portfolio router — /api/portfolio/history endpoint.

Ports the server.py get_portfolio_history() function to FastAPI.
Accepts tickers as a comma-separated query param (GET) instead of POST body,
matching the FastAPI style of previous routers while remaining compatible
with the vanilla server.py behaviour.

The original server.py endpoint was POST /api/portfolio/history with body
{"tickers": [...], "dates": [...]}. This router exposes it as GET with
query params for consistency with the rest of the FastAPI migration.
"""
from __future__ import annotations

import asyncio
import datetime

from fastapi import APIRouter, HTTPException

from api.models import PortfolioHistoryResponse

router = APIRouter(prefix="/api", tags=["portfolio"])


def _fetch_portfolio_history(tickers: list[str], dates: list[str]) -> dict[str, dict[str, float | None]]:
    """
    Blocking fetch of historical close prices for a list of tickers and dates.

    For each ticker and date, finds the first available close price on or after
    that date. Returns {ticker: {date: price_or_None}}.

    Mirrors server.py get_portfolio_history() exactly.
    """
    if not tickers or not dates:
        return {}

    try:
        import yfinance as yf
    except ImportError:
        return {t: {d: None for d in dates} for t in tickers}

    all_dates = sorted(set(dates))
    min_date = all_dates[0]
    max_dt = datetime.datetime.strptime(max(all_dates), "%Y-%m-%d") + datetime.timedelta(days=7)
    max_date = max_dt.strftime("%Y-%m-%d")

    result: dict[str, dict[str, float | None]] = {}
    for ticker in tickers:
        yf_ticker = ticker if ("." in ticker or "=" in ticker) else ticker + ".SA"
        try:
            hist = yf.download(yf_ticker, start=min_date, end=max_date, progress=False, auto_adjust=True)
            if hist.empty:
                hist = yf.download(ticker, start=min_date, end=max_date, progress=False, auto_adjust=True)
            ticker_prices: dict[str, float | None] = {}
            for date_str in all_dates:
                date_dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                subset = hist[hist.index >= date_dt]
                ticker_prices[date_str] = float(subset["Close"].iloc[0]) if not subset.empty else None
            result[ticker] = ticker_prices
        except Exception:
            result[ticker] = {d: None for d in all_dates}

    return result


@router.get("/portfolio/history", response_model=PortfolioHistoryResponse)
async def portfolio_history(
    tickers: str,
    dates: str,
) -> PortfolioHistoryResponse:
    """
    Fetch historical close prices for a portfolio of tickers on specific dates.

    Query params:
      - tickers: comma-separated list of B3 tickers (e.g. PETR4,VALE3)
      - dates:   comma-separated list of dates in YYYY-MM-DD format

    Returns a PortfolioHistoryResponse with:
      - tickers: list of tickers (in request order)
      - dates:   sorted unique list of dates
      - prices:  {ticker: [price_per_date]} where price is null if unavailable
    """
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    date_list = [d.strip() for d in dates.split(",") if d.strip()]

    if not ticker_list:
        raise HTTPException(status_code=400, detail={"code": "MISSING_TICKERS", "error": "tickers param required"})
    if not date_list:
        raise HTTPException(status_code=400, detail={"code": "MISSING_DATES", "error": "dates param required"})

    raw = await asyncio.to_thread(_fetch_portfolio_history, ticker_list, date_list)

    sorted_dates = sorted(set(date_list))

    # Build prices dict: {ticker: [price_for_date1, price_for_date2, ...]}
    # Align prices to sorted_dates order; None → 0.0 to satisfy list[float] model
    prices: dict[str, list[float]] = {}
    for ticker in ticker_list:
        ticker_data = raw.get(ticker, {})
        prices[ticker] = [
            ticker_data.get(d) or 0.0
            for d in sorted_dates
        ]

    return PortfolioHistoryResponse(
        tickers=ticker_list,
        dates=sorted_dates,
        prices=prices,
    )
