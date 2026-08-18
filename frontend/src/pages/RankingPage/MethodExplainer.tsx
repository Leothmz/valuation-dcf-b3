import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { explainMethod } from '../../engines/method-explainer'
import { useEscapeToClose } from '../../hooks/useKeyBinding'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { BottomSheet } from '../../components/BottomSheet'
import type { RankingMethod } from '../../stores/rankingStore'

interface MethodExplainerProps {
  method: RankingMethod
}

/**
 * Explica o método ativo, no lugar onde a escolha acontece.
 *
 * Um gatilho ao lado do tablist, e não um `ⓘ` dentro de cada pill: elemento
 * interativo dentro de `role="tab"` quebra o roving tabindex que o
 * `ScrollableTabs` implementa — o `Tab` passaria a parar dentro da aba em vez
 * de atravessar o tablist de uma vez. Desvio consciente do brief, pelo contrato
 * ARIA.
 *
 * Fechado por padrão: quem já sabe o que é Bazin não precisa ver o cartão toda
 * vez que abre o ranking.
 */
export function MethodExplainer({ method }: MethodExplainerProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const info = explainMethod(method)

  useEscapeToClose(open, () => setOpen(false))

  const body = (
    <div className="flex flex-col gap-3">
      <Field label="O que privilegia" value={info.privileges} />
      <Field label="Como calcula" value={info.formula} mono />
      {/* "Onde engana" não usa âmbar: âmbar significa valor sobrescrito pelo
          usuário no sistema. A hierarquia aqui vem do rótulo e da borda. */}
      <Field label="Onde engana" value={info.blindSpot} bordered />
    </div>
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-[9px] border border-border
                   text-[13px] text-text-sec cursor-pointer transition-colors
                   hover:border-cyan hover:text-cyan"
        style={{ background: 'var(--color-bg-2)' }}
      >
        <Info size={15} />
        Sobre o método
      </button>

      {open && (isMobile ? (
        <BottomSheet isOpen onClose={() => setOpen(false)} title={info.title}>
          {body}
        </BottomSheet>
      ) : (
        <div
          role="dialog"
          aria-label={info.title}
          className="absolute right-0 top-full mt-2 z-40 w-[360px] rounded-[12px] border p-4"
          style={{
            background: 'var(--color-bg-2)',
            borderColor: 'var(--color-bg-4)',
            boxShadow: '0 14px 34px -10px rgba(0,0,0,.9)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="text-[14px] font-bold text-text-base">{info.title}</div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="shrink-0 text-text-muted hover:text-text-base cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          {body}
        </div>
      ))}
    </div>
  )
}

function Field({
  label, value, mono = false, bordered = false,
}: { label: string; value: string; mono?: boolean; bordered?: boolean }) {
  return (
    <div className={bordered ? 'border-l-2 border-border pl-3' : undefined}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted mb-1">
        {label}
      </div>
      <div className={`text-[12px] leading-relaxed text-text-base ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}
