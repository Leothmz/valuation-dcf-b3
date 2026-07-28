import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from './BottomSheet'

describe('BottomSheet', () => {
  it('não renderiza nada quando fechado', () => {
    render(<BottomSheet isOpen={false} onClose={() => {}} title="Filtros">conteúdo</BottomSheet>)
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('renderiza título e conteúdo quando aberto', () => {
    render(<BottomSheet isOpen onClose={() => {}} title="Filtros">conteúdo</BottomSheet>)
    expect(screen.getByText('Filtros')).toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('fecha ao clicar no scrim', () => {
    const onClose = vi.fn()
    render(<BottomSheet isOpen onClose={onClose} title="Filtros">conteúdo</BottomSheet>)
    fireEvent.click(screen.getByTestId('bottomsheet-scrim'))
    expect(onClose).toHaveBeenCalled()
  })

  it('fecha no Escape', () => {
    const onClose = vi.fn()
    render(<BottomSheet isOpen onClose={onClose} title="Filtros">conteúdo</BottomSheet>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('renderiza o rodapé quando fornecido', () => {
    render(
      <BottomSheet isOpen onClose={() => {}} title="Filtros" footer={<button>Aplicar</button>}>
        conteúdo
      </BottomSheet>
    )
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })
})
