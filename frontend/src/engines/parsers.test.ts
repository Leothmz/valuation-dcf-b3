import { parsePct, parseLL } from './parsers'

describe('parsePct', () => {
  it('parses plain number as percent', () => {
    expect(parsePct('15')).toBeCloseTo(0.15)
  })

  it('parses comma decimal', () => {
    expect(parsePct('10,5')).toBeCloseTo(0.105)
  })

  it('returns null for empty string', () => {
    expect(parsePct('')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parsePct(null)).toBeNull()
  })

  it('parses comma decimal (pt-BR style)', () => {
    // parsePct strips '.' (pt-BR thousands sep) before parsing, so '10,5' → 0.105
    // '10.5' would be treated as '105' / 100 = 1.05 (dot stripped as thousands sep)
    expect(parsePct('10,5')).toBeCloseTo(0.105)
    expect(parsePct('10.5')).toBeCloseTo(1.05)
  })
})

describe('parseLL', () => {
  it('parses plain number', () => {
    expect(parseLL('1000000')).toBe(1_000_000)
  })

  it('parses M suffix', () => {
    expect(parseLL('367M')).toBe(367_000_000)
  })

  it('parses B suffix', () => {
    // parseLL strips '.' as pt-BR thousands sep, so use comma for decimal
    expect(parseLL('1,5B')).toBe(1_500_000_000)
  })

  it('parses K suffix', () => {
    expect(parseLL('500K')).toBe(500_000)
  })

  it('returns null for empty', () => {
    expect(parseLL('')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parseLL(null)).toBeNull()
  })
})
