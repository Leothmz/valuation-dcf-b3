"""
Tests for api/adapters/yfinance_adapter.py

All yfinance I/O is mocked — no network calls.
"""
from unittest.mock import MagicMock, patch
import pytest
from api.adapters.yfinance_adapter import (
    fetch_stock,
    fetch_fundamentals,
    fetch_fii,
    _normalize_dy,
    _normalize_ticker,
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_mock_ticker(info=None, fast_info=None, income_stmt=None, dividends=None, balance_sheet=None):
    ticker = MagicMock()
    ticker.info = info or {}
    if fast_info is not None:
        ticker.fast_info = fast_info
    else:
        ticker.fast_info = MagicMock()
        ticker.fast_info.last_price = None
    ticker.income_stmt = income_stmt
    ticker.financials = income_stmt  # some yfinance versions use .financials
    ticker.dividends = dividends
    ticker.balance_sheet = balance_sheet
    return ticker


# ── _normalize_ticker ──────────────────────────────────────────────────────────

def test_normalize_ticker_adds_sa():
    assert _normalize_ticker("PETR4") == "PETR4.SA"


def test_normalize_ticker_keeps_sa():
    assert _normalize_ticker("PETR4.SA") == "PETR4.SA"


def test_normalize_ticker_uppercases():
    assert _normalize_ticker("petr4") == "PETR4.SA"


def test_normalize_ticker_already_upper_with_sa():
    assert _normalize_ticker("MXRF11.SA") == "MXRF11.SA"


# ── _normalize_dy ──────────────────────────────────────────────────────────────

def test_normalize_dy_none():
    assert _normalize_dy(None) is None


def test_normalize_dy_decimal_unchanged():
    # 6% as decimal — should stay as-is
    result = _normalize_dy(0.06)
    assert result == pytest.approx(0.06)


def test_normalize_dy_large_value_normalized():
    # 8.49 (percent form) → 0.0849
    result = _normalize_dy(8.49)
    assert result == pytest.approx(0.0849)


def test_normalize_dy_boundary_one():
    # Exactly 1.0 — treated as decimal (100% yield, unusual but valid)
    assert _normalize_dy(1.0) == pytest.approx(1.0)


def test_normalize_dy_just_above_one():
    # 1.01 → normalized to ~0.0101
    assert _normalize_dy(1.01) == pytest.approx(0.0101)


# ── fetch_stock ────────────────────────────────────────────────────────────────

def test_fetch_stock_not_found_raises():
    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info={"regularMarketPrice": None})
        mock_ticker.fast_info.last_price = None
        mock_yf.Ticker.return_value = mock_ticker
        with pytest.raises(ValueError, match="NOT_FOUND"):
            fetch_stock("INVALID")


def test_fetch_stock_no_yfinance_raises():
    with patch("api.adapters.yfinance_adapter.yf", None):
        with pytest.raises(ImportError, match="NO_YFINANCE"):
            fetch_stock("PETR4")


def test_fetch_stock_returns_stock_quote():
    from api.models import StockQuote

    mock_info = {
        "regularMarketPrice": 38.5,
        "regularMarketChangePercent": 0.02,
        "shortName": "Petrobras",
        "fiftyTwoWeekHigh": 45.0,
        "fiftyTwoWeekLow": 28.0,
        "sharesOutstanding": 13_000_000_000,
        "returnOnEquity": 0.25,
        "marketCap": 500_000_000_000,
        "dividendYield": 0.12,
    }
    mock_income = MagicMock()
    mock_income.empty = True
    mock_dividends = MagicMock()
    mock_dividends.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(
            info=mock_info,
            income_stmt=mock_income,
            dividends=mock_dividends,
        )
        mock_ticker.fast_info.last_price = 38.5
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_stock("PETR4")

    assert isinstance(result, StockQuote)
    assert result.ticker == "PETR4"
    assert result.price == pytest.approx(38.5)
    assert result.roe == pytest.approx(0.25)
    assert result.dividendYield == pytest.approx(0.12)
    assert result.sharesOutstanding == 13_000_000_000
    assert result.netIncomeHistory == []


def test_fetch_stock_ticker_uppercased():
    """ticker field in result is always uppercase."""
    mock_info = {"regularMarketPrice": 10.0}
    mock_income = MagicMock(); mock_income.empty = True
    mock_divs = MagicMock(); mock_divs.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info=mock_info, income_stmt=mock_income, dividends=mock_divs)
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_stock("wege3")

    assert result.ticker == "WEGE3"


def test_fetch_stock_dy_normalized():
    """dividendYield > 1 is normalized to decimal."""
    mock_info = {
        "regularMarketPrice": 20.0,
        "dividendYield": 9.5,  # percent form
    }
    mock_income = MagicMock(); mock_income.empty = True
    mock_divs = MagicMock(); mock_divs.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info=mock_info, income_stmt=mock_income, dividends=mock_divs)
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_stock("BBAS3")

    assert result.dividendYield == pytest.approx(0.095)


# ── fetch_fundamentals ─────────────────────────────────────────────────────────

def test_fetch_fundamentals_no_yfinance_raises():
    with patch("api.adapters.yfinance_adapter.yf", None):
        with pytest.raises(ImportError, match="NO_YFINANCE"):
            fetch_fundamentals("PETR4")


def test_fetch_fundamentals_not_found_raises():
    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info={})
        mock_ticker.fast_info.last_price = None
        mock_yf.Ticker.return_value = mock_ticker
        with pytest.raises(ValueError, match="NOT_FOUND"):
            fetch_fundamentals("INVALID")


def test_fetch_fundamentals_returns_model():
    from api.models import FundamentalsData

    mock_info = {
        "regularMarketPrice": 45.0,
        "trailingPE": 12.5,
        "priceToBook": 3.2,
        "returnOnEquity": 0.30,
        "profitMargins": 0.18,
        "returnOnAssets": 0.08,
        "marketCap": 200_000_000_000,
        "sector": "Energy",
        "industry": "Oil & Gas",
        "trailingEps": 3.6,
        "bookValue": 14.0,
    }
    mock_divs = MagicMock(); mock_divs.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info=mock_info, dividends=mock_divs)
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_fundamentals("PETR4")

    assert isinstance(result, FundamentalsData)
    assert result.ticker == "PETR4"
    assert result.pl == pytest.approx(12.5)
    assert result.pvp == pytest.approx(3.2)
    assert result.roe == pytest.approx(0.30)
    assert result.setor == "Energy"
    assert result.subsetor == "Oil & Gas"
    assert result.lpa == pytest.approx(3.6)
    assert result.vpa == pytest.approx(14.0)


def test_fetch_fundamentals_debt_ratio_computed():
    mock_info = {
        "regularMarketPrice": 50.0,
        "totalDebt": 100_000_000,
        "totalCash": 20_000_000,
        "ebitda": 40_000_000,
    }
    mock_divs = MagicMock(); mock_divs.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info=mock_info, dividends=mock_divs)
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_fundamentals("WEGE3")

    # (100M - 20M) / 40M = 2.0
    assert result.dividaLiquidaEbit == pytest.approx(2.0)


# ── fetch_fii ──────────────────────────────────────────────────────────────────

def test_fetch_fii_not_found_raises():
    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info={"regularMarketPrice": None})
        mock_ticker.fast_info.last_price = None
        mock_yf.Ticker.return_value = mock_ticker
        with pytest.raises(ValueError, match="NOT_FOUND"):
            fetch_fii("INVALID11")


def test_fetch_fii_no_yfinance_raises():
    with patch("api.adapters.yfinance_adapter.yf", None):
        with pytest.raises(ImportError, match="NO_YFINANCE"):
            fetch_fii("MXRF11")


def test_fetch_fii_returns_model():
    from api.models import FIIData

    mock_info = {
        "regularMarketPrice": 11.50,
        "regularMarketChangePercent": -0.01,
        "shortName": "MXRF11",
        "priceToBook": 0.98,
        "marketCap": 5_000_000_000,
        "averageVolume": 2_000_000,
        "fiftyTwoWeekHigh": 12.0,
        "fiftyTwoWeekLow": 9.5,
    }
    mock_divs = MagicMock(); mock_divs.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info=mock_info, dividends=mock_divs)
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_fii("MXRF11")

    assert isinstance(result, FIIData)
    assert result.ticker == "MXRF11"
    assert result.price == pytest.approx(11.50)
    assert result.pvp == pytest.approx(0.98)
    assert result.ffoYield is None   # scraper fields excluded
    assert result.vacancia is None
    assert result.segmento is None
    assert result.dividends == []


def test_fetch_fii_removes_sa_suffix_from_ticker():
    mock_info = {"regularMarketPrice": 10.0}
    mock_divs = MagicMock(); mock_divs.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info=mock_info, dividends=mock_divs)
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_fii("HGLG11.SA")

    assert result.ticker == "HGLG11"


def test_fetch_fii_liquidez_computed():
    mock_info = {
        "regularMarketPrice": 10.0,
        "averageVolume": 500_000,
    }
    mock_divs = MagicMock(); mock_divs.empty = True

    with patch("api.adapters.yfinance_adapter.yf") as mock_yf:
        mock_ticker = make_mock_ticker(info=mock_info, dividends=mock_divs)
        mock_yf.Ticker.return_value = mock_ticker
        result = fetch_fii("BTLG11")

    assert result.liquidez == pytest.approx(5_000_000.0)
