import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AnaliseValuations } from './AnaliseValuations'
import { useWatchlistStore } from '../../stores/watchlistStore'
import type { FundamentalsData } from '../../api/stocks'

function renderValuations() {
  return render(
    <MemoryRouter>
      <AnaliseValuations data={DATA} ticker="PETR4" />
    </MemoryRouter>
  )
}

// price=38.42; dpa gera upside NEGATIVO no card Bazin (25 < 38.42);
// lpa+vpa geram upside POSITIVO no card Graham (68.37 > 38.42).
const DATA: FundamentalsData = {
  ticker: 'PETR4',
  price: 38.42,
  dy: 0.142,
  pl: 4.1,
  roe: 0.31,
  lpa: 9.4,
  vpa: 22.1,
  dpa: 1.5,
  crescimentoLucros: 0.08,
}

function resetStore() {
  useWatchlistStore.setState({ entries: {} })
}

describe('AnaliseValuations — regra do upside (sinal sempre visível)', () => {
  afterEach(resetStore)

  it('upside negativo (Bazin) nunca aparece sem o sinal de menos', () => {
    resetStore()
    renderValuations()
    // Hoje: "↓ 53,68% upside" (Math.abs esconde o menos). Correto: "↓ -53,68% upside".
    const semSinal = screen.queryAllByText(/↓ \d+,\d+% upside/)
    expect(semSinal).toHaveLength(0)
  })

  it('todo texto de upside carrega "+" ou "-" explícito junto ao percentual', () => {
    resetStore()
    renderValuations()
    const comSinalNegativo = screen.queryAllByText(/-\d+,\d+% upside/)
    const comSinalPositivo = screen.queryAllByText(/\+\d+,\d+% upside/)
    expect(comSinalNegativo.length).toBeGreaterThan(0)
    expect(comSinalPositivo.length).toBeGreaterThan(0)
  })

  it('bloco de DCF salvo (upside negativo) também exibe o sinal de menos', () => {
    resetStore()
    // Preço teto salvo abaixo do preço atual → upside negativo nesse bloco também.
    useWatchlistStore.setState({
      entries: {
        PETR4: {
          ticker: 'PETR4',
          name: 'Petrobras',
          fairPrice: 20,
          savedAt: '2026-01-01T00:00:00.000Z',
          projYears: 5,
          dcfMethod: 'padrao',
          assumptions: {},
          overrides: [],
          apiVals: {},
          yearOverrides: {},
          history: [],
        },
      },
    })
    renderValuations()
    // fair=20, price=38.42 → upside negativo grande; hoje sairia sem o menos.
    const semSinal = screen.queryAllByText(/↓ \d+,\d+% em relação ao preço atual/)
    expect(semSinal).toHaveLength(0)
    const comSinal = screen.queryAllByText(/↓ -\d+,\d+% em relação ao preço atual/)
    expect(comSinal.length).toBeGreaterThan(0)
  })
})
