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
