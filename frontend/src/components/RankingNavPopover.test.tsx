import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RankingNavPopover } from './RankingNavPopover'

function setup(props: { isOpen?: boolean; onClose?: () => void; currentPath?: string } = {}) {
  const onClose = props.onClose ?? vi.fn()
  render(
    <MemoryRouter>
      <RankingNavPopover
        isOpen={props.isOpen ?? true}
        onClose={onClose}
        currentPath={props.currentPath ?? '/'}
      />
    </MemoryRouter>
  )
  return { onClose }
}

describe('RankingNavPopover', () => {
  it('não renderiza quando fechado', () => {
    setup({ isOpen: false })
    expect(screen.queryByRole('link', { name: 'Ações' })).not.toBeInTheDocument()
  })

  it('oferece Ações e FIIs com as rotas certas', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Ações' })).toHaveAttribute('href', '/ranking')
    expect(screen.getByRole('link', { name: 'FIIs' })).toHaveAttribute('href', '/fiis')
  })

  it('marca a opção correspondente à rota atual', () => {
    setup({ currentPath: '/fiis' })
    expect(screen.getByRole('link', { name: 'FIIs' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Ações' })).not.toHaveAttribute('aria-current')
  })

  it('fecha ao escolher uma opção', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('link', { name: 'FIIs' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('fecha no Escape', () => {
    const { onClose } = setup()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('fecha ao clicar fora', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByTestId('ranking-popover-scrim'))
    expect(onClose).toHaveBeenCalled()
  })
})
