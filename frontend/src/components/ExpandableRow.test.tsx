import { render, screen, fireEvent } from '@testing-library/react'
import { ExpandableRow } from './ExpandableRow'

function setup(props = {}) {
  return render(
    <ExpandableRow ariaLabel="PETR4" summary={<span>PETR4</span>} {...props}>
      <span>detalhe</span>
    </ExpandableRow>
  )
}

describe('ExpandableRow', () => {
  it('começa recolhido', () => {
    setup()
    expect(screen.queryByText('detalhe')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PETR4' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('expande ao clicar no resumo', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'PETR4' }))
    expect(screen.getByText('detalhe')).toBeInTheDocument()
  })

  it('recolhe no segundo clique', () => {
    setup()
    const toggle = screen.getByRole('button', { name: 'PETR4' })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(screen.queryByText('detalhe')).not.toBeInTheDocument()
  })

  it('respeita defaultExpanded', () => {
    setup({ defaultExpanded: true })
    expect(screen.getByText('detalhe')).toBeInTheDocument()
  })

  it('expande com Enter no teclado', () => {
    setup()
    fireEvent.keyDown(screen.getByRole('button', { name: 'PETR4' }), { key: 'Enter' })
    expect(screen.getByText('detalhe')).toBeInTheDocument()
  })

  it('expande com Space no teclado', () => {
    setup()
    fireEvent.keyDown(screen.getByRole('button', { name: 'PETR4' }), { key: ' ' })
    expect(screen.getByText('detalhe')).toBeInTheDocument()
  })
})
