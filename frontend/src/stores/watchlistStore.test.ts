import { describe, it, expect, beforeEach } from 'vitest'
import { useWatchlistStore } from './watchlistStore'
import type { WatchlistEntry } from './watchlistStore'

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

beforeEach(() => {
  useWatchlistStore.setState({ entries: {} })
})

describe('watchlistStore.save()', () => {
  it('saves new entry without priceHistory', () => {
    const { save } = useWatchlistStore.getState()
    save(makeEntry('PETR4'))
    const stored = useWatchlistStore.getState().entries['PETR4']
    expect(stored.fairPrice).toBe(50)
    expect(stored.priceHistory).toEqual([])
  })

  it('moves previous fairPrice into priceHistory when re-saving', () => {
    const { save } = useWatchlistStore.getState()
    save(makeEntry('PETR4', { fairPrice: 50, savedAt: '2026-06-01T10:00:00.000Z' }))
    save(makeEntry('PETR4', { fairPrice: 60, savedAt: '2026-06-15T10:00:00.000Z' }))
    const stored = useWatchlistStore.getState().entries['PETR4']
    expect(stored.fairPrice).toBe(60)
    expect(stored.priceHistory).toHaveLength(1)
    expect(stored.priceHistory![0].fairPrice).toBe(50)
    expect(stored.priceHistory![0].savedAt).toBe('2026-06-01T10:00:00.000Z')
  })

  it('accumulates multiple saves in priceHistory', () => {
    const { save } = useWatchlistStore.getState()
    save(makeEntry('PETR4', { fairPrice: 40, savedAt: '2026-05-01T00:00:00.000Z' }))
    save(makeEntry('PETR4', { fairPrice: 50, savedAt: '2026-06-01T00:00:00.000Z' }))
    save(makeEntry('PETR4', { fairPrice: 60, savedAt: '2026-07-01T00:00:00.000Z' }))
    const stored = useWatchlistStore.getState().entries['PETR4']
    expect(stored.priceHistory).toHaveLength(2)
    expect(stored.priceHistory![0].fairPrice).toBe(50)
    expect(stored.priceHistory![1].fairPrice).toBe(40)
  })

  it('caps priceHistory at 50 entries', () => {
    const { save } = useWatchlistStore.getState()
    save(makeEntry('PETR4', { fairPrice: 1, savedAt: '2026-01-01T00:00:00.000Z' }))
    for (let i = 2; i <= 52; i++) {
      save(makeEntry('PETR4', { fairPrice: i, savedAt: `2026-01-${String(i).padStart(2, '0')}T00:00:00.000Z` }))
    }
    const stored = useWatchlistStore.getState().entries['PETR4']
    expect(stored.priceHistory!.length).toBe(50)
  })

  it('preserves notes when re-saving', () => {
    const { save, updateNotes } = useWatchlistStore.getState()
    save(makeEntry('PETR4', { fairPrice: 50, savedAt: '2026-06-01T00:00:00.000Z' }))
    updateNotes('PETR4', 'Minha nota')
    save(makeEntry('PETR4', { fairPrice: 60, savedAt: '2026-06-15T00:00:00.000Z' }))
    const stored = useWatchlistStore.getState().entries['PETR4']
    expect(stored.notes).toBe('Minha nota')
  })
})

describe('watchlistStore.updateHistoryAnnotation()', () => {
  it('adds annotation to the matching history entry', () => {
    const { save, updateHistoryAnnotation } = useWatchlistStore.getState()
    save(makeEntry('PETR4', { fairPrice: 50, savedAt: '2026-06-01T00:00:00.000Z' }))
    save(makeEntry('PETR4', { fairPrice: 60, savedAt: '2026-06-15T00:00:00.000Z' }))
    updateHistoryAnnotation('PETR4', '2026-06-01T00:00:00.000Z', 'Mês de resultados')
    const stored = useWatchlistStore.getState().entries['PETR4']
    expect(stored.priceHistory![0].annotation).toBe('Mês de resultados')
  })
})
