import { Link } from 'react-router-dom'
import { TrendingUp, Building2 } from 'lucide-react'
import { useEscapeToClose } from '../hooks/useKeyBinding'

const OPTIONS = [
  { to: '/ranking', icon: TrendingUp, label: 'Ações' },
  { to: '/fiis',    icon: Building2,  label: 'FIIs'  },
]

interface RankingNavPopoverProps {
  isOpen: boolean
  onClose: () => void
  /** Rota atual, para marcar a opção correspondente. */
  currentPath: string
}

export function RankingNavPopover({ isOpen, onClose, currentPath }: RankingNavPopoverProps) {
  useEscapeToClose(isOpen, onClose)

  if (!isOpen) return null

  return (
    <>
      <div
        data-testid="ranking-popover-scrim"
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(6,9,16,.45)' }}
      />
      <div
        role="menu"
        aria-label="Escolher ranking"
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50
                   w-[150px] rounded-[12px] border p-1"
        style={{
          background: 'var(--color-bg-2)',
          borderColor: 'var(--color-bg-4)',
          boxShadow: '0 14px 34px -10px rgba(0,0,0,.9)',
        }}
      >
        {OPTIONS.map(({ to, icon: Icon, label }) => {
          const isCurrent = currentPath === to
          return (
            <Link
              key={to}
              to={to}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 min-h-[44px] rounded-[8px]
                         text-[13px] font-semibold"
              style={{
                background: isCurrent ? 'rgba(6,182,212,.14)' : 'transparent',
                color: isCurrent ? 'var(--color-cyan)' : 'var(--color-text-sec)',
              }}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
        {/* Seta apontando para o item Ranking */}
        <div
          aria-hidden
          className="absolute left-1/2 -ml-[5px] -bottom-[5px] w-[9px] h-[9px] rotate-45"
          style={{
            background: 'var(--color-bg-2)',
            borderRight: '1px solid var(--color-bg-4)',
            borderBottom: '1px solid var(--color-bg-4)',
          }}
        />
      </div>
    </>
  )
}
