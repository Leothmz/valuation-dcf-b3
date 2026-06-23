"""
Tests for api/services/stock_service.py — specifically the yfinance-primary,
brapi-fallback resilience path in get_stock_quote.
"""
from unittest.mock import patch
from api.models import StockQuote
from api.services.stock_service import get_stock_quote


def _quote(ticker="PETR4", price=38.5):
    return StockQuote(ticker=ticker, name="Petrobras", price=price)


def test_uses_yfinance_when_it_succeeds():
    with patch("api.services.stock_service.cache_get", return_value=None), \
         patch("api.services.stock_service.cache_set"), \
         patch("api.services.stock_service.yf_adapter.fetch_stock", return_value=_quote(price=38.5)) as mock_yf, \
         patch("api.services.stock_service.i10_adapter.fetch_net_income", return_value=[]), \
         patch("api.services.stock_service.brapi_adapter.fetch_quote") as mock_brapi:
        quote = get_stock_quote("PETR4")

    assert quote.price == 38.5
    mock_yf.assert_called_once()
    mock_brapi.assert_not_called()


def test_falls_back_to_brapi_when_yfinance_raises():
    with patch("api.services.stock_service.cache_get", return_value=None), \
         patch("api.services.stock_service.cache_set"), \
         patch("api.services.stock_service.yf_adapter.fetch_stock", side_effect=ValueError("NOT_FOUND")), \
         patch("api.services.stock_service.i10_adapter.fetch_net_income", return_value=[]), \
         patch("api.services.stock_service.brapi_adapter.fetch_quote", return_value=_quote(price=39.17)) as mock_brapi:
        quote = get_stock_quote("PETR4")

    assert quote.price == 39.17
    mock_brapi.assert_called_once_with("PETR4")


def test_reraises_original_error_when_both_sources_fail():
    with patch("api.services.stock_service.cache_get", return_value=None), \
         patch("api.services.stock_service.yf_adapter.fetch_stock", side_effect=ValueError("NOT_FOUND")), \
         patch("api.services.stock_service.brapi_adapter.fetch_quote", return_value=None):
        try:
            get_stock_quote("INVALID")
            assert False, "expected ValueError"
        except ValueError as e:
            assert str(e) == "NOT_FOUND"
