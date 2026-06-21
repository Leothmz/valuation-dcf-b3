import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraOperacoes } from './CarteiraOperacoes'

describe('CarteiraOperacoes — cripto asset class', () => {
  it('offers Criptoativo as a class option in the registration form', () => {
    render(<CarteiraOperacoes operations={[]} onAdd={() => {}} onDelete={() => {}} />)
    fireEvent.click(screen.getByText('+ Registrar Operação'))
    expect(screen.getByRole('option', { name: 'Criptoativo' })).toBeInTheDocument()
  })

  it('shows the Criptoativo label for an existing cripto operation', () => {
    const op = {
      id: '1',
      date: '2024-01-15',
      ticker: 'BTC',
      assetClass: 'cripto' as const,
      type: 'buy' as const,
      qty: 0.1,
      price: 200000,
      currency: 'BRL',
      fees: 0,
    }
    render(<CarteiraOperacoes operations={[op]} onAdd={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('Criptoativo')).toBeInTheDocument()
  })
})
