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

// Mesmo padrão de CarteiraMetas.test.tsx (Task 21) — sobrescreve o polyfill global de
// matchMedia (test-setup.ts, default matches:false = desktop) para provar montagem
// condicional via useIsMobile(), não CSS (`md:hidden`). Sem escopo de container,
// getByRole é o detector de duplicata: se os dois botões de salvar montassem ao
// mesmo tempo, a busca por nome lançaria "found multiple elements".
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
    onExportHTML: vi.fn().mockResolvedValue(undefined),
    isExporting: false,
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
    // getByRole com nome exato: distingue do botão "Salvar preço teto" (mobile,
    // Step 6) que também consome onSave e reaproveita texto parecido — mas só monta
    // no desktop quando isMobile=false (default do polyfill em test-setup.ts).
    expect(screen.getByRole('button', { name: '＋ Salvar Preço Teto' })).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: '＋ Salvar Preço Teto' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('calls onSave when the mobile "Salvar preço teto" button is clicked (Step 6)', () => {
    mockMatchMedia(true)
    const onSave = vi.fn()
    renderPanel({ results: baseResult, ticker: 'PETR4', onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar preço teto' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    mockMatchMedia(false)
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

describe('export HTML button', () => {
  it('renders export button when results exist', () => {
    renderPanel({ results: baseResult, ticker: 'PETR4' })
    expect(screen.getByRole('button', { name: /exportar relatório html/i })).toBeInTheDocument()
  })

  it('shows loading text when isExporting', () => {
    renderPanel({ results: baseResult, ticker: 'PETR4', isExporting: true })
    expect(screen.getByText(/gerando relatório/i)).toBeInTheDocument()
  })

  it('does not render export button when results is null', () => {
    renderPanel({ results: null })
    expect(screen.queryByRole('button', { name: /exportar relatório/i })).not.toBeInTheDocument()
  })
})

describe('save button — montagem condicional mobile/desktop (useIsMobile, não md:hidden)', () => {
  afterEach(() => {
    mockMatchMedia(false)
  })

  it('no desktop, o botão de salvar aparece uma única vez (o de cima)', () => {
    mockMatchMedia(false)
    renderPanel({ results: baseResult, ticker: 'PETR4' })
    expect(screen.getAllByRole('button', { name: /salvar preço teto/i })).toHaveLength(1)
  })

  it('no mobile, o botão de salvar aparece uma única vez (o de baixo)', () => {
    mockMatchMedia(true)
    renderPanel({ results: baseResult, ticker: 'PETR4' })
    expect(screen.getAllByRole('button', { name: /salvar preço teto/i })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Salvar preço teto' })).toBeInTheDocument()
  })

  describe('avisos de premissa e valor terminal', () => {
    it('mostra o aviso de payout acima de 100% junto do preço teto', () => {
      renderPanel({
        results: baseResult,
        ticker: 'PETR4',
        assumptions: { ...baseAssumptions, payout: 1.2589 },
      })
      expect(screen.getByText(/Payout de 125,9%/)).toBeInTheDocument()
    })

    it('mostra o aviso de crescimento negativo', () => {
      renderPanel({
        results: baseResult,
        ticker: 'PETR4',
        assumptions: { ...baseAssumptions, g: -0.0784 },
      })
      expect(screen.getByText(/Crescimento estimado negativo/)).toBeInTheDocument()
    })

    it('mostra o peso do valor terminal quando a perpetuidade passa de 50% do EV', () => {
      renderPanel({
        results: { ...baseResult, pvTV: 57_000_000, ev: 100_000_000 },
        ticker: 'PETR4',
      })
      expect(screen.getByText(/57% do valor vem do valor terminal/)).toBeInTheDocument()
    })

    it('não mostra aviso nenhum num cenário saudável', () => {
      // baseResult tem pvTV/ev = 75%, que por si só dispara o aviso de valor
      // terminal — o cenário saudável precisa de uma perpetuidade menor.
      renderPanel({
        results: { ...baseResult, pvTV: 12_000_000, ev: 40_000_000 },
        ticker: 'PETR4',
      })
      expect(screen.queryByRole('note')).not.toBeInTheDocument()
    })
  })

  it('mostra o VPL da perpetuidade com o percentual do EV, sem repetir o EV', () => {
    renderPanel({ results: baseResult, ticker: 'PETR4' })
    expect(screen.getByText('VPL da Perpetuidade')).toBeInTheDocument()
    expect(screen.getByText('75% do EV')).toBeInTheDocument()
    expect(screen.queryByText('Market Cap Projetado')).not.toBeInTheDocument()
  })
})
