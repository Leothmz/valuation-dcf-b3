import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import pytest
import unittest.mock as mock
import pandas as pd

import server


# ── Dados de mock ──────────────────────────────────────────────────

MOCK_PRICE = 35.50
MOCK_SHARES = 10_000_000

MOCK_INFO = {
    "longName": "Petróleo Brasileiro S.A.",
    "regularMarketPrice": MOCK_PRICE,
    "regularMarketChangePercent": 0.02,
    "fiftyTwoWeekHigh": 42.0,
    "fiftyTwoWeekLow": 28.0,
    "sharesOutstanding": MOCK_SHARES,
    "returnOnEquity": 0.20,
    "dividendYield": 0.06,
    "marketCap": 355_000_000,
}

def _make_financials():
    """DataFrame com formato yfinance: index=métricas, colunas=datas"""
    dates = pd.to_datetime(["2023-12-31", "2022-12-31", "2021-12-31"])
    ni = pd.Series([5_000_000, 4_000_000, 3_000_000], index=dates)
    return pd.DataFrame({"Net Income": ni}).T

def _make_dividends():
    """Série com dividendos: índice=datas, valor=dividendo por ação"""
    return pd.Series({
        pd.Timestamp("2023-06-30"): 0.10,
        pd.Timestamp("2023-12-31"): 0.10,
        pd.Timestamp("2022-06-30"): 0.08,
        pd.Timestamp("2022-12-31"): 0.08,
    })

def _make_mock_ticker(info=None, financials=None, dividends=None):
    m = mock.MagicMock()
    m.info = info if info is not None else MOCK_INFO
    m.financials = financials if financials is not None else _make_financials()
    m.dividends = dividends if dividends is not None else _make_dividends()
    return m


# ── Testes: get_b3_tickers ─────────────────────────────────────────

def test_get_b3_tickers_not_empty():
    tickers = server.get_b3_tickers()
    assert isinstance(tickers, list)
    assert len(tickers) > 0


# ── Testes: normalização de ticker ────────────────────────────────

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_ticker_sa_suffix_added(mock_i10, mock_ticker_cls):
    mock_ticker_cls.return_value = _make_mock_ticker()
    server.get_stock_data("petr4")
    mock_ticker_cls.assert_called_once_with("PETR4.SA")

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_ticker_sa_suffix_not_duplicated(mock_i10, mock_ticker_cls):
    mock_ticker_cls.return_value = _make_mock_ticker()
    server.get_stock_data("PETR4.SA")
    mock_ticker_cls.assert_called_once_with("PETR4.SA")


# ── Testes: erros ─────────────────────────────────────────────────

@mock.patch.dict('sys.modules', {'yfinance': None})
def test_no_yfinance_error():
    result = server.get_stock_data("PETR4")
    assert result["code"] == "NO_YFINANCE"

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_not_found_when_no_price(mock_i10, mock_ticker_cls):
    info = {**MOCK_INFO, "regularMarketPrice": None, "currentPrice": None, "previousClose": None}
    mock_ticker_cls.return_value = _make_mock_ticker(info=info)
    result = server.get_stock_data("INEXISTENTE")
    assert result["code"] == "NOT_FOUND"


# ── Testes: cálculo de payout ─────────────────────────────────────

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_payout_calculation(mock_i10, mock_ticker_cls):
    # shares=10M, net_income_2023=5M, divs_2023=0.20/ação
    # payout_2023 = (0.20 * 10M) / 5M = 0.40
    # payout_2022 = (0.16 * 10M) / 4M = 0.40
    # média = 0.40
    mock_ticker_cls.return_value = _make_mock_ticker()
    result = server.get_stock_data("PETR4")
    assert result["payout"] is not None
    assert abs(result["payout"] - 0.40) < 0.01

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_payout_filters_outliers(mock_i10, mock_ticker_cls):
    # Dividendos absurdamente altos → payout > 2 → descartado
    divs = pd.Series({
        pd.Timestamp("2023-12-31"): 5.0,  # 5.0 * 10M / 5M = 10x payout → descartado
    })
    info = {**MOCK_INFO, "sharesOutstanding": 10_000_000}
    fin = _make_financials()  # net_income_2023 = 5M
    mock_ticker_cls.return_value = _make_mock_ticker(info=info, financials=fin, dividends=divs)
    result = server.get_stock_data("PETR4")
    # payout de 50x é descartado → payout deve ser None (nenhum ponto válido)
    assert result["payout"] is None


# ── Testes: histórico ─────────────────────────────────────────────

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_history_limited_to_5_years(mock_i10, mock_ticker_cls):
    dates = pd.to_datetime([f"{y}-12-31" for y in [2023, 2022, 2021, 2020, 2019, 2018]])
    ni = pd.Series([6e6, 5e6, 4e6, 3e6, 2e6, 1e6], index=dates)
    fin = pd.DataFrame({"Net Income": ni}).T
    mock_ticker_cls.return_value = _make_mock_ticker(financials=fin)
    result = server.get_stock_data("PETR4")
    assert len(result["netIncomeHistory"]) <= 5

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[
    {"year": 2023, "netIncome": 9_000_000},
    {"year": 2022, "netIncome": 8_000_000},
])
def test_history_merges_investidor10_over_yfinance(mock_i10, mock_ticker_cls):
    # yfinance retorna 2023=5M; investidor10 retorna 2023=9M → i10 vence
    mock_ticker_cls.return_value = _make_mock_ticker()
    result = server.get_stock_data("PETR4")
    entry_2023 = next(h for h in result["netIncomeHistory"] if h["year"] == 2023)
    assert entry_2023["netIncome"] == 9_000_000


# ── Testes: investidor10 ──────────────────────────────────────────

@mock.patch('urllib.request.urlopen', side_effect=Exception("network error"))
def test_investidor10_returns_empty_on_network_error(mock_urlopen):
    result = server._get_investidor10_net_income("PETR4")
    assert result == []


# ── Testes: get_fundamentals ──────────────────────────────────────

@mock.patch('yfinance.Ticker')
def test_fundamentals_not_found_when_no_price(mock_ticker_cls):
    info = {**MOCK_INFO, "regularMarketPrice": None, "currentPrice": None, "previousClose": None}
    mock_ticker_cls.return_value = _make_mock_ticker(info=info)
    result = server.get_fundamentals("INEXISTENTE")
    assert result["code"] == "NOT_FOUND"

@mock.patch('yfinance.Ticker')
def test_fundamentals_divida_liquida_ebit(mock_ticker_cls):
    # net_debt = 100M - 20M = 80M; ebitda = 40M; ratio = 2.0
    info = {
        **MOCK_INFO,
        "totalDebt": 100_000_000,
        "totalCash": 20_000_000,
        "ebitda": 40_000_000,
        "trailingPE": 10.0,
        "profitMargins": 0.20,
        "returnOnEquity": 0.20,
        "returnOnAssets": 0.10,
        "dividendYield": 0.06,
        "trailingEps": 3.0,
        "bookValue": 15.0,
        "earningsGrowth": 0.15,
        "averageVolume": 5_000_000,
        "sector": "Energy",
        "industry": "Oil & Gas",
    }
    mock_ticker_cls.return_value = _make_mock_ticker(info=info, dividends=_make_dividends())
    result = server.get_fundamentals("PETR4")
    assert result["dividaLiquidaEbit"] is not None
    assert abs(result["dividaLiquidaEbit"] - 2.0) < 0.01

@mock.patch('yfinance.Ticker')
def test_fundamentals_dy_from_ttm_dividends(mock_ticker_cls):
    # Usa datas relativas ao dia atual para garantir que caem dentro da janela TTM (365 dias)
    # TTM total = 0.20/ação → DY = 0.20/35.50 ≈ 0.00563
    from datetime import date, timedelta
    today = date.today()
    ttm_divs = pd.Series({
        pd.Timestamp(today - timedelta(days=60)):  0.10,
        pd.Timestamp(today - timedelta(days=240)): 0.10,
    })
    info = {**MOCK_INFO, "dividendYield": 0.99}  # valor errado do yfinance deve ser ignorado
    mock_ticker_cls.return_value = _make_mock_ticker(info=info, dividends=ttm_divs)
    result = server.get_fundamentals("PETR4")
    # O DY calculado via TTM deve ser ~ 0.20/35.50, não 0.99
    assert result["dy"] is not None
    assert abs(result["dy"] - 0.20 / MOCK_PRICE) < 0.001
