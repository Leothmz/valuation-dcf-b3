import { buildFairPriceRange } from './fair-price-range'
import type { WatchlistEntry } from '../stores/watchlistStore'

/**
 * Converte a seleção do ranking em entradas da watchlist.
 *
 * Grava a **mediana da faixa**, não o teto de um método: numa ação em lote o
 * usuário não escolheu método nenhum, e obrigá-lo a escolher para salvar cinco
 * tickers desfaz o ganho de fazer em lote. `dcfMethod: 'faixa'` deixa registrado
 * que aquele número veio de consenso entre métodos, não de um DCF que ele rodou.
 *
 * Ticker sem nenhum preço é pulado e devolvido em `skipped` — salvar com teto
 * zero criaria um alerta de faixa de compra permanentemente disparado.
 */
export interface BulkSaveResult {
  entries: WatchlistEntry[]
  skipped: string[]
}

interface BulkRow {
  ticker: string
  name?: string | null
  price?: number | null
  bazinFairPrice?: number | null
  grahamFairPrice?: number | null
  lynchFairPrice?: number | null
  savedFairPrice?: number | null
}

const DEFAULT_PROJ_YEARS = 5

export function buildBulkWatchlistEntries(rows: BulkRow[], selection: string[]): BulkSaveResult {
  const selected = new Set(selection)
  const entries: WatchlistEntry[] = []
  const skipped: string[] = []
  const savedAt = new Date().toISOString()

  for (const row of rows) {
    if (!selected.has(row.ticker)) continue

    const range = buildFairPriceRange(
      {
        bazinFairPrice: row.bazinFairPrice,
        grahamFairPrice: row.grahamFairPrice,
        lynchFairPrice: row.lynchFairPrice,
        savedFairPrice: row.savedFairPrice,
      },
      row.price
    )

    if (!range) {
      skipped.push(row.ticker)
      continue
    }

    entries.push({
      ticker: row.ticker,
      name: row.name ?? row.ticker,
      fairPrice: range.median,
      savedAt,
      projYears: DEFAULT_PROJ_YEARS,
      dcfMethod: 'faixa',
      assumptions: {},
      overrides: [],
      apiVals: {},
      yearOverrides: {},
      history: [],
    })
  }

  return { entries, skipped }
}
