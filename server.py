#!/usr/bin/env python3
"""
Servidor local - Valuation DCF B3
Serve arquivos estáticos + API de dados via yfinance (gratuito, sem token)
"""

import datetime, json, os, sys, time, urllib.parse, urllib.request, re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse, parse_qs
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

try:
    import yfinance as yf
except ImportError:
    yf = None

PORT = int(os.environ.get('PORT', 8000))

_api_cache: dict = {}
_API_CACHE_TTL = 1800   # 30 min
_CACHE_MAX_ENTRIES = 300

def _cache_get(key: str):
    entry = _api_cache.get(key)
    if entry and time.time() - entry[0] < _API_CACHE_TTL:
        return entry[1]
    return None

def _cache_set(key: str, data: dict):
    now = time.time()
    # Evict expired entries
    expired = [k for k, (ts, _) in _api_cache.items() if now - ts >= _API_CACHE_TTL]
    for k in expired:
        del _api_cache[k]
    # If still over limit, drop oldest 50
    if len(_api_cache) >= _CACHE_MAX_ENTRIES:
        oldest = sorted(_api_cache.items(), key=lambda x: x[1][0])[:50]
        for k, _ in oldest:
            del _api_cache[k]
    _api_cache[key] = (now, data)
BASE_DIR = Path(__file__).parent

# ── B3 tickers ─────────────────────────────────────────────────────
_B3_FALLBACK = [
    # Bancos & holding financeira
    'ITUB4','ITUB3','BBDC4','BBDC3','BBAS3','SANB11','BRSR6','BMGB4','BPAC11','ABCB4','ITSA4',
    # Seguros
    'BBSE3','PSSA3','CXSE3','WIZC3','IRBR3','SULA11','BRBI11',
    # Outros financeiros
    'B3SA3','CIEL3','RIAA3','BRAP4','GGPS3',
    # Energia elétrica
    'EGIE3','TAEE11','TRPL4','EQTL3','CMIG4','CMIG3','CPFE3','ELET3','ELET6','CPLE6',
    'ENEV3','ENBR3','ISAE4','AURE3','ALUP11','ENGI11','NEOE3','CESP6','EQPA3',
    # Gás
    'CGAS3',
    # Saneamento
    'SBSP3','SAPR11','CSMG3',
    # Petróleo & gás
    'PETR4','PETR3','PRIO3','CSAN3','RECV3','RRRP3','VBBR3','RAIZ4','BRAV3',
    # Mineração & siderurgia
    'VALE3','GGBR4','GGBR3','CSNA3','CMIN3','GOAU4','USIM5','BRKM5','CBAV3',
    # Papel & celulose
    'SUZB3','KLBN11',
    # Consumo básico
    'ABEV3','MDIA3','SMTO3','BEEF3','SLCE3','AGRO3','TTEN3','CAML3','NATU3',
    # Consumo cíclico
    'RADL3','RENT3','LREN3','SOMA3','ARZZ3','VIVA3','GRND3','CGRA4',
    'NTCO3','MGLU3','PETZ3','CRFB3','ASAI3','PCAR3','SMFT3',
    'ALPA4','AZZA3','CEAB3','LJQQ3',
    # Proteína animal
    'JBSS3','BRFS3','MRFG3',
    # Construção civil
    'CYRE3','MRVE3','DIRR3','EVEN3','CURY3','PLPL3','TRIS3','TEND3',
    'LAVV3','JHSF3','HBOR3','GFSA3','MDNE3','EZTC3','MTRE3',
    # Saúde & farmácia
    'RDOR3','FLRY3','HAPV3','ODPV3','HYPE3','DASA3','QUAL3','PNVL3','ONCO3','PARD3','BLAU3',
    # Tecnologia & serviços
    'TOTS3','VIVT3','TIMS3','LWSA3','POSI3','DESK3','VLID3',
    # Industrial
    'WEGE3','RAIL3','EMBR3','TUPY3','FRAS3','ROMI3','MYPK3','LEVE3','VULC3','SHUL4','KEPL3',
    'POMO4','DXCO3','RAPT4',
    # Locação & distribuição
    'UGPA3','MOVI3','VAMO3','ARML3',
    # Shoppings & imóveis
    'MULT3','IGTI11','ALOS3','LOGG3','BRPR3',
    # Educação
    'COGN3','YDUQ3','SEER3','ANIM3','VTRU3',
    # Transporte & logística
    'GOLL4','AZUL4','CCRO3','ECOR3','JSLG3','SIMH3','HBSA3','SEQL3','TGMA3','LOGN3',
    # Ambiental
    'AMBP3','ORVR3',
    # Agro
    'RANI3','JALL3','SOJA3','VITT3',
    # Química
    'UNIP6',
    # Turismo
    'CVCB3',
]


def get_b3_tickers() -> list:
    return _B3_FALLBACK

# ── Expansão futura: lista dinâmica via brapi.dev ───────────────────
# Para carregar todos os tickers da B3 (incluindo FIIs), descomentar
# o bloco abaixo e substituir a função get_b3_tickers acima.
#
# _b3_cache: dict = {"data": None, "ts": 0.0}
# _B3_TTL = 24 * 3600
#
# def get_b3_tickers() -> list:
#     now = time.time()
#     if _b3_cache["data"] and now - _b3_cache["ts"] < _B3_TTL:
#         return _b3_cache["data"]
#     try:
#         req = urllib.request.Request(
#             "https://brapi.dev/api/available",
#             headers={"User-Agent": "Mozilla/5.0"},
#         )
#         with urllib.request.urlopen(req, timeout=10) as r:
#             data = json.loads(r.read())
#         stocks = data.get("stocks", [])
#         funds  = set(data.get("availableStocksFunds", []))
#         # Ações brasileiras: 4 letras + sufixo 1–12; exclui BDRs e fundos declarados
#         filtered = [
#             t for t in stocks
#             if re.match(r'^[A-Z]{4}([1-9]|1[0-2])$', t) and t not in funds
#         ]
#         # Para incluir FIIs, adicionar também:
#         # fiis = [t for t in data.get("availableStocksFunds", [])
#         #         if re.match(r'^[A-Z]{4}11$', t)]
#         # filtered += fiis
#         if filtered:
#             _b3_cache["data"] = filtered
#             _b3_cache["ts"] = now
#             print(f"[b3-tickers] {len(filtered)} tickers via brapi")
#             return filtered
#     except Exception as e:
#         print(f"[b3-tickers] brapi falhou ({e}), usando fallback")
#     _b3_cache["data"] = _B3_FALLBACK
#     _b3_cache["ts"] = now
#     return _B3_FALLBACK


def _get_investidor10_net_income(ticker: str) -> list:
    """
    Busca lucro líquido anual (2021+) via investidor10.com.br.
    Retorna lista [{year, netIncome}] ordenada mais recente primeiro, ou [] em caso de falha.
    """
    try:
        base_url = f"https://investidor10.com.br/acoes/{ticker.upper()}/"
        req = urllib.request.Request(base_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            html = r.read().decode("utf-8", errors="replace")

        # Extrai o ID interno da empresa
        m = re.search(r'data-company-id=["\'](\d+)["\']', html)
        if not m:
            m = re.search(r"companyId\s*=\s*['\"](\d+)['\"]", html)
        if not m:
            print(f"[investidor10] company ID não encontrado para {ticker}")
            return []

        company_id = m.group(1)
        api_url = f"https://investidor10.com.br/api/balancos/ativospassivos/chart/{company_id}/"
        req2 = urllib.request.Request(api_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": base_url,
            "X-Requested-With": "XMLHttpRequest",
        })
        with urllib.request.urlopen(req2, timeout=8) as r2:
            data = json.loads(r2.read().decode("utf-8"))

        result = []
        for d in data:
            year = d.get("year")
            profit = d.get("net_profit")
            if profit is not None and str(year).isdigit() and int(year) >= 2021:
                result.append({"year": int(year), "netIncome": float(profit)})

        result.sort(key=lambda x: x["year"], reverse=True)
        print(f"[investidor10] {ticker}: {len(result)} anos encontrados (ID {company_id})")
        return result

    except Exception as e:
        print(f"[investidor10] erro para {ticker}: {e}")
        return []


def _normalize_dy(dy) -> float | None:
    """yfinance for .SA tickers sometimes returns dividendYield as a percentage
    (e.g. 8.49 meaning 8.49%) instead of decimal (0.0849). Normalize to 0-1."""
    if dy is None:
        return None
    return dy / 100 if dy > 1 else dy


def get_stock_data(ticker: str) -> dict:
    try:
        import yfinance as yf
    except ImportError:
        return {"code": "NO_YFINANCE", "error": "yfinance não instalado"}

    symbol = ticker.upper()
    if not symbol.endswith(".SA"):
        symbol += ".SA"

    stock = yf.Ticker(symbol)
    info  = stock.info or {}

    price = (info.get("regularMarketPrice")
          or info.get("currentPrice")
          or info.get("previousClose"))

    if not price:
        return {"code": "NOT_FOUND", "error": f"Ticker {ticker} não encontrado"}

    # ── Lucro Líquido histórico ─────────────────────────────
    history = []
    try:
        fin = stock.financials          # linhas = métricas, colunas = datas
        if fin is not None and not fin.empty:
            # Procura linha de Net Income (yfinance muda o nome às vezes)
            ni_keys = ["Net Income", "Net Income Common Stockholders",
                       "Net Income From Continuing Operations"]
            ni_row = None
            for k in ni_keys:
                if k in fin.index:
                    ni_row = fin.loc[k]
                    break
            if ni_row is None:
                # Tenta qualquer linha com "Net Income"
                matches = [i for i in fin.index if "net income" in str(i).lower()]
                if matches:
                    ni_row = fin.loc[matches[0]]

            if ni_row is not None:
                for col in ni_row.index:
                    val = ni_row[col]
                    try:
                        fval = float(val)
                        if fval == fval:          # not NaN
                            year = col.year if hasattr(col, "year") else int(str(col)[:4])
                            history.append({"year": year, "netIncome": fval})
                    except Exception:
                        pass
    except Exception as e:
        print(f"[yfinance] financials error: {e}")

    history.sort(key=lambda x: x["year"], reverse=True)

    # Substitui anos 2021+ com dados do investidor10 (mais confiável)
    i10_data = _get_investidor10_net_income(ticker)
    if i10_data:
        i10_by_year = {d["year"]: d["netIncome"] for d in i10_data}
        # Remove anos 2021+ do yfinance e adiciona os do investidor10
        history = [h for h in history if h["year"] < 2021]
        for year, ni in i10_by_year.items():
            history.append({"year": year, "netIncome": ni})
        history.sort(key=lambda x: x["year"], reverse=True)

    history = history[:5]

    # ── Dividendos por ano ──────────────────────────────────
    divs_by_year = {}
    try:
        divs = stock.dividends
        if divs is not None and not divs.empty:
            for date, amount in divs.items():
                y = date.year if hasattr(date, "year") else int(str(date)[:4])
                divs_by_year[y] = divs_by_year.get(y, 0) + float(amount)
    except Exception as e:
        print(f"[yfinance] dividends error: {e}")

    # ── Shares outstanding ──────────────────────────────────
    shares = (info.get("sharesOutstanding")
           or info.get("impliedSharesOutstanding")
           or info.get("floatShares"))

    # ── ROE ────────────────────────────────────────────────
    roe = info.get("returnOnEquity")

    # ── Payout médio histórico ──────────────────────────────
    payout = None
    if shares and divs_by_year and history:
        pts = []
        for h in history:
            y = h["year"]
            if y in divs_by_year and h["netIncome"] > 0:
                p = (divs_by_year[y] * shares) / h["netIncome"]
                if 0 < p < 2:
                    pts.append(p)
        if pts:
            payout = sum(pts) / len(pts)

    return {
        "ticker":            ticker.upper(),
        "name":              info.get("longName") or info.get("shortName") or ticker,
        "price":             price,
        "changePercent":     info.get("regularMarketChangePercent", 0),
        "fiftyTwoWeekHigh":  info.get("fiftyTwoWeekHigh"),
        "fiftyTwoWeekLow":   info.get("fiftyTwoWeekLow"),
        "sharesOutstanding": shares,
        "roe":               roe,
        "payout":            payout,
        "netIncomeHistory":  history,
        "marketCap":         info.get("marketCap"),
        "dividendYield":     _normalize_dy(info.get("dividendYield")),
    }


def get_fundamentals(ticker: str) -> dict:
    """Returns extended fundamental data for screening and ranking."""
    cached = _cache_get(f"fund:{ticker.upper()}")
    if cached is not None:
        return cached

    try:
        import yfinance as yf
    except ImportError:
        return {"code": "NO_YFINANCE", "error": "yfinance não instalado"}

    symbol = ticker.upper()
    if not symbol.endswith(".SA"):
        symbol += ".SA"

    try:
        stock = yf.Ticker(symbol)
        info = stock.info or {}
    except Exception as e:
        return {"code": "ERROR", "error": str(e)}

    price = (info.get("regularMarketPrice")
          or info.get("currentPrice")
          or info.get("previousClose"))

    if not price:
        return {"code": "NOT_FOUND", "error": f"Ticker {ticker} não encontrado"}

    market_cap = info.get("marketCap")
    shares = (info.get("sharesOutstanding")
           or info.get("impliedSharesOutstanding")
           or info.get("floatShares"))

    # Valuation multiples
    pl  = info.get("trailingPE")
    pvp = info.get("priceToBook")

    # Profitability
    roe            = info.get("returnOnEquity")   # decimal
    margem_liquida = info.get("profitMargins")    # decimal

    # ROIC: usar returnOnAssets como proxy — consistente entre setores
    # (cálculo manual de Invested Capital é não-confiável para bancos/seguradoras)
    roic = info.get("returnOnAssets")  # decimal, ex: 0.05 = 5%

    # Debt metrics
    total_debt = info.get("totalDebt") or 0
    cash       = info.get("totalCash") or 0
    ebitda     = info.get("ebitda")
    divida_liquida_ebit = None
    if ebitda and ebitda != 0:
        net_debt = total_debt - cash
        divida_liquida_ebit = net_debt / abs(ebitda)

    # DY e DPA: calculados a partir do histórico real de dividendos (TTM)
    # Evita a inconsistência do campo dividendYield do yfinance para .SA tickers
    # (às vezes retorna decimal 0.08, às vezes percentual 8.0)
    dy  = None
    dpa = None
    try:
        one_year_ago = datetime.date.today() - datetime.timedelta(days=365)
        divs = stock.dividends
        if divs is not None and not divs.empty:
            ttm_total = 0.0
            for date, amount in divs.items():
                d = date.date() if hasattr(date, "date") else date
                if d >= one_year_ago:
                    ttm_total += float(amount)
            if ttm_total > 0:
                dpa = round(ttm_total, 4)
                dy  = ttm_total / price if price > 0 else None
    except Exception as e:
        print(f"[fundamentals] dividends error for {ticker}: {e}")

    # Per-share
    lpa = info.get("trailingEps")
    vpa = info.get("bookValue")

    # Growth & PEG
    crescimento = info.get("earningsGrowth")   # decimal, can be negative
    peg = info.get("pegRatio")
    if not peg and pl and crescimento and crescimento > 0:
        peg = pl / (crescimento * 100)

    # Liquidity (avg daily volume in BRL)
    avg_vol = info.get("averageVolume") or info.get("averageVolume10days") or 0
    liquidez_media = avg_vol * price

    setor    = info.get("sector")
    subsetor = info.get("industry")

    result = {
        "ticker":              ticker.upper(),
        "name":                info.get("longName") or info.get("shortName") or ticker,
        "price":               _r(price),
        "changePercent":       info.get("regularMarketChangePercent", 0),
        "marketCap":           market_cap,
        "shares":              shares,
        "pl":                  _r(pl),
        "pvp":                 _r(pvp),
        "roe":                 roe,
        "roic":                roic,
        "margemLiquida":       margem_liquida,
        "dividaLiquidaEbit":   _r(divida_liquida_ebit),
        "liquidezMedia":       liquidez_media,
        "dy":                  dy,
        "dpa":                 _r(dpa, 4),
        "lpa":                 _r(lpa, 4),
        "vpa":                 _r(vpa, 4),
        "crescimentoLucros":   crescimento,
        "pegRatio":            _r(peg),
        "setor":               setor,
        "subsetor":            subsetor,
        "fiftyTwoWeekHigh":    info.get("fiftyTwoWeekHigh"),
        "fiftyTwoWeekLow":     info.get("fiftyTwoWeekLow"),
    }
    _cache_set(f"fund:{ticker.upper()}", result)
    return result


def _r(v, d=2):
    """Round a float value; returns None for None/NaN/non-numeric."""
    if v is None:
        return None
    try:
        fv = float(v)
        return round(fv, d) if fv == fv else None
    except (TypeError, ValueError):
        return None


# ── Fundamentus FII cache ───────────────────────────────────────────
_fundamentus_fii_cache: dict | None = None
_fundamentus_fii_cache_ts: float = 0.0
_FUNDAMENTUS_TTL = 1800  # 30 min


def _parse_fundamentus_table(html: str) -> dict:
    """Parse the fundamentus FII results table. Returns {TICKER: {fields}} dict."""
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


def _get_fundamentus_fii_data(ticker: str) -> dict:
    """Fetch FII metrics from fundamentus.com.br (cached 30 min). Fail silently."""
    global _fundamentus_fii_cache, _fundamentus_fii_cache_ts
    try:
        now = time.time()
        if _fundamentus_fii_cache is None or (now - _fundamentus_fii_cache_ts) > _FUNDAMENTUS_TTL:
            url = "https://www.fundamentus.com.br/fii_resultado.php"
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
            })
            with urllib.request.urlopen(req, timeout=8) as r:
                html = r.read().decode("latin-1", errors="replace")
            _fundamentus_fii_cache = _parse_fundamentus_table(html)
            _fundamentus_fii_cache_ts = now
            print(f"[fundamentus] tabela carregada: {len(_fundamentus_fii_cache)} FIIs")
        raw = ticker.upper().replace(".SA", "")
        return _fundamentus_fii_cache.get(raw, {})
    except Exception as e:
        print(f"[fundamentus] erro: {e}")
        return {}


def _get_statusinvest_fii_data(ticker: str) -> dict:
    """
    Scraping de dados extras de FIIs via statusinvest.com.br.
    Retorna dict com campos extras ou {} em caso de falha.
    Falha silenciosa — nunca lança exceção.
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

        result = {}

        # Segmento — tenta múltiplos padrões de HTML do statusinvest
        _seg_patterns = [
            r'[Ss]egmento[^<]{0,30}</[^>]+>\s*<[^>]+>\s*([A-Za-záéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ /\-]{3,60})</[^>]+>',
            r'[Ss]egmento.*?<strong[^>]*>\s*([A-Za-záéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ /\-]{3,60}?)\s*</strong>',
            r'[Ss]egmento.*?class="[^"]*value[^"]*"[^>]*>\s*([A-Za-záéíóúâêîôûãõç /\-]{3,60}?)\s*<',
            r'"segmento"\s*[=:]\s*["\']([^"\']{3,60})["\']',
        ]
        for _pat in _seg_patterns:
            _m = re.search(_pat, html, re.IGNORECASE | re.DOTALL)
            if _m:
                _v = _normalize_fii_segmento(_m.group(1).strip())
                if _v:
                    result['segmento'] = _v
                    break

        # FFO Yield — ex: "9,12%" (DOTALL para cruzar tags HTML)
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

        # Vacância — ex: "3,20%" (DOTALL para cruzar tags HTML)
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
        m = re.search(r'Im[oó]veis[^0-9]{0,30}(\d+)', html, re.IGNORECASE)
        if m:
            try:
                result['numImoveis'] = int(m.group(1))
            except ValueError:
                pass

        # P/VP — ex: "0,97" ou "1.02"
        # Nota: usar .{0,200}? com DOTALL para cruzar tags HTML (ex: </h3><strong>)
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
        print(f"[statusinvest] erro para {ticker}: {e}")
        return {}


# Segmentos canônicos para os tickers da lista padrão — fonte: investidor10/statusinvest
_FII_SEGMENTO_MAP: dict[str, str] = {
    # ── Logística ─────────────────────────────────────────────────────────
    'HGLG11': 'Logística', 'BRCO11': 'Logística', 'XPLG11': 'Logística',
    'VILG11': 'Logística', 'BTLG11': 'Logística', 'LVBI11': 'Logística',
    'CXCE11': 'Logística', 'ALZR11': 'Logística', 'GLOG11': 'Logística',
    'TGAR11': 'Logística', 'RBLG11': 'Logística', 'HSLG11': 'Logística',
    'PATL11': 'Logística', 'BLOG11': 'Logística', 'BMLC11': 'Logística',
    'RBRL11': 'Logística', 'GLPF11': 'Logística', 'TRXB11': 'Logística',
    'AIEC11': 'Logística', 'FIIP11': 'Logística', 'BCIA11': 'Logística',
    'VHFA11': 'Logística', 'ARRI11': 'Logística', 'CPSH11': 'Logística',
    'BLCA11': 'Logística', 'SNFZ11': 'Logística',
    'CPLG11': 'Logística', 'ITRI11': 'Logística', 'XPIN11': 'Logística',
    'KISU11': 'Logística', 'SNEL11': 'Logística',
    # ── Shoppings ─────────────────────────────────────────────────────────
    'XPML11': 'Shoppings', 'VISC11': 'Shoppings', 'HSML11': 'Shoppings',
    'MALL11': 'Shoppings', 'FIGS11': 'Shoppings', 'ABCP11': 'Shoppings',
    'SHOP11': 'Shoppings', 'SHPP11': 'Shoppings', 'SHPH11': 'Shoppings',
    'BPML11': 'Shoppings', 'MGHT11': 'Shoppings',
    'GZIT11': 'Shoppings', 'PQDP11': 'Shoppings', 'PMLL11': 'Shoppings',
    'ADSH11': 'Shoppings', 'LASC11': 'Shoppings', 'HPDP11': 'Shoppings',
    # ── Lajes Corp. ───────────────────────────────────────────────────────
    'BRCR11': 'Lajes Corp.', 'RBRP11': 'Lajes Corp.', 'PVBI11': 'Lajes Corp.',
    'RCRB11': 'Lajes Corp.', 'JSRE11': 'Lajes Corp.', 'BTWR11': 'Lajes Corp.',
    'HGRE11': 'Lajes Corp.', 'VINO11': 'Lajes Corp.', 'SPTW11': 'Lajes Corp.',
    'RECT11': 'Lajes Corp.', 'EDGA11': 'Lajes Corp.', 'PATC11': 'Lajes Corp.',
    'BLMG11': 'Lajes Corp.', 'ALMI11': 'Lajes Corp.',
    'BLMO11': 'Lajes Corp.', 'BROF11': 'Lajes Corp.', 'BTAL11': 'Lajes Corp.',
    'FATN11': 'Lajes Corp.', 'GARE11': 'Lajes Corp.', 'HSRE11': 'Lajes Corp.',
    'MFII11': 'Lajes Corp.', 'RVBI11': 'Lajes Corp.', 'TEPP11': 'Lajes Corp.',
    'VIUR11': 'Lajes Corp.', 'XPCI11': 'Lajes Corp.', 'PORD11': 'Lajes Corp.',
    # ── Papel / CRI ───────────────────────────────────────────────────────
    'MXRF11': 'Papel/CRI', 'KNCR11': 'Papel/CRI', 'IRDM11': 'Papel/CRI',
    'BCRI11': 'Papel/CRI', 'HGCR11': 'Papel/CRI', 'VRTA11': 'Papel/CRI',
    'RBRY11': 'Papel/CRI', 'MCCI11': 'Papel/CRI', 'CPTS11': 'Papel/CRI',
    'KNIP11': 'Papel/CRI', 'KNHF11': 'Papel/CRI', 'KNHY11': 'Papel/CRI',
    'KNCA11': 'Papel/CRI', 'KNSC11': 'Papel/CRI', 'VCRR11': 'Papel/CRI',
    'VCRI11': 'Papel/CRI', 'VCJR11': 'Papel/CRI', 'RECR11': 'Papel/CRI',
    'RBHG11': 'Papel/CRI', 'RBHY11': 'Papel/CRI', 'RBRR11': 'Papel/CRI',
    'CVBI11': 'Papel/CRI', 'DEVA11': 'Papel/CRI', 'PLRI11': 'Papel/CRI',
    'BIME11': 'Papel/CRI', 'BTCI11': 'Papel/CRI', 'HCTR11': 'Papel/CRI',
    'HCRI11': 'Papel/CRI', 'HBCR11': 'Papel/CRI', 'HABT11': 'Papel/CRI',
    'BFCC11': 'Papel/CRI', 'BGRB11': 'Papel/CRI', 'GCRA11': 'Papel/CRI',
    'GCRI11': 'Papel/CRI', 'GLCR11': 'Papel/CRI', 'ICRI11': 'Papel/CRI',
    'KCRE11': 'Papel/CRI', 'KORE11': 'Papel/CRI', 'MCRE11': 'Papel/CRI',
    'NCRI11': 'Papel/CRI', 'OCRE11': 'Papel/CRI', 'RCFF11': 'Papel/CRI',
    'RCRI11': 'Papel/CRI', 'RDLI11': 'Papel/CRI', 'SNCI11': 'Papel/CRI',
    'VVRI11': 'Papel/CRI', 'VVCR11': 'Papel/CRI', 'IBCR11': 'Papel/CRI',
    'CRFF11': 'Papel/CRI', 'CRAA11': 'Papel/CRI', 'RBCO11': 'Papel/CRI',
    'RBDS11': 'Papel/CRI', 'RBFM11': 'Papel/CRI', 'RBFY11': 'Papel/CRI',
    'RBIR11': 'Papel/CRI', 'RBOP11': 'Papel/CRI', 'RBRD11': 'Papel/CRI',
    'RBRI11': 'Papel/CRI', 'RBRS11': 'Papel/CRI', 'RBTS11': 'Papel/CRI',
    'RBRX11': 'Papel/CRI', 'URPR11': 'Papel/CRI', 'RRCI11': 'Papel/CRI',
    'DCRA11': 'Papel/CRI', 'FLCR11': 'Papel/CRI', 'NCRA11': 'Papel/CRI',
    'VVMR11': 'Papel/CRI', 'DVFF11': 'Papel/CRI', 'CXRI11': 'Papel/CRI',
    'BBRC11': 'Papel/CRI', 'JGPX11': 'Papel/CRI', 'FZDA11': 'Papel/CRI',
    'FZDB11': 'Papel/CRI', 'RZLC11': 'Papel/CRI', 'RZZR11': 'Papel/CRI',
    'AFHI11': 'Papel/CRI', 'AZPL11': 'Papel/CRI', 'BTHF11': 'Papel/CRI',
    'CACR11': 'Papel/CRI', 'CLIN11': 'Papel/CRI', 'CPUR11': 'Papel/CRI',
    'EMET11': 'Papel/CRI', 'GSFI11': 'Papel/CRI', 'HIRE11': 'Papel/CRI',
    'HSAF11': 'Papel/CRI', 'IBBP11': 'Papel/CRI', 'IRIM11': 'Papel/CRI',
    'KNUQ11': 'Papel/CRI', 'MANA11': 'Papel/CRI', 'PCIP11': 'Papel/CRI',
    'PSEC11': 'Papel/CRI', 'RPRI11': 'Papel/CRI', 'RZAT11': 'Papel/CRI',
    'SPXS11': 'Papel/CRI', 'TOPP11': 'Papel/CRI', 'TRBL11': 'Papel/CRI',
    'TVRI11': 'Papel/CRI', 'VGHF11': 'Papel/CRI', 'VGIA11': 'Papel/CRI',
    'VGIP11': 'Papel/CRI', 'VGRI11': 'Papel/CRI', 'VXXV11': 'Papel/CRI',
    # ── Residencial ───────────────────────────────────────────────────────
    'RZAK11': 'Residencial', 'HOSI11': 'Residencial',
    'NAUI11': 'Residencial', 'PLCA11': 'Residencial',
    'APTO11': 'Residencial', 'LIFE11': 'Residencial',
    'JFLL11': 'Residencial',
    # ── Híbrido / FOF ─────────────────────────────────────────────────────
    'HGRU11': 'Híbrido', 'VGIR11': 'Híbrido', 'GGRC11': 'Híbrido',
    'GTWR11': 'Híbrido', 'TRXF11': 'Híbrido', 'RBRF11': 'Híbrido',
    'BCFF11': 'Híbrido', 'BPFF11': 'Híbrido', 'RFOF11': 'Híbrido',
    'KNRI11': 'Híbrido', 'HFOF11': 'Híbrido', 'KFOF11': 'Híbrido',
    'CPOF11': 'Híbrido', 'BBFO11': 'Híbrido', 'SNFF11': 'Híbrido',
    'JSAF11': 'Híbrido',  'RBVA11': 'Híbrido',
    'AURB11': 'Híbrido', 'BBIG11': 'Híbrido', 'MCLO11': 'Híbrido',
    # ── Agronegócio ───────────────────────────────────────────────────────
    'RZAG11': 'Agro', 'IAGR11': 'Agro', 'HAAA11': 'Agro',
    'LMAI11': 'Agro', 'SNAG11': 'Agro', 'PLAG11': 'Agro',
    'OIAG11': 'Agro', 'FGAA11': 'Agro', 'RMAI11': 'Agro',
    'EGAF11': 'Agro', 'QAGR11': 'Agro', 'AGRX11': 'Agro',
    'ZAGH11': 'Agro', 'ZAVC11': 'Agro', 'ZAVI11': 'Agro',
    'ZIFI11': 'Agro', 'PQAG11': 'Agro', 'LSAG11': 'Agro',
    'RZTR11': 'Agro', 'GCOI11': 'Agro',
    'MIDW11': 'Agro', 'RURA11': 'Agro', 'VCRA11': 'Agro', 'XPCA11': 'Agro',
    # ── Hotel ─────────────────────────────────────────────────────────────
    'HTMX11': 'Hotel', 'EURO11': 'Hotel',
    # ── Educacional ───────────────────────────────────────────────────────
    'FAED11': 'Educacional', 'FCFL11': 'Educacional',
}


def _normalize_fii_segmento(raw: str) -> str | None:
    """Normaliza label de segmento do statusinvest/investidor10 para valor canônico."""
    s = raw.lower()
    if 'logíst' in s or 'logist' in s:                                    return 'Logística'
    if 'shop' in s or 'shopping' in s:                                    return 'Shoppings'
    if 'laje' in s or 'corporativ' in s or 'escritório' in s:            return 'Lajes Corp.'
    if 'papel' in s or 'recebív' in s or 'recebi' in s or 'cri' in s:   return 'Papel/CRI'
    if 'resid' in s or 'habitac' in s or 'living' in s:                  return 'Residencial'
    if 'agro' in s or 'agríc' in s or 'rural' in s:                      return 'Agro'
    if 'hotel' in s or 'hoteleiro' in s or 'hospedagem' in s:            return 'Hotel'
    if 'híbrid' in s or 'hibrid' in s or 'fof' in s or 'fundo de fund' in s: return 'Híbrido'
    return None  # desconhecido — não retornar lixo


def get_fii_data(ticker: str) -> dict:
    """Fetch FII data from yfinance + statusinvest scraping."""
    cached = _cache_get(f"fii:{ticker.upper()}")
    if cached is not None:
        return cached

    try:
        import yfinance as yf
    except ImportError:
        return {"code": "NO_YFINANCE", "error": "yfinance não instalado"}

    symbol = ticker.upper()
    if not symbol.endswith(".SA"):
        symbol += ".SA"

    try:
        stock = yf.Ticker(symbol)
        info = stock.info or {}
    except Exception as e:
        return {"code": "ERROR", "error": str(e)}

    price = (info.get("regularMarketPrice")
          or info.get("currentPrice")
          or info.get("previousClose"))

    if not price:
        return {"code": "NOT_FOUND", "error": f"Ticker {ticker} não encontrado"}

    avg_vol  = info.get("averageVolume") or 0
    liquidez = _r(avg_vol * price) if avg_vol and price else None

    # DY e DPA: TTM — mesmo padrão de get_fundamentals (mais confiável que info.dividendYield)
    dy  = None
    dpa = None
    try:
        one_year_ago = datetime.date.today() - datetime.timedelta(days=365)
        divs = stock.dividends
        if divs is not None and not divs.empty:
            ttm_total = 0.0
            for date, amount in divs.items():
                d = date.date() if hasattr(date, "date") else date
                if d >= one_year_ago:
                    ttm_total += float(amount)
            if ttm_total > 0:
                dpa = round(ttm_total, 4)
                dy  = ttm_total / price if price > 0 else None
    except Exception:
        dy = _normalize_dy(info.get("dividendYield"))

    result = {
        "ticker":           ticker.upper().replace(".SA", ""),
        "name":             info.get("longName") or info.get("shortName") or ticker.upper(),
        "price":            price,
        "changePercent":    info.get("regularMarketChangePercent"),
        "dy":               dy,
        "pvp":              _r(info.get("priceToBook")),
        "dpa":              _r(dpa, 4),
        "marketCap":        info.get("marketCap"),
        "liquidez":         liquidez,
        "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
        "fiftyTwoWeekLow":  info.get("fiftyTwoWeekLow"),
        # campos scraping — segmento pré-populado pelo mapa canônico
        "ffoYield":   None,
        "vacancia":   None,
        "numImoveis": None,
        "segmento":   _FII_SEGMENTO_MAP.get(ticker.upper().replace(".SA", "")),
    }

    # Enriquecer com statusinvest (sobrescreve campos None; segmento só sobrescrito se scraping retornar valor válido)
    try:
        scraped = _get_statusinvest_fii_data(ticker)
        for k, v in scraped.items():
            if v is not None:
                result[k] = v
    except Exception:
        pass

    # Fallback: fundamentus para campos que statusinvest não retornou
    _fii_nullable = ('ffoYield', 'vacancia', 'numImoveis', 'pvp')
    if any(result.get(k) is None for k in _fii_nullable):
        try:
            fund = _get_fundamentus_fii_data(ticker)
            for k in _fii_nullable:
                if result.get(k) is None and fund.get(k) is not None:
                    result[k] = fund[k]
        except Exception:
            pass

    # Histórico de dividendos — últimos 24 pagamentos, mais recente primeiro
    dividends_list = []
    try:
        divs = stock.dividends
        if divs is not None and not divs.empty:
            for ts, amount in divs.sort_index(ascending=False).items():
                dividends_list.append({
                    "date": ts.strftime("%Y-%m-%d"),
                    "amount": round(float(amount), 4)
                })
                if len(dividends_list) >= 24:
                    break
    except Exception:
        pass
    result["dividends"] = dividends_list
    _cache_set(f"fii:{ticker.upper()}", result)
    return result


def get_cdi_data(date_from=None, date_to=None):
    today = datetime.date.today()
    if date_to is None:
        dt_to = today
    else:
        dt_to = datetime.datetime.strptime(date_to, "%Y-%m-%d").date()
    if date_from is None:
        dt_from = today - datetime.timedelta(days=365)
    else:
        dt_from = datetime.datetime.strptime(date_from, "%Y-%m-%d").date()

    fmt = lambda d: d.strftime("%d/%m/%Y")
    url = (
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados"
        f"?formato=json&dataInicial={fmt(dt_from)}&dataFinal={fmt(dt_to)}"
    )
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        accumulated = 1.0
        for item in data:
            accumulated *= 1 + float(item["valor"]) / 100
        return {
            "accumulated": round(accumulated - 1, 6),
            "from": dt_from.isoformat(),
            "to": dt_to.isoformat(),
            "days": len(data),
        }
    except Exception as e:
        return {
            "accumulated": 0.105,
            "from": dt_from.isoformat(),
            "to": dt_to.isoformat(),
            "days": 252,
            "fallback": True,
        }


_EXCHANGE_TICKERS = {"USDBRL": "USDBRL=X", "EURBRL": "EURBRL=X"}

def get_exchange_rate(pair):
    if yf is None:
        return {"code": "NO_YFINANCE"}
    try:
        yf_ticker = _EXCHANGE_TICKERS.get(pair, pair)
        info = yf.Ticker(yf_ticker).info
        rate = info.get("regularMarketPrice") or info.get("bid") or info.get("previousClose")
        if not rate:
            raise ValueError("no price field")
        return {"pair": pair, "rate": float(rate)}
    except Exception as e:
        return {"code": "ERROR", "message": str(e)}


def get_portfolio_history(tickers, dates):
    if not tickers or not dates:
        return {}
    if yf is None:
        return {t: {d: None for d in dates} for t in tickers}
    all_dates = sorted(set(dates))
    min_date = all_dates[0]
    max_dt = datetime.datetime.strptime(max(all_dates), "%Y-%m-%d") + datetime.timedelta(days=7)
    max_date = max_dt.strftime("%Y-%m-%d")
    result = {}
    for ticker in tickers:
        yf_ticker = ticker if ("." in ticker or "=" in ticker) else ticker + ".SA"
        try:
            hist = yf.download(yf_ticker, start=min_date, end=max_date, progress=False, auto_adjust=True)
            if hist.empty:
                hist = yf.download(ticker, start=min_date, end=max_date, progress=False, auto_adjust=True)
            ticker_prices = {}
            for date_str in all_dates:
                date_dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                subset = hist[hist.index >= date_dt]
                ticker_prices[date_str] = float(subset["Close"].iloc[0]) if not subset.empty else None
            result[ticker] = ticker_prices
        except Exception:
            result[ticker] = {d: None for d in all_dates}
    return result



class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path

        if path == "/" or path == "":
            self.send_response(302)
            self.send_header("Location", "/home.html")
            self.end_headers()
        elif path.startswith("/api/quote/"):
            ticker = path[len("/api/quote/"):].strip("/")
            if not ticker:
                self.send_error(400, "Ticker required")
                return
            print(f"[API] quote → {ticker}")
            data = get_stock_data(ticker)
            self._json(data)
        elif path.startswith("/api/fundamentals/"):
            ticker = path[len("/api/fundamentals/"):].strip("/")
            if not ticker:
                self.send_error(400, "Ticker required")
                return
            print(f"[API] fundamentals → {ticker}")
            data = get_fundamentals(ticker)
            self._json(data)
        elif path.startswith("/api/fii/"):
            ticker = path[len("/api/fii/"):].strip("/")
            if not ticker:
                self.send_error(400, "Ticker required")
                return
            print(f"[API] fii → {ticker}")
            data = get_fii_data(ticker)
            self._json(data)
        elif path.startswith("/api/cdi"):
            qs = parse_qs(urlparse(self.path).query)
            date_from = qs.get("from", [None])[0]
            date_to   = qs.get("to",   [None])[0]
            print(f"[API] cdi → from={date_from} to={date_to}")
            self._json(get_cdi_data(date_from, date_to))
        elif path.startswith("/api/exchange/"):
            pair = path.split("/api/exchange/")[1].strip("/").upper()
            print(f"[API] exchange → {pair}")
            self._json(get_exchange_rate(pair))
        elif path == "/api/b3-tickers":
            tickers = get_b3_tickers()
            self._json({"tickers": tickers, "count": len(tickers)})
        elif path.startswith("/api/batch-fundamentals"):
            qs = parse_qs(urlparse(self.path).query)
            raw = qs.get("tickers", [""])[0]
            tickers = [t.strip() for t in raw.split(",") if t.strip()]
            if not tickers:
                self.send_error(400, "tickers param required")
                return
            print(f"[API] batch-fundamentals → {len(tickers)} tickers")
            with ThreadPoolExecutor(max_workers=min(len(tickers), 4)) as ex:
                results = dict(zip(tickers, ex.map(get_fundamentals, tickers)))
            self._json(results)
        elif path.startswith("/api/batch-fii"):
            qs = parse_qs(urlparse(self.path).query)
            raw = qs.get("tickers", [""])[0]
            tickers = [t.strip() for t in raw.split(",") if t.strip()]
            if not tickers:
                self.send_error(400, "tickers param required")
                return
            print(f"[API] batch-fii → {len(tickers)} tickers")
            with ThreadPoolExecutor(max_workers=min(len(tickers), 4)) as ex:
                results = dict(zip(tickers, ex.map(get_fii_data, tickers)))
            self._json(results)
        else:
            super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body)
        except Exception:
            self._json({"code": "BAD_REQUEST"}, 400)
            return
        path = self.path.split("?")[0].rstrip("/")
        if path == "/api/portfolio/history":
            tickers = payload.get("tickers", [])
            dates   = payload.get("dates", [])
            print(f"[API] portfolio/history → {len(tickers)} tickers, {len(dates)} dates")
            self._json(get_portfolio_history(tickers, dates))
        else:
            self._json({"code": "NOT_FOUND"}, 404)

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"  {fmt % args}")


if __name__ == "__main__":
    print("=" * 50)
    print("  Valuation DCF · B3 — Servidor Local")
    print("=" * 50)

    # Garante yfinance instalado
    try:
        import yfinance as yf
        print(f"✓ yfinance {yf.__version__}")
    except ImportError:
        print("  Instalando yfinance...")
        ret = os.system(f'"{sys.executable}" -m pip install yfinance --quiet')
        if ret != 0:
            print("  ERRO: falha ao instalar yfinance. Execute manualmente:")
            print(f"    pip install yfinance")
        else:
            print("✓ yfinance instalado")

    print(f"\n  Acesse: http://localhost:{PORT}")
    print("  Encerrar: Ctrl+C\n")

    server = ThreadingHTTPServer(("", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor encerrado.")
