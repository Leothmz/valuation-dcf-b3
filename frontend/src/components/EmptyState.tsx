import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  /** CTA opcional — quando existe, é o único botão do bloco. */
  action?: { label: string; onClick: () => void }
}

/**
 * Estado vazio padrão do app. Nasceu da divergência entre `/watchlist` (ícone +
 * título + explicação + CTA) e `/carteira` (quatro KPIs zerados e uma linha
 * cinza): mesmo produto, dois padrões, e o pior deles na rota mais complexa.
 *
 * O CTA usa o botão primário do sistema (gradiente ciano, 42px, raio 10px) —
 * um estado vazio sem saída é uma tela morta.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-12 px-4">
      <Icon size={28} className="text-text-muted" strokeWidth={1.5} />
      <div className="text-[15px] font-semibold text-text-base">{title}</div>
      <p className="text-[13px] text-text-sec max-w-[340px] leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 min-h-[44px] h-[42px] px-[18px] rounded-[10px] text-bg-0 font-semibold text-[13px]
                     cursor-pointer border-none transition-all hover:opacity-90 hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
