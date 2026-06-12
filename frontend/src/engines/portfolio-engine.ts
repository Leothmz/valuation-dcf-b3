import type { Operation, RFTitle } from '../stores/portfolioStore'

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
