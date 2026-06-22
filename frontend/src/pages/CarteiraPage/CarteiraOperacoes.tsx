import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { fBRL as fBRLFormatter } from '../../engines/formatters'
import { useCryptoList } from '../../api/crypto'
import type { Operation, AssetClass, OperationType } from '../../stores/portfolioStore'

const fBRL = (v: number) => fBRLFormatter.format(v)

const CLASS_LABELS: Record<string, string> = {
  acao_br: 'Ação BR',
  fii: 'FII',
  etf: 'ETF',
  stock_intl: 'Stock Intl',
  cripto: 'Criptoativo',
}

type OpFilter = 'all' | 'buy' | 'sell'

interface CarteiraOperacoesProps {
  operations: Operation[]
  onAdd: (op: Omit<Operation, 'id'>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  ticker: '',
  assetClass: 'acao_br' as AssetClass,
  type: 'buy' as OperationType,
  qty: '',
  price: '',
  fees: '0',
}

export function CarteiraOperacoes({
  operations,
  onAdd,
  onDelete,
}: CarteiraOperacoesProps) {
  const [filter, setFilter] = useState<OpFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const { data: cryptoList = [] } = useCryptoList()
  const cryptoLabel = (id: string) =>
    cryptoList.find((c) => c.id === id)?.symbol ?? id.toUpperCase()

  const sorted = [...operations]
    .filter((o) => filter === 'all' || o.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date))

  function handleSave() {
    // Crypto tickers are CoinGecko ids (lowercase, e.g. "bitcoin") — never uppercase those
    const ticker = form.assetClass === 'cripto' ? form.ticker.trim() : form.ticker.toUpperCase().trim()
    const qty = parseFloat(form.qty) || 0
    const price = parseFloat(form.price) || 0
    if (!ticker || !qty || !form.date) return
    onAdd({
      date: form.date,
      ticker,
      assetClass: form.assetClass,
      type: form.type,
      qty,
      price,
      currency: 'BRL',
      fees: parseFloat(form.fees) || 0,
    })
    setShowModal(false)
    setForm({ ...EMPTY_FORM })
  }

  const FILTERS: { key: OpFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'buy', label: 'Compras' },
    { key: 'sell', label: 'Vendas' },
  ]

  return (
    <div>
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
          + Registrar Operação
        </button>
        <div className="flex gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-md text-xs border cursor-pointer transition-colors
                         ${filter === key
                           ? 'bg-cyan-dim text-cyan border-cyan'
                           : 'bg-transparent text-text-muted border-border hover:text-text-sec'
                         }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!sorted.length ? (
        <p className="text-center text-text-muted py-10 text-sm">
          Nenhuma operação registrada.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Data', 'Ticker', 'Tipo', 'Classe', 'Qtd', 'Preço Unit.', 'Total', 'Corretagem', ''].map(
                  (col, i) => (
                    <th
                      key={i}
                      className={`text-[11px] text-text-muted uppercase tracking-[0.4px]
                                  py-2.5 px-2.5 text-left border-b border-border whitespace-nowrap
                                  ${i >= 4 && i <= 7 ? 'text-right' : ''}`}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((op) => (
                <tr
                  key={op.id}
                  className="border-b border-border-muted hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-2.5 py-2.5 text-sm font-mono">{op.date}</td>
                  <td className="px-2.5 py-2.5 text-sm font-bold">
                    {op.assetClass === 'cripto' ? cryptoLabel(op.ticker) : op.ticker}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border
                                  ${op.type === 'buy'
                                    ? 'bg-green-dim text-green border-green/20'
                                    : 'bg-red-dim text-red border-red/20'
                                  }`}
                    >
                      {op.type === 'buy' ? 'COMPRA' : 'VENDA'}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 text-sm text-text-sec">
                    {CLASS_LABELS[op.assetClass] ?? op.assetClass}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">{op.qty}</td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">{fBRL(op.price)}</td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                    {fBRL(op.qty * op.price)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono text-text-muted">
                    {fBRL(op.fees)}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <button
                      onClick={() => onDelete(op.id)}
                      className="text-text-muted hover:text-red cursor-pointer border-0 bg-transparent p-0.5"
                      title="Deletar operação"
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

      {/* Add Operation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(6,9,16,.7)' }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-[480px]"
            style={{ background: '#111827', border: '1px solid #1e2d42' }}
          >
            <h3 className="text-base font-bold mb-5">Registrar Operação</h3>

            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <FormField label="Tipo" className="col-span-2">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as OperationType })}
                  className="form-select-dark"
                >
                  <option value="buy">Compra</option>
                  <option value="sell">Venda</option>
                </select>
              </FormField>
              <FormField label="Ticker">
                {form.assetClass === 'cripto' ? (
                  <select
                    value={form.ticker}
                    onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                    className="form-select-dark"
                  >
                    <option value="">Selecione…</option>
                    {cryptoList.map((c) => (
                      <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.ticker}
                    onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                    placeholder="Ex: WEGE3"
                    className="form-input-dark"
                  />
                )}
              </FormField>
              <FormField label="Classe">
                <select
                  value={form.assetClass}
                  onChange={(e) => setForm({ ...form, assetClass: e.target.value as AssetClass, ticker: '' })}
                  className="form-select-dark"
                >
                  <option value="acao_br">Ação BR</option>
                  <option value="fii">FII</option>
                  <option value="etf">ETF</option>
                  <option value="stock_intl">Stock Internacional</option>
                  <option value="cripto">Criptoativo</option>
                </select>
              </FormField>
              <FormField label="Data">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="form-input-dark"
                />
              </FormField>
              <FormField label="Quantidade">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  className="form-input-dark"
                />
              </FormField>
              <FormField label="Preço Unitário">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="form-input-dark"
                />
              </FormField>
              <FormField label="Corretagem (opcional)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fees}
                  onChange={(e) => setForm({ ...form, fees: e.target.value })}
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
                onClick={handleSave}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                           bg-cyan text-black cursor-pointer border-0"
              >
                Salvar Operação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[11px] text-text-muted uppercase tracking-[0.4px]">
        {label}
      </label>
      {children}
    </div>
  )
}
