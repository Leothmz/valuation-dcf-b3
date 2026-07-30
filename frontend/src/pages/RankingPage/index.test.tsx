import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RankingPage } from './index'
import type { FundamentalsData } from '../../api/stocks'

// Mocka só a chamada de dados — o resto (useRankingStore, useIsMobile) usa a
// implementação real, como já é feito em WatchlistPage.test.tsx.
vi.mock('../../api/stocks', () => ({
  useBatchFundamentals: vi.fn(),
}))

import { useBatchFundamentals } from '../../api/stocks'

const mockUseBatchFundamentals = vi.mocked(useBatchFundamentals)

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

// Passa por todos os pré-filtros default do rankingStore (pl 3–15, dy ≥6%,
// margem ≥10%, roe ≥10%, DL/EBITDA ≤5, liquidez ≥ R$1M) para garantir que
// aparece em `rankedRows` independente do método ativo.
const ONE_STOCK: FundamentalsData = {
  ticker: 'PETR4',
  name: 'Petrobras',
  price: 38.42,
  pl: 4.1,
  dy: 0.142,
  roe: 0.31,
  margemLiquida: 0.15,
  dividaLiquidaEbit: 1.2,
  liquidezMedia: 5_000_000,
  dpa: 3.0,
  lpa: 5.0,
  vpa: 20.0,
  pvp: 1.5,
  setor: 'Energy',
  subsetor: 'Oil & Gas',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <RankingPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockUseBatchFundamentals.mockReturnValue({
    data: [ONE_STOCK],
    isLoading: false,
  } as ReturnType<typeof useBatchFundamentals>)
})

describe('RankingPage — montagem condicional mobile/desktop (useIsMobile, não CSS)', () => {
  it('no mobile, a RankingMobileList está no DOM e a RankingTable não', () => {
    mockMatchMedia(true)
    renderPage()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    // ExpandableRow expõe role="button" com aria-label = ticker — só existe na lista mobile.
    expect(screen.getByRole('button', { name: 'PETR4' })).toBeInTheDocument()
    // Se a RankingTable também estivesse montada (bug de dupla montagem), o ticker
    // apareceria uma segunda vez (texto do botão de ticker da tabela) e este getByText
    // lançaria "found multiple elements".
    expect(screen.getByText('PETR4')).toBeInTheDocument()
  })

  it('no desktop, a RankingTable está no DOM e a RankingMobileList não', () => {
    mockMatchMedia(false)
    renderPage()
    expect(screen.getByRole('table')).toBeInTheDocument()
    // Mesma lógica: se a RankingMobileList também estivesse montada, haveria dois
    // elementos com texto "PETR4" e getByText lançaria em vez de resolver.
    expect(screen.getByText('PETR4')).toBeInTheDocument()
  })
})
