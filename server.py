#!/usr/bin/env python3
"""
Servidor local - Valuation DCF B3
Serve arquivos estáticos + API de dados via yfinance (gratuito, sem token)
"""

import json, os, sys, urllib.parse, urllib.request, re
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

PORT = 8000
BASE_DIR = Path(__file__).parent


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
            print(f"[API] → {ticker}")
            data = get_stock_data(ticker)
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

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

    server = HTTPServer(("", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor encerrado.")
