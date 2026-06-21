import { describe, it, expect } from 'vitest'
import { buildHistoricalPriceMap, calcTWRR, buildTWRRSubPeriods, buildAssetTWRRMap } from './portfolio-engine'
import type { Operation } from '../stores/portfolioStore'

describe('buildHistoricalPriceMap', () => {
  it('maps parallel price arrays to a nested ticker/date lookup', () => {
    const response = {
      tickers: ['PETR4', 'VALE3'],
      dates: ['2024-01-02', '2024-02-01'],
      prices: {
        PETR4: [30, 32],
        VALE3: [60, null],
      },
    }
    const map = buildHistoricalPriceMap(response)
    expect(map.PETR4['2024-01-02']).toBe(30)
    expect(map.PETR4['2024-02-01']).toBe(32)
    expect(map.VALE3['2024-01-02']).toBe(60)
    expect(map.VALE3['2024-02-01']).toBeNull()
  })

  it('returns empty object for empty response', () => {
    expect(buildHistoricalPriceMap({ tickers: [], dates: [], prices: {} })).toEqual({})
  })
})

describe('calcTWRR', () => {
  it('single period +10%', () => {
    expect(calcTWRR([{ startValue: 1000, endValue: 1100 }])).toBeCloseTo(0.1, 4)
  })

  it('two periods compound', () => {
    const periods = [
      { startValue: 1000, endValue: 1100 },
      { startValue: 1100, endValue: 1100 * 1.1 },
    ]
    expect(calcTWRR(periods)).toBeCloseTo(0.21, 4)
  })

  it('one period -10%', () => {
    expect(calcTWRR([{ startValue: 1000, endValue: 900 }])).toBeCloseTo(-0.1, 4)
  })

  it('returns null for empty array', () => {
    expect(calcTWRR([])).toBeNull()
  })

  it('skips periods where startValue is zero', () => {
    const periods = [
      { startValue: 0, endValue: 500 },
      { startValue: 1000, endValue: 1100 },
    ]
    expect(calcTWRR(periods)).toBeCloseTo(0.1, 4)
  })

  it('returns null when all periods have startValue <= 0', () => {
    const periods = [
      { startValue: 0, endValue: 500 },
      { startValue: -10, endValue: 20 },
    ]
    expect(calcTWRR(periods)).toBeNull()
  })
})

describe('buildTWRRSubPeriods', () => {
  function op(overrides: Partial<Operation>): Operation {
    return {
      id: '1',
      date: '2024-01-02',
      ticker: 'PETR4',
      assetClass: 'acao_br',
      type: 'buy',
      qty: 100,
      price: 30,
      currency: 'BRL',
      fees: 0,
      ...overrides,
    }
  }

  it('single operation — one sub-period', () => {
    const ops = [op({})]
    const hist = { PETR4: { '2024-01-02': 30 } }
    const curr = { PETR4: 35 }
    const periods = buildTWRRSubPeriods(ops, hist, curr)
    expect(periods).toHaveLength(1)
    expect(periods[0].startValue).toBeCloseTo(3000, 2)
    expect(periods[0].endValue).toBeCloseTo(3500, 2)
  })

  it('returns empty array for no operations', () => {
    expect(buildTWRRSubPeriods([], {}, {})).toEqual([])
  })

  it('two buys at different dates produce two sub-periods', () => {
    const ops = [
      op({ id: '1', date: '2024-01-02', qty: 100, price: 30 }),
      op({ id: '2', date: '2024-02-01', qty: 50, price: 32 }),
    ]
    const hist = { PETR4: { '2024-01-02': 30, '2024-02-01': 32 } }
    const curr = { PETR4: 35 }
    const periods = buildTWRRSubPeriods(ops, hist, curr)
    expect(periods).toHaveLength(2)
    expect(periods[0].startValue).toBeCloseTo(3000, 2)
    expect(periods[0].endValue).toBeCloseTo(3200, 2)
    expect(periods[1].startValue).toBeCloseTo(4800, 2)
    expect(periods[1].endValue).toBeCloseTo(5250, 2)
  })
})

describe('buildAssetTWRRMap', () => {
  function op(overrides: Partial<Operation>): Operation {
    return {
      id: '1',
      date: '2024-01-02',
      ticker: 'PETR4',
      assetClass: 'acao_br',
      type: 'buy',
      qty: 100,
      price: 30,
      currency: 'BRL',
      fees: 0,
      ...overrides,
    }
  }

  it('computes independent TWRR per ticker', () => {
    const ops = [
      op({ id: '1', ticker: 'PETR4', qty: 100, price: 30 }),
      op({ id: '2', ticker: 'VALE3', qty: 10, price: 60 }),
    ]
    const hist = { PETR4: { '2024-01-02': 30 }, VALE3: { '2024-01-02': 60 } }
    const curr = { PETR4: 33, VALE3: 54 }
    const map = buildAssetTWRRMap(ops, hist, curr)
    expect(map.PETR4.twrr).toBeCloseTo(0.1, 4)
    expect(map.VALE3.twrr).toBeCloseTo(-0.1, 4)
    expect(map.PETR4.subPeriods).toHaveLength(1)
  })

  it('returns empty object for no operations', () => {
    expect(buildAssetTWRRMap([], {}, {})).toEqual({})
  })
})
