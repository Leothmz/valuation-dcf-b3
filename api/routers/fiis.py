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
