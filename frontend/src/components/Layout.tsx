import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { NotificationProvider } from './Notification'
import { GlobalSearch } from './GlobalSearch'
import { ShortcutsPanel } from './ShortcutsPanel'
import { useKeyBinding } from '../hooks/useKeyBinding'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  useKeyBinding({
    'mod+k': (e) => { e.preventDefault(); setIsSearchOpen((open) => !open) },
    '?': () => setIsShortcutsOpen((open) => !open),
  })

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
    </div>
  )
}
