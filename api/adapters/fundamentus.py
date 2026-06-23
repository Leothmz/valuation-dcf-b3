"""
Adapter for fundamentus.com.br — FII extras scraper (fallback).

Fetches the full FII results table from fundamentus and caches it for 30 min.
Used as a fallback when statusinvest does not return certain fields.
Fails silently, always returning {} on any error.
"""
from __future__ import annotations

import re
import ssl
import threading
import time
import urllib.request

import certifi

from api.adapters.statusinvest import _normalize_segmento

# Module-level cache (shared within process lifetime)
_cache: dict | None = None
_cache_ts: float = 0.0
_CACHE_TTL = 1800  # 30 minutes
_cache_lock = threading.Lock()

# fundamentus.com.br's cert chain fails verification against some OS trust
# stores (observed: stale root on Windows) even though it's valid — certifi's
# independently-maintained bundle verifies it correctly.
_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def _parse_table(html: str) -> dict:
    """Parse the fundamentus FII results table.

    Returns a dict keyed by ticker (uppercase, no .SA):
    ``{TICKER: {segmento, ffoYield, vacancia, numImoveis, pvp}}``.
    Any missing/unparseable field is simply omitted from the per-ticker dict.
    """
    result: dict = {}
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL | re.IGNORECASE)
    if not rows:
        return result

    def _cells(row: str) -> list[str]:
        raw = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', row, re.DOTALL | re.IGNORECASE)
        return [re.sub(r'<[^>]+>', '', c).strip() for c in raw]

    headers: list[str] = []
    header_row_idx = -1
    for i, row in enumerate(rows):
        cells = _cells(row)
        if cells and ('Papel' in cells or 'FFO Yield' in cells):
            headers = cells
            header_row_idx = i
            break

    if not headers:
        return result

    col = {h: i for i, h in enumerate(headers)}

    def _pct(texts: list[str], key: str) -> float | None:
        idx = col.get(key, -1)
        if idx < 0 or idx >= len(texts):
            return None
        v = texts[idx].replace('%', '').replace(',', '.').strip()
        try:
            return float(v) / 100
        except ValueError:
            return None

    def _int(texts: list[str], key: str) -> int | None:
        idx = col.get(key, -1)
        if idx < 0 or idx >= len(texts):
            return None
        v = re.sub(r'[^\d]', '', texts[idx])
        try:
            return int(v)
        except ValueError:
            return None

    for row in rows[header_row_idx + 1:]:
        cells = _cells(row)
        if not cells or not cells[0]:
            continue
        ticker = cells[0].upper()
        entry: dict = {}

        seg_idx = col.get('Segmento', -1)
        if 0 <= seg_idx < len(cells) and cells[seg_idx]:
            seg = _normalize_segmento(cells[seg_idx])
            if seg:
                entry['segmento'] = seg

        ffo = _pct(cells, 'FFO Yield')
        if ffo is not None:
            entry['ffoYield'] = ffo

        vac = _pct(cells, 'Vacância Média')
        if vac is not None:
            entry['vacancia'] = vac

        nim = _int(cells, 'Qtd de imóveis')
        if nim is not None:
            entry['numImoveis'] = nim

        pvp_idx = col.get('P/VP', -1)
        if pvp_idx >= 0 and pvp_idx < len(cells):
            v = cells[pvp_idx].replace(',', '.').strip()
            try:
                fv = float(v)
                if 0.01 < fv < 50:
                    entry['pvp'] = round(fv, 2)
            except ValueError:
                pass

        if entry:
            result[ticker] = entry

    return result


def fetch_fii_extras(ticker: str) -> dict:
    """
    Return cached FII data for *ticker* from fundamentus.com.br.

    The full table is fetched once and cached for 30 min. Subsequent calls
    for different tickers reuse the same cached table.
    Returns {} on any error (network failure, parse error, ticker not in table).
    """
    global _cache, _cache_ts
    try:
        with _cache_lock:
            now = time.time()
            if _cache is None or (now - _cache_ts) > _CACHE_TTL:
                url = "https://www.fundamentus.com.br/fii_resultado.php"
                req = urllib.request.Request(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml",
                })
                with urllib.request.urlopen(req, timeout=8, context=_SSL_CONTEXT) as r:
                    html = r.read().decode("latin-1", errors="replace")
                _cache = _parse_table(html)
                _cache_ts = now
                print(f"[fundamentus] table loaded: {len(_cache)} FIIs")
            raw = ticker.upper().replace(".SA", "")
            return _cache.get(raw, {})
    except Exception as e:
        print(f"[fundamentus] error: {e}")
        return {}
