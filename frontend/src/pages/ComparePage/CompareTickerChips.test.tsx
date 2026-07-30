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
