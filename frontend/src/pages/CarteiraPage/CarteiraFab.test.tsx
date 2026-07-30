import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraFab } from './CarteiraFab'

describe('CarteiraFab', () => {
  it('some nas abas sem ação de adicionar', () => {
    const { container } = render(<CarteiraFab tab="visao" onAction={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('rotula a ação conforme a aba', () => {
    render(<CarteiraFab tab="operacoes" onAction={() => {}} />)
    expect(screen.getByRole('button', { name: 'Adicionar operação' })).toBeInTheDocument()
  })

  it('rotula a ação de renda fixa', () => {
    render(<CarteiraFab tab="rf" onAction={() => {}} />)
    expect(screen.getByRole('button', { name: 'Adicionar título' })).toBeInTheDocument()
  })

  it('dispara onAction com a aba corrente', () => {
    const onAction = vi.fn()
    render(<CarteiraFab tab="proventos" onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar provento' }))
    expect(onAction).toHaveBeenCalledWith('proventos')
  })
})
