from __future__ import annotations
from api.models import FIIData
from api.cache import cache_get, cache_set, QUOTES_TTL
import api.adapters.yfinance_adapter as yf_adapter
import api.adapters.statusinvest as si_adapter
import api.adapters.fundamentus as fu_adapter
import api.adapters.investidor10 as inv10_adapter
from api.adapters.statusinvest import _normalize_segmento

FII_TTL = QUOTES_TTL  # 5 minutes

# Funds whose ANBIMA/scraper segmento is wrong or too generic for their real
# strategy (urban income-generating real estate outside the other buckets) —
# hardcoded until a source classifies "Renda Urbana" reliably on its own.
_HARDCODED_SEGMENTO: dict[str, str] = {
    "RBVA11": "Renda Urbana",
    "GARE11": "Renda Urbana",
    "TRXF11": "Renda Urbana",
    "HSRE11": "Renda Urbana",
    "HGRU11": "Renda Urbana",
    "CPUR11": "Renda Urbana",
}


def _classify_segmento(ticker: str) -> str | None:
    """
    Decide a FII's segmento using investidor10's 'Tipo de Fundo' card as the
    authority for Papel/CRI classification.

    'Segmento' (ANBIMA registration) is frequently stale for funds that pivoted
    strategy after launch — e.g. MXRF11 is registered under Logística even though
    it has operated as a papel/recebíveis fund for years. 'Tipo de Fundo' doesn't
    have this problem, so: tipo == Papel always wins; for any other tipo, fall
    back to the page's own narrative segmento label (Híbrido, Logístico, Fiagros, etc).
    """
    classification = inv10_adapter.fetch_fii_classification(ticker)
    tipo = classification.get("tipo")
    if tipo == "Papel":
        return "Papel/CRI"
    seg_raw = classification.get("segmentoRaw")
    if seg_raw:
        return _normalize_segmento(seg_raw)
    return None


def get_fii(ticker: str) -> FIIData:
    """Fetch FII data: cache first, then yfinance + investidor10 + fundamentus + statusinvest enrichment."""
    key = f"fii:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return FIIData(**cached)

    fii = yf_adapter.fetch_fii(ticker)

    # Segmento: hardcoded override first, then investidor10's Tipo de Fundo
    if hardcoded := _HARDCODED_SEGMENTO.get(ticker.upper()):
        fii = fii.model_copy(update={"segmento": hardcoded})
    elif fii.segmento is None:
        segmento = _classify_segmento(ticker)
        if segmento:
            fii = fii.model_copy(update={"segmento": segmento})

    # FFO yield / vacância / nº imóveis / P-VP: fundamentus bulk table (1 cached
    # request covers every FII on B3 — far higher coverage than per-ticker scraping)
    if any(getattr(fii, f) is None for f in ("ffoYield", "vacancia", "numImoveis", "pvp", "segmento")):
        fu_extras = fu_adapter.fetch_fii_extras(ticker)
        if fu_extras:
            updates = {}
            for field in ("ffoYield", "vacancia", "numImoveis", "pvp", "segmento"):
                if fu_extras.get(field) is not None and getattr(fii, field) is None:
                    updates[field] = fu_extras[field]
            if updates:
                fii = fii.model_copy(update=updates)

    # Last-resort fallback: statusinvest, for whatever is still missing
    if any(getattr(fii, f) is None for f in ("ffoYield", "vacancia", "numImoveis", "pvp", "segmento")):
        si_extras = si_adapter.fetch_fii_extras(ticker)
        if si_extras:
            updates = {}
            for field in ("ffoYield", "vacancia", "numImoveis", "pvp", "segmento"):
                if si_extras.get(field) is not None and getattr(fii, field) is None:
                    updates[field] = si_extras[field]
            if updates:
                fii = fii.model_copy(update=updates)

    cache_set(key, fii.model_dump(), FII_TTL)
    return fii
