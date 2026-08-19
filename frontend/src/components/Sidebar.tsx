import { NavLink } from 'react-router-dom'
import { useIsMobile } from '../hooks/useMediaQuery'
import {
  Home,
  Calculator,
  Bookmark,
  Trophy,
  Activity,
  Building2,
  BarChart2,
  TrendingUp,
  Briefcase,
  Search,
  GitCompare,
  Heart,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dcf', icon: Calculator, label: 'Calculadora' },
  { to: '/watchlist', icon: Bookmark, label: 'Meus Valuations' },
  { to: '/ranking', icon: Trophy, label: 'Ranking de Ações' },
  { to: '/compare', icon: GitCompare, label: 'Comparar Ações' },
  { to: '/analise', icon: Activity, label: 'Análise Ações' },
  { to: '/fiis', icon: Building2, label: 'FIIs' },
  { to: '/analise-fii', icon: BarChart2, label: 'Análise FII' },
  { to: '/carteira', icon: Briefcase, label: 'Carteira' },
  { to: '/apoiar', icon: Heart, label: 'Apoiar o Projeto' },
]

interface SidebarProps {
  onOpenSearch?: () => void
  /** No mobile a sidebar vira gaveta; no desktop essas props são ignoradas. */
  isDrawerOpen?: boolean
  onCloseDrawer?: () => void
}

export function Sidebar({ onOpenSearch, isDrawerOpen = false, onCloseDrawer }: SidebarProps) {
  const isMobile = useIsMobile()
  // No mobile, gaveta fechada = nav deslocada pra fora da viewport (-translate-x-full),
  // mas continuava no DOM e no tab order antes desta correção: usuário de teclado/leitor
  // de tela tabulava por 10 links invisíveis antes de chegar ao conteúdo da página.
  const isHiddenDrawer = isMobile && !isDrawerOpen

  return (
    <>
      {/* Scrim da gaveta — só no mobile, só quando aberta */}
      {isDrawerOpen && (
        <div
          data-testid="sidebar-scrim"
          onClick={onCloseDrawer}
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(6,9,16,.6)' }}
        />
      )}

      <nav
        aria-hidden={isHiddenDrawer || undefined}
        inert={isHiddenDrawer || undefined}
        className={`group fixed left-0 top-0 h-screen z-50 flex flex-col
                    border-r border-border overflow-hidden
                    transition-[width,transform,box-shadow] duration-[320ms]
                    [transition-timing-function:var(--ease-out-expo)]
                    w-56 md:w-[58px] md:hover:w-56
                    md:hover:shadow-[8px_0_32px_-12px_rgba(0,0,0,.8)]
                    ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{
          background: 'rgba(11,15,23,0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border-muted min-w-56">
          <span className="shrink-0 flex items-center justify-center w-5 h-5">
            <TrendingUp size={14} className="text-cyan" strokeWidth={2.5} />
          </span>
          <span
            className="text-sm font-semibold whitespace-nowrap
                       opacity-100 md:opacity-0 md:group-hover:opacity-100
                       md:-translate-x-1 md:group-hover:translate-x-0
                       transition-[opacity,transform] duration-[320ms] [transition-timing-function:var(--ease-out-expo)]
                       bg-gradient-to-r from-cyan to-blue-400 bg-clip-text text-transparent"
          >
            Valuation DCF
          </span>
        </div>

        {/* Search button */}
        <div className="p-2 border-b border-border-muted min-w-56">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                       text-text-muted hover:text-text-base hover:bg-bg-3
                       transition-colors duration-150 whitespace-nowrap"
          >
            <Search size={16} className="shrink-0" strokeWidth={1.75} />
            <span
              className="text-sm font-medium
                         opacity-100 md:opacity-0 md:group-hover:opacity-100
                       md:-translate-x-1 md:group-hover:translate-x-0
                       transition-[opacity,transform] duration-[320ms] [transition-timing-function:var(--ease-out-expo)]"
            >
              Buscar
              <span className="ml-auto pl-4 text-[11px] text-text-muted font-mono">Ctrl+K</span>
            </span>
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1 p-2 flex-1 min-w-56">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg
                 transition-colors duration-150 whitespace-nowrap
                 ${isActive
                   ? 'text-cyan bg-cyan-dim border-l-2 border-cyan'
                   : 'text-text-sec hover:text-text-base hover:bg-bg-3'
                 }`
              }
            >
              <Icon size={16} className="shrink-0" strokeWidth={1.75} />
              <span
                className="text-sm font-medium
                           opacity-100 md:opacity-0 md:group-hover:opacity-100
                       md:-translate-x-1 md:group-hover:translate-x-0
                       transition-[opacity,transform] duration-[320ms] [transition-timing-function:var(--ease-out-expo)]"
              >
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
