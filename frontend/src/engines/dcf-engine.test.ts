import { runDCF, growthRate } from './dcf-engine'
import type { DCFResult } from './dcf-engine'

describe('growthRate', () => {
  it('calculates g = (1 - payout) * roe', () => {
    expect(growthRate(0.4, 0.20)).toBeCloseTo(0.12)
  })

  it('returns 0 when payout is 1', () => {
    expect(growthRate(1.0, 0.20)).toBeCloseTo(0)
  })
})

describe('runDCF', () => {
  const assumptions = {
    ll: 1_000_000,
    g: 0.12,       // (1 - 0.4) * 0.20
    disc: 0.15,
    perp: 0.03,
    shares: 100_000,
    price: 50,
  }

  const history = [{ year: 2024, value: 1_000_000 }]
  const projYears = 5
  const yearOverrides = {}

  it('returns a DCFResult (not null or gordon error)', () => {
    const result = runDCF(assumptions, history, projYears, yearOverrides)
    expect(result).not.toBeNull()
    expect(result).not.toHaveProperty('error')
  })

  it('returns a positive fair price', () => {
    const result = runDCF(assumptions, history, projYears, yearOverrides) as DCFResult
    expect(result.fairPrice).toBeGreaterThan(0)
  })

  it('calculates upside correctly', () => {
    const result = runDCF(assumptions, history, projYears, yearOverrides) as DCFResult
    const expectedUpside = (result.fairPrice - assumptions.price) / result.fairPrice
    expect(result.upside).toBeCloseTo(expectedUpside, 4)
  })

  it('produces correct number of projected flows', () => {
    const result = runDCF(assumptions, history, projYears, yearOverrides) as DCFResult
    expect(result.flows.length).toBe(5)
  })

  it('returns gordon error when perp >= disc', () => {
    const badAssumptions = { ...assumptions, perp: 0.15 }
    const result = runDCF(badAssumptions, history, projYears, yearOverrides)
    expect(result).toEqual({ error: 'gordon' })
  })

  it('returns null when ll is 0', () => {
    const result = runDCF({ ...assumptions, ll: 0 }, history, projYears, yearOverrides)
    expect(result).toBeNull()
  })

  it('returns null upside when price is not provided', () => {
    const noPrice = { ...assumptions, price: undefined }
    const result = runDCF(noPrice, history, projYears, yearOverrides) as DCFResult
    expect(result.upside).toBeNull()
  })
})
