import { X } from 'lucide-react'
import { fBRL } from '../../engines/formatters'
import type { AlertEvent } from '../../engines/alert-engine'

// ── Format date ───────────────────────────────────────────────────────────────
function fDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface WatchlistAlertModalProps {
  isOpen: boolean
  onClose: () => void
  ticker: string | null
  history: AlertEvent[]
}

export function WatchlistAlertModal({ isOpen, onClose, ticker, history }: WatchlistAlertModalProps) {
  if (!isOpen || !ticker) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-bg-2 border border-border rounded-[16px] p-6 w-[480px] max-w-[94vw]"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-[16px] font-semibold">
            Histórico de alertas · <span style={{ color: 'var(--color-cyan)' }}>{ticker}</span>
          </div>
          <button
            className="text-text-muted hover:text-text-base transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-[13px] text-text-muted text-center py-6">
            Nenhum alerta disparado ainda — você é avisado quando o preço atual cair para o preço teto ou abaixo.
          </p>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Data', 'Preço', 'Preço Teto'].map((h) => (
                    <th
                      key={h}
                      className="text-[11px] text-text-muted uppercase tracking-[.08em] font-semibold
                                 py-2 px-3 text-left border-b border-border bg-bg-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.firedAt} className="border-b border-border-muted last:border-b-0">
                    <td className="font-mono text-[13px] py-3 px-3 text-text-sec whitespace-nowrap">
                      {fDate(h.firedAt)}
                    </td>
                    <td className="font-mono text-[13px] py-3 px-3" style={{ color: 'var(--color-green)' }}>
                      {fBRL.format(h.price)}
                    </td>
                    <td className="font-mono text-[13px] py-3 px-3 text-cyan">
                      {fBRL.format(h.fairPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
