// src/portfolio-engine.js

export function calcPrecoMedio(operations) {
  const buys = operations.filter(o => o.type === 'buy')
  if (!buys.length) return null
  const totalCost = buys.reduce((sum, o) => sum + o.qty * o.price, 0)
  const totalQty  = buys.reduce((sum, o) => sum + o.qty, 0)
  return totalCost / totalQty
}

export function calcRetornoSimples(precoMedio, cotacaoAtual) {
  if (precoMedio == null || cotacaoAtual == null) return null
  return (cotacaoAtual - precoMedio) / precoMedio
}

export function calcHoldings(operations) {
  const h = {}
  for (const op of operations) {
    h[op.ticker] = (h[op.ticker] ?? 0) + (op.type === 'buy' ? op.qty : -op.qty)
  }
  return Object.fromEntries(Object.entries(h).filter(([, q]) => q > 0))
}

export function calcTWRR(subPeriods) {
  if (!subPeriods || !subPeriods.length) return null
  let product = 1
  let counted = 0
  for (const { startValue, endValue } of subPeriods) {
    if (startValue <= 0) continue
    product *= 1 + (endValue - startValue) / startValue
    counted++
  }
  return counted === 0 ? null : product - 1
}

export function buildTWRRSubPeriods(operations, historicalPrices, currentPrices) {
  if (!operations.length) return []
  const sorted = [...operations].sort((a, b) => a.date.localeCompare(b.date))
  const uniqueDates = [...new Set(sorted.map(o => o.date))]

  const portfolioValue = (ops, date, useCurrentForFinalDate) => {
    const holdings = calcHoldings(ops)
    return Object.entries(holdings).reduce((sum, [ticker, qty]) => {
      const price = useCurrentForFinalDate
        ? (currentPrices[ticker] ?? 0)
        : (historicalPrices[ticker]?.[date] ?? currentPrices[ticker] ?? 0)
      return sum + qty * price
    }, 0)
  }

  const subPeriods = []
  for (let i = 0; i < uniqueDates.length; i++) {
    const startDate = uniqueDates[i]
    const isLast    = i === uniqueDates.length - 1
    const opsUpToStart = sorted.filter(o => o.date <= startDate)
    const opsUpToEnd   = isLast ? sorted : sorted.filter(o => o.date < uniqueDates[i + 1])
    const startValue = portfolioValue(opsUpToStart, startDate, false)
    const endValue   = portfolioValue(opsUpToEnd, uniqueDates[i + 1], isLast)
    if (startValue > 0) subPeriods.push({ startValue, endValue })
  }
  return subPeriods
}
