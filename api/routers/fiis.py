from __future__ import annotations
import asyncio
from fastapi import APIRouter, HTTPException
from api.models import FIIData
from api.services.fii_service import get_fii

router = APIRouter(prefix="/api", tags=["fiis"])


@router.get("/fii/{ticker}", response_model=FIIData)
async def fii(ticker: str) -> FIIData:
    try:
        return await asyncio.to_thread(get_fii, ticker)
    except ImportError:
        raise HTTPException(status_code=503, detail={"code": "NO_YFINANCE"})
    except ValueError:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})


@router.get("/batch/fii", response_model=list[FIIData])
async def batch_fii(tickers: str) -> list[FIIData]:
    """Fetch multiple FIIs. tickers = comma-separated, e.g. ?tickers=MXRF11,HGLG11"""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        return []

    async def fetch_one(t: str) -> FIIData | None:
        try:
            return await asyncio.to_thread(get_fii, t)
        except Exception:
            return None

    results = await asyncio.gather(*[fetch_one(t) for t in ticker_list])
    return [r for r in results if r is not None]
