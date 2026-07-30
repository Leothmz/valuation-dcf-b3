import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from './BottomSheet'

describe('BottomSheet', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

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

  it('trava o scroll do body enquanto aberto e restaura ao fechar', () => {
    document.body.style.overflow = 'auto'
    const { rerender } = render(<BottomSheet isOpen onClose={() => {}} title="Filtros">c</BottomSheet>)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<BottomSheet isOpen={false} onClose={() => {}} title="Filtros">c</BottomSheet>)
    expect(document.body.style.overflow).toBe('auto')
  })
})
