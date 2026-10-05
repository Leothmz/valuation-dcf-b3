/**
 * Faixa de preço teto por ticker.
 *
 * O ranking calcula até quatro tetos para a mesma ação e os exibia como colunas
 * paralelas, sem dizer que são a mesma grandeza vista por óticas diferentes —
 * e o do Lynch nem chegava à tela (`calcLynchScore` computa `fairPrice` e a
 * tabela mostra o PEG). Reunidos, eles formam uma faixa: o intervalo em que o
 * valor intrínseco cai conforme a ótica escolhida.
 *
 * Joel fica de fora **por construção**: `calcJoelScore` retorna `fairPrice: null`
 * porque a Magic Formula ordena barateza + retorno sobre capital, não estima
 * preço. Ausência declarada, não dado faltando.
 */

/** Rótulos na ordem em que aparecem quando empatam — só métodos que produzem preço. */
export const PRICE_METHODS = ['Bazin', 'Graham', 'Lynch', 'Teto salvo'] as const

export type PriceMethod = (typeof PRICE_METHODS)[number]

export interface FairPriceInputs {
  bazinFairPrice?: number | null
  grahamFairPrice?: number | null
  lynchFairPrice?: number | null
  /** Teto que o usuário salvou na DCF para este ticker (watchlist). */
  savedFairPrice?: number | null
}

export interface FairPriceEntry {
  method: PriceMethod
  price: number
}

export interface FairPriceRange {
  /** Ordenada do menor para o maior preço. */
  entries: FairPriceEntry[]
  min: number
  /** Âncora da faixa. Mediana, não média: Bazin (`DPA / 6%`) vira outlier com dividendo extraordinário e arrastaria a média. */
  median: number
  max: number
  /** Quantos métodos produziram preço para este ticker. */
  available: number
  /** Quantos poderiam produzir (sempre 4 — Joel nunca entra). */
  total: number
  /** Onde a cotação atual cai em relação à faixa; null quando não há cotação. */
  position: 'below' | 'inside' | 'above' | null
}

function median(sorted: number[]): number {
  const n = sorted.length
  const mid = Math.floor(n / 2)
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function buildFairPriceRange(
  inputs: FairPriceInputs,
  price: number | null | undefined
): FairPriceRange | null {
  const candidates: FairPriceEntry[] = [
    { method: 'Bazin' as const, price: inputs.bazinFairPrice },
    { method: 'Graham' as const, price: inputs.grahamFairPrice },
    { method: 'Lynch' as const, price: inputs.lynchFairPrice },
    { method: 'Teto salvo' as const, price: inputs.savedFairPrice },
  ].filter((c): c is FairPriceEntry => c.price != null && c.price > 0)

  if (candidates.length === 0) return null

  // Ordena por preço; empate mantém a ordem de PRICE_METHODS (sort estável).
  const entries = [...candidates].sort((a, b) => a.price - b.price)
  const prices = entries.map((e) => e.price)
  const min = prices[0]
  const max = prices[prices.length - 1]

  let position: FairPriceRange['position'] = null
  if (price != null) {
    position = price < min ? 'below' : price > max ? 'above' : 'inside'
  }

  return {
    entries,
    min,
    median: median(prices),
    max,
    available: entries.length,
    total: PRICE_METHODS.length,
    position,
  }
}
