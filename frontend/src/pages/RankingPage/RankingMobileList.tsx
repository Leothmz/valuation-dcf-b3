import { Link } from 'react-router-dom'
import { Star, X } from 'lucide-react'
import { ExpandableRow } from '../../components/ExpandableRow'
import { fBRL, fPct, fPctSigned, fNum } from '../../engines/formatters'
import type { RankingMethod } from '../../stores/rankingStore'

interface Row {
  ticker: string
  price?: number | null
  fairPrice?: number | null
  joelVal?: number | null
  pl?: number | null
  dy?: number | null
  roe?: number | null
  margemLiquida?: number | null
  dividaLiquidaEbit?: number | null
  isCustom?: boolean
  [key: string]: unknown
}

interface RankingMobileListProps {
  rows: Row[]
  method: RankingMethod
  favorites: string[]
  onToggleFavorite: (ticker: string) => void
  onRemoveCustom: (ticker: string) => void
  /** Step 9 — modo de seleção para comparação (opcional; usado pelo botão flutuante "Comparar"). */
  compareMode?: boolean
  compareSelection?: string[]
  onToggleCompare?: (ticker: string) => void
  maxCompare?: number
}

/**
 * No Joel a métrica-herói é o Earnings Yield (`row.joelVal`, sem sinal — é sempre
 * positivo por construção, só calculado quando P/L > 0); nos demais métodos é o
 * upside contra o preço teto do método ativo (`row.fairPrice`), com sinal.
 * Fórmula do upside confirmada em engines/ranking-scores.ts: (fair - price) / fair.
 */
function heroMetric(row: Row, method: RankingMethod): { text: string; positive: boolean } | null {
  if (method === 'joel') {
    const ey = row.joelVal
    if (ey == null) return null
    return { text: fPct(ey), positive: ey >= 0 }
  }
  const fair = row.fairPrice
  const price = row.price
  if (fair == null || price == null || fair === 0) return null
  const upside = (fair - price) / fair
  return { text: fPctSigned(upside), positive: upside >= 0 }
}

export function RankingMobileList({
  rows, method, favorites, onToggleFavorite, onRemoveCustom,
  compareMode = false, compareSelection = [], onToggleCompare, maxCompare = 3,
}: RankingMobileListProps) {
  return (
    <div className="md:hidden">
      {rows.map((row, i) => {
        const hero = heroMetric(row, method)
        const isFav = favorites.includes(row.ticker)
        const isSelectedForCompare = compareSelection.includes(row.ticker)
        const compareDisabled = !isSelectedForCompare && compareSelection.length >= maxCompare

        return (
          <ExpandableRow key={row.ticker} ariaLabel={row.ticker} summary={
            <>
              {compareMode && onToggleCompare && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleCompare(row.ticker) }}
                  onKeyDown={(e) => { e.stopPropagation() }}
                  aria-label={`Selecionar ${row.ticker} para comparar`}
                  aria-pressed={isSelectedForCompare}
                  disabled={compareDisabled}
                  className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center
                             cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span
                    className="w-[18px] h-[18px] rounded-full border-2"
                    style={{
                      borderColor: isSelectedForCompare ? 'var(--color-cyan)' : 'var(--color-border)',
                      background: isSelectedForCompare ? 'var(--color-cyan)' : 'transparent',
                    }}
                  />
                </button>
              )}

              <span
                className="shrink-0 min-w-[24px] text-center text-[11px] font-extrabold rounded-full px-1.5 py-0.5"
                style={{ background: 'rgba(6,182,212,.15)', color: 'var(--color-cyan)' }}
              >
                {i + 1}
              </span>
              <span className="font-mono font-extrabold text-[13px] text-cyan truncate">
                {row.ticker}
              </span>
              {row.isCustom && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveCustom(row.ticker) }}
                  onKeyDown={(e) => { e.stopPropagation() }}
                  aria-label={`Remover ${row.ticker}`}
                  className="shrink-0 min-w-[44px] min-h-[44px] rounded-[5px] px-1.5 text-[10px] font-bold
                             cursor-pointer flex items-center justify-center gap-1"
                  style={{
                    background: 'var(--color-amber-dim)',
                    color: 'var(--color-amber)',
                    border: '1px solid rgba(245,158,11,.2)',
                  }}
                >
                  Custom <X size={10} />
                </button>
              )}
              <span className="ml-auto font-mono text-[11px] text-text-sec shrink-0">
                {row.price != null ? fBRL.format(row.price) : '—'}
              </span>
              {hero && (
                <span
                  className="font-mono text-[12px] font-bold shrink-0"
                  style={{ color: hero.positive ? 'var(--color-green)' : 'var(--color-red)' }}
                >
                  {hero.text}
                </span>
              )}
            </>
          }>
            <div className="flex items-baseline justify-between py-1">
              <span className="text-[12px] text-text-sec">Preço Teto</span>
              <span className="font-mono text-[14px] font-bold text-text-base">
                {row.fairPrice != null ? fBRL.format(row.fairPrice) : '—'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {[
                { lb: 'P/L', vl: row.pl != null ? fNum(row.pl, 1) : '—' },
                { lb: 'DY', vl: row.dy != null ? fPct(row.dy, 1) : '—' },
                { lb: 'ROE', vl: row.roe != null ? fPct(row.roe, 0) : '—' },
              ].map(({ lb, vl }) => (
                <div key={lb} className="rounded-[7px] border border-border p-1.5 text-center"
                     style={{ background: 'var(--color-bg-1)' }}>
                  <div className="text-[9px] uppercase tracking-[.4px] text-text-muted">{lb}</div>
                  <div className="font-mono text-[12px] font-bold text-text-base">{vl}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {[
                { lb: 'Margem Líq.', vl: row.margemLiquida != null ? fPct(row.margemLiquida, 1) : '—' },
                { lb: 'DL/EBITDA', vl: row.dividaLiquidaEbit != null ? fNum(row.dividaLiquidaEbit, 1) : '—' },
              ].map(({ lb, vl }) => (
                <div key={lb} className="flex justify-between rounded-[7px] border border-border px-2 py-1.5"
                     style={{ background: 'var(--color-bg-1)' }}>
                  <span className="text-[10px] text-text-muted">{lb}</span>
                  <span className="font-mono text-[11px] font-bold text-text-base">{vl}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onToggleFavorite(row.ticker)}
                className="flex-1 min-h-[44px] rounded-[8px] border border-border text-[12px] font-semibold
                           cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: 'var(--color-bg-1)', color: isFav ? 'var(--color-amber)' : 'var(--color-text-sec)' }}
              >
                <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? 'Favorito' : 'Favoritar'}
              </button>
              <Link
                to={`/analise?ticker=${row.ticker}`}
                className="flex-1 min-h-[44px] rounded-[8px] border border-border text-[12px] font-semibold
                           flex items-center justify-center"
                style={{ background: 'var(--color-bg-1)', color: 'var(--color-text-sec)' }}
              >
                Analisar ›
              </Link>
            </div>
          </ExpandableRow>
        )
      })}
    </div>
  )
}
