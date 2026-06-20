import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    scenarios: { enabled: false, bear: null, base: null, bull: null },
    scenarioResults: null,
    onToggleScenarios: vi.fn(),
    onSetScenario: vi.fn(),
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

describe('scenarios section', () => {
  const scenariosOff = { enabled: false, bear: null, base: null, bull: null }
  const scenariosOn = { enabled: true, bear: 0.07, base: 0.10, bull: 0.13 }
  const scenarioResults = { bear: 35.0, base: 40.0, bull: 48.0 }

  it('does not render scenario toggle when results is null', () => {
    renderPanel({
      scenarios: scenariosOff,
      scenarioResults: null,
      onToggleScenarios: vi.fn(),
      onSetScenario: vi.fn(),
    })
    expect(screen.queryByText(/bull \/ base \/ bear/i)).not.toBeInTheDocument()
  })

  it('renders scenario toggle when results exist', () => {
    renderPanel({
      results: baseResult,
      ticker: 'PETR4',
      scenarios: scenariosOff,
      scenarioResults: null,
      onToggleScenarios: vi.fn(),
      onSetScenario: vi.fn(),
    })
    expect(screen.getByText(/bull \/ base \/ bear/i)).toBeInTheDocument()
    expect(screen.getByText('OFF')).toBeInTheDocument()
  })

  it('shows scenario price chips when enabled', () => {
    renderPanel({
      results: baseResult,
      ticker: 'PETR4',
      scenarios: scenariosOn,
      scenarioResults,
      onToggleScenarios: vi.fn(),
      onSetScenario: vi.fn(),
    })
    expect(screen.getByText('ON')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*35/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*48/)).toBeInTheDocument()
  })

  it('calls onToggleScenarios when button clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderPanel({
      results: baseResult,
      ticker: 'PETR4',
      scenarios: scenariosOff,
      scenarioResults: null,
      onToggleScenarios: onToggle,
      onSetScenario: vi.fn(),
    })
    await user.click(screen.getByText(/bull \/ base \/ bear/i))
    expect(onToggle).toHaveBeenCalledWith(0.12) // baseAssumptions.g
  })
})
