import { render, screen, fireEvent } from '@testing-library/react'
import { ScrollableTabs } from './ScrollableTabs'

const TABS = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta' },
  { key: 'c', label: 'Gama' },
]

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
