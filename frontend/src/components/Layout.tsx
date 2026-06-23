import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { NotificationProvider } from './Notification'
import { GlobalSearch } from './GlobalSearch'
import { ShortcutsPanel } from './ShortcutsPanel'
import { WelcomeModal } from './WelcomeModal'
import { useKeyBinding, useEscapeToClose } from '../hooks/useKeyBinding'

interface LayoutProps {
  children: React.ReactNode
}

const ONBOARDING_KEY = 'onboarding_done'

export function Layout({ children }: LayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => !localStorage.getItem(ONBOARDING_KEY))

  function dismissWelcome() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setIsWelcomeOpen(false)
  }

  useKeyBinding({
    'mod+k': (e) => { e.preventDefault(); setIsSearchOpen((open) => !open) },
    '?': () => setIsShortcutsOpen((open) => !open),
  })

  useEscapeToClose(isWelcomeOpen, dismissWelcome)

  return (
    <div className="flex min-h-screen bg-bg-1">
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <main className="flex-1 ml-0 md:ml-[58px] min-h-screen pb-14 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <NotificationProvider />
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ShortcutsPanel isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <WelcomeModal isOpen={isWelcomeOpen} onDismiss={dismissWelcome} />
    </div>
  )
}
