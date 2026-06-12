import { fBRL, fPct, fShort, fInputLL, fInputPct } from './formatters'

describe('fBRL', () => {
  it('formats positive value with pt-BR currency', () => {
    const result = fBRL.format(1234.56)
    expect(result).toContain('1.234')
  })

  it('formats zero', () => {
    const result = fBRL.format(0)
    expect(result).toContain('0')
  })
})

describe('fShort', () => {
  it('formats a number as BRL currency', () => {
    const result = fShort(1234.56)
    expect(result).toContain('1.234')
  })
})

describe('fPct', () => {
  it('formats 0.15 as ~15%', () => {
    const result = fPct(0.15)
    expect(result).toContain('15')
    expect(result).toContain('%')
  })

  it('formats 0 as 0%', () => {
    const result = fPct(0)
    expect(result).toContain('0')
    expect(result).toContain('%')
  })

  it('respects decimal places param', () => {
    const result = fPct(0.1, 0)
    expect(result).toBe('10%')
  })
})

describe('fInputLL', () => {
  it('returns empty string for null', () => {
    expect(fInputLL(null)).toBe('')
  })

  it('formats number without decimal fraction', () => {
    const result = fInputLL(1000000)
    // pt-BR uses '.' as thousands separator — result is '1.000.000'
    expect(result).toContain('1.000.000')
  })
})

describe('fInputPct', () => {
  it('returns empty string for null', () => {
    expect(fInputPct(null)).toBe('')
  })

  it('converts 0.15 to ~15', () => {
    const result = fInputPct(0.15)
    expect(result).toContain('15')
  })
})
