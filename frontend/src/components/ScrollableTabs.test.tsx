import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ScrollableTabs } from './ScrollableTabs'

const TABS = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta' },
  { key: 'c', label: 'Gama' },
]


import { useTabArrowNav } from '../hooks/useKeyBinding'

describe('ScrollableTabs — teclado (contrato do role="tab")', () => {
  function setup(active = 'a') {
    const onSelect = vi.fn()
    render(<ScrollableTabs tabs={TABS} active={active} onSelect={onSelect} ariaLabel="Testes" />)
    return { onSelect, tab: (n: string) => screen.getByRole('tab', { name: n }) }
  }

  it('roving tabindex: só a aba ativa está no tab order', () => {
    setup('b')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'Gama' })).toHaveAttribute('tabindex', '-1')
  })

  it('seta direita vai para a próxima aba', () => {
    const { onSelect, tab } = setup('a')
    fireEvent.keyDown(tab('Alpha'), { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('seta esquerda volta para a anterior', () => {
    const { onSelect, tab } = setup('b')
    fireEvent.keyDown(tab('Beta'), { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('não dá a volta nas pontas', () => {
    const a = setup('a')
    fireEvent.keyDown(a.tab('Alpha'), { key: 'ArrowLeft' })
    expect(a.onSelect).not.toHaveBeenCalled()
    cleanup()
    const c = setup('c')
    fireEvent.keyDown(c.tab('Gama'), { key: 'ArrowRight' })
    expect(c.onSelect).not.toHaveBeenCalled()
  })

  it('Home vai para a primeira e End para a última', () => {
    const h = setup('b')
    fireEvent.keyDown(h.tab('Beta'), { key: 'Home' })
    expect(h.onSelect).toHaveBeenCalledWith('a')
    cleanup()
    const e = setup('b')
    fireEvent.keyDown(e.tab('Beta'), { key: 'End' })
    expect(e.onSelect).toHaveBeenCalledWith('c')
  })

  it('move o foco junto com a seleção (senão a próxima seta partiria da aba errada)', () => {
    const { tab } = setup('a')
    fireEvent.keyDown(tab('Alpha'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tab('Beta'))
  })

  it('ignora teclas que não são de navegação', () => {
    const { onSelect, tab } = setup('a')
    fireEvent.keyDown(tab('Alpha'), { key: 'ArrowDown' })
    fireEvent.keyDown(tab('Alpha'), { key: 'x' })
    expect(onSelect).not.toHaveBeenCalled()
  })
})

// Análise, Análise FII e Carteira montam useTabArrowNav (listener global no
// document) junto do ScrollableTabs — dois handlers para a mesma tecla.
//
// A aba final é a mesma nos dois caminhos: o state do React não muda no meio do
// despacho do evento, então ambos leem o mesmo `active` e calculam o mesmo
// destino. O que muda é quantas vezes o setter roda. Por isso o teste conta
// chamadas em vez de olhar a aba resultante — olhando só a aba, ele passaria
// mesmo sem o stopPropagation e não provaria nada.
describe('ScrollableTabs + useTabArrowNav na mesma página', () => {
  const setActive = vi.fn()

  function Pagina({ active = 'a' }: { active?: string }) {
    useTabArrowNav(['a', 'b', 'c'], active, setActive)
    return <ScrollableTabs tabs={TABS} active={active} onSelect={setActive} ariaLabel="Testes" />
  }

  beforeEach(() => setActive.mockClear())

  it('com foco na aba, só o tablist responde — o handler global não roda também', () => {
    render(<Pagina />)
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Alpha' }), { key: 'ArrowRight' })
    expect(setActive).toHaveBeenCalledTimes(1)
    expect(setActive).toHaveBeenCalledWith('b')
  })

  it('com foco fora do tablist, o atalho global segue funcionando', () => {
    render(<Pagina />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(setActive).toHaveBeenCalledTimes(1)
    expect(setActive).toHaveBeenCalledWith('b')
  })
})

describe('ScrollableTabs', () => {
  it('renderiza uma aba por item', () => {
    render(<ScrollableTabs tabs={TABS} active="a" onSelect={() => {}} ariaLabel="Testes" />)
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('marca só a aba ativa com aria-selected', () => {
    render(<ScrollableTabs tabs={TABS} active="b" onSelect={() => {}} ariaLabel="Testes" />)
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false')
  })

  it('chama onSelect com a chave da aba clicada', () => {
    const onSelect = vi.fn()
    render(<ScrollableTabs tabs={TABS} active="a" onSelect={onSelect} ariaLabel="Testes" />)
    fireEvent.click(screen.getByRole('tab', { name: 'Gama' }))
    expect(onSelect).toHaveBeenCalledWith('c')
  })

  it('expõe a lista como tablist rotulada', () => {
    render(<ScrollableTabs tabs={TABS} active="a" onSelect={() => {}} ariaLabel="Métodos" />)
    expect(screen.getByRole('tablist', { name: 'Métodos' })).toBeInTheDocument()
  })

  it('aba ativa à direita da viewport do container → scrollLeft avança para valor exato esperado', () => {
    const { rerender } = render(
      <ScrollableTabs tabs={TABS} active="a" onSelect={() => {}} ariaLabel="Testes" />
    )
    const container = screen.getByRole('tablist') as HTMLDivElement
    const buttonC = screen.getByRole('tab', { name: 'Gama' }) as HTMLButtonElement

    // Mock da geometria: container 200px de largura, botão C em offsetLeft 250 com 60px de largura
    Object.defineProperty(container, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(container, 'scrollLeft', { value: 0, writable: true, configurable: true })
    Object.defineProperty(buttonC, 'offsetLeft', { value: 250, configurable: true })
    Object.defineProperty(buttonC, 'clientWidth', { value: 60, configurable: true })

    // Trigga a mudança de aba para 'c'
    rerender(<ScrollableTabs tabs={TABS} active="c" onSelect={() => {}} ariaLabel="Testes" />)

    // Fórmula esperada: buttonRight (250 + 60 = 310) > scrollLeft + containerWidth (0 + 200 = 200)
    // Logo: container.scrollLeft = 310 - 200 = 110
    expect(container.scrollLeft).toBe(110)
  })

  it('aba ativa à esquerda do scroll atual → scrollLeft recua para valor exato esperado', () => {
    const { rerender } = render(
      <ScrollableTabs tabs={TABS} active="c" onSelect={() => {}} ariaLabel="Testes" />
    )
    const container = screen.getByRole('tablist') as HTMLDivElement
    const buttonA = screen.getByRole('tab', { name: 'Alpha' }) as HTMLButtonElement

    // Mock: container começou com scrollLeft = 150, botão A está em offsetLeft = 50
    Object.defineProperty(container, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(container, 'scrollLeft', { value: 150, writable: true, configurable: true })
    Object.defineProperty(buttonA, 'offsetLeft', { value: 50, configurable: true })
    Object.defineProperty(buttonA, 'clientWidth', { value: 60, configurable: true })

    // Trigga a mudança para 'a'
    rerender(<ScrollableTabs tabs={TABS} active="a" onSelect={() => {}} ariaLabel="Testes" />)

    // Fórmula esperada: buttonLeft (50) < scrollLeft (150)
    // Logo: container.scrollLeft = 50
    expect(container.scrollLeft).toBe(50)
  })

  it('aba ativa já inteiramente visível → scrollLeft permanece igual', () => {
    const { rerender } = render(
      <ScrollableTabs tabs={TABS} active="a" onSelect={() => {}} ariaLabel="Testes" />
    )
    const container = screen.getByRole('tablist') as HTMLDivElement
    const buttonB = screen.getByRole('tab', { name: 'Beta' }) as HTMLButtonElement

    // Mock: container 200px, scrollLeft = 100, botão B em 120 com 60px
    // Visível? buttonLeft (120) >= scrollLeft (100) AND buttonRight (180) <= scrollLeft + containerWidth (300)
    Object.defineProperty(container, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(container, 'scrollLeft', { value: 100, writable: true, configurable: true })
    Object.defineProperty(buttonB, 'offsetLeft', { value: 120, configurable: true })
    Object.defineProperty(buttonB, 'clientWidth', { value: 60, configurable: true })

    // Trigga a mudança para 'b'
    rerender(<ScrollableTabs tabs={TABS} active="b" onSelect={() => {}} ariaLabel="Testes" />)

    // Nenhuma condição atendida, scrollLeft não muda
    expect(container.scrollLeft).toBe(100)
  })

  it('botões têm dimensões mínimas de toque 44x44px', () => {
    render(<ScrollableTabs tabs={TABS} active="a" onSelect={() => {}} ariaLabel="Testes" />)
    const buttons = screen.getAllByRole('tab')

    buttons.forEach((button) => {
      // Verifica se o className contém min-h-[44px] e min-w-[44px]
      expect(button.className).toContain('min-h-[44px]')
      expect(button.className).toContain('min-w-[44px]')
    })
  })
})

describe('ScrollableTabs — cor do fade', () => {
  const tabs = [
    { key: 'a' as const, label: 'Aba A' },
    { key: 'b' as const, label: 'Aba B' },
  ]

  it('por padrão o fade termina na cor de fundo da página', () => {
    const { container } = render(
      <ScrollableTabs tabs={tabs} active="a" onSelect={vi.fn()} ariaLabel="Teste" />
    )
    const fade = container.querySelector('[aria-hidden]') as HTMLElement
    expect(fade.style.background).toContain('var(--color-bg-1)')
  })

  it('aceita a cor da superfície onde o tablist está montado', () => {
    // Ranking e Carteira montam o tablist dentro de um card bg-2: com o fade
    // terminando em bg-1, aparecia uma emenda de cor e a última pill era
    // cortada em corte reto.
    const { container } = render(
      <ScrollableTabs tabs={tabs} active="a" onSelect={vi.fn()} ariaLabel="Teste" fadeColor="var(--color-bg-2)" />
    )
    const fade = container.querySelector('[aria-hidden]') as HTMLElement
    expect(fade.style.background).toContain('var(--color-bg-2)')
  })
})
