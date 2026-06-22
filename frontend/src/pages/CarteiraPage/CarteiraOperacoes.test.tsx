import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraOperacoes } from './CarteiraOperacoes'

const mockCryptoList = vi.fn(() => ({ data: [{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' }] }))
vi.mock('../../api/crypto', () => ({
  useCryptoList: () => mockCryptoList(),
}))

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
      ticker: 'bitcoin',
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

  it('shows the coin symbol (not the raw CoinGecko id) in the ticker column for a cripto operation', () => {
    const op = {
      id: '1',
      date: '2024-01-15',
      ticker: 'bitcoin',
      assetClass: 'cripto' as const,
      type: 'buy' as const,
      qty: 0.1,
      price: 200000,
      currency: 'BRL',
      fees: 0,
    }
    render(<CarteiraOperacoes operations={[op]} onAdd={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('swaps the ticker field to a coin select when Criptoativo is chosen', () => {
    render(<CarteiraOperacoes operations={[]} onAdd={() => {}} onDelete={() => {}} />)
    fireEvent.click(screen.getByText('+ Registrar Operação'))
    fireEvent.change(screen.getByDisplayValue('Ação BR'), { target: { value: 'cripto' } })
    expect(screen.getByRole('option', { name: 'BTC — Bitcoin' })).toBeInTheDocument()
  })
})
