import { render, screen } from '@testing-library/react'
import { WatchlistHistoryModal } from './WatchlistHistoryModal'
import type { PriceHistoryEntry } from '../../stores/watchlistStore'

// Mesmo padrão de index.test.tsx / Sidebar.test.tsx — sobrescreve o polyfill global
// de matchMedia (test-setup.ts, default matches:false = desktop) para simular mobile.
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

const HISTORY: PriceHistoryEntry[] = [
  { fairPrice: 45, savedAt: '2026-05-01T00:00:00.000Z' },
]

function setup(isMobile: boolean) {
  mockMatchMedia(isMobile)
  render(
    <WatchlistHistoryModal
      isOpen
      onClose={() => {}}
      ticker="PETR4"
      history={HISTORY}
      onUpdateAnnotation={() => {}}
    />
  )
}

afterEach(() => {
  // Restaura o comportamento desktop padrão para não vazar entre testes.
  mockMatchMedia(false)
})

describe('WatchlistHistoryModal — montagem condicional (padrão C)', () => {
  it('em mobile, mostra a lista de cards e NÃO a tabela (detector de duplicata via getByText sem escopo)', () => {
    setup(true)
    // getByText (sem escopo) falharia com "multiple elements" se tabela e cards
    // fossem montados ao mesmo tempo — é o teste de montagem condicional.
    expect(screen.getByText(/R\$\s*45,00/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('em desktop, mostra a tabela e NÃO a lista de cards (detector de duplicata via getByText sem escopo)', () => {
    setup(false)
    expect(screen.getByText(/R\$\s*45,00/)).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
