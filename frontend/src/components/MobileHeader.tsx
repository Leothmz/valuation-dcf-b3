import { Link } from 'react-router-dom'
import { Menu, Search, Heart } from 'lucide-react'

interface MobileHeaderProps {
  title: string
  onOpenSearch: () => void
  onOpenDrawer: () => void
}

export function MobileHeader({ title, onOpenSearch, onOpenDrawer }: MobileHeaderProps) {
  return (
    <header
      className="md:hidden sticky top-0 z-40 flex items-center gap-2 px-3 py-2
                 border-b border-border"
      style={{ background: 'rgba(11,15,23,.95)', backdropFilter: 'blur(12px)' }}
    >
      <button
        onClick={onOpenDrawer}
        aria-label="Abrir menu"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center
                   rounded-[10px] text-text-sec cursor-pointer"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      <h1 className="flex-1 min-w-0 truncate text-[15px] font-bold text-text-base">{title}</h1>

      <button
        onClick={onOpenSearch}
        aria-label="Buscar"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center
                   rounded-[10px] text-text-sec cursor-pointer"
      >
        <Search size={19} strokeWidth={1.75} />
      </button>

      <Link
        to="/apoiar"
        aria-label="Apoiar o Projeto"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[10px]"
      >
        <Heart size={19} className="text-[#f43f5e]" fill="currentColor" />
      </Link>
    </header>
  )
}
