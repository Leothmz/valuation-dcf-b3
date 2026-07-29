import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'
import {
  buildDividendProjection,
  buildMergedDividendHistory,
  calcYieldOnCost,
} from '../../engines/portfolio-engine'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { DataCard } from '../../components/DataCard'
import type { HoldingSummary, ApiDividendEntry } from '../../engines/portfolio-engine'
import type { Operation, Provento } from '../../stores/portfolioStore'

const fBRL = (v: number) => fBRLFormatter.format(v)

interface CarteiraProventosPorAtivoProps {
  holdings: HoldingSummary[]
  dividendHistoryByTicker: Record<string, ApiDividendEntry[]>
  dpaMap: Record<string, number | null>
  operations: Operation[]
  proventos: Provento[]
  loading: boolean
  onConfirm: (p: Omit<Provento, 'id'>) => void
}

export function CarteiraProventosPorAtivo({
  holdings,
  dividendHistoryByTicker,
  dpaMap,
  operations,
  proventos,
  loading,
  onConfirm,
}: CarteiraProventosPorAtivoProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const isMobile = useIsMobile()

  if (!holdings.length) {
    return <p className="text-center text-text-muted py-10 text-sm">Nenhum ativo em carteira.</p>
  }

  const projection = buildDividendProjection(holdings, dpaMap)

  return (
    <div>
      <div
        className="rounded-[14px] p-4 mb-4"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <div className="text-[11px] text-text-muted mb-1.5">PROJEÇÃO DE RENDA PASSIVA (12M)</div>
        <div
          className="text-[20px] font-bold text-cyan"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {loading ? '—' : fBRL(projection.total)}
        </div>
      </div>

      {holdings.map((h) => {
        const dpa = dpaMap[h.ticker] ?? null
        const yieldOnCost = calcYieldOnCost(dpa, h.precoMedio)
        const projected = projection.perTicker[h.ticker]
        const isExpanded = expanded === h.ticker
        const merged = buildMergedDividendHistory(
          h.ticker,
          dividendHistoryByTicker[h.ticker] ?? [],
          operations,
          proventos
        )

        return (
          <div
            key={h.ticker}
            className="rounded-[10px] mb-2 overflow-hidden"
            style={{ border: '1px solid #1e2d42' }}
          >
            <button
              onClick={() => setExpanded(isExpanded ? null : h.ticker)}
              className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-0 cursor-pointer text-left"
              style={{ background: '#111827' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{h.ticker}</span>
                <span className="text-xs text-text-muted">DPA {dpa != null ? fBRL(dpa) : '—'}</span>
                <span className="text-xs text-text-muted">
                  Yield on Cost {yieldOnCost != null ? fPct(yieldOnCost, 1) : '—'}
                </span>
                <span className="text-xs text-cyan">
                  Projeção 12m {projected != null ? fBRL(projected) : '—'}
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-text-muted transition-transform"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            {isExpanded && (
              <div className="px-4 py-3" style={{ borderTop: '1px solid #1e2d42' }}>
                {!merged.length ? (
                  <p className="text-text-muted text-xs">Sem histórico de proventos para este ativo.</p>
                ) : isMobile ? (
                  <div>
                    {merged.map((entry) => (
                      <DataCard
                        key={entry.date}
                        title={<span className="font-mono">{entry.date}</span>}
                        badge={
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              entry.source === 'confirmed'
                                ? 'bg-green-dim text-green'
                                : 'bg-amber-dim text-amber'
                            }`}
                          >
                            {entry.source === 'confirmed' ? 'Confirmado' : 'Estimado'}
                          </span>
                        }
                        fields={[
                          { label: 'Quantidade', value: entry.qty },
                          { label: 'Valor/cota', value: fBRL(entry.valuePerShare) },
                          { label: 'Total', value: fBRL(entry.total), emphasis: true },
                        ]}
                        actions={
                          entry.source === 'estimated' ? (
                            <button
                              onClick={() =>
                                onConfirm({
                                  date: entry.date,
                                  ticker: entry.ticker,
                                  type: entry.type,
                                  qty: entry.qty,
                                  valuePerShare: entry.valuePerShare,
                                })
                              }
                              className="flex-1 min-h-[44px] rounded-[8px] border border-border text-[12px] font-semibold cursor-pointer text-cyan"
                            >
                              Confirmar
                            </button>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-text-muted font-normal pb-1">Data</th>
                        <th className="text-left text-text-muted font-normal pb-1">Status</th>
                        <th className="text-right text-text-muted font-normal pb-1">Qtd</th>
                        <th className="text-right text-text-muted font-normal pb-1">Valor/cota</th>
                        <th className="text-right text-text-muted font-normal pb-1">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {merged.map((entry) => (
                        <tr key={entry.date}>
                          <td className="font-mono py-1">{entry.date}</td>
                          <td className="py-1">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                entry.source === 'confirmed'
                                  ? 'bg-green-dim text-green'
                                  : 'bg-amber-dim text-amber'
                              }`}
                            >
                              {entry.source === 'confirmed' ? 'Confirmado' : 'Estimado'}
                            </span>
                          </td>
                          <td className="text-right font-mono py-1">{entry.qty}</td>
                          <td className="text-right font-mono py-1">{fBRL(entry.valuePerShare)}</td>
                          <td className="text-right font-mono py-1">{fBRL(entry.total)}</td>
                          <td className="text-right py-1">
                            {entry.source === 'estimated' && (
                              <button
                                onClick={() =>
                                  onConfirm({
                                    date: entry.date,
                                    ticker: entry.ticker,
                                    type: entry.type,
                                    qty: entry.qty,
                                    valuePerShare: entry.valuePerShare,
                                  })
                                }
                                className="text-cyan bg-transparent border-0 cursor-pointer text-[11px] underline"
                              >
                                Confirmar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
