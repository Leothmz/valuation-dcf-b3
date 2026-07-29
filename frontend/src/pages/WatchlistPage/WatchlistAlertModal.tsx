import { X } from 'lucide-react'
import { fBRL } from '../../engines/formatters'
import { useIsMobile } from '../../hooks/useMediaQuery'
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
  const isMobile = useIsMobile()
  if (!isOpen || !ticker) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                   bg-bg-2 border border-border rounded-none md:rounded-[14px] p-6
                   w-auto md:w-[480px] max-w-none md:max-w-[94vw] max-h-none md:max-h-[80vh] overflow-y-auto"
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
        ) : isMobile ? (
          // Montagem condicional (não CSS) — mesma regra de WatchlistPage/index.tsx.
          <div className="overflow-auto max-h-[70vh]">
            {history.map((h) => (
              <div
                key={h.firedAt}
                className="rounded-[10px] border border-border-muted p-3 mb-2"
                style={{ background: 'var(--color-bg-3)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-text-sec">{fDate(h.firedAt)}</span>
                  <span className="font-mono text-[13px] font-semibold text-cyan">{fBRL.format(h.fairPrice)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-text-muted">Preço no disparo</span>
                  <span className="font-mono text-[13px]" style={{ color: 'var(--color-green)' }}>
                    {fBRL.format(h.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
