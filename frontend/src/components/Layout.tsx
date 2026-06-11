import { Sidebar } from './Sidebar'
import { NotificationProvider } from './Notification'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-bg-1">
      <Sidebar />
      <main className="flex-1 ml-[58px] min-h-screen">
        {children}
      </main>
      <NotificationProvider />
    </div>
  )
}
