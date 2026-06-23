import { parseTickersParam, MAX_COMPARE_TICKERS } from './index'

describe('parseTickersParam', () => {
  it('returns empty array for null param', () => {
    expect(parseTickersParam(null)).toEqual([])
  })

  it('parses comma-separated tickers uppercased', () => {
    expect(parseTickersParam('petr4,vale3')).toEqual(['PETR4', 'VALE3'])
  })

  it('trims whitespace around tickers', () => {
    expect(parseTickersParam(' petr4 , vale3 ')).toEqual(['PETR4', 'VALE3'])
  })

  it('dedupes repeated tickers', () => {
    expect(parseTickersParam('PETR4,PETR4,VALE3')).toEqual(['PETR4', 'VALE3'])
  })

  it('caps at MAX_COMPARE_TICKERS', () => {
    const result = parseTickersParam('A,B,C,D,E')
    expect(result.length).toBe(MAX_COMPARE_TICKERS)
  })

  it('ignores empty segments', () => {
    expect(parseTickersParam('PETR4,,VALE3')).toEqual(['PETR4', 'VALE3'])
  })
})
