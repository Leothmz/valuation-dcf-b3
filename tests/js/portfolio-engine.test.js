// tests/js/portfolio-engine.test.js
import { describe, it, expect } from 'vitest'
import { calcPrecoMedio, calcRetornoSimples, calcHoldings } from '../../src/portfolio-engine.js'

describe('calcPrecoMedio', () => {
  it('single buy', () => {
    const ops = [{ type: 'buy', qty: 100, price: 34.20 }]
    expect(calcPrecoMedio(ops)).toBeCloseTo(34.20)
  })
  it('two buys at different prices — weighted average', () => {
    const ops = [
      { type: 'buy', qty: 100, price: 30.00 },
      { type: 'buy', qty: 100, price: 40.00 },
    ]
    expect(calcPrecoMedio(ops)).toBeCloseTo(35.00)
  })
  it('unequal quantities', () => {
    const ops = [
      { type: 'buy', qty: 200, price: 30.00 },
      { type: 'buy', qty: 100, price: 36.00 },
    ]
    // (200×30 + 100×36) / 300 = 9600/300 = 32
    expect(calcPrecoMedio(ops)).toBeCloseTo(32.00)
  })
  it('sell does NOT change precoMedio', () => {
    const ops = [
      { type: 'buy',  qty: 100, price: 30.00 },
      { type: 'sell', qty:  50, price: 50.00 },
    ]
    expect(calcPrecoMedio(ops)).toBeCloseTo(30.00)
  })
  it('returns null for empty array', () => {
    expect(calcPrecoMedio([])).toBeNull()
  })
})

describe('calcRetornoSimples', () => {
  it('positive return 18.7%', () => {
    expect(calcRetornoSimples(34.20, 40.60)).toBeCloseTo(0.187, 2)
  })
  it('negative return −31.2%', () => {
    expect(calcRetornoSimples(12.50, 8.60)).toBeCloseTo(-0.312, 2)
  })
  it('returns null when precoMedio is null', () => {
    expect(calcRetornoSimples(null, 40.60)).toBeNull()
  })
  it('returns null when cotacaoAtual is null', () => {
    expect(calcRetornoSimples(30.00, null)).toBeNull()
  })
})

describe('calcHoldings', () => {
  it('buy only — full qty held', () => {
    const ops = [{ ticker: 'WEGE3', type: 'buy', qty: 100 }]
    expect(calcHoldings(ops)).toEqual({ WEGE3: 100 })
  })
  it('buy then partial sell', () => {
    const ops = [
      { ticker: 'WEGE3', type: 'buy',  qty: 100 },
      { ticker: 'WEGE3', type: 'sell', qty:  40 },
    ]
    expect(calcHoldings(ops)).toEqual({ WEGE3: 60 })
  })
  it('fully sold position is excluded', () => {
    const ops = [
      { ticker: 'WEGE3', type: 'buy',  qty: 100 },
      { ticker: 'WEGE3', type: 'sell', qty: 100 },
    ]
    expect(calcHoldings(ops)).toEqual({})
  })
  it('multiple tickers', () => {
    const ops = [
      { ticker: 'WEGE3',  type: 'buy', qty: 100 },
      { ticker: 'XPLG11', type: 'buy', qty:  50 },
    ]
    const h = calcHoldings(ops)
    expect(h.WEGE3).toBe(100)
    expect(h.XPLG11).toBe(50)
  })
})

import { calcTWRR, buildTWRRSubPeriods, projectDeposit, aggregateTitle } from '../../src/portfolio-engine.js'

describe('calcTWRR', () => {
  it('single period +10%', () => {
    expect(calcTWRR([{ startValue: 1000, endValue: 1100 }])).toBeCloseTo(0.10, 4)
  })
  it('two periods compound', () => {
    const periods = [
      { startValue: 1000, endValue: 1100 },
      { startValue: 1100, endValue: 1210 },
    ]
    expect(calcTWRR(periods)).toBeCloseTo(0.21, 4)
  })
  it('one period −10%', () => {
    expect(calcTWRR([{ startValue: 1000, endValue: 900 }])).toBeCloseTo(-0.10, 4)
  })
  it('returns null for empty array', () => {
    expect(calcTWRR([])).toBeNull()
  })
  it('skips periods where startValue is zero', () => {
    const periods = [
      { startValue: 0,    endValue: 1000 },
      { startValue: 1000, endValue: 1100 },
    ]
    expect(calcTWRR(periods)).toBeCloseTo(0.10, 4)
  })
  it('returns null when all periods have startValue <= 0', () => {
    const periods = [
      { startValue: 0,    endValue: 1000 },
      { startValue: -100, endValue: 500 },
    ]
    expect(calcTWRR(periods)).toBeNull()
  })
})

describe('buildTWRRSubPeriods', () => {
  it('single operation — one sub-period', () => {
    const ops = [{ ticker: 'WEGE3', type: 'buy', qty: 100, date: '2024-01-15' }]
    const hist = { WEGE3: { '2024-01-15': 34.20 } }
    const curr = { WEGE3: 40.60 }
    const periods = buildTWRRSubPeriods(ops, hist, curr)
    expect(periods).toHaveLength(1)
    expect(periods[0].startValue).toBeCloseTo(3420)
    expect(periods[0].endValue).toBeCloseTo(4060)
  })
  it('returns empty for no operations', () => {
    expect(buildTWRRSubPeriods([], {}, {})).toEqual([])
  })
})

describe('projectDeposit', () => {
  it('cdi_pct: 10k at 110% CDI with 10.5% accumulated → 11,155', () => {
    const result = projectDeposit({
      amount: 10000, rateType: 'cdi_pct', baseRate: 110, cdiAccumulated: 0.105, daysElapsed: 365
    })
    expect(result).toBeCloseTo(10000 * (1 + 1.10 * 0.105), 0)
  })
  it('prefixado: 10k at 12% for 365 days → 11,200', () => {
    const result = projectDeposit({
      amount: 10000, rateType: 'prefixado', baseRate: 12, cdiAccumulated: 0, daysElapsed: 365
    })
    expect(result).toBeCloseTo(11200, 0)
  })
  it('ipca_plus: 10k at IPCA+6% with 5% IPCA + 6% spread → greater than 10,500', () => {
    const result = projectDeposit({
      amount: 10000, rateType: 'ipca_plus', baseRate: 6, ipcaAccumulated: 0.05, daysElapsed: 365
    })
    expect(result).toBeGreaterThan(10500)
  })
  it('manual: returns manualCurrentValue directly', () => {
    const result = projectDeposit({
      amount: 10000, rateType: 'manual', baseRate: 0, manualCurrentValue: 10750, daysElapsed: 200
    })
    expect(result).toBe(10750)
  })
  it('returns amount when daysElapsed is 0', () => {
    const result = projectDeposit({
      amount: 5000, rateType: 'cdi_pct', baseRate: 100, cdiAccumulated: 0, daysElapsed: 0
    })
    expect(result).toBeCloseTo(5000)
  })
})

describe('aggregateTitle', () => {
  it('sums projected values across deposits', () => {
    const title = {
      rateType: 'cdi_pct', baseRate: 110,
      deposits: [
        { id: 'd1', amount: 10000, date: '2024-01-01', rateOverride: null },
        { id: 'd2', amount: 5000,  date: '2024-01-01', rateOverride: null },
      ]
    }
    const result = aggregateTitle(title, { cdiAccumulated: 0 }, '2024-01-01')
    expect(result.totalInvested).toBeCloseTo(15000)
    expect(result.totalProjected).toBeCloseTo(15000)
  })
})
