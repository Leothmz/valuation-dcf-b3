import { render, screen, fireEvent } from '@testing-library/react'
import { DCFResultPanel } from './DCFResultPanel'
import type { DCFResult } from '../../engines/dcf-engine'
import type { NullableDCFAssumptions } from '../../stores/dcfStore'

const baseAssumptions: NullableDCFAssumptions = {
  ll: 1_000_000,
  payout: 0.4,
  roe: 0.2,
  g: 0.12,
  disc: 0.15,
  perp: 0.03,
  shares: 100_000,
  price: 30.0,
}

const baseResult: DCFResult = {
  flows: [],
  pvFlows: [],
  tv: 50_000_000,
  pvTV: 30_000_000,
  sumPV: 10_000_000,
  ev: 40_000_000,
  fairPrice: 40.0,
  upside: 0.25,
  baseYear: 2024,
}

const gordonError = { error: 'gordon' as const }

function renderPanel(overrides: Partial<Parameters<typeof DCFResultPanel>[0]> = {}) {
  const defaults = {
    results: null,
    resultsClassico: null,
    resultsBuffett: null,
    dcfMethod: 'buffett' as const,
    assumptions: baseAssumptions,
    ticker: null,
    onSave: vi.fn(),
    isSaved: false,
    onOpenMethodModal: vi.fn(),
  }
  return render(<DCFResultPanel {...defaults} {...overrides} />)
}

describe('DCFResultPanel', () => {
  it('shows dash for fair price when results is null', () => {
    renderPanel({ results: null })
    const prices = screen.getAllByText('—')
    expect(prices.length).toBeGreaterThan(0)
  })

  it('shows fair price in BRL when results provided', () => {
    renderPanel({ results: baseResult, ticker: 'PETR4' })
    const matches = screen.getAllByText(/R\$\s*40/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows positive upside badge', () => {
    renderPanel({ results: baseResult, ticker: 'PETR4' })
    expect(screen.getByText(/\+25,00%/)).toBeInTheDocument()
  })

  it('shows negative upside badge', () => {
    renderPanel({
      results: { ...baseResult, upside: -0.15 },
      ticker: 'PETR4',
    })
    expect(screen.getByText(/-15,00%/)).toBeInTheDocument()
  })

  it('shows gordon error message when perp >= disc', () => {
    renderPanel({ results: gordonError })
    expect(
      screen.getByText(/Taxa de crescimento na perpetuidade deve ser menor/i)
    ).toBeInTheDocument()
  })

  it('shows save button when ticker + valid results', () => {
    renderPanel({ results: baseResult, ticker: 'PETR4' })
    expect(screen.getByText(/Salvar Preço Teto/i)).toBeInTheDocument()
  })

  it('shows "Atualizar" text when isSaved=true', () => {
    renderPanel({ results: baseResult, ticker: 'PETR4', isSaved: true })
    expect(screen.getByText(/Atualizar Preço Teto Salvo/i)).toBeInTheDocument()
  })

  it('does not show save button when ticker is null', () => {
    renderPanel({ results: baseResult, ticker: null })
    expect(screen.queryByText(/Salvar Preço Teto/i)).not.toBeInTheDocument()
  })

  it('calls onOpenMethodModal when settings button clicked', () => {
    const onOpenMethodModal = vi.fn()
    renderPanel({ onOpenMethodModal })
    fireEvent.click(screen.getByTitle(/Configurações do método DCF/i))
    expect(onOpenMethodModal).toHaveBeenCalledTimes(1)
  })

  it('calls onSave when save button clicked', () => {
    const onSave = vi.fn()
    renderPanel({ results: baseResult, ticker: 'PETR4', onSave })
    fireEvent.click(screen.getByText(/Salvar Preço Teto/i))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('shows current price from assumptions', () => {
    renderPanel({ results: baseResult, assumptions: { ...baseAssumptions, price: 25.5 } })
    const matches = screen.getAllByText(/R\$\s*25/)
    expect(matches.length).toBeGreaterThan(0)
  })
})
