import { useState, useCallback, useEffect } from 'react'

type NotificationType = 'success' | 'error' | 'warning'

interface Toast {
  id: number
  message: string
  type: NotificationType
}

// Global state via module-level ref
let _showFn: ((message: string, type: NotificationType) => void) | null = null

export function notify(message: string, type: NotificationType = 'success') {
  _showFn?.(message, type)
}

export function NotificationProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: NotificationType) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    _showFn = show
    return () => { _showFn = null }
  }, [show])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`u-toast-in px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-green text-bg-1' :
            toast.type === 'error' ? 'bg-red text-white' :
            'bg-amber text-bg-1'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
