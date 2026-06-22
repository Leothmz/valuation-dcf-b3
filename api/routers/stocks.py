from __future__ import annotations
import asyncio
from fastapi import APIRouter, HTTPException
from api.models import StockQuote, FundamentalsData, DividendEntry
from api.services.stock_service import get_stock_quote, get_fundamentals, get_dividend_history

router = APIRouter(prefix="/api", tags=["stocks"])


@router.get("/quote/{ticker}", response_model=StockQuote)
async def quote(ticker: str) -> StockQuote:
    try:
        return await asyncio.to_thread(get_stock_quote, ticker)
    except ImportError:
        raise HTTPException(status_code=503, detail={"code": "NO_YFINANCE"})
    except ValueError:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})


@router.get("/fundamentals/{ticker}", response_model=FundamentalsData)
async def fundamentals(ticker: str) -> FundamentalsData:
    try:
        return await asyncio.to_thread(get_fundamentals, ticker)
    except ImportError:
        raise HTTPException(status_code=503, detail={"code": "NO_YFINANCE"})
    except ValueError:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})


@router.get("/dividends/{ticker}", response_model=list[DividendEntry])
async def dividends(ticker: str) -> list[DividendEntry]:
    try:
        return await asyncio.to_thread(get_dividend_history, ticker)
    except ImportError:
        raise HTTPException(status_code=503, detail={"code": "NO_YFINANCE"})


@router.get("/batch/quotes", response_model=list[StockQuote])
async def batch_quotes(tickers: str) -> list[StockQuote]:
    """Fetch multiple stock quotes. tickers = comma-separated, e.g. ?tickers=PETR4,VALE3"""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        return []

    async def fetch_one(t: str) -> StockQuote | None:
        try:
            return await asyncio.to_thread(get_stock_quote, t)
        except Exception:
            return None

    results = await asyncio.gather(*[fetch_one(t) for t in ticker_list])
    return [r for r in results if r is not None]


@router.get("/batch/fundamentals", response_model=list[FundamentalsData])
async def batch_fundamentals(tickers: str) -> list[FundamentalsData]:
    """Fetch multiple fundamentals. tickers = comma-separated"""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        return []

    async def fetch_one(t: str) -> FundamentalsData | None:
        try:
            return await asyncio.to_thread(get_fundamentals, t)
        except Exception:
            return None

    results = await asyncio.gather(*[fetch_one(t) for t in ticker_list])
    return [r for r in results if r is not None]
