import { useState } from 'react'

interface WatchlistNotesModalProps {
  isOpen: boolean
  onClose: () => void
  ticker: string | null
  note: string
  onSave: (note: string) => void
}

export function WatchlistNotesModal({ isOpen, onClose, ticker, note, onSave }: WatchlistNotesModalProps) {
  const [draft, setDraft] = useState(note)

  if (!isOpen || !ticker) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                   bg-bg-2 border border-border rounded-none md:rounded-[14px] p-6
                   w-auto md:w-[440px] max-w-none md:max-w-[92vw] max-h-none md:max-h-[80vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}
      >
        <div className="text-[16px] font-semibold mb-4">
          Nota · <span style={{ color: 'var(--color-cyan)' }}>{ticker}</span>
        </div>
        <textarea
          className="w-full bg-bg-3 border border-border rounded-[10px] text-text-base text-[13px]
                     p-3 resize-none outline-none h-[120px] placeholder-text-muted
                     focus:border-cyan focus:shadow-[0_0_0_3px_rgba(6,182,212,.06)]"
          maxLength={500}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Adicione suas observações sobre este ativo…"
          autoFocus
        />
        <div className="text-[11px] text-text-muted text-right mt-1">
          {draft.length}/500
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button
            className="border border-border rounded-[10px] text-text-sec text-[13px] font-ui
                       px-4 h-[38px] cursor-pointer hover:bg-bg-3 hover:text-text-base transition-colors"
            style={{ background: 'none' }}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-[10px] text-[13px] font-semibold font-ui px-4 h-[38px] cursor-pointer
                       hover:-translate-y-px transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--color-cyan) 0%, #0891b2 100%)',
              color: 'var(--color-bg-0)',
              boxShadow: '0 2px 8px rgba(6,182,212,.2)',
            }}
            onClick={() => onSave(draft)}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
