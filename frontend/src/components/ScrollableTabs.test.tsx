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
})
