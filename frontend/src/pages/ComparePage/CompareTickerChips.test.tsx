import { render, screen, fireEvent } from '@testing-library/react'
import { CompareTickerChips } from './CompareTickerChips'

describe('CompareTickerChips', () => {
  it('mostra um chip por ticker', () => {
    render(<CompareTickerChips tickers={['PETR4', 'VALE3']} onRemove={() => {}} onAdd={() => {}} max={3} />)
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByText('VALE3')).toBeInTheDocument()
  })

  it('remove pelo × do chip', () => {
    const onRemove = vi.fn()
    render(<CompareTickerChips tickers={['PETR4']} onRemove={onRemove} onAdd={() => {}} max={3} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remover PETR4' }))
    expect(onRemove).toHaveBeenCalledWith('PETR4')
  })

  it('adiciona em maiúsculas ao submeter', () => {
    const onAdd = vi.fn()
    render(<CompareTickerChips tickers={['PETR4']} onRemove={() => {}} onAdd={onAdd} max={3} />)
    const input = screen.getByPlaceholderText('+ ticker')
    fireEvent.change(input, { target: { value: 'vale3' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith('VALE3')
  })

  it('esconde o input ao atingir o limite', () => {
    render(<CompareTickerChips tickers={['A', 'B', 'C']} onRemove={() => {}} onAdd={() => {}} max={3} />)
    expect(screen.queryByPlaceholderText('+ ticker')).not.toBeInTheDocument()
  })
})

// Sugestão de ticker existia em DCF, Análise e busca global, mas não aqui — só
// no Comparar o usuário tinha que saber o código de cor.
describe('CompareTickerChips — sugestões de ticker', () => {
  function typeInto(value: string, tickers: string[] = []) {
    const onAdd = vi.fn()
    render(<CompareTickerChips tickers={tickers} onRemove={() => {}} onAdd={onAdd} max={3} />)
    const input = screen.getByPlaceholderText('+ ticker')
    fireEvent.change(input, { target: { value } })
    return { input, onAdd }
  }

  it('sugere tickers da B3 pelo prefixo digitado', () => {
    typeInto('petr')
    const opcoes = screen.getAllByRole('option').map((o) => o.textContent)
    expect(opcoes).toContain('PETR4')
    expect(opcoes.every((t) => t!.startsWith('PETR'))).toBe(true)
  })

  it('não sugere um ticker que já está sendo comparado', () => {
    typeInto('petr', ['PETR4'])
    expect(screen.getAllByRole('option').map((o) => o.textContent)).not.toContain('PETR4')
  })

  it('não mostra nada com o campo vazio', () => {
    typeInto('')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('clicar numa sugestão adiciona o ticker', () => {
    const { onAdd } = typeInto('vale')
    fireEvent.mouseDown(screen.getByRole('option', { name: 'VALE3' }))
    expect(onAdd).toHaveBeenCalledWith('VALE3')
  })

  it('seta pra baixo + Enter adiciona a sugestão destacada, não o texto cru', () => {
    // "itu" digitado ≠ ticker válido; o que entra é a 1ª sugestão, capturada
    // antes do Enter (depois dele a lista já fechou).
    const { input, onAdd } = typeInto('itu')
    const primeira = screen.getAllByRole('option')[0].textContent
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith(primeira)
    expect(primeira).not.toBe('ITU')
  })

  it('Enter sem sugestão destacada mantém o texto digitado (ticker fora da lista)', () => {
    const { input, onAdd } = typeInto('xpto11')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith('XPTO11')
  })

  it('Escape fecha a lista', () => {
    const { input } = typeInto('petr')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
