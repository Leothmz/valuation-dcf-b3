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
  classifySaleGains,
  buildMonthlyIRSummary,
  buildIRPFAnnualSummary,
} from './portfolio-engine'
import type { MonthlyIRSummary, SaleGain } from './portfolio-engine'
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

describe('classifySaleGains', () => {
  it('classifies a pure swing trade sale using the pre-existing average cost', () => {
    const ops = [
      { id: '1', date: '2024-01-10', ticker: 'PETR4', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 30, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-03-15', ticker: 'PETR4', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 40, price: 35, currency: 'BRL', fees: 0 },
    ]
    const gains = classifySaleGains(ops)
    expect(gains).toHaveLength(1)
    expect(gains[0]).toMatchObject({
      date: '2024-03-15', ticker: 'PETR4', category: 'swing_acoes', qty: 40, proceeds: 1400,
    })
    expect(gains[0].gain).toBeCloseTo(200) // 40 * (35 - 30)
  })

  it('classifies a pure day trade using same-day weighted average prices, independent of running cost basis', () => {
    const ops = [
      { id: '1', date: '2024-04-02', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 200, price: 60, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-04-02', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 200, price: 65, currency: 'BRL', fees: 0 },
    ]
    const gains = classifySaleGains(ops)
    expect(gains).toHaveLength(1)
    expect(gains[0]).toMatchObject({
      date: '2024-04-02', ticker: 'VALE3', category: 'day_trade', qty: 200, proceeds: 13000,
    })
    expect(gains[0].gain).toBeCloseTo(1000) // 200 * (65 - 60)
  })

  it('splits a same-day sell that exceeds the same-day buy into a day-trade portion and a swing-trade portion using prior cost basis', () => {
    // Hand-verified scenario: prior holding 100 @ R$20. Same day: buy 50 @ R$25, sell 120 @ R$28.
    // Day trade matches min(50,120)=50 @ (sell avg 28 - buy avg 25) = R$150 gain, proceeds 50*28=1400.
    // Remaining 70 sold come from the PRE-EXISTING 100 @ R$20 (not today's R$25 buy): gain = 70*(28-20)=R$560, proceeds 70*28=1960.
    // The day's buy (50) is entirely consumed by the day-trade match, so none of it joins the running position;
    // the running position after this day = 100 - 70 = 30 shares, still @ R$20 average (unaffected by the day's buy or sell).
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 20, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-05-10', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 50, price: 25, currency: 'BRL', fees: 0 },
      { id: '3', date: '2024-05-10', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 120, price: 28, currency: 'BRL', fees: 0 },
      { id: '4', date: '2024-06-01', ticker: 'ITUB4', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 10, price: 22, currency: 'BRL', fees: 0 },
    ]
    const gains = classifySaleGains(ops)
    expect(gains).toHaveLength(3)

    const dayTrade = gains.find((g) => g.category === 'day_trade')!
    expect(dayTrade.qty).toBe(50)
    expect(dayTrade.proceeds).toBeCloseTo(1400)
    expect(dayTrade.gain).toBeCloseTo(150)

    const swingOnSameDay = gains.find((g) => g.date === '2024-05-10' && g.category === 'swing_acoes')!
    expect(swingOnSameDay.qty).toBe(70)
    expect(swingOnSameDay.proceeds).toBeCloseTo(1960)
    expect(swingOnSameDay.gain).toBeCloseTo(560) // 70 * (28 - 20), using the PRIOR R$20 cost basis, not the day's R$25 buy

    const laterSale = gains.find((g) => g.date === '2024-06-01')!
    expect(laterSale.qty).toBe(10)
    expect(laterSale.gain).toBeCloseTo(20) // 10 * (22 - 20): confirms the running position stayed at R$20 average after the day-trade day
  })

  it('classifies a FII swing-trade sale as swing_fii, independent of the stock swing-trade bucket', () => {
    const ops = [
      { id: '1', date: '2024-02-01', ticker: 'XPLG11', assetClass: 'fii' as const, type: 'buy' as const, qty: 100, price: 100, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-05-01', ticker: 'XPLG11', assetClass: 'fii' as const, type: 'sell' as const, qty: 50, price: 120, currency: 'BRL', fees: 0 },
    ]
    const gains = classifySaleGains(ops)
    expect(gains).toHaveLength(1)
    expect(gains[0]).toMatchObject({ category: 'swing_fii', qty: 50, proceeds: 6000 })
    expect(gains[0].gain).toBeCloseTo(1000) // 50 * (120 - 100)
  })

  it('classifies a crypto sale as a single cripto bucket, with no day-trade split even when bought and sold same-day', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'bitcoin', assetClass: 'cripto' as const, type: 'buy' as const, qty: 1, price: 200000, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-06-01', ticker: 'bitcoin', assetClass: 'cripto' as const, type: 'buy' as const, qty: 1, price: 250000, currency: 'BRL', fees: 0 },
      { id: '3', date: '2024-06-01', ticker: 'bitcoin', assetClass: 'cripto' as const, type: 'sell' as const, qty: 1.5, price: 300000, currency: 'BRL', fees: 0 },
    ]
    const gains = classifySaleGains(ops)
    expect(gains).toHaveLength(1)
    expect(gains[0]).toMatchObject({ category: 'cripto', qty: 1.5, proceeds: 450000 })
    expect(gains[0].gain).toBeCloseTo(150000) // 1.5 * (300000 - 200000), using the pre-existing average cost
  })

  it('produces no entries when there are no sells', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 30, currency: 'BRL', fees: 0 },
    ]
    expect(classifySaleGains(ops)).toEqual([])
  })

  it('keeps tickers fully independent', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 30, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-02-01', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 50, price: 40, currency: 'BRL', fees: 0 },
      { id: '3', date: '2024-01-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 200, price: 60, currency: 'BRL', fees: 0 },
      { id: '4', date: '2024-02-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 100, price: 50, currency: 'BRL', fees: 0 },
    ]
    const gains = classifySaleGains(ops)
    expect(gains).toHaveLength(2)
    expect(gains.find((g) => g.ticker === 'WEGE3')!.gain).toBeCloseTo(500) // 50*(40-30)
    expect(gains.find((g) => g.ticker === 'VALE3')!.gain).toBeCloseTo(-1000) // 100*(50-60), a loss
  })
})

describe('buildMonthlyIRSummary', () => {
  it('applies the R$20k exemption to a small swing-trade-stock month (based on proceeds, not gain)', () => {
    const gains: SaleGain[] = [
      { date: '2024-03-10', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 15000, gain: 1000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary).toHaveLength(1)
    expect(summary[0]).toMatchObject({
      month: '2024-03', category: 'swing_acoes', grossGain: 1000, proceeds: 15000,
      exempt: true, taxableAmount: 0, darfAmount: 0, lossCarriedIn: 0, lossCarriedOut: 0,
    })
  })

  it('taxes a swing-trade-stock month at 15% when proceeds exceed R$20k', () => {
    const gains: SaleGain[] = [
      { date: '2024-03-10', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 25000, gain: 2000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary[0].exempt).toBe(false)
    expect(summary[0].taxableAmount).toBeCloseTo(2000)
    expect(summary[0].rate).toBeCloseTo(0.15)
    expect(summary[0].darfAmount).toBeCloseTo(300)
  })

  it('never exempts a FII swing-trade month regardless of proceeds', () => {
    const gains: SaleGain[] = [
      { date: '2024-03-10', ticker: 'XPLG11', category: 'swing_fii', qty: 100, proceeds: 5000, gain: 500 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary[0].exempt).toBe(false)
    expect(summary[0].taxableAmount).toBeCloseTo(500)
    expect(summary[0].rate).toBeCloseTo(0.20)
    expect(summary[0].darfAmount).toBeCloseTo(100)
  })

  it('never exempts a day-trade month regardless of proceeds', () => {
    const gains: SaleGain[] = [
      { date: '2024-03-10', ticker: 'VALE3', category: 'day_trade', qty: 50, proceeds: 1000, gain: 200 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary[0].exempt).toBe(false)
    expect(summary[0].taxableAmount).toBeCloseTo(200)
    expect(summary[0].rate).toBeCloseTo(0.20)
    expect(summary[0].darfAmount).toBeCloseTo(40)
  })

  it('applies the R$35k exemption to crypto (not R$20k like swing_acoes)', () => {
    const gains: SaleGain[] = [
      { date: '2024-03-10', ticker: 'bitcoin', category: 'cripto', qty: 1, proceeds: 30000, gain: 5000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary[0].exempt).toBe(true)
    expect(summary[0].taxableAmount).toBe(0)
  })

  it('taxes crypto at 15% with no partial exemption once proceeds exceed R$35k', () => {
    const gains: SaleGain[] = [
      { date: '2024-03-10', ticker: 'bitcoin', category: 'cripto', qty: 1, proceeds: 40000, gain: 5000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary[0].exempt).toBe(false)
    expect(summary[0].taxableAmount).toBeCloseTo(5000)
    expect(summary[0].rate).toBeCloseTo(0.15)
    expect(summary[0].darfAmount).toBeCloseTo(750)
  })

  it('keeps the crypto loss-carry bucket independent of swing_acoes', () => {
    const gains: SaleGain[] = [
      { date: '2024-01-15', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 30000, gain: -1000 },
      { date: '2024-02-15', ticker: 'bitcoin', category: 'cripto', qty: 1, proceeds: 40000, gain: 1000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    const cryptoMonth = summary.find((s) => s.category === 'cripto')!
    expect(cryptoMonth.lossCarriedIn).toBe(0)
    expect(cryptoMonth.taxableAmount).toBeCloseTo(1000)
  })

  it('carries a loss forward, partially offsets a later gain, then a later month is exempt without disturbing a zero loss balance', () => {
    // Hand-verified 3-month scenario for the swing_acoes bucket:
    // Jan: loss of R$500 (proceeds irrelevant to a loss) -> lossCarriedOut = 500, no tax.
    // Feb: gain R$2000, proceeds R$25000 (not exempt, > 20k) -> taxable = 2000 - 500(carried) = 1500, darf = 1500*0.15 = 225, lossCarriedOut = 0.
    // Mar: gain R$1000, proceeds R$10000 (<= 20k -> exempt) -> exempt, taxable 0, darf 0, lossCarriedOut stays 0 (exemption never touches the loss balance).
    const gains: SaleGain[] = [
      { date: '2024-01-15', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 30000, gain: -500 },
      { date: '2024-02-15', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 25000, gain: 2000 },
      { date: '2024-03-15', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 10000, gain: 1000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary).toHaveLength(3)

    const jan = summary.find((s) => s.month === '2024-01')!
    expect(jan.grossGain).toBeCloseTo(-500)
    expect(jan.taxableAmount).toBe(0)
    expect(jan.darfAmount).toBe(0)
    expect(jan.lossCarriedIn).toBe(0)
    expect(jan.lossCarriedOut).toBeCloseTo(500)

    const feb = summary.find((s) => s.month === '2024-02')!
    expect(feb.lossCarriedIn).toBeCloseTo(500)
    expect(feb.exempt).toBe(false)
    expect(feb.taxableAmount).toBeCloseTo(1500)
    expect(feb.darfAmount).toBeCloseTo(225)
    expect(feb.lossCarriedOut).toBe(0)

    const mar = summary.find((s) => s.month === '2024-03')!
    expect(mar.lossCarriedIn).toBe(0)
    expect(mar.exempt).toBe(true)
    expect(mar.taxableAmount).toBe(0)
    expect(mar.darfAmount).toBe(0)
    expect(mar.lossCarriedOut).toBe(0) // exemption does not touch the (already-zero) loss balance
  })

  it('keeps the three category buckets fully independent — a swing-stock loss does not offset a FII gain', () => {
    const gains: SaleGain[] = [
      { date: '2024-01-15', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 30000, gain: -1000 },
      { date: '2024-02-15', ticker: 'XPLG11', category: 'swing_fii', qty: 100, proceeds: 6000, gain: 1000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    const fiiMonth = summary.find((s) => s.category === 'swing_fii')!
    expect(fiiMonth.lossCarriedIn).toBe(0) // unaffected by the swing_acoes loss
    expect(fiiMonth.taxableAmount).toBeCloseTo(1000)
    expect(fiiMonth.darfAmount).toBeCloseTo(200)
  })

  it('computes the DARF due date as the last calendar day of the following month, including a leap-year case', () => {
    const gains: SaleGain[] = [
      { date: '2024-01-15', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 25000, gain: 1000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary[0].dueDate).toBe('2024-02-29') // 2024 is a leap year
  })

  it('rolls the due date over into the next year for a December reference month', () => {
    const gains: SaleGain[] = [
      { date: '2024-12-10', ticker: 'WEGE3', category: 'swing_acoes', qty: 100, proceeds: 25000, gain: 1000 },
    ]
    const summary = buildMonthlyIRSummary(gains)
    expect(summary[0].dueDate).toBe('2025-01-31')
  })

  it('returns an empty array for no sale gains', () => {
    expect(buildMonthlyIRSummary([])).toEqual([])
  })
})

describe('buildIRPFAnnualSummary', () => {
  it('reports a year-end position with the average cost as of 31/12', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 10, currency: 'BRL', fees: 0 },
    ]
    const result = buildIRPFAnnualSummary(ops, [], 2024)
    expect(result.year).toBe(2024)
    expect(result.positions).toEqual([{ ticker: 'WEGE3', qty: 100, avgCost: 10, totalCost: 1000 }])
  })

  it('excludes a ticker that was fully liquidated by year end', () => {
    const ops = [
      { id: '1', date: '2024-01-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 50, price: 20, currency: 'BRL', fees: 0 },
      { id: '2', date: '2024-06-01', ticker: 'VALE3', assetClass: 'acao_br' as const, type: 'sell' as const, qty: 50, price: 25, currency: 'BRL', fees: 0 },
    ]
    const result = buildIRPFAnnualSummary(ops, [], 2024)
    expect(result.positions).toEqual([])
  })

  it('excludes operations dated after the requested year', () => {
    const ops = [
      { id: '1', date: '2025-01-01', ticker: 'WEGE3', assetClass: 'acao_br' as const, type: 'buy' as const, qty: 100, price: 10, currency: 'BRL', fees: 0 },
    ]
    const result = buildIRPFAnnualSummary(ops, [], 2024)
    expect(result.positions).toEqual([])
  })

  it('sums exempt months in the requested year into exemptIncome, ignoring non-exempt months', () => {
    const monthlySummaries: MonthlyIRSummary[] = [
      { month: '2024-01', category: 'swing_acoes', grossGain: 800, proceeds: 15000, exempt: true, lossCarriedIn: 0, taxableAmount: 0, rate: 0.15, darfAmount: 0, lossCarriedOut: 0, dueDate: '2024-02-29' },
      { month: '2024-02', category: 'swing_acoes', grossGain: 2000, proceeds: 25000, exempt: false, lossCarriedIn: 0, taxableAmount: 2000, rate: 0.15, darfAmount: 300, lossCarriedOut: 0, dueDate: '2024-03-31' },
      { month: '2024-03', category: 'swing_fii', grossGain: 1200, proceeds: 18000, exempt: true, lossCarriedIn: 0, taxableAmount: 0, rate: 0.20, darfAmount: 0, lossCarriedOut: 0, dueDate: '2024-04-30' },
    ]
    const result = buildIRPFAnnualSummary([], monthlySummaries, 2024)
    // only the 2024-01 entry is exempt:true in this fixture (the 2024-03 entry's grossGain is included
    // only because this test fixture marks it exempt — included to confirm exemptIncome sums ALL exempt
    // months regardless of category, not just swing_acoes)
    expect(result.exemptIncome).toBeCloseTo(800 + 1200)
  })

  it('includes only months with a positive taxable amount in taxableGainsByMonth, for the requested year only', () => {
    const monthlySummaries: MonthlyIRSummary[] = [
      { month: '2023-12', category: 'swing_acoes', grossGain: 5000, proceeds: 30000, exempt: false, lossCarriedIn: 0, taxableAmount: 5000, rate: 0.15, darfAmount: 750, lossCarriedOut: 0, dueDate: '2024-01-31' },
      { month: '2024-02', category: 'swing_acoes', grossGain: 2000, proceeds: 25000, exempt: false, lossCarriedIn: 0, taxableAmount: 2000, rate: 0.15, darfAmount: 300, lossCarriedOut: 0, dueDate: '2024-03-31' },
      { month: '2024-03', category: 'swing_acoes', grossGain: -500, proceeds: 30000, exempt: false, lossCarriedIn: 0, taxableAmount: 0, rate: 0.15, darfAmount: 0, lossCarriedOut: 500, dueDate: '2024-04-30' },
    ]
    const result = buildIRPFAnnualSummary([], monthlySummaries, 2024)
    expect(result.taxableGainsByMonth).toHaveLength(1)
    expect(result.taxableGainsByMonth[0].month).toBe('2024-02')
  })
})
