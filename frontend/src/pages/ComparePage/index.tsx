import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBatchFundamentals } from '../../api/stocks'
import type { FundamentalsData } from '../../api/stocks'
import {
  calcBazinScore,
  calcGrahamScore,
  calcLynchScore,
  calcJoelScore,
} from '../../engines/ranking-scores'
import type { StockData } from '../../engines/ranking-scores'
import { bestWorstIndices } from '../../engines/compare-engine'
import type { Direction } from '../../engines/compare-engine'
import { fBRL, fPct } from '../../engines/formatters'
import { CompareTable } from './CompareTable'
import type { CompareRow } from './CompareTable'

export const MAX_COMPARE_TICKERS = 3

export function parseTickersParam(param: string | null): string[] {
  if (!param) return []
  const seen = new Set<string>()
  for (const raw of param.split(',')) {
    const t = raw.trim().toUpperCase()
    if (t) seen.add(t)
  }
  return [...seen].slice(0, MAX_COMPARE_TICKERS)
}

function fNum(v: number | null | undefined, dec = 2): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function buildRows(stocks: StockData[]): CompareRow[] {
  const bazin = calcBazinScore(stocks)
  const graham = calcGrahamScore(stocks)
  const lynch = calcLynchScore(stocks)
  const joel = calcJoelScore(stocks)

  const defs: Array<{ label: string; values: (number | null | undefined)[]; format: (v: number) => string; direction: Direction | null }> = [
    { label: 'Cotação', values: stocks.map((s) => s.price), format: (v) => fBRL.format(v), direction: null },
    { label: 'DY', values: stocks.map((s) => s.dy), format: fPct, direction: 'desc' },
    { label: 'P/L', values: stocks.map((s) => s.pl), format: (v) => fNum(v, 1), direction: 'asc' },
    { label: 'Margem Líquida', values: stocks.map((s) => s.margemLiquida), format: fPct, direction: 'desc' },
    { label: 'ROE', values: stocks.map((s) => s.roe), format: fPct, direction: 'desc' },
    { label: 'DL/EBITDA', values: stocks.map((s) => s.dividaLiquidaEbit), format: (v) => fNum(v, 2), direction: 'asc' },
    { label: 'Bazin · Preço Teto', values: bazin.map((s) => s.fairPrice), format: (v) => fBRL.format(v), direction: 'desc' },
    { label: 'Graham · Preço Teto', values: graham.map((s) => s.fairPrice), format: (v) => fBRL.format(v), direction: 'desc' },
    { label: 'Peter Lynch · PEG', values: lynch.map((s) => (s as { _peg?: number | null })._peg), format: (v) => fNum(v, 2), direction: 'asc' },
    { label: 'Joel · Earnings Yield', values: joel.map((s) => (s as { _earningsYield?: number | null })._earningsYield), format: fPct, direction: 'desc' },
  ]

  return defs.map((d) => {
    const { best, worst } = d.direction ? bestWorstIndices(d.values, d.direction) : { best: null, worst: null }
    return {
      label: d.label,
      cells: d.values.map((v, i) => ({
        value: v != null ? d.format(v) : '—',
        highlight: best === i ? 'best' as const : worst === i ? 'worst' as const : null,
      })),
    }
  })
}

export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const tickers = parseTickersParam(params.get('tickers'))
  const [input, setInput] = useState('')

  const { data: rawStocks, isLoading } = useBatchFundamentals(tickers)

  function setTickers(next: string[]) {
    const deduped = [...new Set(next.map((t) => t.toUpperCase()))].slice(0, MAX_COMPARE_TICKERS)
    if (deduped.length > 0) {
      setParams({ tickers: deduped.join(',') })
    } else {
      setParams({})
    }
  }

  function handleAdd() {
    const t = input.trim().toUpperCase()
    if (!t || tickers.includes(t) || tickers.length >= MAX_COMPARE_TICKERS) return
    setTickers([...tickers, t])
    setInput('')
  }

  function handleRemove(t: string) {
    setTickers(tickers.filter((x) => x !== t))
  }

  // Preserve URL order — fetch result order isn't guaranteed
  const stocks: FundamentalsData[] = tickers
    .map((t) => rawStocks?.find((s) => s.ticker === t))
    .filter((s): s is FundamentalsData => !!s)

  const rows = buildRows(stocks as StockData[])

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-7 pb-16 flex flex-col gap-5">
      <div
        className="rounded-[16px] border border-border p-6"
        style={{ background: 'linear-gradient(180deg, #0d1829 0%, #0b0f17 100%)' }}
      >
        <h1 className="text-[24px] font-bold text-text-base leading-tight mb-1">
          Comparar Ações
        </h1>
        <p className="text-[13px] text-text-muted mb-5">
          Adicione 2 a {MAX_COMPARE_TICKERS} tickers para comparar indicadores e preços teto lado a lado.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tickers.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 font-mono text-[13px] px-3 py-1.5 rounded-[8px]"
              style={{ background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)', border: '1px solid var(--color-border-glow)' }}
            >
              {t}
              <button
                onClick={() => handleRemove(t)}
                title={`Remover ${t}`}
                className="cursor-pointer leading-none"
                style={{ background: 'none', border: 'none', padding: 0, color: 'inherit' }}
              >
                ×
              </button>
            </span>
          ))}

          {tickers.length < MAX_COMPARE_TICKERS && (
            <>
              <input
                type="text"
                className="rounded-[10px] border border-border bg-bg-3 text-text-base text-[13px] px-[14px] py-[7px] outline-none w-36 placeholder-text-muted focus:border-cyan"
                placeholder="Ex: PETR4"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              />
              <button
                onClick={handleAdd}
                className="rounded-[10px] border border-border bg-bg-3 text-text-sec text-[13px] px-3 py-[7px] cursor-pointer hover:border-cyan hover:text-cyan"
              >
                + Add
              </button>
            </>
          )}
        </div>
      </div>

      {tickers.length < 2 ? (
        <div className="flex items-center justify-center py-20 text-text-muted text-[14px]">
          Adicione pelo menos 2 tickers para comparar
        </div>
      ) : (
        <CompareTable tickers={tickers} rows={rows} isLoading={isLoading} />
      )}
    </div>
  )
}
