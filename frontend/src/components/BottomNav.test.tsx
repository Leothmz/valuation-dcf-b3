import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location-pathname">{location.pathname}</div>
}

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
      <LocationDisplay />
    </MemoryRouter>
  )
}

describe('BottomNav', () => {
  it('tem 5 itens', () => {
    renderNav()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('DCF')).toBeInTheDocument()
    expect(screen.getByText('Valuations')).toBeInTheDocument()
    expect(screen.getByText('Ranking')).toBeInTheDocument()
    expect(screen.getByText('Carteira')).toBeInTheDocument()
  })

  it('Ranking abre o popover em vez de navegar', () => {
    renderNav()
    expect(screen.queryByRole('link', { name: 'FIIs' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }))
    expect(screen.getByRole('link', { name: 'Ações' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'FIIs' })).toBeInTheDocument()
  })

  it('abre o popover mesmo já estando em /ranking', () => {
    renderNav('/ranking')
    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }))
    expect(screen.getByRole('link', { name: 'FIIs' })).toBeInTheDocument()
  })

  it('marca Ranking como ativo em /fiis', () => {
    renderNav('/fiis')
    expect(screen.getByRole('button', { name: 'Ranking' })).toHaveAttribute('aria-current', 'page')
  })

  it('fecha o popover e navega ao escolher FIIs', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }))
    fireEvent.click(screen.getByRole('link', { name: 'FIIs' }))
    expect(screen.queryByRole('link', { name: 'FIIs' })).not.toBeInTheDocument()
    expect(screen.getByTestId('location-pathname').textContent).toBe('/fiis')
  })
})
