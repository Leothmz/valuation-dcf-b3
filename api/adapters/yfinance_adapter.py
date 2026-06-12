"""
yfinance adapter — extracts data-fetching logic from server.py into typed functions.

Returns Pydantic models (StockQuote, FIIData, FundamentalsData).
Raises:
  - ImportError("NO_YFINANCE")  if yfinance is not installed
  - ValueError("NOT_FOUND")     if the ticker has no price data

No caching, no scraping — pure yfinance → Pydantic model.
Scraper enrichment is handled in card #37.
"""

from __future__ import annotations

import datetime

try:
    import yfinance as yf
except ImportError:
    yf = None  # type: ignore[assignment]

from api.models import (
    StockQuote,
    FIIData,
    FundamentalsData,
    NetIncomeEntry,
    DividendEntry,
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _normalize_ticker(ticker: str) -> str:
    """Append .SA suffix for B3 tickers if not already present."""
    symbol = ticker.upper()
    if not symbol.endswith(".SA"):
        symbol += ".SA"
    return symbol


def _normalize_dy(dy: float | None) -> float | None:
    """yfinance for .SA tickers sometimes returns dividendYield as a percentage
    (e.g. 8.49 meaning 8.49%) instead of decimal (0.0849). Normalize to 0-1."""
    if dy is None:
        return None
    return dy / 100 if dy > 1 else dy


def _r(v: object, d: int = 2) -> float | None:
    """Round a float value; returns None for None/NaN/non-numeric."""
    if v is None:
        return None
    try:
        fv = float(v)  # type: ignore[arg-type]
        return round(fv, d) if fv == fv else None  # noqa: PLR0124  (NaN check)
    except (TypeError, ValueError):
        return None


def _get_price(info: dict) -> float | None:
    """Extract price from yfinance info dict, trying multiple fields."""
    return (
        info.get("regularMarketPrice")
        or info.get("currentPrice")
        or info.get("previousClose")
    )


def _get_shares(info: dict) -> int | None:
    """Extract shares outstanding from yfinance info dict."""
    val = (
        info.get("sharesOutstanding")
        or info.get("impliedSharesOutstanding")
        or info.get("floatShares")
    )
    return int(val) if val else None


# ── Public adapter functions ───────────────────────────────────────────────────

def fetch_stock(ticker: str) -> StockQuote:
    """
    Fetch stock data from yfinance and return a StockQuote model.

    Args:
        ticker: B3 ticker (e.g. "PETR4" or "PETR4.SA")

    Raises:
        ImportError: if yfinance is not installed ("NO_YFINANCE")
        ValueError: if ticker has no price data ("NOT_FOUND")
    """
    if yf is None:
        raise ImportError("NO_YFINANCE")

    symbol = _normalize_ticker(ticker)
    stock = yf.Ticker(symbol)
    info = stock.info or {}

    price = _get_price(info)
    # Also try fast_info as fallback
    if not price:
        try:
            price = stock.fast_info.last_price
        except Exception:
            pass

    if not price:
        raise ValueError("NOT_FOUND")

    # ── Net income history ──────────────────────────────────────────────
    history: list[NetIncomeEntry] = []
    try:
        fin = stock.income_stmt  # preferred; falls back to financials below
        if fin is None or (hasattr(fin, "empty") and fin.empty):
            fin = stock.financials
        if fin is not None and not (hasattr(fin, "empty") and fin.empty):
            ni_keys = [
                "Net Income",
                "Net Income Common Stockholders",
                "Net Income From Continuing Operations",
            ]
            ni_row = None
            for k in ni_keys:
                if k in fin.index:
                    ni_row = fin.loc[k]
                    break
            if ni_row is None:
                matches = [i for i in fin.index if "net income" in str(i).lower()]
                if matches:
                    ni_row = fin.loc[matches[0]]

            if ni_row is not None:
                for col in ni_row.index:
                    val = ni_row[col]
                    try:
                        fval = float(val)
                        if fval == fval:  # not NaN
                            year = col.year if hasattr(col, "year") else int(str(col)[:4])
                            history.append(NetIncomeEntry(year=year, netIncome=fval))
                    except Exception:
                        pass
    except Exception:
        pass

    history.sort(key=lambda x: x.year, reverse=True)
    history = history[:5]

    # ── Dividends by year (for payout calculation) ──────────────────────
    divs_by_year: dict[int, float] = {}
    try:
        divs = stock.dividends
        if divs is not None and not (hasattr(divs, "empty") and divs.empty):
            for date, amount in divs.items():
                y = date.year if hasattr(date, "year") else int(str(date)[:4])
                divs_by_year[y] = divs_by_year.get(y, 0.0) + float(amount)
    except Exception:
        pass

    # ── Shares & ROE ────────────────────────────────────────────────────
    shares = _get_shares(info)
    roe = info.get("returnOnEquity")

    # ── Payout (historical average) ─────────────────────────────────────
    payout: float | None = None
    if shares and divs_by_year and history:
        pts: list[float] = []
        for entry in history:
            y = entry.year
            if y in divs_by_year and entry.netIncome > 0:
                p = (divs_by_year[y] * shares) / entry.netIncome
                if 0 < p < 2:
                    pts.append(p)
        if pts:
            payout = sum(pts) / len(pts)

    return StockQuote(
        ticker=ticker.upper(),
        name=info.get("longName") or info.get("shortName") or ticker.upper(),
        price=price,
        changePercent=info.get("regularMarketChangePercent", 0),
        fiftyTwoWeekHigh=info.get("fiftyTwoWeekHigh"),
        fiftyTwoWeekLow=info.get("fiftyTwoWeekLow"),
        sharesOutstanding=shares,
        roe=roe,
        payout=payout,
        netIncomeHistory=history,
        marketCap=info.get("marketCap"),
        dividendYield=_normalize_dy(info.get("dividendYield")),
    )


def fetch_fundamentals(ticker: str) -> FundamentalsData:
    """
    Fetch extended fundamental data from yfinance for screening/ranking.

    Args:
        ticker: B3 ticker (e.g. "WEGE3")

    Raises:
        ImportError: if yfinance is not installed ("NO_YFINANCE")
        ValueError: if ticker has no price data ("NOT_FOUND")
    """
    if yf is None:
        raise ImportError("NO_YFINANCE")

    symbol = _normalize_ticker(ticker)
    stock = yf.Ticker(symbol)
    info = stock.info or {}

    price = _get_price(info)
    if not price:
        raise ValueError("NOT_FOUND")

    market_cap = info.get("marketCap")
    shares = _get_shares(info)

    # Valuation multiples
    pl = info.get("trailingPE")
    pvp = info.get("priceToBook")

    # Profitability
    roe = info.get("returnOnEquity")
    margem_liquida = info.get("profitMargins")
    # ROIC proxy: returnOnAssets (consistent across sectors)
    roic = info.get("returnOnAssets")

    # Debt metrics
    total_debt = info.get("totalDebt") or 0
    cash = info.get("totalCash") or 0
    ebitda = info.get("ebitda")
    divida_liquida_ebit: float | None = None
    if ebitda and ebitda != 0:
        net_debt = total_debt - cash
        divida_liquida_ebit = net_debt / abs(ebitda)

    # DY and DPA: TTM from actual dividend history (more reliable than info.dividendYield for .SA)
    dy: float | None = None
    dpa: float | None = None
    try:
        one_year_ago = datetime.date.today() - datetime.timedelta(days=365)
        divs = stock.dividends
        if divs is not None and not (hasattr(divs, "empty") and divs.empty):
            ttm_total = 0.0
            for date, amount in divs.items():
                d = date.date() if hasattr(date, "date") else date
                if d >= one_year_ago:
                    ttm_total += float(amount)
            if ttm_total > 0:
                dpa = round(ttm_total, 4)
                dy = ttm_total / price if price > 0 else None
    except Exception:
        pass

    # Per-share
    lpa = info.get("trailingEps")
    vpa = info.get("bookValue")

    # Growth & PEG
    crescimento = info.get("earningsGrowth")
    peg = info.get("pegRatio")
    if not peg and pl and crescimento and crescimento > 0:
        peg = pl / (crescimento * 100)

    # Liquidity (avg daily volume in BRL)
    avg_vol = info.get("averageVolume") or info.get("averageVolume10days") or 0
    liquidez_media = avg_vol * price

    setor = info.get("sector")
    subsetor = info.get("industry")

    return FundamentalsData(
        ticker=ticker.upper(),
        name=info.get("longName") or info.get("shortName") or ticker.upper(),
        price=_r(price),
        changePercent=info.get("regularMarketChangePercent", 0),
        marketCap=market_cap,
        shares=shares,
        pl=_r(pl),
        pvp=_r(pvp),
        roe=roe,
        roic=roic,
        margemLiquida=margem_liquida,
        dividaLiquidaEbit=_r(divida_liquida_ebit),
        liquidezMedia=liquidez_media,
        dy=dy,
        dpa=_r(dpa, 4),
        lpa=_r(lpa, 4),
        vpa=_r(vpa, 4),
        crescimentoLucros=crescimento,
        pegRatio=_r(peg),
        setor=setor,
        subsetor=subsetor,
        fiftyTwoWeekHigh=info.get("fiftyTwoWeekHigh"),
        fiftyTwoWeekLow=info.get("fiftyTwoWeekLow"),
    )


def fetch_fii(ticker: str) -> FIIData:
    """
    Fetch FII data from yfinance only (no scraper enrichment — that is card #37).

    Args:
        ticker: FII ticker (e.g. "MXRF11" or "MXRF11.SA")

    Raises:
        ImportError: if yfinance is not installed ("NO_YFINANCE")
        ValueError: if ticker has no price data ("NOT_FOUND")
    """
    if yf is None:
        raise ImportError("NO_YFINANCE")

    symbol = _normalize_ticker(ticker)
    stock = yf.Ticker(symbol)
    info = stock.info or {}

    price = _get_price(info)
    if not price:
        raise ValueError("NOT_FOUND")

    avg_vol = info.get("averageVolume") or 0
    liquidez = _r(avg_vol * price) if avg_vol and price else None

    # DY and DPA: TTM from actual dividend history
    dy: float | None = None
    dpa: float | None = None
    try:
        one_year_ago = datetime.date.today() - datetime.timedelta(days=365)
        divs = stock.dividends
        if divs is not None and not (hasattr(divs, "empty") and divs.empty):
            ttm_total = 0.0
            for date, amount in divs.items():
                d = date.date() if hasattr(date, "date") else date
                if d >= one_year_ago:
                    ttm_total += float(amount)
            if ttm_total > 0:
                dpa = round(ttm_total, 4)
                dy = ttm_total / price if price > 0 else None
    except Exception:
        dy = _normalize_dy(info.get("dividendYield"))

    # Dividend history — last 24 payments, most recent first
    dividends_list: list[DividendEntry] = []
    try:
        divs = stock.dividends
        if divs is not None and not (hasattr(divs, "empty") and divs.empty):
            for ts, amount in divs.sort_index(ascending=False).items():
                dividends_list.append(
                    DividendEntry(
                        date=ts.strftime("%Y-%m-%d"),
                        amount=round(float(amount), 4),
                    )
                )
                if len(dividends_list) >= 24:
                    break
    except Exception:
        pass

    clean_ticker = ticker.upper().replace(".SA", "")

    return FIIData(
        ticker=clean_ticker,
        name=info.get("longName") or info.get("shortName") or clean_ticker,
        price=price,
        changePercent=info.get("regularMarketChangePercent"),
        dy=dy,
        pvp=_r(info.get("priceToBook")),
        dpa=_r(dpa, 4),
        marketCap=info.get("marketCap"),
        liquidez=liquidez,
        fiftyTwoWeekHigh=info.get("fiftyTwoWeekHigh"),
        fiftyTwoWeekLow=info.get("fiftyTwoWeekLow"),
        # scraper fields — left to card #37
        ffoYield=None,
        vacancia=None,
        numImoveis=None,
        segmento=None,
        dividends=dividends_list,
    )
