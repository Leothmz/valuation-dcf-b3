from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class NetIncomeEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    year: int
    netIncome: float


class DividendEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    date: str
    amount: float


class StockQuote(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    ticker: str
    name: str | None = None
    price: float | None = None
    changePercent: float | None = None
    fiftyTwoWeekHigh: float | None = None
    fiftyTwoWeekLow: float | None = None
    sharesOutstanding: int | None = None
    roe: float | None = None
    payout: float | None = None
    netIncomeHistory: list[NetIncomeEntry] = []
    marketCap: float | None = None
    dividendYield: float | None = None


class FIIData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    ticker: str
    name: str | None = None
    price: float | None = None
    changePercent: float | None = None
    dy: float | None = None
    pvp: float | None = None
    dpa: float | None = None
    marketCap: float | None = None
    liquidez: float | None = None
    fiftyTwoWeekHigh: float | None = None
    fiftyTwoWeekLow: float | None = None
    ffoYield: float | None = None
    vacancia: float | None = None
    numImoveis: int | None = None
    segmento: str | None = None
    dividends: list[DividendEntry] = []


class FundamentalsData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    ticker: str
    name: str | None = None
    price: float | None = None
    changePercent: float | None = None
    marketCap: float | None = None
    shares: int | None = None
    pl: float | None = None
    pvp: float | None = None
    roe: float | None = None
    roic: float | None = None
    margemLiquida: float | None = None
    dividaLiquidaEbit: float | None = None
    liquidezMedia: float | None = None
    dy: float | None = None
    dpa: float | None = None
    lpa: float | None = None
    vpa: float | None = None
    crescimentoLucros: float | None = None
    pegRatio: float | None = None
    setor: str | None = None
    subsetor: str | None = None
    fiftyTwoWeekHigh: float | None = None
    fiftyTwoWeekLow: float | None = None


class PortfolioHistoryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    tickers: list[str]
    dates: list[str]
    prices: dict[str, list[float | None]]
