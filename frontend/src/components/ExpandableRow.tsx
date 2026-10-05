import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface ExpandableRowProps {
  /** Conteúdo sempre visível da linha compacta. */
  summary: React.ReactNode
  /** Detalhe revelado ao expandir. */
  children: React.ReactNode
  defaultExpanded?: boolean
  /** Destaque visual (ex: ticker na faixa de compra). */
  highlighted?: boolean
  /** Rótulo acessível do botão de expandir — normalmente o ticker. */
  ariaLabel: string
}

export function ExpandableRow({
  summary, children, defaultExpanded = false, highlighted = false, ariaLabel,
}: ExpandableRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const toggle = () => setExpanded((e) => !e)

  return (
    <div
      className="rounded-[10px] border mb-1.5"
      style={{
        background: 'var(--color-bg-2)',
        borderColor: highlighted ? 'rgba(16,185,129,.4)' : 'var(--color-border)',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={ariaLabel}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
        }}
        className="flex items-center gap-2 px-3 min-h-[52px] cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">{summary}</div>
        {expanded
          ? <ChevronDown size={16} className="shrink-0 text-text-muted" />
          : <ChevronRight size={16} className="shrink-0 text-text-muted" />}
      </div>

      {expanded && (
        <div className="u-detail-open px-3 pb-3 pt-2 border-t border-border">{children}</div>
      )}
    </div>
  )
}
