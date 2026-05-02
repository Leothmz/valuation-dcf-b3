import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import http.client
import json
import threading
import pytest
from unittest.mock import patch
from http.server import ThreadingHTTPServer

import server as srv

MOCK_STOCK = {
    "ticker": "PETR4", "name": "Petróleo Brasileiro", "price": 35.5,
    "changePercent": 0.02, "fiftyTwoWeekHigh": 42.0, "fiftyTwoWeekLow": 28.0,
    "sharesOutstanding": 10_000_000, "roe": 0.20, "payout": 0.40,
    "netIncomeHistory": [{"year": 2023, "netIncome": 5_000_000}],
    "marketCap": 355_000_000, "dividendYield": 0.06,
}

MOCK_FUND = {**MOCK_STOCK, "pl": 8.5, "pvp": 1.2, "margemLiquida": 0.15,
             "dividaLiquidaEbit": 2.0, "roic": 0.12, "dy": 0.06,
             "dpa": 2.10, "lpa": 4.2, "vpa": 29.5, "liquidezMedia": 500_000_000,
             "crescimentoLucros": 0.10, "pegRatio": 0.85,
             "setor": "Energy", "subsetor": "Oil & Gas",
             "fiftyTwoWeekHigh": 42.0, "fiftyTwoWeekLow": 28.0}


@pytest.fixture(scope="module")
def server_port():
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), srv.Handler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    yield port
    httpd.shutdown()


def _get(port, path, mock_stock=None, mock_fund=None):
    patches = []
    if mock_stock is not None:
        patches.append(patch('server.get_stock_data', return_value=mock_stock))
    if mock_fund is not None:
        patches.append(patch('server.get_fundamentals', return_value=mock_fund))
    for p in patches:
        p.start()
    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        conn.request("GET", path)
        resp = conn.getresponse()
        body = resp.read()
        return resp, body
    finally:
        for p in patches:
            p.stop()


# ── Testes ────────────────────────────────────────────────────────

def test_root_redirects_to_home(server_port):
    resp, _ = _get(server_port, "/")
    assert resp.status == 302
    assert resp.getheader("Location") == "/home.html"

def test_quote_returns_200_json(server_port):
    resp, body = _get(server_port, "/api/quote/PETR4", mock_stock=MOCK_STOCK)
    assert resp.status == 200
    assert "application/json" in resp.getheader("Content-Type")
    data = json.loads(body)
    assert data["ticker"] == "PETR4"

def test_quote_calls_get_stock_data(server_port):
    with patch('server.get_stock_data', return_value=MOCK_STOCK) as mock_fn:
        conn = http.client.HTTPConnection("127.0.0.1", server_port, timeout=5)
        conn.request("GET", "/api/quote/VALE3")
        conn.getresponse().read()
        mock_fn.assert_called_once_with("VALE3")

def test_fundamentals_returns_200_json(server_port):
    resp, body = _get(server_port, "/api/fundamentals/VALE3", mock_fund=MOCK_FUND)
    assert resp.status == 200
    assert "application/json" in resp.getheader("Content-Type")
    data = json.loads(body)
    assert data["ticker"] == "PETR4"

def test_b3_tickers_returns_json(server_port):
    resp, body = _get(server_port, "/api/b3-tickers")
    assert resp.status == 200
    data = json.loads(body)
    assert "tickers" in data
    assert "count" in data
    assert data["count"] == len(data["tickers"])
    assert data["count"] > 0

def test_quote_missing_ticker_returns_400(server_port):
    resp, _ = _get(server_port, "/api/quote/")
    assert resp.status == 400

def test_cors_header_present(server_port):
    resp, _ = _get(server_port, "/api/quote/PETR4", mock_stock=MOCK_STOCK)
    assert resp.getheader("Access-Control-Allow-Origin") == "*"
