import { useEffect } from 'react'
import { useEscapeToClose } from '../hooks/useKeyBinding'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Área fixa no rodapé (ex: botões Limpar / Aplicar). */
  footer?: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children, footer }: BottomSheetProps) {
  useEscapeToClose(isOpen, onClose)

  // Trava o scroll do body enquanto o sheet está aberto.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end">
      <div
        data-testid="bottomsheet-scrim"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(6,9,16,.6)', backdropFilter: 'blur(2px)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-h-[80vh] flex flex-col
                   rounded-t-[18px] border-t border-border safe-area-pb"
        style={{ background: 'var(--color-bg-2)' }}
      >
        <div className="shrink-0 px-4 pt-2 pb-3 border-b border-border">
          <div
            aria-hidden
            className="w-8 h-[3px] rounded-full mx-auto mb-3"
            style={{ background: 'var(--color-bg-4)' }}
          />
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-text-base">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="min-w-[44px] min-h-[44px] -mr-2 text-text-muted hover:text-text-base cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>

        {footer && (
          <div className="shrink-0 px-4 py-3 border-t border-border">{footer}</div>
        )}
      </div>
    </div>
  )
}
