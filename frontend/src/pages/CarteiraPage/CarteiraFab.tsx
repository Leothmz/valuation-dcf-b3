import { Plus } from 'lucide-react'
import type { Tab } from './index'

const FAB_LABELS: Partial<Record<Tab, string>> = {
  operacoes: 'Adicionar operação',
  proventos: 'Adicionar provento',
  ativos:    'Adicionar operação',
  rf:        'Adicionar título',
}

interface CarteiraFabProps {
  tab: Tab
  onAction: (tab: Tab) => void
}

export function CarteiraFab({ tab, onAction }: CarteiraFabProps) {
  const label = FAB_LABELS[tab]
  if (!label) return null

  return (
    <button
      onClick={() => onAction(tab)}
      aria-label={label}
      className="md:hidden fixed right-4 bottom-[72px] z-30
                 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
      style={{
        background: 'var(--color-cyan)',
        color: '#04121a',
        boxShadow: '0 8px 20px -6px rgba(6,182,212,.7)',
      }}
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  )
}
