from api.models import (
    DividendEntry,
    FIIData,
    FundamentalsData,
    NetIncomeEntry,
    PortfolioHistoryResponse,
    StockQuote,
)


def test_stock_quote_required_only():
    q = StockQuote(ticker="PETR4")
    assert q.ticker == "PETR4"
    assert q.price is None
    assert q.netIncomeHistory == []


def test_stock_quote_full():
    q = StockQuote(
        ticker="PETR4",
        name="Petrobras",
        price=38.5,
        changePercent=0.02,
        roe=0.20,
        payout=0.40,
        netIncomeHistory=[{"year": 2023, "netIncome": 1e10}],
    )
    assert q.price == 38.5
    assert q.netIncomeHistory[0].year == 2023


def test_fii_data_optional_fields():
    f = FIIData(ticker="HGLG11")
    assert f.dy is None
    assert f.pvp is None
    assert f.dividends == []


def test_fii_data_with_dividends():
    f = FIIData(
        ticker="HGLG11",
        price=160.0,
        dividends=[{"date": "2024-01-15", "amount": 1.20}],
    )
    assert f.dividends[0].amount == 1.20


def test_fundamentals_data_optional():
    d = FundamentalsData(ticker="VALE3")
    assert d.pl is None
    assert d.roic is None


def test_portfolio_history_response():
    r = PortfolioHistoryResponse(
        tickers=["PETR4", "VALE3"],
        dates=["2024-01-01", "2024-01-02"],
        prices={"PETR4": [38.0, 38.5], "VALE3": [60.0, 61.0]},
    )
    assert len(r.tickers) == 2
    assert r.prices["PETR4"][1] == 38.5


def test_net_income_entry():
    e = NetIncomeEntry(year=2023, netIncome=5_000_000_000.0)
    assert e.year == 2023


def test_dividend_entry():
    d = DividendEntry(date="2024-03-15", amount=0.85)
    assert d.amount == 0.85
