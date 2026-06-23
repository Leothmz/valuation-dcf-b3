import { describe, it, expect, beforeEach } from 'vitest'
import { useRankingStore } from './rankingStore'

beforeEach(() => {
  useRankingStore.setState({ customTickers: [] })
})

describe('rankingStore custom tickers', () => {
  it('adds a custom ticker uppercased and trimmed', () => {
    const { addCustomTicker } = useRankingStore.getState()
    addCustomTicker(' mtre3 ')
    expect(useRankingStore.getState().customTickers).toEqual(['MTRE3'])
  })

  it('does not add duplicate tickers', () => {
    const { addCustomTicker } = useRankingStore.getState()
    addCustomTicker('MTRE3')
    addCustomTicker('MTRE3')
    expect(useRankingStore.getState().customTickers).toEqual(['MTRE3'])
  })

  it('ignores empty input', () => {
    const { addCustomTicker } = useRankingStore.getState()
    addCustomTicker('   ')
    expect(useRankingStore.getState().customTickers).toEqual([])
  })

  it('removes a custom ticker', () => {
    const { addCustomTicker, removeCustomTicker } = useRankingStore.getState()
    addCustomTicker('MTRE3')
    removeCustomTicker('MTRE3')
    expect(useRankingStore.getState().customTickers).toEqual([])
  })
})
