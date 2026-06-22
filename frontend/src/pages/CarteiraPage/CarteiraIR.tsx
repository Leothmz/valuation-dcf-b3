import { useState, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'
import {
  adjustOperationsForSplits,
  classifySaleGains,
  buildMonthlyIRSummary,
  buildIRPFAnnualSummary,
} from '../../engines/portfolio-engine'
import type { GainCategory } from '../../engines/portfolio-engine'
import type { Operation, SplitEvent } from '../../stores/portfolioStore'

const fBRL = (v: number) => fBRLFormatter.format(v)

const CATEGORY_LABELS: Record<GainCategory, string> = {
  swing_acoes: 'Swing Trade (Ações)',
  day_trade: 'Day Trade',
  swing_fii: 'FIIs',
}

interface CarteiraIRProps {
  operations: Operation[]
  splitEvents: SplitEvent[]
  onAddSplitEvent: (event: Omit<SplitEvent, 'id'>) => void
  onDeleteSplitEvent: (id: string) => void
}

const EMPTY_SPLIT_FORM = {
  ticker: '',
  date: new Date().toISOString().slice(0, 10),
  ratio: '',
}

export function CarteiraIR({
  operations,
  splitEvents,
  onAddSplitEvent,
  onDeleteSplitEvent,
}: CarteiraIRProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_SPLIT_FORM })
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const adjustedOps = useMemo(
    () => adjustOperationsForSplits(operations, splitEvents),
    [operations, splitEvents]
  )
  const saleGains = useMemo(() => classifySaleGains(adjustedOps), [adjustedOps])
  const monthly = useMemo(() => buildMonthlyIRSummary(saleGains), [saleGains])

  const years = useMemo(() => {
    const fromOps = adjustedOps.map((o) => Number(o.date.slice(0, 4)))
    const fromMonthly = monthly.map((m) => Number(m.month.slice(0, 4)))
    return [...new Set([...fromOps, ...fromMonthly])].sort((a, b) => b - a)
  }, [adjustedOps, monthly])

  const year = selectedYear ?? years[0] ?? new Date().getFullYear()
  const annual = useMemo(
    () => buildIRPFAnnualSummary(adjustedOps, monthly, year),
    [adjustedOps, monthly, year]
  )
  const sortedPositions = useMemo(
    () => [...annual.positions].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    [annual.positions]
  )

  function handleSaveSplit() {
    const ticker = form.ticker.toUpperCase().trim()
    const ratio = parseFloat(form.ratio)
    if (!ticker || !form.date || !ratio || ratio <= 0) return
    onAddSplitEvent({ ticker, date: form.date, ratio })
    setShowModal(false)
    setForm({ ...EMPTY_SPLIT_FORM })
  }

  return (
    <div>
      {/* Split/inplit events */}
      <div
        className="rounded-[14px] p-4 mb-4"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-semibold text-text-sec uppercase tracking-[0.5px]">
            Eventos de Split/Inplit
          </div>
          <button
            onClick={() => {
              setForm({ ...EMPTY_SPLIT_FORM })
              setShowModal(true)
            }}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                       bg-cyan text-black cursor-pointer border-0"
          >
            + Registrar Split
          </button>
        </div>
        {!splitEvents.length ? (
          <p className="text-text-muted text-xs">Nenhum evento registrado.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-text-muted font-normal pb-1">Ticker</th>
                <th className="text-left text-text-muted font-normal pb-1">Data</th>
                <th className="text-right text-text-muted font-normal pb-1">Razão</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {splitEvents.map((e) => (
                <tr key={e.id}>
                  <td className="font-bold py-1">{e.ticker}</td>
                  <td className="font-mono py-1">{e.date}</td>
                  <td className="text-right font-mono py-1">{e.ratio}x</td>
                  <td className="text-right py-1">
                    <button
                      onClick={() => onDeleteSplitEvent(e.id)}
                      className="text-text-muted hover:text-red cursor-pointer border-0 bg-transparent p-0.5"
                      title="Deletar evento"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Monthly DARF dashboard */}
      <div
        className="rounded-[14px] p-4 mb-4"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <div className="text-[13px] font-semibold text-text-sec uppercase tracking-[0.5px] mb-3">
          Dashboard Mensal — DARF
        </div>
        {!monthly.length ? (
          <p className="text-text-muted text-xs">Nenhuma venda registrada.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-text-muted font-normal pb-1.5">Mês</th>
                <th className="text-left text-text-muted font-normal pb-1.5">Categoria</th>
                <th className="text-right text-text-muted font-normal pb-1.5">Ganho Bruto</th>
                <th className="text-right text-text-muted font-normal pb-1.5">Isenção</th>
                <th className="text-right text-text-muted font-normal pb-1.5">Base Tributável</th>
                <th className="text-right text-text-muted font-normal pb-1.5">Alíquota</th>
                <th className="text-right text-text-muted font-normal pb-1.5">DARF a Pagar</th>
                <th className="text-right text-text-muted font-normal pb-1.5">Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={`${m.month}-${m.category}`}>
                  <td className="font-mono py-1.5">{m.month}</td>
                  <td className="py-1.5">{CATEGORY_LABELS[m.category]}</td>
                  <td className="text-right font-mono py-1.5">
                    <span className={m.grossGain >= 0 ? 'text-green' : 'text-red'}>
                      {fBRL(m.grossGain)}
                    </span>
                  </td>
                  <td className="text-right py-1.5">
                    {m.exempt ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-dim text-green">
                        Isento
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-right font-mono py-1.5">{fBRL(m.taxableAmount)}</td>
                  <td className="text-right font-mono py-1.5">{fPct(m.rate, 0)}</td>
                  <td className="text-right font-mono py-1.5 font-bold">
                    {m.darfAmount > 0 ? fBRL(m.darfAmount) : '—'}
                  </td>
                  <td className="text-right font-mono py-1.5 text-text-muted">
                    {m.darfAmount > 0 ? m.dueDate : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* IRPF annual summary */}
      <div
        className="rounded-[14px] p-4"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-semibold text-text-sec uppercase tracking-[0.5px]">
            Resumo Anual IRPF
          </div>
          <select
            aria-label="Ano"
            value={year}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="form-select-dark text-xs w-[100px]"
          >
            {(years.length ? years : [new Date().getFullYear()]).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <div className="text-[11px] text-text-muted mb-1.5">RENDIMENTOS ISENTOS NO ANO</div>
          <div
            className="text-[18px] font-bold text-green"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {fBRL(annual.exemptIncome)}
          </div>
        </div>

        <div className="mb-1.5 text-xs text-text-sec font-semibold">
          Posições em 31/12/{year}
        </div>
        {!sortedPositions.length ? (
          <p className="text-text-muted text-xs mb-4">Nenhuma posição em aberto.</p>
        ) : (
          <table className="w-full text-xs mb-4">
            <thead>
              <tr>
                <th className="text-left text-text-muted font-normal pb-1">Ticker</th>
                <th className="text-right text-text-muted font-normal pb-1">Qtd</th>
                <th className="text-right text-text-muted font-normal pb-1">Custo Médio</th>
                <th className="text-right text-text-muted font-normal pb-1">Custo Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedPositions.map((p) => (
                <tr key={p.ticker}>
                  <td className="font-bold py-1">{p.ticker}</td>
                  <td className="text-right font-mono py-1">{p.qty}</td>
                  <td className="text-right font-mono py-1">{fBRL(p.avgCost)}</td>
                  <td className="text-right font-mono py-1">{fBRL(p.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mb-1.5 text-xs text-text-sec font-semibold">
          Ganhos Tributáveis por Mês
        </div>
        {!annual.taxableGainsByMonth.length ? (
          <p className="text-text-muted text-xs">Nenhum ganho tributável no ano.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-text-muted font-normal pb-1">Mês</th>
                <th className="text-left text-text-muted font-normal pb-1">Categoria</th>
                <th className="text-right text-text-muted font-normal pb-1">Base Tributável</th>
                <th className="text-right text-text-muted font-normal pb-1">Imposto Pago</th>
              </tr>
            </thead>
            <tbody>
              {annual.taxableGainsByMonth.map((m) => (
                <tr key={`${m.month}-${m.category}`}>
                  <td className="font-mono py-1">Ref. {m.month}</td>
                  <td className="py-1">{CATEGORY_LABELS[m.category]}</td>
                  <td className="text-right font-mono py-1">{fBRL(m.taxableAmount)}</td>
                  <td className="text-right font-mono py-1">Pago: {fBRL(m.darfAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add split event modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(6,9,16,.7)' }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-[420px]"
            style={{ background: '#111827', border: '1px solid #1e2d42' }}
          >
            <h3 className="text-base font-bold mb-5">Registrar Split/Inplit</h3>
            <div className="flex flex-col gap-2.5 mb-2.5">
              <FormField label="Ticker">
                <input
                  value={form.ticker}
                  onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                  placeholder="Ex: VALE3"
                  className="form-input-dark"
                />
              </FormField>
              <FormField label="Data">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="form-input-dark"
                />
              </FormField>
              <FormField label="Razão (ex: 2 para split 2-por-1, 0.5 para inplit 1-por-2)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.ratio}
                  onChange={(e) => setForm({ ...form, ratio: e.target.value })}
                  className="form-input-dark"
                />
              </FormField>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                           bg-transparent text-text-sec border border-border cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSplit}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                           bg-cyan text-black cursor-pointer border-0"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">{label}</label>
      {children}
    </div>
  )
}
