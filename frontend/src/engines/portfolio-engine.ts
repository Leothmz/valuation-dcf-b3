import type { Operation, RFTitle, Provento, Category, SplitEvent } from '../stores/portfolioStore'
import { CATEGORIES } from '../stores/portfolioStore'

export function calcPrecoMedio(operations: Operation[]): number | null {
  const buys = operations.filter((o) => o.type === 'buy')
  if (!buys.length) return null
  const totalCost = buys.reduce((sum, o) => sum + o.qty * o.price, 0)
  const totalQty = buys.reduce((sum, o) => sum + o.qty, 0)
  return totalCost / totalQty
}

export function calcHoldings(operations: Operation[]): Record<string, number> {
  const h: Record<string, number> = {}
  for (const op of operations) {
    h[op.ticker] = (h[op.ticker] ?? 0) + (op.type === 'buy' ? op.qty : -op.qty)
  }
  return Object.fromEntries(Object.entries(h).filter(([, q]) => q > 0))
}

export function projectDeposit(p: {
  amount: number
  rateType: string
  baseRate: number
  cdiAccumulated?: number
  ipcaAccumulated?: number
  daysElapsed?: number
  manualCurrentValue?: number | null
}): number {
  const {
    amount,
    rateType,
    baseRate,
    cdiAccumulated = 0,
    ipcaAccumulated = 0,
    daysElapsed = 0,
    manualCurrentValue,
  } = p
  if (rateType === 'manual') return manualCurrentValue ?? amount
  if (daysElapsed <= 0) return amount
  const yearFraction = daysElapsed / 365
  switch (rateType) {
    case 'cdi_pct':
      return amount * (1 + (baseRate / 100) * cdiAccumulated)
    case 'prefixado':
      return amount * Math.pow(1 + baseRate / 100, yearFraction)
    case 'ipca_plus': {
      const totalRate =
        (1 + ipcaAccumulated) * (1 + (baseRate / 100) * yearFraction) - 1
      return amount * (1 + totalRate)
    }
    default:
      return amount
  }
}

export function aggregateTitle(
  title: RFTitle,
  ratesForPeriod: { cdiAccumulated?: number; ipcaAccumulated?: number },
  today: string
): { totalInvested: number; totalProjected: number; retorno: number | null } {
  let totalInvested = 0
  let totalProjected = 0
  for (const dep of title.deposits) {
    const daysElapsed = Math.max(
      0,
      Math.floor((new Date(today).getTime() - new Date(dep.date).getTime()) / 86400000)
    )
    const baseRate = dep.rateOverride ?? title.baseRate ?? 0
    totalInvested += dep.amount
    totalProjected += projectDeposit({
      amount: dep.amount,
      rateType: title.rateType,
      baseRate,
      cdiAccumulated: ratesForPeriod.cdiAccumulated ?? 0,
      ipcaAccumulated: ratesForPeriod.ipcaAccumulated ?? 0,
      daysElapsed,
      manualCurrentValue: dep.manualCurrentValue,
    })
  }
  return {
    totalInvested,
    totalProjected,
    retorno: totalInvested > 0 ? (totalProjected - totalInvested) / totalInvested : null,
  }
}

export interface HoldingSummary {
  ticker: string
  assetClass: string
  qty: number
  precoMedio: number | null
  investido: number | null
}

export function buildHoldingSummaries(operations: Operation[]): HoldingSummary[] {
  const holdings = calcHoldings(operations)
  return Object.entries(holdings).map(([ticker, qty]) => {
    const tickerOps = operations.filter((o) => o.ticker === ticker)
    const assetClass = tickerOps[tickerOps.length - 1]?.assetClass ?? 'acao_br'
    const precoMedio = calcPrecoMedio(tickerOps)
    return {
      ticker,
      assetClass,
      qty,
      precoMedio,
      investido: precoMedio != null ? qty * precoMedio : null,
    }
  })
}

export interface PortfolioHistoryResponse {
  tickers: string[]
  dates: string[]
  prices: Record<string, Array<number | null>>
}

export function buildHistoricalPriceMap(
  history: PortfolioHistoryResponse
): Record<string, Record<string, number | null>> {
  const map: Record<string, Record<string, number | null>> = {}
  if (!Array.isArray(history?.tickers)) return map
  for (const ticker of history.tickers) {
    const pricesForTicker = history.prices[ticker] ?? []
    map[ticker] = {}
    history.dates.forEach((date, i) => {
      map[ticker][date] = pricesForTicker[i] ?? null
    })
  }
  return map
}

export interface TWRRSubPeriod {
  startValue: number
  endValue: number
}

export function calcTWRR(subPeriods: TWRRSubPeriod[]): number | null {
  if (!subPeriods.length) return null
  let product = 1
  let counted = 0
  for (const { startValue, endValue } of subPeriods) {
    if (startValue <= 0) continue
    product *= 1 + (endValue - startValue) / startValue
    counted++
  }
  return counted === 0 ? null : product - 1
}

export function buildTWRRSubPeriods(
  operations: Operation[],
  historicalPrices: Record<string, Record<string, number | null>>,
  currentPrices: Record<string, number>
): TWRRSubPeriod[] {
  if (!operations.length) return []
  const sorted = [...operations].sort((a, b) => a.date.localeCompare(b.date))
  const uniqueDates = [...new Set(sorted.map((o) => o.date))]

  const portfolioValue = (
    ops: Operation[],
    date: string | undefined,
    useCurrentForFinalDate: boolean
  ) => {
    const holdings = calcHoldings(ops)
    return Object.entries(holdings).reduce((sum, [ticker, qty]) => {
      const price = useCurrentForFinalDate
        ? currentPrices[ticker] ?? 0
        : historicalPrices[ticker]?.[date ?? ''] ?? currentPrices[ticker] ?? 0
      return sum + qty * price
    }, 0)
  }

  const subPeriods: TWRRSubPeriod[] = []
  for (let i = 0; i < uniqueDates.length; i++) {
    const startDate = uniqueDates[i]
    const isLast = i === uniqueDates.length - 1
    const opsUpToStart = sorted.filter((o) => o.date <= startDate)
    const opsUpToEnd = isLast ? sorted : sorted.filter((o) => o.date < uniqueDates[i + 1])
    const startValue = portfolioValue(opsUpToStart, startDate, false)
    const endValue = portfolioValue(opsUpToEnd, uniqueDates[i + 1], isLast)
    if (startValue > 0) subPeriods.push({ startValue, endValue })
  }
  return subPeriods
}

export interface AssetTWRR {
  twrr: number | null
  subPeriods: TWRRSubPeriod[]
}

export function buildAssetTWRRMap(
  operations: Operation[],
  historicalPrices: Record<string, Record<string, number | null>>,
  currentPrices: Record<string, number>
): Record<string, AssetTWRR> {
  const tickers = [...new Set(operations.map((o) => o.ticker))]
  const map: Record<string, AssetTWRR> = {}
  for (const ticker of tickers) {
    const tickerOps = operations.filter((o) => o.ticker === ticker)
    const subPeriods = buildTWRRSubPeriods(tickerOps, historicalPrices, currentPrices)
    map[ticker] = { twrr: calcTWRR(subPeriods), subPeriods }
  }
  return map
}

export interface ApiDividendEntry {
  date: string
  amount: number
}

export interface MergedDividendEntry {
  date: string
  ticker: string
  type: Provento['type']
  qty: number
  valuePerShare: number
  total: number
  source: 'confirmed' | 'estimated'
  provento: Provento | null
}

export function buildMergedDividendHistory(
  ticker: string,
  apiDividends: ApiDividendEntry[],
  operations: Operation[],
  storedProventos: Provento[]
): MergedDividendEntry[] {
  const storedForTicker = storedProventos.filter((p) => p.ticker === ticker)
  const storedByDate = new Map(storedForTicker.map((p) => [p.date, p]))
  const tickerOps = operations.filter((o) => o.ticker === ticker)

  const entries: MergedDividendEntry[] = []
  const seenDates = new Set<string>()

  for (const div of apiDividends) {
    seenDates.add(div.date)
    const stored = storedByDate.get(div.date)
    if (stored) {
      entries.push({
        date: stored.date,
        ticker,
        type: stored.type,
        qty: stored.qty,
        valuePerShare: stored.valuePerShare,
        total: stored.qty * stored.valuePerShare,
        source: 'confirmed',
        provento: stored,
      })
      continue
    }
    const heldQty = calcHoldings(tickerOps.filter((o) => o.date <= div.date))[ticker] ?? 0
    if (heldQty <= 0) continue
    entries.push({
      date: div.date,
      ticker,
      type: 'dividendo',
      qty: heldQty,
      valuePerShare: div.amount,
      total: heldQty * div.amount,
      source: 'estimated',
      provento: null,
    })
  }

  for (const stored of storedForTicker) {
    if (!seenDates.has(stored.date)) {
      entries.push({
        date: stored.date,
        ticker,
        type: stored.type,
        qty: stored.qty,
        valuePerShare: stored.valuePerShare,
        total: stored.qty * stored.valuePerShare,
        source: 'confirmed',
        provento: stored,
      })
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

export function calcYieldOnCost(dpa: number | null, precoMedio: number | null): number | null {
  if (dpa == null || precoMedio == null || precoMedio <= 0) return null
  return dpa / precoMedio
}

export interface DividendProjection {
  perTicker: Record<string, number | null>
  total: number
}

export function buildDividendProjection(
  holdings: HoldingSummary[],
  dpaMap: Record<string, number | null>
): DividendProjection {
  const perTicker: Record<string, number | null> = {}
  let total = 0
  for (const h of holdings) {
    const dpa = dpaMap[h.ticker]
    if (dpa == null) {
      perTicker[h.ticker] = null
      continue
    }
    const projected = dpa * h.qty
    perTicker[h.ticker] = projected
    total += projected
  }
  return { perTicker, total }
}

export function mapAssetClassToCategory(assetClass: string): Category {
  switch (assetClass) {
    case 'fii':
      return 'fiis'
    case 'etf':
    case 'stock_intl':
      return 'internacional'
    case 'cripto':
      return 'criptoativos'
    default:
      return 'acoes_br'
  }
}

export function buildCategoryAllocation(
  holdings: HoldingSummary[],
  priceMap: Record<string, number>,
  rfValue: number,
  cashBalance: number
): Record<Category, number> {
  const values: Record<Category, number> = {
    acoes_br: 0,
    fiis: 0,
    renda_fixa: rfValue,
    internacional: 0,
    criptoativos: 0,
    caixa: cashBalance,
  }
  for (const h of holdings) {
    const price = priceMap[h.ticker]
    if (price == null) continue
    const category = mapAssetClassToCategory(h.assetClass)
    values[category] += h.qty * price
  }
  return values
}

export interface CategoryDeviation {
  actualValue: number
  actualPct: number
  targetPct: number
  targetValue: number
  deviationPct: number
  deviationValue: number
}

export function calcAllocationDeviation(
  actualValues: Record<Category, number>,
  targets: Record<Category, number>
): Record<Category, CategoryDeviation> {
  const total = CATEGORIES.reduce((sum, c) => sum + (actualValues[c] ?? 0), 0)
  const result = {} as Record<Category, CategoryDeviation>
  for (const category of CATEGORIES) {
    const actualValue = actualValues[category] ?? 0
    const actualPct = total > 0 ? (actualValue / total) * 100 : 0
    const targetPct = targets[category] ?? 0
    const targetValue = total * (targetPct / 100)
    result[category] = {
      actualValue,
      actualPct,
      targetPct,
      targetValue,
      deviationPct: actualPct - targetPct,
      deviationValue: actualValue - targetValue,
    }
  }
  return result
}

export interface RebalanceSuggestion {
  action: 'comprar' | 'vender' | 'manter'
  amount: number
}

export function buildRebalancingSuggestions(
  deviations: Record<Category, CategoryDeviation>
): Record<Category, RebalanceSuggestion> {
  const result = {} as Record<Category, RebalanceSuggestion>
  for (const category of CATEGORIES) {
    const dev = deviations[category]
    if (Math.abs(dev.deviationValue) < 0.01) {
      result[category] = { action: 'manter', amount: 0 }
    } else if (dev.deviationValue > 0) {
      result[category] = { action: 'vender', amount: dev.deviationValue }
    } else {
      result[category] = { action: 'comprar', amount: -dev.deviationValue }
    }
  }
  return result
}

export function adjustOperationsForSplits(
  operations: Operation[],
  splitEvents: SplitEvent[]
): Operation[] {
  return operations.map((op) => {
    const cumulativeRatio = splitEvents
      .filter((e) => e.ticker === op.ticker && e.date > op.date)
      .reduce((product, e) => product * e.ratio, 1)
    if (cumulativeRatio === 1) return { ...op }
    return { ...op, qty: op.qty * cumulativeRatio, price: op.price / cumulativeRatio }
  })
}

export interface AvgCostPoint {
  operation: Operation
  qtyBefore: number
  avgCostBefore: number
  qtyAfter: number
  avgCostAfter: number
}

export function buildAvgCostTimeline(tickerOperations: Operation[]): AvgCostPoint[] {
  const sorted = [...tickerOperations].sort((a, b) => a.date.localeCompare(b.date))
  let qty = 0
  let avgCost = 0
  const timeline: AvgCostPoint[] = []
  for (const operation of sorted) {
    const qtyBefore = qty
    const avgCostBefore = avgCost
    if (operation.type === 'buy') {
      const newQty = qty + operation.qty
      avgCost = newQty > 0 ? (qty * avgCost + operation.qty * operation.price) / newQty : 0
      qty = newQty
    } else {
      qty -= operation.qty
      if (qty <= 0) {
        qty = 0
        avgCost = 0
      }
    }
    timeline.push({ operation, qtyBefore, avgCostBefore, qtyAfter: qty, avgCostAfter: avgCost })
  }
  return timeline
}

export type GainCategory = 'swing_acoes' | 'day_trade' | 'swing_fii'

export interface SaleGain {
  date: string
  ticker: string
  category: GainCategory
  qty: number
  proceeds: number
  gain: number
}

export function classifySaleGains(operations: Operation[]): SaleGain[] {
  const tickers = [...new Set(operations.map((o) => o.ticker))]
  const result: SaleGain[] = []

  for (const ticker of tickers) {
    const tickerOps = operations.filter((o) => o.ticker === ticker)
    const assetClass = tickerOps[tickerOps.length - 1].assetClass
    const sorted = [...tickerOps].sort((a, b) => a.date.localeCompare(b.date))
    const dates = [...new Set(sorted.map((o) => o.date))].sort()

    let runningQty = 0
    let runningAvgCost = 0

    for (const date of dates) {
      const opsToday = sorted.filter((o) => o.date === date)
      const buysToday = opsToday.filter((o) => o.type === 'buy')
      const sellsToday = opsToday.filter((o) => o.type === 'sell')
      const dayBuyQty = buysToday.reduce((s, o) => s + o.qty, 0)
      const dayBuyCost = buysToday.reduce((s, o) => s + o.qty * o.price, 0)
      const daySellQty = sellsToday.reduce((s, o) => s + o.qty, 0)
      const daySellRevenue = sellsToday.reduce((s, o) => s + o.qty * o.price, 0)
      const dayTradeQty = Math.min(dayBuyQty, daySellQty)
      const daySellAvgPrice = daySellQty > 0 ? daySellRevenue / daySellQty : 0

      if (dayTradeQty > 0) {
        const dayBuyAvgPrice = dayBuyQty > 0 ? dayBuyCost / dayBuyQty : 0
        result.push({
          date,
          ticker,
          category: 'day_trade',
          qty: dayTradeQty,
          proceeds: dayTradeQty * daySellAvgPrice,
          gain: dayTradeQty * (daySellAvgPrice - dayBuyAvgPrice),
        })
      }

      const swingSellQty = daySellQty - dayTradeQty
      if (swingSellQty > 0) {
        result.push({
          date,
          ticker,
          category: assetClass === 'fii' ? 'swing_fii' : 'swing_acoes',
          qty: swingSellQty,
          proceeds: swingSellQty * daySellAvgPrice,
          gain: swingSellQty * (daySellAvgPrice - runningAvgCost),
        })
      }

      const buyQtyAddedToPosition = dayBuyQty - dayTradeQty
      if (buyQtyAddedToPosition > 0) {
        const dayBuyAvgPrice = dayBuyCost / dayBuyQty
        const newQty = runningQty + buyQtyAddedToPosition
        runningAvgCost =
          newQty > 0
            ? (runningQty * runningAvgCost + buyQtyAddedToPosition * dayBuyAvgPrice) / newQty
            : 0
        runningQty = newQty
      }
      if (swingSellQty > 0) {
        runningQty -= swingSellQty
        if (runningQty <= 0) {
          runningQty = 0
          runningAvgCost = 0
        }
      }
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

const IR_RATES: Record<GainCategory, number> = {
  swing_acoes: 0.15,
  day_trade: 0.20,
  swing_fii: 0.20,
}

const GAIN_CATEGORY_ORDER: GainCategory[] = ['swing_acoes', 'day_trade', 'swing_fii']

function lastDayOfNextMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const d = new Date(year, monthNum + 1, 0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface MonthlyIRSummary {
  month: string
  category: GainCategory
  grossGain: number
  proceeds: number
  exempt: boolean
  lossCarriedIn: number
  taxableAmount: number
  rate: number
  darfAmount: number
  lossCarriedOut: number
  dueDate: string
}

export function buildMonthlyIRSummary(saleGains: SaleGain[]): MonthlyIRSummary[] {
  const months = [...new Set(saleGains.map((g) => g.date.slice(0, 7)))].sort()
  const lossCarry: Record<GainCategory, number> = { swing_acoes: 0, day_trade: 0, swing_fii: 0 }
  const result: MonthlyIRSummary[] = []

  for (const month of months) {
    for (const category of GAIN_CATEGORY_ORDER) {
      const entries = saleGains.filter((g) => g.date.slice(0, 7) === month && g.category === category)
      if (!entries.length) continue

      const grossGain = entries.reduce((s, g) => s + g.gain, 0)
      const proceeds = entries.reduce((s, g) => s + g.proceeds, 0)
      const lossCarriedIn = lossCarry[category]

      let exempt = false
      let taxableAmount = 0
      let lossCarriedOut = lossCarriedIn

      if (grossGain <= 0) {
        lossCarriedOut = lossCarriedIn + -grossGain
      } else if (category === 'swing_acoes' && proceeds <= 20000) {
        exempt = true
      } else {
        const afterLoss = grossGain - lossCarriedIn
        if (afterLoss <= 0) {
          lossCarriedOut = -afterLoss
        } else {
          taxableAmount = afterLoss
          lossCarriedOut = 0
        }
      }

      const rate = IR_RATES[category]
      lossCarry[category] = lossCarriedOut
      result.push({
        month,
        category,
        grossGain,
        proceeds,
        exempt,
        lossCarriedIn,
        taxableAmount,
        rate,
        darfAmount: taxableAmount * rate,
        lossCarriedOut,
        dueDate: lastDayOfNextMonth(month),
      })
    }
  }

  return result
}
