import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { fBRL, fPct } from '../../engines/formatters'
import { SECTOR_PT } from '../../data/b3Tickers'
import { PositionBadge } from './PositionBadge'
import { RankDetail } from './RankDetail'
import type { RankedRow } from './index'
import type { RankingMethod } from '../../stores/rankingStore'

interface RankingTableProps {
  rows: RankedRow[]
  isLoading: boolean
  favorites: string[]
  onToggleFav: (ticker: string) => void
  sortCol: string
  sortDir: 'asc' | 'desc'
  onSort: (col: string) => void
  onRemoveCustom?: (ticker: string) => void
  compareSelection?: string[]
  onToggleCompare?: (ticker: string) => void
  maxCompare?: number
  /** Método ativo — decide quais fatores a linha expandida explica. */
  method?: RankingMethod
}

// #, ticker, cotação, DY, P/L, margem, ROE, DL/EBITDA, 4 métodos, detalhe = 13;
// +1 quando a coluna de seleção para comparar está montada.
const COLUMN_COUNT = 14

function fNum(v: number | null | undefined, dec = 1): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const TH = ({
  col,
  sortCol,
  sortDir,
  onSort,
  children,
  align = 'right',
}: {
  col: string
  sortCol: string
  sortDir: 'asc' | 'desc'
  onSort: (c: string) => void
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
}) => {
  const isActive = sortCol === col
  const arrow = isActive ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''
  return (
    <th
      className={`bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.08em] uppercase py-3 px-3 whitespace-nowrap cursor-pointer select-none text-${align}`}
      onClick={() => onSort(col)}
      style={{ color: isActive ? 'var(--color-cyan)' : undefined }}
    >
      {children}{arrow}
    </th>
  )
}

export function RankingTable({
  rows,
  isLoading,
  favorites,
  onToggleFav,
  sortCol,
  sortDir,
  onSort,
  onRemoveCustom,
  compareSelection = [],
  onToggleCompare,
  maxCompare = 3,
  method = 'thomaz',
}: RankingTableProps) {
  const navigate = useNavigate()
  // Uma linha expandida por vez: duas abertas empurram a tabela e o usuário
  // perde a referência de onde estava na varredura.
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-[14px]">
        Carregando dados…
      </div>
    )
  }

  if (!isLoading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-[14px]">
        Nenhuma ação encontrada com os filtros atuais
      </div>
    )
  }

  return (
    <div className="border border-border rounded-[14px] overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              {onToggleCompare && (
                <th className="bg-bg-2 border-b border-border py-3 px-3 w-8" />
              )}
              <TH col="rank"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center">#</TH>
              <TH col="ticker"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="left">Ticker</TH>
              <TH col="price"   sortCol={sortCol} sortDir={sortDir} onSort={onSort}>Cotação</TH>
              <TH col="dy"      sortCol={sortCol} sortDir={sortDir} onSort={onSort}>DY</TH>
              <TH col="pl"      sortCol={sortCol} sortDir={sortDir} onSort={onSort}>P/L</TH>
              <TH col="margemLiquida" sortCol={sortCol} sortDir={sortDir} onSort={onSort}>Margem Líq.</TH>
              <TH col="roe"     sortCol={sortCol} sortDir={sortDir} onSort={onSort}>ROE</TH>
              <TH col="dividaLiquidaEbit" sortCol={sortCol} sortDir={sortDir} onSort={onSort}>DL/EBITDA</TH>
              <th
                className="bg-bg-2 border-b border-border text-[11px] font-semibold tracking-[.08em] uppercase py-3 px-3 text-right whitespace-nowrap"
                style={{ color: 'var(--color-text-sec)' }}
              >
                Bazin
              </th>
              <th
                className="bg-bg-2 border-b border-border text-[11px] font-semibold tracking-[.08em] uppercase py-3 px-3 text-right whitespace-nowrap"
                style={{ color: 'var(--color-text-sec)' }}
              >
                Graham
              </th>
              <th
                className="bg-bg-2 border-b border-border text-[11px] font-semibold tracking-[.08em] uppercase py-3 px-3 text-right whitespace-nowrap"
                style={{ color: 'var(--color-text-sec)' }}
              >
                P. Lynch
              </th>
              <th
                className="bg-bg-2 border-b border-border text-[11px] font-semibold tracking-[.08em] uppercase py-3 px-3 text-right whitespace-nowrap"
                style={{ color: 'var(--color-text-sec)' }}
              >
                Joel EY
              </th>
              {/* Coluna do botão de detalhe — sem rótulo, o ícone se explica. */}
              <th className="bg-bg-2 border-b border-border py-3 px-2 w-9" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const isFav = favorites.includes(s.ticker)
              const sectorLabel = s.setor ? (SECTOR_PT[s.setor] ?? s.setor) : null
              const deVal = s.dividaLiquidaEbit
              const deColor =
                deVal == null ? 'var(--color-text-sec)'
                : deVal > 3   ? 'var(--color-red)'
                : deVal < 0   ? 'var(--color-green)'
                : 'var(--color-text-sec)'

              const isSelectedForCompare = compareSelection.includes(s.ticker)
              // Sem trava: a seleção alimenta comparar, salvar tetos e exportar. O limite
              // de 3 é da tela de comparação e agora vive no botão Comparar.
              const compareDisabled = false

              return [
                <tr
                  key={s.ticker}
                  className="border-b border-border-muted last:border-b-0 cursor-pointer"
                  style={{ transition: 'background .12s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,.025)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                  onClick={() => navigate(`/dcf?ticker=${encodeURIComponent(s.ticker)}`)}
                >
                  {/* Compare checkbox */}
                  {onToggleCompare && (
                    <td className="py-[10px] px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelectedForCompare}
                        disabled={compareDisabled}
                        onChange={() => onToggleCompare(s.ticker)}
                        title={compareDisabled ? `Máximo de ${maxCompare} tickers para comparar` : 'Selecionar para comparar'}
                        className="appearance-none w-[15px] h-[15px] rounded-[3px] border border-border bg-bg-3
                                   checked:bg-cyan checked:border-cyan accent-cyan
                                   cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                  )}

                  {/* Rank badge */}
                  <td className="py-[10px] px-3 text-center align-middle whitespace-nowrap">
                    <PositionBadge rank={s.rank} />
                  </td>

                  {/* Ticker + fav button */}
                  <td
                    className="py-[10px] px-3 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFav(s.ticker) }}
                        className="text-[14px] leading-none cursor-pointer"
                        title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        style={{ color: isFav ? '#f59e0b' : 'var(--color-text-muted)', background: 'none', border: 'none', padding: 0 }}
                      >
                        ★
                      </button>
                      <button
                        onClick={() => navigate(`/dcf?ticker=${encodeURIComponent(s.ticker)}`)}
                        className="font-mono font-semibold text-[13px] cursor-pointer"
                        style={{ color: 'var(--color-cyan)', background: 'none', border: 'none', padding: 0 }}
                      >
                        {s.ticker}
                      </button>
                      {s.isCustom && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-medium px-[6px] py-[2px] rounded-[5px]"
                          style={{ background: 'var(--color-amber-dim)', color: 'var(--color-amber)', border: '1px solid rgba(245,158,11,.2)' }}
                        >
                          Custom
                          {onRemoveCustom && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveCustom(s.ticker) }}
                              title={`Remover ${s.ticker} dos tickers customizados`}
                              className="cursor-pointer leading-none"
                              style={{ background: 'none', border: 'none', padding: 0, color: 'inherit' }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      )}
                      {sectorLabel && (
                        <span
                          className="text-[10px] font-medium px-[6px] py-[2px] rounded-[5px] hidden md:inline"
                          style={{
                            background: 'var(--color-bg-4)',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {sectorLabel}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cotação */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px] text-text-base">
                    {s.price != null ? fBRL.format(s.price) : '—'}
                  </td>

                  {/* DY */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{ color: s.dy != null && s.dy > 0.06 ? 'var(--color-green)' : 'var(--color-text-sec)' }}>
                    {s.dy != null ? fPct(s.dy) : '—'}
                  </td>

                  {/* P/L */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{ color: s.pl != null && s.pl < 0 ? 'var(--color-red)' : 'var(--color-text-sec)' }}>
                    {fNum(s.pl, 1)}
                  </td>

                  {/* Margem Líq. */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px] text-text-sec">
                    {s.margemLiquida != null ? fPct(s.margemLiquida) : '—'}
                  </td>

                  {/* ROE */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{ color: s.roe != null && s.roe > 0.2 ? 'var(--color-green)' : 'var(--color-text-sec)' }}>
                    {s.roe != null ? fPct(s.roe) : '—'}
                  </td>

                  {/* DL/EBITDA */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]" style={{ color: deColor }}>
                    {fNum(deVal, 2)}
                  </td>

                  {/* Bazin fair price */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{ color: 'var(--color-cyan)' }}>
                    {s.bazinFairPrice != null ? fBRL.format(s.bazinFairPrice) : '—'}
                  </td>

                  {/* Graham fair price */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{ color: 'var(--color-purple)' }}>
                    {s.grahamFairPrice != null ? fBRL.format(s.grahamFairPrice) : '—'}
                  </td>

                  {/* Lynch PEG */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{ color: 'var(--color-text-base)' }}>
                    {s.lynchVal != null ? fNum(s.lynchVal, 2) : '—'}
                  </td>

                  {/* Joel Earnings Yield */}
                  <td className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{ color: 'var(--color-text-base)' }}>
                    {s.joelVal != null ? fPct(s.joelVal) : '—'}
                  </td>

                  {/* Detalhe — stopPropagation porque o clique na linha navega
                      para a DCF; expandir não pode levar embora da tela. */}
                  <td className="py-[10px] px-2 align-middle" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setExpanded((prev) => (prev === s.ticker ? null : s.ticker))}
                      aria-expanded={expanded === s.ticker}
                      aria-label={`Detalhe de ${s.ticker}`}
                      className="flex items-center justify-center w-7 h-7 rounded-[7px] text-text-muted
                                 hover:text-cyan hover:bg-bg-3 cursor-pointer transition-colors"
                    >
                      {expanded === s.ticker ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </td>
                </tr>,

                expanded === s.ticker && (
                  <tr key={`${s.ticker}-detalhe`} className="border-b border-border-muted">
                    <td colSpan={COLUMN_COUNT} className="px-4 py-3" style={{ background: 'var(--color-bg-1)' }}>
                      <RankDetail row={s} method={method} />
                    </td>
                  </tr>
                ),
              ]
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
