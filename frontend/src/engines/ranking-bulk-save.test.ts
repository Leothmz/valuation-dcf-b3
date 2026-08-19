import { buildBulkWatchlistEntries } from './ranking-bulk-save'

const rows = [
  { ticker: 'VULC3', name: 'Vulcabras', price: 13.47, bazinFairPrice: 75, grahamFairPrice: 23, lynchFairPrice: 40 },
  { ticker: 'BBSE3', name: 'BB Seguridade', price: 37.2, bazinFairPrice: 76.5, grahamFairPrice: 24.43 },
  { ticker: 'SEMPR3', name: 'Sem Preço', price: 10, bazinFairPrice: null, grahamFairPrice: null },
] as never[]

describe('buildBulkWatchlistEntries', () => {
  it('grava a mediana da faixa como preço teto', () => {
    const { entries } = buildBulkWatchlistEntries(rows, ['VULC3'])
    expect(entries[0].fairPrice).toBe(40)
  })

  it('marca a origem como faixa, não como um método específico', () => {
    const { entries } = buildBulkWatchlistEntries(rows, ['VULC3'])
    expect(entries[0].dcfMethod).toBe('faixa')
  })

  it('salva só os selecionados', () => {
    const { entries } = buildBulkWatchlistEntries(rows, ['BBSE3'])
    expect(entries.map((e) => e.ticker)).toEqual(['BBSE3'])
  })

  it('pula quem não tem preço nenhum e diz quantos foram pulados', () => {
    const { entries, skipped } = buildBulkWatchlistEntries(rows, ['VULC3', 'SEMPR3'])
    expect(entries.map((e) => e.ticker)).toEqual(['VULC3'])
    expect(skipped).toEqual(['SEMPR3'])
  })

  it('a entrada é completa o bastante para a watchlist renderizar', () => {
    const { entries } = buildBulkWatchlistEntries(rows, ['VULC3'])
    const e = entries[0]
    expect(e.name).toBe('Vulcabras')
    expect(e.projYears).toBeGreaterThan(0)
    expect(Array.isArray(e.history)).toBe(true)
    expect(typeof e.savedAt).toBe('string')
  })

  it('seleção vazia não produz entrada', () => {
    expect(buildBulkWatchlistEntries(rows, []).entries).toHaveLength(0)
  })
})
