"""
Adapter for investidor10.com.br — net income history scraper.

Fetches annual net income (lucro líquido) for B3 tickers via the
investidor10 API. Fails silently, always returning [] on any error.
"""
from __future__ import annotations

import json
import re
import urllib.request

from api.models import NetIncomeEntry


def fetch_net_income(ticker: str) -> list[NetIncomeEntry]:
    """
    Fetch annual net income for *ticker* from investidor10.com.br.

    Returns a list of NetIncomeEntry (year >= 2021) sorted most-recent-first.
    Returns [] on any error (network failure, parse error, company not found).
    """
    try:
        base_url = f"https://investidor10.com.br/acoes/{ticker.upper()}/"
        req = urllib.request.Request(base_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            html = r.read().decode("utf-8", errors="replace")

        # Extract the internal company ID
        m = re.search(r'data-company-id=["\'](\d+)["\']', html)
        if not m:
            m = re.search(r"companyId\s*=\s*['\"](\d+)['\"]", html)
        if not m:
            print(f"[investidor10] company ID not found for {ticker}")
            return []

        company_id = m.group(1)
        api_url = (
            f"https://investidor10.com.br/api/balancos/ativospassivos/chart/{company_id}/"
        )
        req2 = urllib.request.Request(api_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": base_url,
            "X-Requested-With": "XMLHttpRequest",
        })
        with urllib.request.urlopen(req2, timeout=8) as r2:
            data = json.loads(r2.read().decode("utf-8"))

        result: list[NetIncomeEntry] = []
        for d in data:
            year = d.get("year")
            profit = d.get("net_profit")
            if profit is not None and str(year).isdigit() and int(year) >= 2021:
                result.append(NetIncomeEntry(year=int(year), netIncome=float(profit)))

        result.sort(key=lambda x: x.year, reverse=True)
        print(f"[investidor10] {ticker}: {len(result)} years found (ID {company_id})")
        return result

    except Exception as e:
        print(f"[investidor10] error for {ticker}: {e}")
        return []


def _normalize_tipo(raw: str) -> str:
    """Normalize investidor10's 'Tipo de Fundo' card value to a canonical label."""
    s = raw.lower()
    if "papel" in s:
        return "Papel"
    if "tijolo" in s:
        return "Tijolo"
    if "híbrido" in s or "hibrido" in s:
        return "Híbrido"
    return "Outro"


def fetch_fii_classification(ticker: str) -> dict:
    """
    Scrape the 'Tipo de Fundo' card and narrative segmento from investidor10's FII page.

    'Tipo de Fundo' (Papel/Tijolo/Híbrido/Outro) is a single, unambiguous card on the
    page and is far more reliable than scraping 'Segmento' directly — it correctly
    flags credit/receivables funds as Papel even when their ANBIMA segment
    registration is stale (e.g. MXRF11 registered under Logística).

    Returns {} on any error. On success, returns a dict with zero or more of:
    'tipo' (Papel/Tijolo/Híbrido/Outro), 'segmentoRaw' (raw narrative label, e.g.
    "Híbrido", "Logístico", "Fiagros" — caller normalizes this further).
    """
    try:
        url = f"https://investidor10.com.br/fiis/{ticker.upper()}/"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            html = r.read().decode("utf-8", errors="replace")

        result: dict = {}

        m = re.search(
            r'TIPO DE FUNDO.*?<div class="value">\s*<span>\s*([^<]+?)\s*</span>',
            html, re.IGNORECASE | re.DOTALL,
        )
        if m:
            result["tipo"] = _normalize_tipo(m.group(1))

        m2 = re.search(r'do segmento\s*(?:<a[^>]*>)?\s*([A-Za-zÀ-ÿ]+)', html, re.IGNORECASE)
        if m2:
            result["segmentoRaw"] = m2.group(1).strip()

        return result
    except Exception as e:
        print(f"[investidor10] fii classification error for {ticker}: {e}")
        return {}
