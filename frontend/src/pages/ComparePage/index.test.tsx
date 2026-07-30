import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { ComparePage } from './index'
import type { FundamentalsData } from '../../api/stocks'

// Mocka só a chamada de dados — mesmo padrão de RankingPage/index.test.tsx.
vi.mock('../../api/stocks', () => ({
  useBatchFundamentals: vi.fn(),
}))

import { useBatchFundamentals } from '../../api/stocks'

const mockUseBatchFundamentals = vi.mocked(useBatchFundamentals)

const STOCKS: FundamentalsData[] = [
  {
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
  },
  {
    ticker: 'VALE3',
    name: 'Vale',
    price: 60.0,
    pl: 5.0,
    dy: 0.08,
    roe: 0.2,
    margemLiquida: 0.2,
    dividaLiquidaEbit: 1.0,
    liquidezMedia: 5_000_000,
    dpa: 2.0,
    lpa: 4.0,
    vpa: 15.0,
    pvp: 1.2,
    setor: 'Materials',
    subsetor: 'Mining',
  },
]

// Componente auxiliar só pra expor o searchParams atual pra asserção,
// já que o teste precisa confirmar que a URL foi reescrita de verdade —
// não só que onRemove/setTickers foi chamado.
function LocationProbe() {
  const [params] = useSearchParams()
  return <div data-testid="probe">{params.get('tickers')}</div>
}

function renderPage(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/compare" element={<><ComparePage /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockUseBatchFundamentals.mockReturnValue({
    data: STOCKS,
    isLoading: false,
  } as ReturnType<typeof useBatchFundamentals>)
})

describe('ComparePage — chips escrevem na URL', () => {
  it('remover um chip atualiza o search param tickers', () => {
    renderPage('/compare?tickers=PETR4,VALE3')

    expect(screen.getByTestId('probe').textContent).toBe('PETR4,VALE3')

    fireEvent.click(screen.getByRole('button', { name: 'Remover VALE3' }))

    expect(screen.getByTestId('probe').textContent).toBe('PETR4')
  })
})
