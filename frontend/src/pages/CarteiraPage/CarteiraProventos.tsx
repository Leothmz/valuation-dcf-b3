import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { fBRL as fBRLFormatter } from '../../engines/formatters'
import type { Provento } from '../../stores/portfolioStore'

const fBRL = (v: number) => fBRLFormatter.format(v)

const NOW = new Date()
const CUR_YEAR = NOW.getFullYear()
const CUR_MONTH = `${CUR_YEAR}-${String(NOW.getMonth() + 1).padStart(2, '0')}`

const PROV_TYPE_LABELS: Record<string, string> = {
  dividendo: 'Dividendo',
  jcp: 'JCP',
  rendimento: 'Rendimento',
  reembolso: 'Reembolso',
  fracao: 'Fração',
  bonificacao: 'Bonificação',
  outro: 'Outro',
}

const PROV_BADGE_CLASS: Record<string, string> = {
  dividendo: 'text-cyan bg-cyan-dim border-cyan/20',
  jcp: 'text-amber bg-amber-dim border-amber/20',
  rendimento: 'text-[#818cf8] bg-[rgba(99,102,241,.15)] border-[rgba(99,102,241,.25)]',
  reembolso: 'text-green bg-green-dim border-green/20',
  fracao: 'text-text-muted bg-transparent border-border',
  bonificacao: 'text-purple bg-purple-dim border-purple/20',
  outro: 'text-text-muted bg-transparent border-border',
}

interface CarteiraProventosProps {
  proventos: Provento[]
  onAdd: (p: Omit<Provento, 'id'>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  ticker: '',
  type: 'dividendo' as Provento['type'],
  qty: '',
  valuePerShare: '',
}

export function CarteiraProventos({ proventos, onAdd, onDelete }: CarteiraProventosProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [yearFilter, setYearFilter] = useState('')
  const [tickerFilter, setTickerFilter] = useState('')

  const total = proventos.reduce((s, p) => s + p.qty * p.valuePerShare, 0)
  const anoAtual = proventos
    .filter((p) => p.date.startsWith(String(CUR_YEAR)))
    .reduce((s, p) => s + p.qty * p.valuePerShare, 0)
  const mesAtual = proventos
    .filter((p) => p.date.startsWith(CUR_MONTH))
    .reduce((s, p) => s + p.qty * p.valuePerShare, 0)

  const months = new Set(proventos.map((p) => p.date.slice(0, 7)))
  const mediaStr = months.size > 0 ? fBRL(total / months.size) : '—'

  const years = [...new Set(proventos.map((p) => p.date.slice(0, 4)))].sort().reverse()

  const filtered = [...proventos]
    .filter((p) => {
      if (yearFilter && !p.date.startsWith(yearFilter)) return false
      if (tickerFilter && !p.ticker.includes(tickerFilter.toUpperCase())) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  function handleSave() {
    const ticker = form.ticker.toUpperCase().trim()
    const qty = parseFloat(form.qty) || 0
    const valuePerShare = parseFloat(form.valuePerShare) || 0
    if (!ticker || !qty || !form.date || !valuePerShare) return
    onAdd({ date: form.date, ticker, type: form.type, qty, valuePerShare })
    setShowModal(false)
    setForm({ ...EMPTY_FORM })
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'TOTAL RECEBIDO', value: fBRL(total) },
          { label: 'ANO ATUAL', value: fBRL(anoAtual) },
          { label: 'MÊS ATUAL', value: fBRL(mesAtual) },
          { label: 'MÉDIA MENSAL', value: mediaStr },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[14px] p-4"
            style={{ background: '#111827', border: '1px solid #1e2d42' }}
          >
            <div className="text-[11px] text-text-muted mb-1.5">{label}</div>
            <div
              className="text-[20px] font-bold text-text-base"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3.5 flex-wrap">
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) })
            setShowModal(true)
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold
                     bg-cyan text-black cursor-pointer border-0"
        >
          + Registrar Provento
        </button>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="form-select-dark text-xs w-[140px]"
        >
          <option value="">Todos os anos</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <input
          value={tickerFilter}
          onChange={(e) => setTickerFilter(e.target.value)}
          placeholder="Filtrar ticker…"
          className="form-input-dark text-xs w-[160px]"
        />
      </div>

      {!filtered.length ? (
        <p className="text-center text-text-muted py-10 text-sm">Nenhum provento registrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Data', 'Ticker', 'Tipo', 'Quantidade', 'Valor/cota', 'Total', ''].map(
                  (col, i) => (
                    <th
                      key={i}
                      className={`text-[11px] text-text-muted uppercase tracking-[0.4px]
                                  py-2.5 px-2.5 text-left border-b border-border
                                  ${i >= 3 && i <= 5 ? 'text-right' : ''}`}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border-muted hover:bg-white/[0.02]"
                >
                  <td className="px-2.5 py-2.5 text-sm font-mono">{p.date}</td>
                  <td className="px-2.5 py-2.5 text-sm font-bold">{p.ticker}</td>
                  <td className="px-2.5 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border
                                  ${PROV_BADGE_CLASS[p.type] ?? ''}`}
                    >
                      {PROV_TYPE_LABELS[p.type] ?? p.type}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">{p.qty}</td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                    {fBRL(p.valuePerShare)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono text-green">
                    {fBRL(p.qty * p.valuePerShare)}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <button
                      onClick={() => onDelete(p.id)}
                      className="text-text-muted hover:text-red cursor-pointer border-0 bg-transparent p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(6,9,16,.7)' }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-[400px]"
            style={{ background: '#111827', border: '1px solid #1e2d42' }}
          >
            <h3 className="text-base font-bold mb-5">Registrar Provento</h3>
            <div className="flex flex-col gap-2.5 mb-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Ticker</label>
                  <input
                    value={form.ticker}
                    onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                    placeholder="Ex: MXRF11"
                    className="form-input-dark"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as Provento['type'] })
                    }
                    className="form-select-dark"
                  >
                    <option value="dividendo">Dividendo</option>
                    <option value="jcp">JCP</option>
                    <option value="rendimento">Rendimento</option>
                    <option value="reembolso">Reembolso</option>
                    <option value="fracao">Fração</option>
                    <option value="bonificacao">Bonificação</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="form-input-dark"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    className="form-input-dark"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">
                  Valor por cota (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.valuePerShare}
                  onChange={(e) => setForm({ ...form, valuePerShare: e.target.value })}
                  className="form-input-dark"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                           bg-transparent text-text-sec border border-border cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
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
