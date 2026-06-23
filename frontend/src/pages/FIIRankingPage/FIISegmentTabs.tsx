interface Props {
  active: string
  onChange: (seg: string) => void
}

const SEGMENTS = [
  { key: 'todos', label: 'Todos' },
  { key: 'Logística', label: 'Logística' },
  { key: 'Shoppings', label: 'Shoppings' },
  { key: 'Lajes Corp.', label: 'Lajes Corp.' },
  { key: 'Papel/CRI', label: 'Papel/CRI' },
  { key: 'Residencial', label: 'Residencial' },
  { key: 'Híbrido', label: 'Híbrido' },
  { key: 'Renda Urbana', label: 'Renda Urbana' },
  { key: 'Hotel', label: 'Hotel' },
  { key: 'Fiagro', label: 'Fiagro' },
]

export function FIISegmentTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {SEGMENTS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-1.5 rounded-[20px] border text-[12px] font-medium cursor-pointer
                      whitespace-nowrap select-none transition-colors
                      ${active === key
                        ? 'bg-cyan/10 border-cyan/40 text-cyan'
                        : 'bg-bg-3 border-border text-text-sec hover:border-cyan/30 hover:text-text-base'
                      }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
