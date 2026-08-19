import { explainMethod } from './method-explainer'
import { buildFairPriceRange } from './fair-price-range'
import type { RankingMethod } from '../stores/rankingStore'

/**
 * Exporta o ranking exibido para CSV.
 *
 * Mesmo dialeto do `WatchlistPage.exportCSV`, porque abre no mesmo Excel em
 * pt-BR: BOM (senão acento vira mojibake), `;` como separador (a vírgula é
 * decimal aqui) e número sem símbolo — quem recebe quer calcular em cima, não
 * ler texto formatado.
 */

const SEP = ';'
const BOM = '﻿'

interface ExportRow {
  ticker: string
  name?: string | null
  rank?: number | null
  price?: number | null
  dy?: number | null
  pl?: number | null
  roe?: number | null
  margemLiquida?: number | null
  dividaLiquidaEbit?: number | null
  bazinFairPrice?: number | null
  grahamFairPrice?: number | null
  lynchFairPrice?: number | null
  lynchVal?: number | null
  joelVal?: number | null
  savedFairPrice?: number | null
}

/** Número em pt-BR, sem símbolo. Ausente vira célula vazia — não "null", não "—". */
function num(v: number | null | undefined, dec = 2, mult = 1): string {
  if (v == null) return ''
  return (v * mult).toFixed(dec).replace('.', ',')
}

function text(v: string | null | undefined): string {
  if (!v) return ''
  return v.includes(SEP) || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
}

export function buildRankingCSV(rows: ExportRow[], method: RankingMethod): string {
  const headers = [
    `Posição (${explainMethod(method).title})`,
    'Ticker',
    'Empresa',
    'Cotação',
    'DY (%)',
    'P/L',
    'ROE (%)',
    'Margem Líquida (%)',
    'DL/EBITDA',
    'Teto Bazin',
    'Teto Graham',
    'Teto Lynch',
    'PEG Lynch',
    'Joel EY (%)',
    'Teto salvo',
    'Faixa · mínimo',
    'Faixa · mediana',
    'Faixa · máximo',
    'Métodos com preço',
  ]

  const lines = rows.map((r) => {
    const range = buildFairPriceRange(
      {
        bazinFairPrice: r.bazinFairPrice,
        grahamFairPrice: r.grahamFairPrice,
        lynchFairPrice: r.lynchFairPrice,
        savedFairPrice: r.savedFairPrice,
      },
      r.price
    )
    return [
      r.rank != null ? String(r.rank) : '',
      r.ticker,
      text(r.name),
      num(r.price),
      num(r.dy, 2, 100),
      num(r.pl, 2),
      num(r.roe, 2, 100),
      num(r.margemLiquida, 2, 100),
      num(r.dividaLiquidaEbit, 2),
      num(r.bazinFairPrice),
      num(r.grahamFairPrice),
      num(r.lynchFairPrice),
      num(r.lynchVal),
      num(r.joelVal, 2, 100),
      num(r.savedFairPrice),
      num(range?.min),
      num(range?.median),
      num(range?.max),
      range ? String(range.available) : '',
    ].join(SEP)
  })

  return BOM + [headers.join(SEP), ...lines].join('\n')
}
