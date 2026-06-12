import { useState } from 'react'
import { ChevronRight, Trash2 } from 'lucide-react'
import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'
import { aggregateTitle, projectDeposit } from '../../engines/portfolio-engine'
import type { RFTitle, RFType, RFRateType } from '../../stores/portfolioStore'

const fBRL = (v: number) => fBRLFormatter.format(v)

const TYPE_LABELS: Record<string, string> = {
  cdb: 'CDB', lci: 'LCI', lca: 'LCA', cri: 'CRI',
  cra: 'CRA', debenture: 'DEB', tesouro: 'TESOURO', outro: 'OUTRO',
}

const RATE_LABELS: Record<string, string> = {
  cdi_pct: '% CDI',
  ipca_plus: 'IPCA+',
  prefixado: 'Prefixado',
  manual: 'Manual',
}

const RATE_COLORS: Record<string, string> = {
  cdi_pct: '#818cf8',
  ipca_plus: '#f59e0b',
  prefixado: '#06b6d4',
  manual: '#4a5568',
}

const EMPTY_FORM = {
  name: '',
  type: 'cdb' as RFType,
  date: new Date().toISOString().slice(0, 10),
  rateType: 'cdi_pct' as RFRateType,
  rate: '',
  amount: '',
  maturity: '',
}

interface CarteiraRFProps {
  titles: RFTitle[]
  cdiAccumulated: number
  onAdd: (title: Omit<RFTitle, 'id'>) => void
  onDelete: (id: string) => void
  onDeleteDeposit: (titleId: string, depositId: string) => void
}

export function CarteiraRF({
  titles,
  cdiAccumulated,
  onAdd,
  onDelete,
  onDeleteDeposit,
}: CarteiraRFProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const today = new Date().toISOString().slice(0, 10)

  function handleSave() {
    const name = form.name.trim()
    const amount = parseFloat(form.amount) || 0
    if (!name || !amount || !form.date) return
    onAdd({
      name,
      type: form.type,
      rateType: form.rateType,
      baseRate: parseFloat(form.rate) || 0,
      maturityDate: form.maturity || null,
      deposits: [
        {
          id: crypto.randomUUID(),
          date: form.date,
          amount,
          rateOverride: null,
          manualCurrentValue: null,
        },
      ],
    })
    setShowModal(false)
    setForm({ ...EMPTY_FORM })
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!titles.length) {
    return (
      <div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold
                     bg-cyan text-black cursor-pointer border-0 mb-3.5"
        >
          + Adicionar Título
        </button>
        <p className="text-center text-text-muted py-10 text-sm">Nenhum título cadastrado.</p>
        {showModal && (
          <RFModal
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold
                   bg-cyan text-black cursor-pointer border-0 mb-3.5"
      >
        + Adicionar Título
      </button>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-6" />
              {['Nome / Emissor', 'Tipo', 'Taxa', 'Investido', 'Valor Atual', 'Retorno', 'Vencimento', ''].map(
                (col, i) => (
                  <th
                    key={i}
                    className={`text-[11px] text-text-muted uppercase tracking-[0.4px]
                                py-2.5 px-2.5 text-left border-b border-border whitespace-nowrap
                                ${i >= 3 && i <= 5 ? 'text-right' : ''}`}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {titles.map((title) => {
              const agg = aggregateTitle(title, { cdiAccumulated }, today)
              const retStr =
                agg.retorno != null
                  ? (agg.retorno >= 0 ? '+' : '') + fPct(agg.retorno, 1)
                  : '—'
              const retColor = agg.retorno != null && agg.retorno >= 0 ? 'text-green' : 'text-red'
              const isOpen = expanded.has(title.id)

              return (
                <>
                  <tr
                    key={title.id}
                    className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                    style={{ background: '#111827' }}
                    onClick={() => toggleExpand(title.id)}
                  >
                    <td className="px-2.5 py-2.5 w-6">
                      <ChevronRight
                        size={10}
                        className={`text-text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </td>
                    <td className="px-2.5 py-2.5 text-sm font-bold">
                      {title.name}
                      <span className="ml-2 text-[11px] text-text-muted font-normal">
                        {title.deposits.length} aporte{title.deposits.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold
                                       text-[#818cf8] bg-[rgba(99,102,241,.15)] border border-[rgba(99,102,241,.25)]">
                        {TYPE_LABELS[title.type] ?? title.type}
                      </span>
                    </td>
                    <td
                      className="px-2.5 py-2.5 text-sm font-mono"
                      style={{ color: RATE_COLORS[title.rateType] }}
                    >
                      {title.baseRate}
                      {RATE_LABELS[title.rateType] === '% CDI' ? '% CDI' : title.rateType === 'ipca_plus' ? '% IPCA+' : '%'}
                    </td>
                    <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                      {fBRL(agg.totalInvested)}
                    </td>
                    <td className="px-2.5 py-2.5 text-right text-sm font-mono text-[#818cf8]">
                      {fBRL(agg.totalProjected)}
                    </td>
                    <td className={`px-2.5 py-2.5 text-right text-sm font-mono ${retColor}`}>
                      {retStr}
                    </td>
                    <td className="px-2.5 py-2.5 text-sm text-text-muted">
                      {title.maturityDate ? title.maturityDate.slice(0, 7) : '—'}
                    </td>
                    <td className="px-2.5 py-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(title.id)
                        }}
                        className="text-text-muted hover:text-red cursor-pointer border-0 bg-transparent p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>

                  {isOpen &&
                    title.deposits.map((dep) => {
                      const daysElapsed = Math.max(
                        0,
                        Math.floor(
                          (new Date(today).getTime() - new Date(dep.date).getTime()) / 86400000
                        )
                      )
                      const proj = projectDeposit({
                        amount: dep.amount,
                        rateType: title.rateType,
                        baseRate: dep.rateOverride ?? title.baseRate,
                        cdiAccumulated,
                        daysElapsed,
                        manualCurrentValue: dep.manualCurrentValue,
                      })
                      const r = dep.amount > 0 ? (proj - dep.amount) / dep.amount : null

                      return (
                        <tr
                          key={dep.id}
                          className="border-b border-border-muted"
                          style={{ background: 'rgba(99,102,241,.04)' }}
                        >
                          <td />
                          <td className="px-2.5 py-2 pl-8 text-xs text-text-sec">{dep.date}</td>
                          <td />
                          <td className="px-2.5 py-2 text-xs text-text-muted font-mono">
                            {dep.rateOverride != null ? dep.rateOverride : '↑ herda'}
                          </td>
                          <td className="px-2.5 py-2 text-right text-xs font-mono">
                            {fBRL(dep.amount)}
                          </td>
                          <td className="px-2.5 py-2 text-right text-xs font-mono text-[#818cf8]">
                            {fBRL(proj)}
                          </td>
                          <td
                            className={`px-2.5 py-2 text-right text-xs font-mono ${r != null && r >= 0 ? 'text-green' : 'text-red'}`}
                          >
                            {r != null ? (r >= 0 ? '+' : '') + fPct(r, 1) : '—'}
                          </td>
                          <td className="px-2.5 py-2 text-xs text-text-muted">{dep.date}</td>
                          <td className="px-2.5 py-2">
                            <button
                              onClick={() => onDeleteDeposit(title.id, dep.id)}
                              className="text-text-muted hover:text-red cursor-pointer border-0 bg-transparent p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <RFModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

interface RFFormState {
  name: string
  type: RFType
  date: string
  rateType: RFRateType
  rate: string
  amount: string
  maturity: string
}

function RFModal({
  form,
  setForm,
  onSave,
  onClose,
}: {
  form: RFFormState
  setForm: (f: RFFormState) => void
  onSave: () => void
  onClose: () => void
}) {
  const RATE_PILLS: { key: RFRateType; label: string }[] = [
    { key: 'cdi_pct', label: '% CDI' },
    { key: 'ipca_plus', label: 'IPCA+' },
    { key: 'prefixado', label: 'Prefixado' },
    { key: 'manual', label: 'Manual' },
  ]
  const RATE_INPUT_LABELS: Record<RFRateType, string> = {
    cdi_pct: 'Taxa (% CDI)',
    ipca_plus: 'Spread IPCA+ (%)',
    prefixado: 'Taxa Prefixada (%)',
    manual: '— sem cálculo automático',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(6,9,16,.7)' }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-[480px]"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <h3 className="text-base font-bold mb-5">Adicionar Título de Renda Fixa</h3>

        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Nome / Descrição</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: CDB Nubank"
              className="form-input-dark"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as RFType })}
                className="form-select-dark"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Data do Aporte</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="form-input-dark"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-[0.4px] block mb-2">Tipo de Taxa</label>
            <div className="flex gap-1.5">
              {RATE_PILLS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, rateType: key })}
                  className={`px-3 py-1 rounded-md text-xs border cursor-pointer transition-colors
                             ${form.rateType === key
                               ? 'text-[#818cf8] bg-[rgba(129,140,248,.15)] border-[#818cf8]'
                               : 'text-text-muted border-border bg-transparent hover:border-[#818cf8]'
                             }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">
                {RATE_INPUT_LABELS[form.rateType]}
              </label>
              <input
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="Ex: 110"
                className="form-input-dark"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Valor Investido (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="form-input-dark"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">Vencimento (opcional)</label>
            <input
              type="date"
              value={form.maturity}
              onChange={(e) => setForm({ ...form, maturity: e.target.value })}
              className="form-input-dark"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                       bg-transparent text-text-sec border border-border cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                       bg-cyan text-black cursor-pointer border-0"
          >
            Salvar Título
          </button>
        </div>
      </div>
    </div>
  )
}
