import type { RankingMethod } from '../../stores/rankingStore'

interface MethodPillsProps {
  active: RankingMethod
  onSelect: (m: RankingMethod) => void
}

const METHODS: { key: RankingMethod; label: string }[] = [
  { key: 'thomaz', label: 'Rank Thomaz' },
  { key: 'bazin',  label: 'Rank Bazin'  },
  { key: 'graham', label: 'Rank Graham' },
  { key: 'lynch',  label: 'Rank Lynch'  },
  { key: 'joel',   label: 'Rank Joel'   },
]

export function MethodPills({ active, onSelect }: MethodPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {METHODS.map(({ key, label }) => {
        const isActive = key === active
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="px-4 py-[6px] rounded-full text-[13px] font-semibold cursor-pointer border transition-all"
            style={{
              background: isActive ? 'rgba(6,182,212,.15)' : 'var(--color-bg-3)',
              color: isActive ? 'var(--color-cyan)' : 'var(--color-text-sec)',
              borderColor: isActive ? 'rgba(6,182,212,.4)' : 'var(--color-border)',
              boxShadow: isActive ? '0 0 12px rgba(6,182,212,.12)' : 'none',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
