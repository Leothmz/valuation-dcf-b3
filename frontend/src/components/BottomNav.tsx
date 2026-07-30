import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calculator, Bookmark, Trophy, Briefcase } from 'lucide-react'
import { RankingNavPopover } from './RankingNavPopover'

// Só os itens que navegam direto via NavLink. Ranking (popover) e Carteira
// são renderizados explicitamente abaixo — mantê-los fora daqui evita uma
// entrada "morta" no array (nunca usada pelo .map).
const BOTTOM_NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dcf', icon: Calculator, label: 'DCF' },
  { to: '/watchlist', icon: Bookmark, label: 'Valuations' },
]

const ITEM_CLASS =
  'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] py-2 transition-colors'

export function BottomNav() {
  const [isRankingOpen, setIsRankingOpen] = useState(false)
  const { pathname } = useLocation()
  const isRankingActive = pathname === '/ranking' || pathname === '/fiis'

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border safe-area-pb"
      style={{ background: 'rgba(11,15,23,0.95)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center">
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `${ITEM_CLASS} ${isActive ? 'text-cyan' : 'text-text-muted'}`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}

        {/* Ranking abre um popover ancorado em vez de navegar direto. */}
        <div className="relative flex-1 flex">
          <button
            onClick={() => setIsRankingOpen((open) => !open)}
            aria-label="Ranking"
            aria-expanded={isRankingOpen}
            aria-controls="ranking-nav-popover"
            aria-current={isRankingActive ? 'page' : undefined}
            className={`${ITEM_CLASS} cursor-pointer ${
              isRankingActive || isRankingOpen ? 'text-cyan' : 'text-text-muted'
            }`}
          >
            <Trophy size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">Ranking</span>
          </button>
          <RankingNavPopover
            isOpen={isRankingOpen}
            onClose={() => setIsRankingOpen(false)}
            currentPath={pathname}
          />
        </div>

        <NavLink
          to="/carteira"
          className={({ isActive }) => `${ITEM_CLASS} ${isActive ? 'text-cyan' : 'text-text-muted'}`}
        >
          <Briefcase size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Carteira</span>
        </NavLink>
      </div>
    </nav>
  )
}
