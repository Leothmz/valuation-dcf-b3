export interface DataCardField {
  label: string
  value: React.ReactNode
  /** Destaca o valor (fonte maior, cor base) — use para o número principal do card. */
  emphasis?: boolean
}

const ACCENT_BORDER: Record<string, string> = {
  none: 'var(--color-border)',
  green: 'rgba(16,185,129,.4)',
  amber: 'rgba(245,158,11,.4)',
  red: 'rgba(239,68,68,.4)',
}

interface DataCardProps {
  title: React.ReactNode
  badge?: React.ReactNode
  fields: DataCardField[]
  actions?: React.ReactNode
  accent?: 'none' | 'green' | 'amber' | 'red'
}

export function DataCard({ title, badge, fields, actions, accent = 'none' }: DataCardProps) {
  return (
    <div
      className="rounded-[11px] border p-3 mb-2"
      style={{ background: 'var(--color-bg-2)', borderColor: ACCENT_BORDER[accent] }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[14px] font-bold text-text-base">{title}</div>
        {badge}
      </div>

      {fields.map(({ label, value, emphasis }) => (
        <div key={label} className="flex items-baseline justify-between gap-3 py-1">
          <span className="text-[12px] text-text-sec">{label}</span>
          <span
            className={`font-mono text-right ${
              emphasis ? 'text-[16px] font-bold text-text-base' : 'text-[13px] text-text-base'
            }`}
          >
            {value}
          </span>
        </div>
      ))}

      {actions && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">{actions}</div>
      )}
    </div>
  )
}
