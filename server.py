#!/usr/bin/env python3
"""
Servidor local - Valuation DCF B3
Serve arquivos estáticos + API de dados via yfinance (gratuito, sem token)
"""

import datetime, json, os, sys, urllib.parse, urllib.request, re
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

PORT = 8000
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
        "dividendYield":     info.get("dividendYield"),
    }


def get_fundamentals(ticker: str) -> dict:
    """Returns extended fundamental data for screening and ranking."""
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

    def _r(v, d=2):
        return round(v, d) if v is not None and v == v else None

    return {
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
        elif path == "/api/b3-tickers":
            tickers = get_b3_tickers()
            self._json({"tickers": tickers, "count": len(tickers)})
        else:
            super().do_GET()

    def _json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
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
