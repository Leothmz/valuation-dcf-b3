import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { NotificationProvider } from './Notification'
import { GlobalSearch } from './GlobalSearch'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(open => !open)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-screen bg-bg-1">
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <main className="flex-1 ml-0 md:ml-[58px] min-h-screen pb-14 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <NotificationProvider />
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}
