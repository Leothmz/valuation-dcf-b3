import { NavLink } from 'react-router-dom'
import { Home, Calculator, Bookmark, Trophy, Briefcase } from 'lucide-react'

const BOTTOM_NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dcf', icon: Calculator, label: 'DCF' },
  { to: '/watchlist', icon: Bookmark, label: 'Valuations' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/carteira', icon: Briefcase, label: 'Carteira' },
]

export function BottomNav() {
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
              `flex flex-col items-center justify-center gap-0.5 flex-1
               min-h-[56px] py-2 transition-colors
               ${isActive ? 'text-cyan' : 'text-text-muted'}`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
