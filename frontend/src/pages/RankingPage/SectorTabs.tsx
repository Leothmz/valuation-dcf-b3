type SectorTab = '' | 'insurance' | 'banks'

interface SectorTabsProps {
  active: SectorTab
  onSelect: (tab: SectorTab) => void
}

const TABS: { key: SectorTab; label: string }[] = [
  { key: '',          label: 'Todos'       },
  { key: 'insurance', label: 'Seguradoras' },
  { key: 'banks',     label: 'Bancos'      },
]

export function SectorTabs({ active, onSelect }: SectorTabsProps) {
  return (
    <div className="flex gap-1 border-b border-border mb-0">
      {TABS.map(({ key, label }) => {
        const isActive = key === active
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="px-4 py-[8px] text-[13px] font-medium cursor-pointer border-b-2 transition-all"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive
                ? '2px solid var(--color-cyan)'
                : '2px solid transparent',
              color: isActive ? 'var(--color-cyan)' : 'var(--color-text-sec)',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export type { SectorTab }
