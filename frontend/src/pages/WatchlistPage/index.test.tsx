import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { WatchlistPage } from './index'
import type { WatchlistEntry } from '../../stores/watchlistStore'
import type { LiveQuote } from '../../api/stocks'

// Mesmo padrão de Sidebar.test.tsx — sobrescreve o polyfill global de matchMedia
// (test-setup.ts, default matches:false = desktop) para simular o branch mobile.
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

// Mock stores and API
vi.mock('../../stores', () => ({
  useWatchlistStore: vi.fn(),
}))
vi.mock('../../api/stocks', () => ({
  useBatchQuotes: vi.fn(),
}))

import { useWatchlistStore } from '../../stores'
import { useBatchQuotes } from '../../api/stocks'

const mockUseWatchlist = vi.mocked(useWatchlistStore)
const mockUseBatchQuotes = vi.mocked(useBatchQuotes)

function makeEntry(ticker: string, overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
  return {
    ticker,
    name: `Empresa ${ticker}`,
    fairPrice: 50.0,
    savedAt: '2026-06-01T10:00:00.000Z',
    projYears: 5,
    dcfMethod: 'buffett',
    assumptions: {},
    overrides: [],
    apiVals: {},
    yearOverrides: {},
    history: [],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <WatchlistPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockUseBatchQuotes.mockReturnValue({
    data: [] as LiveQuote[],
    isLoading: false,
    dataUpdatedAt: 0,
  } as ReturnType<typeof useBatchQuotes>)
})

describe('Notes feature', () => {
  it('renders note badge (●) on ticker when entry has notes', () => {
    const mockUpdateNotes = vi.fn()
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4', { notes: 'Boa empresa' }) },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: mockUpdateNotes,
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)

    renderPage()
    expect(screen.getByTitle('Boa empresa')).toBeInTheDocument()
  })

  it('does not render note badge when entry has no notes', () => {
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4') },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)

    renderPage()
    expect(screen.queryByTitle(/boa empresa/i)).not.toBeInTheDocument()
  })
})

describe('WatchlistPage — empty state', () => {
  beforeEach(() => {
    mockUseWatchlist.mockReturnValue({
      entries: {},
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
  })

  it('shows empty state message when no entries', () => {
    renderPage()
    expect(screen.getByText(/Nenhum valuation salvo ainda/i)).toBeInTheDocument()
  })

  it('shows CTA to calculate first valuation', () => {
    renderPage()
    expect(screen.getByText(/Calcular primeiro valuation/i)).toBeInTheDocument()
  })
})

describe('WatchlistPage — data state', () => {
  beforeEach(() => {
    mockUseWatchlist.mockReturnValue({
      entries: {
        PETR4: makeEntry('PETR4'),
        VALE3: makeEntry('VALE3', { name: 'Vale SA', fairPrice: 80.0 }),
      },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
  })

  it('renders ticker names', () => {
    renderPage()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByText('VALE3')).toBeInTheDocument()
  })

  it('renders company names', () => {
    renderPage()
    expect(screen.getByText('Vale SA')).toBeInTheDocument()
  })

  it('renders fair prices in BRL', () => {
    renderPage()
    const prices = screen.getAllByText(/R\$\s*50/)
    expect(prices.length).toBeGreaterThan(0)
  })

  it('shows row count in header', () => {
    renderPage()
    expect(screen.getByText(/2 ativos salvos/i)).toBeInTheDocument()
  })
})

describe('WatchlistPage — loading state', () => {
  beforeEach(() => {
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4') },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)

    mockUseBatchQuotes.mockReturnValue({
      data: undefined,
      isLoading: true,
      dataUpdatedAt: 0,
    } as ReturnType<typeof useBatchQuotes>)
  })

  it('renders skeleton elements in price cells when loading', () => {
    const { container } = renderPage()
    const skeletons = container.querySelectorAll('.skel, [class*="animate"], .skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('WatchlistPage — live data state', () => {
  beforeEach(() => {
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4') },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
  })

  it('shows live price when quote available', () => {
    mockUseBatchQuotes.mockReturnValue({
      data: [{ ticker: 'PETR4', price: 35.5, changePercent: 1.2, dividendYield: 0.08, error: false }],
      isLoading: false,
      dataUpdatedAt: Date.now(),
    } as ReturnType<typeof useBatchQuotes>)

    renderPage()
    expect(screen.getByText(/R\$\s*35/)).toBeInTheDocument()
  })

  it('shows dash for price when live data has error', () => {
    mockUseBatchQuotes.mockReturnValue({
      data: [{ ticker: 'PETR4', price: null, changePercent: null, dividendYield: null, error: true }],
      isLoading: false,
      dataUpdatedAt: Date.now(),
    } as ReturnType<typeof useBatchQuotes>)

    renderPage()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})

describe('CSV export', () => {
  it('renders "Exportar CSV" button when there are entries', () => {
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4') },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)

    renderPage()
    expect(screen.getByRole('button', { name: /exportar csv/i })).toBeInTheDocument()
  })
})

describe('Price alerts feature', () => {
  it('shows buy-range banner when price is at or below fair price', () => {
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4', { fairPrice: 50 }) },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
    mockUseBatchQuotes.mockReturnValue({
      data: [{ ticker: 'PETR4', price: 40, changePercent: 0, dividendYield: 0, error: false }],
      isLoading: false,
      dataUpdatedAt: Date.now(),
    } as ReturnType<typeof useBatchQuotes>)

    renderPage()
    expect(screen.getByText(/na faixa de compra/i)).toBeInTheDocument()
  })

  it('does not show banner when price is above fair price', () => {
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4', { fairPrice: 50 }) },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
    mockUseBatchQuotes.mockReturnValue({
      data: [{ ticker: 'PETR4', price: 60, changePercent: 0, dividendYield: 0, error: false }],
      isLoading: false,
      dataUpdatedAt: Date.now(),
    } as ReturnType<typeof useBatchQuotes>)

    renderPage()
    expect(screen.queryByText(/na faixa de compra/i)).not.toBeInTheDocument()
  })

  it('does not show banner when alerts are disabled for the ticker', () => {
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4', { fairPrice: 50, alertEnabled: false }) },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
    mockUseBatchQuotes.mockReturnValue({
      data: [{ ticker: 'PETR4', price: 40, changePercent: 0, dividendYield: 0, error: false }],
      isLoading: false,
      dataUpdatedAt: Date.now(),
    } as ReturnType<typeof useBatchQuotes>)

    renderPage()
    expect(screen.queryByText(/na faixa de compra/i)).not.toBeInTheDocument()
  })

  it('toggles alert when bell icon clicked', async () => {
    const user = userEvent.setup()
    const mockToggleAlert = vi.fn()
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4', { fairPrice: 50 }) },
      remove: vi.fn(),
      toggleAlert: mockToggleAlert,
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
    mockUseBatchQuotes.mockReturnValue({
      data: [{ ticker: 'PETR4', price: 60, changePercent: 0, dividendYield: 0, error: false }],
      isLoading: false,
      dataUpdatedAt: Date.now(),
    } as ReturnType<typeof useBatchQuotes>)

    renderPage()
    await user.click(screen.getByTitle('Desativar alerta de preço'))
    expect(mockToggleAlert).toHaveBeenCalledWith('PETR4')
  })

  it('shows alert history modal via context menu', async () => {
    const user = userEvent.setup()
    mockUseWatchlist.mockReturnValue({
      entries: {
        PETR4: makeEntry('PETR4', {
          alertHistory: [{ firedAt: '2026-06-20T00:00:00.000Z', price: 38, fairPrice: 50 }],
        }),
      },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)

    renderPage()
    const row = screen.getByText('PETR4').closest('tr')!
    await user.pointer({ target: row, keys: '[MouseRight]' })
    await user.click(screen.getByText('Histórico de alertas'))

    expect(screen.getByText(/Histórico de alertas/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*38/)).toBeInTheDocument()
  })
})

describe('Price history feature', () => {
  it('renders history modal when triggered via context menu', async () => {
    const user = userEvent.setup()
    mockUseWatchlist.mockReturnValue({
      entries: {
        PETR4: makeEntry('PETR4', {
          priceHistory: [
            { fairPrice: 45, savedAt: '2026-05-01T00:00:00.000Z' },
          ],
        }),
      },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)

    renderPage()

    // right-click on row to open context menu
    const row = screen.getByText('PETR4').closest('tr')!
    await user.pointer({ target: row, keys: '[MouseRight]' })

    // click history option
    await user.click(screen.getByText('Histórico de preço teto'))

    // modal header visible
    expect(screen.getByText(/Histórico/)).toBeInTheDocument()
    // price visible
    expect(screen.getByText(/R\$\s*45/)).toBeInTheDocument()
  })

  it('shows empty state when priceHistory is empty', async () => {
    const user = userEvent.setup()
    mockUseWatchlist.mockReturnValue({
      entries: { PETR4: makeEntry('PETR4', { priceHistory: [] }) },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)

    renderPage()
    const row = screen.getByText('PETR4').closest('tr')!
    await user.pointer({ target: row, keys: '[MouseRight]' })
    await user.click(screen.getByText('Histórico de preço teto'))
    expect(screen.getByText(/Nenhum histórico ainda/)).toBeInTheDocument()
  })
})

describe('Watchlist mobile — padrão C (cards) e menu acessível', () => {
  const setupTwoEntries = () => {
    mockUseWatchlist.mockReturnValue({
      entries: {
        PETR4: makeEntry('PETR4', { fairPrice: 50 }),
        VALE3: makeEntry('VALE3', { name: 'Vale SA', fairPrice: 80 }),
      },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      updateNotes: vi.fn(),
      updateHistoryAnnotation: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
    mockUseBatchQuotes.mockReturnValue({
      data: [
        { ticker: 'PETR4', price: 40, changePercent: 1.1, dividendYield: 0.05, error: false },
        { ticker: 'VALE3', price: 90, changePercent: -0.5, dividendYield: 0.03, error: false },
      ],
      isLoading: false,
      dataUpdatedAt: Date.now(),
    } as ReturnType<typeof useBatchQuotes>)
  }

  afterEach(() => {
    // Restaura o comportamento desktop padrão para não vazar entre testes.
    mockMatchMedia(false)
  })

  it('em mobile, mostra os cards e NÃO a tabela desktop (detector de duplicata via getByText sem escopo)', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    // getByText (sem escopo) falharia com "multiple elements" se tabela e cards
    // fossem montados ao mesmo tempo — é o teste de montagem condicional.
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('em desktop, mostra a tabela e NÃO os cards (detector de duplicata via getByText sem escopo)', () => {
    setupTwoEntries()
    mockMatchMedia(false)
    renderPage()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('abre o menu da linha pelo botão de reticências (acessível sem clique direito)', async () => {
    const user = userEvent.setup()
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    await user.click(screen.getAllByRole('button', { name: /Mais ações/ })[0])
    expect(screen.getByText('Histórico de alertas')).toBeInTheDocument()
  })

  it('não expande o card ao clicar no botão de reticências aninhado no summary', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /Mais ações/ })[0])
    expect(screen.queryByText('Salvo em')).not.toBeInTheDocument()
  })

  it('não expande o card ao apertar Enter no botão de reticências aninhado (sem stopPropagation o Enter borbulharia)', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    fireEvent.keyDown(screen.getAllByRole('button', { name: /Mais ações/ })[0], { key: 'Enter' })
    expect(screen.queryByText('Salvo em')).not.toBeInTheDocument()
  })

  it('não expande o card ao clicar no sino (alerta) aninhado no summary', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    const bell = screen.getAllByRole('button', { name: /alerta de preço/ })[0]
    fireEvent.click(bell)
    expect(screen.queryByText('Salvo em')).not.toBeInTheDocument()
  })

  it('não expande o card ao apertar Enter no sino (alerta) aninhado no summary', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    const bell = screen.getAllByRole('button', { name: /alerta de preço/ })[0]
    fireEvent.keyDown(bell, { key: 'Enter' })
    expect(screen.queryByText('Salvo em')).not.toBeInTheDocument()
  })

  it('no desktop, o botão de reticências na célula de ações também abre o menu (descoberta sem clique direito)', async () => {
    const user = userEvent.setup()
    setupTwoEntries()
    mockMatchMedia(false)
    renderPage()
    await user.click(screen.getAllByRole('button', { name: /Mais ações/ })[0])
    expect(screen.getByText('Histórico de alertas')).toBeInTheDocument()
  })

  it('no desktop, o clique direito na linha continua funcionando (não regrediu)', async () => {
    const user = userEvent.setup()
    setupTwoEntries()
    mockMatchMedia(false)
    renderPage()
    const row = screen.getByText('PETR4').closest('tr')!
    await user.pointer({ target: row, keys: '[MouseRight]' })
    expect(screen.getByText('Histórico de alertas')).toBeInTheDocument()
  })

  // Preço teto e upside são o motivo de a tela existir — ficavam escondidos
  // atrás de um toque. Agora vivem na linha 2 do resumo, sem expandir nada.
  it('mostra preço teto e upside no resumo, sem precisar expandir o card', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    expect(screen.queryByText('Salvo em')).not.toBeInTheDocument()
    // upside = (50 - 40) / 50 = 0.20 -> "+20,00%"
    // O hero da página também mostra o melhor upside; aqui o alvo é o card da linha.
    expect(screen.getAllByText('+20,00%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Preço teto').length).toBeGreaterThan(0)
  })

  it('upside positivo sai em verde e negativo em vermelho, com o sinal preservado', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    // PETR4: fairPrice 50, price 40 -> +20,00% (verde)
    // Escopado ao card da linha: o hero da página mostra o mesmo upside em ciano.
    const cardPETR4 = screen.getByRole('button', { name: 'PETR4' })
    expect(within(cardPETR4).getByText('+20,00%').style.color).toBe('var(--color-green)')
    // VALE3: fairPrice 80, price 90 -> (80-90)/80 = -0.125 -> -12,50% (vermelho)
    expect(screen.getByText('-12,50%').style.color).toBe('var(--color-red)')
  })

  it('não duplica preço teto/upside dentro do detalhe ao expandir', () => {
    setupTwoEntries()
    mockMatchMedia(true)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'PETR4' }))
    expect(screen.getByText('Salvo em')).toBeInTheDocument()
    // 2 = o do hero da página + o do card; o que não pode é aparecer duas vezes dentro do card.
    expect(screen.getAllByText('+20,00%')).toHaveLength(2)
  })

  it('exportar CSV vira ícone com aria-label acessível no header', () => {
    setupTwoEntries()
    renderPage()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument()
  })
})

describe('WatchlistPage — número principal da rota', () => {
  beforeEach(() => {
    mockUseWatchlist.mockReturnValue({
      entries: {
        PETR4: makeEntry('PETR4', { fairPrice: 50 }),
        VALE3: makeEntry('VALE3', { name: 'Vale SA', fairPrice: 100 }),
      },
      remove: vi.fn(),
      toggleAlert: vi.fn(),
      recordAlertFired: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
    } as ReturnType<typeof useWatchlistStore>)
  })

  it('destaca a melhor oportunidade salva: maior upside contra o preço teto', () => {
    // PETR4: teto 50, preço 40 → upside 20%. VALE3: teto 100, preço 40 → 60%.
    mockUseBatchQuotes.mockReturnValue({
      data: [
        { ticker: 'PETR4', price: 40, changePercent: 0 },
        { ticker: 'VALE3', price: 40, changePercent: 0 },
      ] as LiveQuote[],
      isLoading: false,
      dataUpdatedAt: 0,
    } as ReturnType<typeof useBatchQuotes>)

    renderPage()
    expect(screen.getByText('Melhor Oportunidade Salva')).toBeInTheDocument()
    expect(screen.getByText('+60,00%')).toBeInTheDocument()
    expect(screen.getByText(/VALE3 · teto/)).toBeInTheDocument()
  })

  it('sem cotação ao vivo, não inventa oportunidade', () => {
    renderPage()
    expect(screen.queryByText('Melhor Oportunidade Salva')).not.toBeInTheDocument()
  })
})
