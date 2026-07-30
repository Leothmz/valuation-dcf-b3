import type { RefObject } from 'react'
import { StickyNote, History, Bell } from 'lucide-react'

// ── Context menu state ────────────────────────────────────────────────────────
export interface ContextMenuState {
  x: number
  y: number
  ticker: string
}

interface WatchlistContextMenuProps {
  menu: ContextMenuState | null
  menuRef: RefObject<HTMLDivElement | null>
  onViewAnalysis: (ticker: string) => void
  onEditNote: (ticker: string) => void
  onViewHistory: (ticker: string) => void
  onViewAlerts: (ticker: string) => void
  onDelete: (ticker: string, e: React.MouseEvent) => void
}

export function WatchlistContextMenu({
  menu,
  menuRef,
  onViewAnalysis,
  onEditNote,
  onViewHistory,
  onViewAlerts,
  onDelete,
}: WatchlistContextMenuProps) {
  if (!menu) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-bg-2 border border-border rounded-[10px] overflow-hidden"
      style={{
        left: menu.x,
        top: menu.y,
        minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,.6)',
      }}
    >
      <button
        className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
        style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
        onClick={() => onViewAnalysis(menu.ticker)}
      >
        Ver Análise Avançada
      </button>
      <button
        className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
        style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
        onClick={() => onEditNote(menu.ticker)}
      >
        <StickyNote size={13} />
        Editar nota
      </button>
      <button
        className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
        style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
        onClick={() => onViewHistory(menu.ticker)}
      >
        <History size={13} />
        Histórico de preço teto
      </button>
      <button
        className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
        style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
        onClick={() => onViewAlerts(menu.ticker)}
      >
        <Bell size={13} />
        Histórico de alertas
      </button>
      <button
        className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer"
        style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-red-dim)'
          e.currentTarget.style.color = 'var(--color-red)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = ''
          e.currentTarget.style.color = ''
        }}
        onClick={(e) => onDelete(menu.ticker, e)}
      >
        Excluir da watchlist
      </button>
    </div>
  )
}
