import { X } from 'lucide-react'

interface ShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: Array<{ combo: string; label: string }> = [
  { combo: 'Ctrl/Cmd + K', label: 'Busca global' },
  { combo: 'Esc', label: 'Fechar modal aberto' },
  { combo: 'S', label: 'Salvar preço teto (na calculadora DCF, com resultado)' },
  { combo: '← / →', label: 'Navegar entre abas (Análise / Carteira)' },
  { combo: '?', label: 'Abrir este painel' },
]

export function ShortcutsPanel({ isOpen, onClose }: ShortcutsPanelProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-bg-2 border border-border rounded-[16px] p-6 w-[420px] max-w-[92vw]"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-[16px] font-semibold text-text-base">Atalhos de Teclado</div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-base transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {SHORTCUTS.map((s) => (
            <div key={s.combo} className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-text-sec">{s.label}</span>
              <kbd
                className="font-mono text-[12px] px-2 py-1 rounded-[6px] whitespace-nowrap"
                style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', color: 'var(--color-cyan)' }}
              >
                {s.combo}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
