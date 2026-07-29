import { render, screen } from '@testing-library/react'
import { AnaliseHistorico } from './AnaliseHistorico'
import type { StockQuote } from '../../api/stocks'

// Mesmo padrão de WatchlistHistoryModal.test.tsx / Sidebar.test.tsx — sobrescreve o polyfill
// global de matchMedia (test-setup.ts, default matches:false = desktop) para simular mobile.
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

const QUOTE = {
  ticker: 'PETR4',
  netIncomeHistory: [
    { year: 2025, netIncome: 120_000_000_000 },
    { year: 2024, netIncome: 100_000_000_000 },
  ],
} as StockQuote

function setup(isMobile: boolean) {
  mockMatchMedia(isMobile)
  render(<AnaliseHistorico quote={QUOTE} />)
}

afterEach(() => {
  // Restaura o comportamento desktop padrão para não vazar entre testes.
  mockMatchMedia(false)
})

describe('AnaliseHistorico — montagem condicional (tabela vs. lista)', () => {
  it('em mobile, mostra a lista de cards e NÃO a tabela (detector de duplicata via getByText sem escopo)', () => {
    setup(true)
    // getByText (sem escopo) falharia com "multiple elements" se tabela e lista
    // fossem montadas ao mesmo tempo — é o teste de montagem condicional.
    expect(screen.getByText('2025')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('em desktop, mostra a tabela e NÃO a lista de cards (detector de duplicata via getByText sem escopo)', () => {
    setup(false)
    expect(screen.getByText('2025')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
