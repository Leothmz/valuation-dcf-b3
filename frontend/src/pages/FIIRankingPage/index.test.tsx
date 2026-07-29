import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FIIRankingPage } from './index'
import type { FIIData } from '../../api/fiis'

// Mocka só a chamada de dados — o resto (useIsMobile) usa a implementação real,
// mesmo padrão de RankingPage/index.test.tsx.
vi.mock('../../api/fiis', () => ({
  useBatchFIIs: vi.fn(),
}))

import { useBatchFIIs } from '../../api/fiis'

const mockUseBatchFIIs = vi.mocked(useBatchFIIs)

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

// Passa pelos filtros default do FIIRankingPage (DY ≥6%, liquidez ≥ R$500k,
// vacância ≤25%, P/VP ≥0,70) para garantir que aparece em `rankedRows`.
const ONE_FII: FIIData = {
  ticker: 'MXRF11',
  name: 'Maxi Renda',
  price: 10.32,
  dy: 0.10,
  pvp: 0.95,
  liquidez: 2_000_000,
  ffoYield: 0.12,
  vacancia: 0.05,
  segmento: 'Papel/CRI',
  dividends: [],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <FIIRankingPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockUseBatchFIIs.mockReturnValue({
    data: [ONE_FII],
    isLoading: false,
  } as ReturnType<typeof useBatchFIIs>)
})

describe('FIIRankingPage — montagem condicional mobile/desktop (useIsMobile, não CSS)', () => {
  it('no mobile, a FIIMobileList está no DOM e a FIITable não', () => {
    mockMatchMedia(true)
    renderPage()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    // ExpandableRow expõe role="button" com aria-label = ticker — só existe na lista mobile.
    expect(screen.getByRole('button', { name: 'MXRF11' })).toBeInTheDocument()
    // Se a FIITable também estivesse montada (bug de dupla montagem), o ticker apareceria
    // uma segunda vez e este getByText lançaria "found multiple elements".
    expect(screen.getByText('MXRF11')).toBeInTheDocument()
  })

  it('no desktop, a FIITable está no DOM e a FIIMobileList não', () => {
    mockMatchMedia(false)
    renderPage()
    expect(screen.getByRole('table')).toBeInTheDocument()
    // Mesma lógica: se a FIIMobileList também estivesse montada, haveria dois elementos
    // com texto "MXRF11" e getByText lançaria em vez de resolver.
    expect(screen.getByText('MXRF11')).toBeInTheDocument()
  })
})
