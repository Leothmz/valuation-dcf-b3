import { useEffect, useRef } from 'react'

export interface TabItem<T extends string> {
  key: T
  label: string
}

interface ScrollableTabsProps<T extends string> {
  tabs: TabItem<T>[]
  active: T
  onSelect: (key: T) => void
  /** Rótulo acessível do tablist — obrigatório porque a página pode ter mais de um. */
  ariaLabel: string
  /**
   * Cor em que o fade da direita termina. Default: o fundo da página (bg-1).
   * Páginas que montam o tablist dentro de um card (bg-2) precisam passar a cor
   * do card — com bg-1 aparecia uma emenda e a última pill parecia cortada em
   * corte reto em vez de esmaecer.
   */
  fadeColor?: string
}

export function ScrollableTabs<T extends string>({
  tabs, active, onSelect, ariaLabel, fadeColor = 'var(--color-bg-1)',
}: ScrollableTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  /**
   * role="tab" é um contrato: a WAI-ARIA APG exige setas ←/→, Home/End e roving
   * tabindex dentro do tablist. Anunciar as abas para um leitor de tela sem isso
   * é pior que ter deixado botões soltos — promete uma navegação que não existe.
   *
   * Ativação automática (a seta move o foco E troca a aba): as abas aqui trocam
   * conteúdo já carregado, sem custo de rede, e é o que a navegação por seta da
   * página inteira (useTabArrowNav) já fazia — manter os dois iguais evita que a
   * mesma tecla se comporte de um jeito com foco na aba e de outro fora dela.
   *
   * Não dá a volta nas pontas, igual ao useTabArrowNav.
   */
  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    const last = tabs.length - 1
    let next: number
    if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1)
    else if (e.key === 'ArrowRight') next = Math.min(last, idx + 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return

    e.preventDefault()
    // Análise, Análise FII e Carteira montam useTabArrowNav (listener no document)
    // junto deste componente. Sem parar a propagação, a mesma seta roda os dois
    // handlers: a aba final é a mesma (nenhum dos dois vê o state atualizado no
    // meio do despacho, então ambos calculam o mesmo destino), mas o setter roda
    // duas vezes. Com foco numa aba, quem manda é o tablist.
    e.stopPropagation()
    if (next === idx) return
    onSelect(tabs[next].key)
    itemRefs.current[next]?.focus()
  }

  // Ao trocar de aba, garante que a pill ativa fica visível na horizontal.
  // Usa scrollLeft em vez de scrollIntoView para não afetar o scroll vertical da página.
  useEffect(() => {
    const container = containerRef.current
    const activeButton = activeRef.current

    if (container && activeButton) {
      const containerWidth = container.clientWidth
      const scrollLeft = container.scrollLeft
      const buttonLeft = activeButton.offsetLeft
      const buttonRight = buttonLeft + activeButton.clientWidth

      // Se o botão está à esquerda da área visível, scroll para esquerda
      if (buttonLeft < scrollLeft) {
        container.scrollLeft = buttonLeft
      }
      // Se o botão está à direita da área visível, scroll para direita
      else if (buttonRight > scrollLeft + containerWidth) {
        container.scrollLeft = buttonRight - containerWidth
      }
    }
  }, [active])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                   md:flex-wrap md:overflow-visible"
      >
        {tabs.map(({ key, label }, idx) => {
          const isActive = key === active
          return (
            <button
              key={key}
              ref={(el) => {
                itemRefs.current[idx] = el
                if (isActive) activeRef.current = el
              }}
              role="tab"
              aria-selected={isActive}
              // Roving tabindex: só a aba ativa entra no tab order, então Tab
              // atravessa o tablist inteiro de uma vez e as setas navegam dentro.
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="snap-start shrink-0 min-h-[44px] min-w-[44px] px-4 rounded-full
                         text-[13px] font-semibold cursor-pointer border transition-all
                         whitespace-nowrap"
              style={{
                background: isActive ? 'rgba(6,182,212,.15)' : 'var(--color-bg-3)',
                color: isActive ? 'var(--color-cyan)' : 'var(--color-text-sec)',
                borderColor: isActive ? 'rgba(6,182,212,.4)' : 'var(--color-border)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      {/* Fade indicando que há mais abas à direita — só no mobile. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 md:hidden"
        style={{ background: `linear-gradient(90deg, transparent, ${fadeColor})` }}
      />
    </div>
  )
}
