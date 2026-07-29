import { X } from 'lucide-react'
import { fBRL } from '../../engines/formatters'
import type { PriceHistoryEntry } from '../../stores/watchlistStore'

// ── Format date ───────────────────────────────────────────────────────────────
function fDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface WatchlistHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  ticker: string | null
  history: PriceHistoryEntry[]
  onUpdateAnnotation: (savedAt: string, annotation: string) => void
}

export function WatchlistHistoryModal({
  isOpen,
  onClose,
  ticker,
  history,
  onUpdateAnnotation,
}: WatchlistHistoryModalProps) {
  if (!isOpen || !ticker) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-bg-2 border border-border rounded-[16px] p-6 w-[640px] max-w-[94vw]"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-[16px] font-semibold">
            Histórico · <span style={{ color: 'var(--color-cyan)' }}>{ticker}</span>
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
            Nenhum histórico ainda — salve o preço teto mais de uma vez para registrar a evolução.
          </p>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Data', 'Preço Teto', 'Variação', 'Anotação'].map((h) => (
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
                {history.map((h, i) => {
                  const prev = history[i + 1]
                  const diff = prev ? ((h.fairPrice - prev.fairPrice) / prev.fairPrice) : null
                  return (
                    <tr key={h.savedAt} className="border-b border-border-muted last:border-b-0">
                      <td className="font-mono text-[13px] py-3 px-3 text-text-sec whitespace-nowrap">
                        {fDate(h.savedAt)}
                      </td>
                      <td className="font-mono text-[13px] py-3 px-3 font-semibold"
                          style={{ color: 'var(--color-cyan)' }}>
                        {fBRL.format(h.fairPrice)}
                      </td>
                      <td className="font-mono text-[13px] py-3 px-3 whitespace-nowrap">
                        {diff == null ? (
                          <span className="text-text-muted">—</span>
                        ) : (
                          <span style={{ color: diff >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                            {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          className="bg-bg-3 border border-border rounded-[6px] text-text-sec text-[12px]
                                     px-2 py-1 outline-none w-full placeholder-text-muted
                                     focus:border-cyan"
                          defaultValue={h.annotation ?? ''}
                          placeholder="Anotação…"
                          onBlur={(e) => onUpdateAnnotation(h.savedAt, e.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
