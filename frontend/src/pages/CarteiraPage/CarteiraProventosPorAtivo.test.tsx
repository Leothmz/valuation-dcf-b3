import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraProventosPorAtivo } from './CarteiraProventosPorAtivo'
import type { HoldingSummary } from '../../engines/portfolio-engine'
import type { Operation, Provento } from '../../stores/portfolioStore'

const holdings: HoldingSummary[] = [
  { ticker: 'WEGE3', assetClass: 'acao_br', qty: 100, precoMedio: 30, investido: 3000 },
]
const operations: Operation[] = [
  {
    id: '1',
    date: '2024-01-01',
    ticker: 'WEGE3',
    assetClass: 'acao_br',
    type: 'buy',
    qty: 100,
    price: 30,
    currency: 'BRL',
    fees: 0,
  },
]

describe('CarteiraProventosPorAtivo', () => {
  it('shows total projection and per-ticker DPA/yield/projection', () => {
    render(
      <CarteiraProventosPorAtivo
        holdings={holdings}
        dividendHistoryByTicker={{}}
        dpaMap={{ WEGE3: 3 }}
        operations={operations}
        proventos={[]}
        loading={false}
        onConfirm={() => {}}
      />
    )
    expect(screen.getByText('PROJEÇÃO DE RENDA PASSIVA (12M)')).toBeInTheDocument()
    expect(screen.getByText(/Yield on Cost 10,0%/)).toBeInTheDocument()
  })

  it('expands to show merged history with an Estimado badge for API-only entries', () => {
    render(
      <CarteiraProventosPorAtivo
        holdings={holdings}
        dividendHistoryByTicker={{ WEGE3: [{ date: '2024-06-01', amount: 0.5 }] }}
        dpaMap={{ WEGE3: 3 }}
        operations={operations}
        proventos={[]}
        loading={false}
        onConfirm={() => {}}
      />
    )
    fireEvent.click(screen.getByText('WEGE3'))
    expect(screen.getByText('Estimado')).toBeInTheDocument()
  })

  it('clicking Confirmar on an estimated row calls onConfirm with the right payload', () => {
    const onConfirm = vi.fn()
    render(
      <CarteiraProventosPorAtivo
        holdings={holdings}
        dividendHistoryByTicker={{ WEGE3: [{ date: '2024-06-01', amount: 0.5 }] }}
        dpaMap={{ WEGE3: 3 }}
        operations={operations}
        proventos={[]}
        loading={false}
        onConfirm={onConfirm}
      />
    )
    fireEvent.click(screen.getByText('WEGE3'))
    fireEvent.click(screen.getByText('Confirmar'))
    expect(onConfirm).toHaveBeenCalledWith({
      date: '2024-06-01',
      ticker: 'WEGE3',
      type: 'dividendo',
      qty: 100,
      valuePerShare: 0.5,
    })
  })

  it('shows a Confirmado badge and no Confirmar button when a stored provento matches the date', () => {
    const proventos: Provento[] = [
      { id: 'p1', date: '2024-06-01', ticker: 'WEGE3', type: 'dividendo', qty: 100, valuePerShare: 0.5 },
    ]
    render(
      <CarteiraProventosPorAtivo
        holdings={holdings}
        dividendHistoryByTicker={{ WEGE3: [{ date: '2024-06-01', amount: 0.5 }] }}
        dpaMap={{ WEGE3: 3 }}
        operations={operations}
        proventos={proventos}
        loading={false}
        onConfirm={() => {}}
      />
    )
    fireEvent.click(screen.getByText('WEGE3'))
    expect(screen.getByText('Confirmado')).toBeInTheDocument()
    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument()
  })
})
