"""
Adapter for statusinvest.com.br — FII extras scraper.

Scrapes supplementary FII data (FFO Yield, vacancia, numImoveis, segmento, pvp)
from statusinvest. Fails silently, always returning {} on any error.
"""
from __future__ import annotations

import re
import urllib.request


def _normalize_segmento(raw: str) -> str | None:
    """Normalize a raw segmento label to a canonical value.

    Returns None for unknown labels to avoid returning garbage.
    """
    s = raw.lower()
    if 'logíst' in s or 'logist' in s:
        return 'Logística'
    if 'shop' in s or 'shopping' in s:
        return 'Shoppings'
    if 'laje' in s or 'corporativ' in s or 'escritório' in s:
        return 'Lajes Corp.'
    if 'papel' in s or 'recebív' in s or 'recebi' in s or 'cri' in s or 'títulos' in s or 'titulos' in s or 'val. mob' in s:
        return 'Papel/CRI'
    if 'resid' in s or 'habitac' in s or 'living' in s:
        return 'Residencial'
    if 'fiagro' in s or 'agro' in s or 'agríc' in s or 'rural' in s:
        return 'Fiagro'
    if 'hotel' in s or 'hoteleiro' in s or 'hospedagem' in s:
        return 'Hotel'
    if 'híbrid' in s or 'hibrid' in s or 'fof' in s or 'fundo de fund' in s or 'multicategoria' in s:
        return 'Híbrido'
    if 'renda urbana' in s or 'urbano' in s:
        return 'Renda Urbana'
    return None  # unknown — do not return garbage


def fetch_fii_extras(ticker: str) -> dict:
    """
    Scrape extra FII fields from statusinvest.com.br for *ticker*.

    Returns a dict with zero or more of: segmento, ffoYield, vacancia,
    numImoveis, pvp. Returns {} on any error (network failure, parse error).
    """
    try:
        raw = ticker.upper().replace(".SA", "")
        url = f"https://statusinvest.com.br/fundos-imobiliarios/{raw.lower()}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9",
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")

        result: dict = {}

        # Segmento — try multiple HTML patterns from statusinvest
        _seg_patterns = [
            r'[Ss]egmento[^<]{0,30}</[^>]+>\s*<[^>]+>\s*([A-Za-záéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ /\-]{3,60})</[^>]+>',
            r'[Ss]egmento.*?<strong[^>]*>\s*([A-Za-záéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ /\-]{3,60}?)\s*</strong>',
            r'[Ss]egmento.*?class="[^"]*value[^"]*"[^>]*>\s*([A-Za-záéíóúâêîôûãõç /\-]{3,60}?)\s*<',
            r'"segmento"\s*[=:]\s*["\']([^"\']{3,60})["\']',
        ]
        for _pat in _seg_patterns:
            _m = re.search(_pat, html, re.IGNORECASE | re.DOTALL)
            if _m:
                _v = _normalize_segmento(_m.group(1).strip())
                if _v:
                    result['segmento'] = _v
                    break

        # FFO Yield — e.g. "9,12%" (DOTALL to cross HTML tags)
        _ffo_patterns = [
            r'FFO\s*[Yy]ield.{0,200}?class="[^"]*value[^"]*"[^>]*>\s*([\d,\.]+)\s*%',
            r'FFO\s*[Yy]ield.{0,200}?<strong[^>]*>\s*([\d,\.]+)\s*%',
            r'FFO\s*[Yy]ield.{0,200}?>\s*([\d]+[,\.][\d]+)\s*%',
            r'"ffo_yield"\s*:\s*([\d]+\.[\d]+)',
        ]
        for _pat in _ffo_patterns:
            m = re.search(_pat, html, re.IGNORECASE | re.DOTALL)
            if m:
                try:
                    result['ffoYield'] = float(m.group(1).replace(',', '.')) / 100
                    break
                except ValueError:
                    pass

        # Vacância — e.g. "3,20%" (DOTALL to cross HTML tags)
        _vac_patterns = [
            r'[Vv]ac[aâ][ân]cia.{0,200}?class="[^"]*value[^"]*"[^>]*>\s*([\d,\.]+)\s*%',
            r'[Vv]ac[aâ][ân]cia.{0,200}?<strong[^>]*>\s*([\d,\.]+)\s*%',
            r'[Vv]ac[aâ][ân]cia.{0,200}?>\s*([\d]+[,\.][\d]+)\s*%',
            r'"vacancia"\s*:\s*([\d]+\.[\d]+)',
        ]
        for _pat in _vac_patterns:
            m = re.search(_pat, html, re.IGNORECASE | re.DOTALL)
            if m:
                try:
                    result['vacancia'] = float(m.group(1).replace(',', '.')) / 100
                    break
                except ValueError:
                    pass

        # Número de imóveis
        m = re.search(r'Im[oó]veis[^0-9]{0,30}(\d{1,4})', html, re.IGNORECASE)
        if m:
            try:
                v = int(m.group(1))
                if v < 5000:
                    result['numImoveis'] = v
            except ValueError:
                pass

        # P/VP — e.g. "0,97" or "1.02"
        _pvp_patterns = [
            r'P/VP[A]?.{0,200}?class="[^"]*value[^"]*"[^>]*>\s*([\d,\.]+)',
            r'P/VP[A]?.{0,200}?<strong[^>]*>\s*([\d,\.]+)',
            r'"p_vp"\s*:\s*([\d]+\.[\d]+)',
            r'p_vp["\s:=]{1,10}([\d]+[,\.][\d]+)',
            r'>P/VP[A]?<.{0,30}>\s*([\d]+[,\.][\d]+)',
        ]
        for _pat in _pvp_patterns:
            _m = re.search(_pat, html, re.IGNORECASE | re.DOTALL)
            if _m:
                try:
                    _v = float(_m.group(1).replace(',', '.'))
                    if 0.01 < _v < 20:
                        result['pvp'] = round(_v, 2)
                        break
                except ValueError:
                    pass

        print(f"[statusinvest] {ticker}: {list(result.keys())}")
        return result

    except Exception as e:
        print(f"[statusinvest] error for {ticker}: {e}")
        return {}
