import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GlobalSearch } from './GlobalSearch'

const renderSearch = (isOpen = true, onClose = vi.fn()) =>
  render(
    <MemoryRouter>
      <GlobalSearch isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>
  )

describe('GlobalSearch', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('renders nothing when closed', () => {
    const { container } = renderSearch(false)
    expect(container.firstChild).toBeNull()
  })

  it('renders input when open', () => {
    renderSearch()
    expect(screen.getByPlaceholderText(/Buscar ticker/i)).toBeInTheDocument()
  })

  it('shows suggestions when typing a valid prefix', () => {
    renderSearch()
    fireEvent.change(screen.getByPlaceholderText(/Buscar ticker/i), { target: { value: 'WEGE' } })
    expect(screen.getByText('WEGE3')).toBeInTheDocument()
  })

  it('shows empty state for unknown ticker', () => {
    renderSearch()
    fireEvent.change(screen.getByPlaceholderText(/Buscar ticker/i), { target: { value: 'XXXXX' } })
    expect(screen.getByText(/Nenhum ticker encontrado/i)).toBeInTheDocument()
  })

  it('calls onClose on Escape', () => {
    const onClose = vi.fn()
    renderSearch(true, onClose)
    fireEvent.keyDown(screen.getByPlaceholderText(/Buscar ticker/i), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn()
    const { container } = renderSearch(true, onClose)
    fireEvent.mouseDown(container.firstChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows recent searches when no query', () => {
    localStorage.setItem('global_search_recent', JSON.stringify(['PETR4', 'VALE3']))
    renderSearch()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByText('VALE3')).toBeInTheDocument()
  })

  it('shows Buscas recentes label when no query and has recent', () => {
    localStorage.setItem('global_search_recent', JSON.stringify(['WEGE3']))
    renderSearch()
    expect(screen.getByText(/buscas recentes/i)).toBeInTheDocument()
  })

  it('hides recent label when typing', () => {
    localStorage.setItem('global_search_recent', JSON.stringify(['WEGE3']))
    renderSearch()
    fireEvent.change(screen.getByPlaceholderText(/Buscar ticker/i), { target: { value: 'VALE' } })
    expect(screen.queryByText(/buscas recentes/i)).not.toBeInTheDocument()
  })

  it('navigates down list with ArrowDown', () => {
    renderSearch()
    const input = screen.getByPlaceholderText(/Buscar ticker/i)
    fireEvent.change(input, { target: { value: 'VALE' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const items = screen.getAllByText(/^VALE/)
    expect(items[0].closest('div')).toHaveClass('text-cyan')
  })
})
