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

// Mesmo padrão de CarteiraAtivos.test.tsx (Task 21) — sobrescreve o polyfill global de
// matchMedia (test-setup.ts, default matches:false = desktop) para provar montagem
// condicional via useIsMobile(), não CSS. getByText SEM escopo de container é o detector
// de duplicata: se a lista mobile e a tabela desktop fossem montadas ao mesmo tempo, o
// texto do ticker apareceria duas vezes e getByText lançaria "found multiple elements".
function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const OP = {
  id: '1',
  date: '2024-01-15',
  ticker: 'PETR4',
  assetClass: 'acao_br' as const,
  type: 'buy' as const,
  qty: 100,
  price: 30,
  currency: 'BRL',
  fees: 2,
}

describe('CarteiraOperacoes — montagem condicional mobile/desktop (useIsMobile, não CSS)', () => {
  afterEach(() => {
    mockMatchMedia(false)
  })

  it('no mobile, a lista de cards está no DOM e a tabela não', () => {
    mockMatchMedia(true)
    render(<CarteiraOperacoes operations={[OP]} onAdd={() => {}} onDelete={() => {}} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByText('Remover')).toBeInTheDocument()
  })

  it('no desktop, a tabela está no DOM e a lista de cards não', () => {
    mockMatchMedia(false)
    render(<CarteiraOperacoes operations={[OP]} onAdd={() => {}} onDelete={() => {}} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.queryByText('Remover')).not.toBeInTheDocument()
  })
})
