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
}

export function ScrollableTabs<T extends string>({
  tabs, active, onSelect, ariaLabel,
}: ScrollableTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

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
        {tabs.map(({ key, label }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              ref={isActive ? activeRef : undefined}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(key)}
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
        style={{ background: 'linear-gradient(90deg, transparent, var(--color-bg-1))' }}
      />
    </div>
  )
}
