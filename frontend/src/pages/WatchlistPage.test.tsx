import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { WatchlistPage } from './WatchlistPage'
import type { WatchlistEntry } from '../stores/watchlistStore'
import type { LiveQuote } from '../api/stocks'

// Mock stores and API
vi.mock('../stores', () => ({
  useWatchlistStore: vi.fn(),
}))
vi.mock('../api/stocks', () => ({
  useBatchQuotes: vi.fn(),
}))

import { useWatchlistStore } from '../stores'
import { useBatchQuotes } from '../api/stocks'

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
