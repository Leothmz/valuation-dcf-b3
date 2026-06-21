import { describe, it, expect } from 'vitest'
import {
  buildHistoricalPriceMap,
  calcTWRR,
  buildTWRRSubPeriods,
  buildAssetTWRRMap,
  buildMergedDividendHistory,
  calcYieldOnCost,
  buildDividendProjection,
} from './portfolio-engine'
import type { Operation, Provento } from '../stores/portfolioStore'

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

  it('returns empty object instead of throwing when given a malformed response (e.g. a bare array)', () => {
    expect(buildHistoricalPriceMap([] as unknown as Parameters<typeof buildHistoricalPriceMap>[0])).toEqual({})
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

function op(overrides: Partial<Operation>): Operation {
  return {
    id: '1',
    date: '2024-01-02',
    ticker: 'WEGE3',
    assetClass: 'acao_br',
    type: 'buy',
    qty: 100,
    price: 30,
    currency: 'BRL',
    fees: 0,
    ...overrides,
  }
}

function provento(overrides: Partial<Provento>): Provento {
  return {
    id: 'p1',
    date: '2024-06-01',
    ticker: 'WEGE3',
    type: 'dividendo',
    qty: 100,
    valuePerShare: 0.5,
    ...overrides,
  }
}

describe('buildMergedDividendHistory', () => {
  it('uses the stored entry (confirmed) when a Provento matches the API date', () => {
    const ops = [op({})]
    const stored = [provento({})]
    const merged = buildMergedDividendHistory('WEGE3', [{ date: '2024-06-01', amount: 0.45 }], ops, stored)
    expect(merged).toHaveLength(1)
    expect(merged[0].source).toBe('confirmed')
    expect(merged[0].valuePerShare).toBeCloseTo(0.5) // stored value wins over API's 0.45
    expect(merged[0].provento).toBe(stored[0])
  })

  it('builds an estimated entry from held qty when no stored entry matches', () => {
    const ops = [op({})]
    const merged = buildMergedDividendHistory('WEGE3', [{ date: '2024-06-01', amount: 0.45 }], ops, [])
    expect(merged).toHaveLength(1)
    expect(merged[0].source).toBe('estimated')
    expect(merged[0].qty).toBe(100)
    expect(merged[0].total).toBeCloseTo(45)
    expect(merged[0].provento).toBeNull()
  })

  it('skips an API entry when held qty at that date is zero', () => {
    const ops = [op({ date: '2024-07-01' })] // bought AFTER the dividend date
    const merged = buildMergedDividendHistory('WEGE3', [{ date: '2024-06-01', amount: 0.45 }], ops, [])
    expect(merged).toHaveLength(0)
  })

  it('includes a stored entry with no matching API date (CSV/manual complement)', () => {
    const ops = [op({})]
    const stored = [provento({ date: '2024-12-01' })]
    const merged = buildMergedDividendHistory('WEGE3', [], ops, stored)
    expect(merged).toHaveLength(1)
    expect(merged[0].source).toBe('confirmed')
    expect(merged[0].date).toBe('2024-12-01')
  })

  it('sorts results by date descending', () => {
    const ops = [op({})]
    const stored = [provento({ date: '2024-01-15' }), provento({ id: 'p2', date: '2024-09-01' })]
    const merged = buildMergedDividendHistory('WEGE3', [], ops, stored)
    expect(merged.map((m) => m.date)).toEqual(['2024-09-01', '2024-01-15'])
  })

  it('only considers proventos and operations for the requested ticker', () => {
    const ops = [op({}), op({ ticker: 'VALE3' })]
    const stored = [provento({}), provento({ id: 'p2', ticker: 'VALE3', date: '2024-07-01' })]
    const merged = buildMergedDividendHistory('WEGE3', [], ops, stored)
    expect(merged).toHaveLength(1)
    expect(merged[0].ticker).toBe('WEGE3')
  })
})

describe('calcYieldOnCost', () => {
  it('divides dpa by precoMedio', () => {
    expect(calcYieldOnCost(3, 30)).toBeCloseTo(0.1, 4)
  })

  it('returns null when dpa is null', () => {
    expect(calcYieldOnCost(null, 30)).toBeNull()
  })

  it('returns null when precoMedio is null or zero', () => {
    expect(calcYieldOnCost(3, null)).toBeNull()
    expect(calcYieldOnCost(3, 0)).toBeNull()
  })
})

describe('buildDividendProjection', () => {
  it('multiplies dpa by qty per ticker and sums the total', () => {
    const holdings = [
      { ticker: 'WEGE3', assetClass: 'acao_br', qty: 100, precoMedio: 30, investido: 3000 },
      { ticker: 'VALE3', assetClass: 'acao_br', qty: 50, precoMedio: 60, investido: 3000 },
    ]
    const projection = buildDividendProjection(holdings, { WEGE3: 3, VALE3: 4 })
    expect(projection.perTicker.WEGE3).toBeCloseTo(300)
    expect(projection.perTicker.VALE3).toBeCloseTo(200)
    expect(projection.total).toBeCloseTo(500)
  })

  it('sets null for a ticker with unknown dpa and excludes it from the total', () => {
    const holdings = [{ ticker: 'WEGE3', assetClass: 'acao_br', qty: 100, precoMedio: 30, investido: 3000 }]
    const projection = buildDividendProjection(holdings, { WEGE3: null })
    expect(projection.perTicker.WEGE3).toBeNull()
    expect(projection.total).toBe(0)
  })
})
