import { describe, it, expect } from 'vitest'
import {
  buildHistoricalPriceMap,
  calcTWRR,
  buildTWRRSubPeriods,
  buildAssetTWRRMap,
  buildMergedDividendHistory,
  calcYieldOnCost,
  buildDividendProjection,
  mapAssetClassToCategory,
  buildCategoryAllocation,
  calcAllocationDeviation,
  buildRebalancingSuggestions,
  adjustOperationsForSplits,
  buildAvgCostTimeline,
} from './portfolio-engine'
import type { Operation, Provento, Category, SplitEvent } from '../stores/portfolioStore'

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

describe('mapAssetClassToCategory', () => {
  it('maps acao_br to acoes_br', () => {
    expect(mapAssetClassToCategory('acao_br')).toBe('acoes_br')
  })

  it('maps fii to fiis', () => {
    expect(mapAssetClassToCategory('fii')).toBe('fiis')
  })

  it('maps both etf and stock_intl to internacional', () => {
    expect(mapAssetClassToCategory('etf')).toBe('internacional')
    expect(mapAssetClassToCategory('stock_intl')).toBe('internacional')
  })

  it('maps cripto to criptoativos', () => {
    expect(mapAssetClassToCategory('cripto')).toBe('criptoativos')
  })

  it('falls back to acoes_br for an unknown class', () => {
    expect(mapAssetClassToCategory('unknown')).toBe('acoes_br')
  })
})

describe('buildCategoryAllocation', () => {
  it('groups holdings into categories by price x qty, adds rfValue and cashBalance', () => {
    const holdings = [
      { ticker: 'WEGE3', assetClass: 'acao_br', qty: 100, precoMedio: 30, investido: 3000 },
      { ticker: 'XPLG11', assetClass: 'fii', qty: 50, precoMedio: 100, investido: 5000 },
      { ticker: 'IVVB11', assetClass: 'etf', qty: 10, precoMedio: 200, investido: 2000 },
      { ticker: 'AAPL34', assetClass: 'stock_intl', qty: 5, precoMedio: 50, investido: 250 },
      { ticker: 'BTC', assetClass: 'cripto', qty: 0.1, precoMedio: 200000, investido: 20000 },
    ]
    const priceMap = { WEGE3: 40, XPLG11: 110, IVVB11: 220, AAPL34: 60, BTC: 250000 }
    const result = buildCategoryAllocation(holdings, priceMap, 8000, 1500)
    expect(result.acoes_br).toBeCloseTo(4000) // 100 * 40
    expect(result.fiis).toBeCloseTo(5500) // 50 * 110
    expect(result.internacional).toBeCloseTo(2200 + 300) // (10*220) + (5*60)
    expect(result.criptoativos).toBeCloseTo(25000) // 0.1 * 250000
    expect(result.renda_fixa).toBe(8000)
    expect(result.caixa).toBe(1500)
  })

  it('skips a holding with no price instead of throwing', () => {
    const holdings = [{ ticker: 'WEGE3', assetClass: 'acao_br', qty: 100, precoMedio: 30, investido: 3000 }]
    const result = buildCategoryAllocation(holdings, {}, 0, 0)
    expect(result.acoes_br).toBe(0)
  })

  it('returns all six categories even with no holdings, zero rfValue and zero cashBalance', () => {
    const result = buildCategoryAllocation([], {}, 0, 0)
    expect(Object.keys(result).sort()).toEqual(
      ['acoes_br', 'caixa', 'criptoativos', 'fiis', 'internacional', 'renda_fixa'].sort()
    )
    expect(Object.values(result).every((v) => v === 0)).toBe(true)
  })
})

describe('calcAllocationDeviation', () => {
  const actualValues: Record<Category, number> = {
    acoes_br: 4000,
    fiis: 2000,
    renda_fixa: 3000,
    internacional: 1000,
    criptoativos: 0,
    caixa: 0,
  } // total = 10000

  it('computes actualPct, targetPct, and deviations as raw percent numbers', () => {
    const targets: Record<Category, number> = {
      acoes_br: 30,
      fiis: 30,
      renda_fixa: 20,
      internacional: 10,
      criptoativos: 5,
      caixa: 5,
    }
    const dev = calcAllocationDeviation(actualValues, targets)
    expect(dev.acoes_br.actualPct).toBeCloseTo(40) // 4000/10000 * 100
    expect(dev.acoes_br.targetPct).toBe(30)
    expect(dev.acoes_br.deviationPct).toBeCloseTo(10) // 40 - 30, overweight
    expect(dev.acoes_br.targetValue).toBeCloseTo(3000) // 30% of 10000
    expect(dev.acoes_br.deviationValue).toBeCloseTo(1000) // 4000 - 3000, overweight by R$1000
  })

  it('produces a negative deviation when actual is below target (underweight)', () => {
    const targets: Record<Category, number> = {
      acoes_br: 10,
      fiis: 10,
      renda_fixa: 10,
      internacional: 10,
      criptoativos: 30,
      caixa: 30,
    }
    const dev = calcAllocationDeviation(actualValues, targets)
    expect(dev.criptoativos.deviationValue).toBeCloseTo(-3000) // 0 - 3000 (30% of 10000)
  })

  it('returns all-zero pct fields when total portfolio value is zero, without dividing by zero', () => {
    const zeroActual: Record<Category, number> = {
      acoes_br: 0, fiis: 0, renda_fixa: 0, internacional: 0, criptoativos: 0, caixa: 0,
    }
    const targets: Record<Category, number> = {
      acoes_br: 50, fiis: 50, renda_fixa: 0, internacional: 0, criptoativos: 0, caixa: 0,
    }
    const dev = calcAllocationDeviation(zeroActual, targets)
    expect(dev.acoes_br.actualPct).toBe(0)
    expect(Number.isFinite(dev.acoes_br.actualPct)).toBe(true)
  })
})

describe('buildRebalancingSuggestions', () => {
  it('suggests vender with a positive amount when a category is overweight', () => {
    const deviations: Record<Category, ReturnType<typeof calcAllocationDeviation>['acoes_br']> = {
      acoes_br: { actualValue: 4000, actualPct: 40, targetPct: 30, targetValue: 3000, deviationPct: 10, deviationValue: 1000 },
      fiis: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      renda_fixa: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      internacional: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      criptoativos: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      caixa: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
    }
    const suggestions = buildRebalancingSuggestions(deviations)
    expect(suggestions.acoes_br.action).toBe('vender')
    expect(suggestions.acoes_br.amount).toBeCloseTo(1000)
  })

  it('suggests comprar with a positive amount when a category is underweight', () => {
    const deviations: Record<Category, ReturnType<typeof calcAllocationDeviation>['acoes_br']> = {
      acoes_br: { actualValue: 0, actualPct: 0, targetPct: 30, targetValue: 3000, deviationPct: -30, deviationValue: -3000 },
      fiis: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      renda_fixa: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      internacional: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      criptoativos: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      caixa: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
    }
    const suggestions = buildRebalancingSuggestions(deviations)
    expect(suggestions.acoes_br.action).toBe('comprar')
    expect(suggestions.acoes_br.amount).toBeCloseTo(3000)
  })

  it('suggests manter with amount 0 when the deviation is under R$0.01', () => {
    const deviations: Record<Category, ReturnType<typeof calcAllocationDeviation>['acoes_br']> = {
      acoes_br: { actualValue: 3000, actualPct: 30, targetPct: 30, targetValue: 3000, deviationPct: 0, deviationValue: 0.001 },
      fiis: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      renda_fixa: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      internacional: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      criptoativos: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
      caixa: { actualValue: 0, actualPct: 0, targetPct: 0, targetValue: 0, deviationPct: 0, deviationValue: 0 },
    }
    const suggestions = buildRebalancingSuggestions(deviations)
    expect(suggestions.acoes_br.action).toBe('manter')
    expect(suggestions.acoes_br.amount).toBe(0)
  })
})

describe('adjustOperationsForSplits', () => {
  it('leaves operations unchanged when there are no split events', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 30, currency: 'BRL', fees: 0 },
    ]
    const result = adjustOperationsForSplits(ops, [])
    expect(result).toEqual(ops)
  })

  it('applies a single split ratio to an operation dated before the split', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 10, price: 100, currency: 'BRL', fees: 0 },
    ]
    const splits: SplitEvent[] = [{ id: 's1', ticker: 'VALE3', date: '2024-06-01', ratio: 2 }]
    const result = adjustOperationsForSplits(ops, splits)
    expect(result[0].qty).toBeCloseTo(20)
    expect(result[0].price).toBeCloseTo(50)
  })

  it('does not apply a split to an operation dated after it', () => {
    const ops = [
      { id: '1', date: '2024-09-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 10, price: 50, currency: 'BRL', fees: 0 },
    ]
    const splits: SplitEvent[] = [{ id: 's1', ticker: 'VALE3', date: '2024-06-01', ratio: 2 }]
    const result = adjustOperationsForSplits(ops, splits)
    expect(result[0].qty).toBe(10)
    expect(result[0].price).toBe(50)
  })

  it('compounds two splits for an operation before both, and applies only the later one for an operation between them', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 10, price: 100, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-04-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 5, price: 50, currency: 'BRL', fees: 0 },
      { id: '3', date: '2024-10-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 3, price: 50 / 3, currency: 'BRL', fees: 0 },
    ]
    const splits: SplitEvent[] = [
      { id: 's1', ticker: 'VALE3', date: '2024-03-01', ratio: 2 },
      { id: 's2', ticker: 'VALE3', date: '2024-09-01', ratio: 3 },
    ]
    const result = adjustOperationsForSplits(ops, splits)
    // op1 (before both): cumulative ratio 2*3=6
    expect(result[0].qty).toBeCloseTo(60)
    expect(result[0].price).toBeCloseTo(100 / 6)
    // op2 (after split 1, before split 2): only split 2's ratio (3) applies
    expect(result[1].qty).toBeCloseTo(15)
    expect(result[1].price).toBeCloseTo(50 / 3)
    // op3 (after both): no future split applies, unchanged
    expect(result[2].qty).toBeCloseTo(3)
    expect(result[2].price).toBeCloseTo(50 / 3)
  })

  it('only applies a split to the matching ticker', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 10, price: 100, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-01-01', ticker: 'PETR4', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 10, price: 100, currency: 'BRL', fees: 0 },
    ]
    const splits: SplitEvent[] = [{ id: 's1', ticker: 'VALE3', date: '2024-06-01', ratio: 2 }]
    const result = adjustOperationsForSplits(ops, splits)
    expect(result[0].qty).toBeCloseTo(20) // VALE3 adjusted
    expect(result[1].qty).toBe(10) // PETR4 untouched
  })

  it('does not mutate the input array or its operations', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 10, price: 100, currency: 'BRL', fees: 0 },
    ]
    const splits: SplitEvent[] = [{ id: 's1', ticker: 'VALE3', date: '2024-06-01', ratio: 2 }]
    adjustOperationsForSplits(ops, splits)
    expect(ops[0].qty).toBe(10)
    expect(ops[0].price).toBe(100)
  })
})

describe('buildAvgCostTimeline', () => {
  it('computes a simple weighted average across two buys, unaffected by a later sell', () => {
    const ops = [
      { id: '1', date: '2024-01-05', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 10, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-01-15', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 20, currency: 'BRL', fees: 0 },
      { id: '3', date: '2024-02-01', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 50, price: 25, currency: 'BRL', fees: 0 },
    ]
    const timeline = buildAvgCostTimeline(ops)
    expect(timeline[1].avgCostAfter).toBeCloseTo(15) // (100*10 + 100*20) / 200
    expect(timeline[2].avgCostBefore).toBeCloseTo(15) // sell uses the pre-existing average
    expect(timeline[2].qtyBefore).toBe(200)
    expect(timeline[2].avgCostAfter).toBeCloseTo(15) // selling never changes average cost
    expect(timeline[2].qtyAfter).toBe(150)
  })

  it('resets average cost to zero when a position is fully liquidated, then starts fresh on reopening', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 10, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-02-01', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 100, price: 30, currency: 'BRL', fees: 0 },
      { id: '3', date: '2024-03-01', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 50, price: 8, currency: 'BRL', fees: 0 },
      { id: '4', date: '2024-04-01', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 20, price: 12, currency: 'BRL', fees: 0 },
    ]
    const timeline = buildAvgCostTimeline(ops)
    expect(timeline[1].qtyAfter).toBe(0)
    expect(timeline[1].avgCostAfter).toBe(0) // reset after full liquidation
    expect(timeline[2].avgCostBefore).toBe(0) // confirms the reset carried into the next operation
    expect(timeline[2].avgCostAfter).toBeCloseTo(8) // fresh average, NOT blended with the old position's R$10 cost
    expect(timeline[3].avgCostBefore).toBeCloseTo(8)
    expect(timeline[3].avgCostAfter).toBeCloseTo(8)
    expect(timeline[3].qtyAfter).toBe(30)
  })

  it('handles operations passed out of date order by sorting internally', () => {
    const ops = [
      { id: '2', date: '2024-01-15', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 20, currency: 'BRL', fees: 0 },
      { id: '1', date: '2024-01-05', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 10, currency: 'BRL', fees: 0 },
    ]
    const timeline = buildAvgCostTimeline(ops)
    expect(timeline[0].operation.id).toBe('1') // earlier date processed first
    expect(timeline[1].avgCostAfter).toBeCloseTo(15)
  })
})
