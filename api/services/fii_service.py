from __future__ import annotations
from api.models import FIIData
from api.cache import cache_get, cache_set, QUOTES_TTL
import api.adapters.yfinance_adapter as yf_adapter
import api.adapters.statusinvest as si_adapter
import api.adapters.fundamentus as fu_adapter

FII_TTL = QUOTES_TTL  # 5 minutes


def get_fii(ticker: str) -> FIIData:
    """Fetch FII data: cache first, then yfinance + statusinvest + fundamentus enrichment."""
    key = f"fii:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return FIIData(**cached)

    fii = yf_adapter.fetch_fii(ticker)

    # Enrich with statusinvest scraped data
    si_extras = si_adapter.fetch_fii_extras(ticker)
    if si_extras:
        updates = {}
        if si_extras.get("ffoYield") is not None and fii.ffoYield is None:
            updates["ffoYield"] = si_extras["ffoYield"]
        if si_extras.get("vacancia") is not None and fii.vacancia is None:
            updates["vacancia"] = si_extras["vacancia"]
        if si_extras.get("numImoveis") is not None and fii.numImoveis is None:
            updates["numImoveis"] = si_extras["numImoveis"]
        if si_extras.get("segmento") is not None and fii.segmento is None:
            updates["segmento"] = si_extras["segmento"]
        if updates:
            fii = fii.model_copy(update=updates)

    # Fallback: fundamentus for any still-missing fields
    if any(getattr(fii, f) is None for f in ("ffoYield", "vacancia", "numImoveis", "segmento")):
        fu_extras = fu_adapter.fetch_fii_extras(ticker)
        if fu_extras:
            updates = {}
            if fu_extras.get("ffoYield") is not None and fii.ffoYield is None:
                updates["ffoYield"] = fu_extras["ffoYield"]
            if fu_extras.get("vacancia") is not None and fii.vacancia is None:
                updates["vacancia"] = fu_extras["vacancia"]
            if fu_extras.get("numImoveis") is not None and fii.numImoveis is None:
                updates["numImoveis"] = fu_extras["numImoveis"]
            if fu_extras.get("segmento") is not None and fii.segmento is None:
                updates["segmento"] = fu_extras["segmento"]
            if updates:
                fii = fii.model_copy(update=updates)

    cache_set(key, fii.model_dump(), FII_TTL)
    return fii
