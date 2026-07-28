import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MobileHeader } from './MobileHeader'

function renderHeader(props: Partial<React.ComponentProps<typeof MobileHeader>> = {}) {
  return render(
    <MemoryRouter>
      <MobileHeader title="X" onOpenSearch={() => {}} onOpenDrawer={() => {}} {...props} />
    </MemoryRouter>
  )
}

describe('MobileHeader', () => {
  it('mostra o título da rota', () => {
    renderHeader({ title: 'Ranking de Ações' })
    expect(screen.getByText('Ranking de Ações')).toBeInTheDocument()
  })

  it('dispara onOpenDrawer no botão de menu', () => {
    const onOpenDrawer = vi.fn()
    renderHeader({ onOpenDrawer })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(onOpenDrawer).toHaveBeenCalled()
  })

  it('dispara onOpenSearch no botão de busca', () => {
    const onOpenSearch = vi.fn()
    renderHeader({ onOpenSearch })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onOpenSearch).toHaveBeenCalled()
  })
})
