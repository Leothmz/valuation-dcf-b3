import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { NotificationProvider } from './Notification'
import { GlobalSearch } from './GlobalSearch'
import { ShortcutsPanel } from './ShortcutsPanel'
import { WelcomeModal } from './WelcomeModal'
import { useKeyBinding, useEscapeToClose } from '../hooks/useKeyBinding'

interface LayoutProps {
  children: React.ReactNode
}

const ONBOARDING_KEY = 'onboarding_done'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Valuation DCF',
  '/dcf': 'Calculadora DCF',
  '/watchlist': 'Meus Valuations',
  '/ranking': 'Ranking de Ações',
  '/compare': 'Comparar',
  '/analise': 'Análise',
  '/fiis': 'Ranking de FIIs',
  '/analise-fii': 'Análise FII',
  '/carteira': 'Carteira',
  '/apoiar': 'Apoiar o Projeto',
}

// Rotas que já têm barra de busca/header própria — evita empilhar dois headers no mobile.
const ROUTES_WITH_OWN_HEADER = new Set(['/dcf', '/analise', '/analise-fii'])

export function Layout({ children }: LayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => !localStorage.getItem(ONBOARDING_KEY))
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { pathname } = useLocation()
  const title = ROUTE_TITLES[pathname] ?? 'Valuation DCF'

  function dismissWelcome() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setIsWelcomeOpen(false)
  }

  useKeyBinding({
    'mod+k': (e) => { e.preventDefault(); setIsSearchOpen((open) => !open) },
    '?': () => setIsShortcutsOpen((open) => !open),
  })

  useEscapeToClose(isWelcomeOpen, dismissWelcome)
  useEscapeToClose(isDrawerOpen, () => setIsDrawerOpen(false))

  return (
    <div className="flex min-h-screen bg-bg-1">
      <Sidebar
        onOpenSearch={() => setIsSearchOpen(true)}
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={() => setIsDrawerOpen(false)}
      />
      <main className="flex-1 ml-0 md:ml-[58px] min-h-screen pb-14 md:pb-0">
        {!ROUTES_WITH_OWN_HEADER.has(pathname) && (
          <MobileHeader
            title={title}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}
        {children}
      </main>
      <SupportButton />
      <BottomNav />
      <NotificationProvider />
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ShortcutsPanel isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <WelcomeModal isOpen={isWelcomeOpen} onDismiss={dismissWelcome} />
    </div>
  )
}

function SupportButton() {
  return (
    <Link
      to="/apoiar"
      aria-label="Apoiar o Projeto"
      title="Apoiar o Projeto"
      className="group/support hidden md:inline-flex fixed md:top-5 md:right-6 z-40
                 items-center gap-2 rounded-full
                 px-2.5 sm:px-3.5 py-2 text-[13px] font-semibold text-text-base
                 border border-[rgba(244,63,94,0.35)] hover:border-[rgba(244,63,94,0.6)]
                 backdrop-blur-md transition-[transform,box-shadow,border-color]
                 duration-200 hover:-translate-y-px
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f43f5e]"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 40%), linear-gradient(120deg, rgba(244,63,94,0.16), rgba(139,92,246,0.16))',
        boxShadow:
          '0 0 0 1px rgba(0,0,0,0.2) inset, 0 8px 24px -12px rgba(244,63,94,0.55)',
      }}
    >
      <Heart
        size={15}
        className="animate-heartbeat shrink-0 text-[#f43f5e]"
        fill="currentColor"
        style={{ filter: 'drop-shadow(0 0 6px rgba(244,63,94,0.6))' }}
      />
      <span className="hidden sm:inline whitespace-nowrap">Apoiar o Projeto</span>
    </Link>
  )
}
