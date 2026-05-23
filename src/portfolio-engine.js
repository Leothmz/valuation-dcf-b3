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
