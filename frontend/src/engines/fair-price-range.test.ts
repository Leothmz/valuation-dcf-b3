import { buildFairPriceRange, PRICE_METHODS } from './fair-price-range'

describe('buildFairPriceRange', () => {
  it('reúne só os métodos que produzem preço', () => {
    const r = buildFairPriceRange(
      { bazinFairPrice: 75, grahamFairPrice: 23, lynchFairPrice: 40, savedFairPrice: null },
      13.47
    )!
    expect(r.entries.map((e) => e.method)).toEqual(['Graham', 'Lynch', 'Bazin'])
    expect(r.available).toBe(3)
    expect(r.total).toBe(4)
  })

  it('ordena a faixa por preço e usa mediana como âncora', () => {
    const r = buildFairPriceRange(
      { bazinFairPrice: 75, grahamFairPrice: 23, lynchFairPrice: 40, savedFairPrice: null },
      13.47
    )!
    expect(r.min).toBe(23)
    expect(r.median).toBe(40)
    expect(r.max).toBe(75)
  })

  it('com dois preços, a mediana é a média deles', () => {
    const r = buildFairPriceRange({ bazinFairPrice: 20, grahamFairPrice: 40 }, 10)!
    expect(r.median).toBe(30)
  })

  it('posiciona a cotação em relação à faixa', () => {
    const base = { bazinFairPrice: 20, grahamFairPrice: 40 }
    expect(buildFairPriceRange(base, 10)!.position).toBe('below')
    expect(buildFairPriceRange(base, 30)!.position).toBe('inside')
    expect(buildFairPriceRange(base, 50)!.position).toBe('above')
  })

  it('inclui o teto salvo na DCF quando existir', () => {
    const r = buildFairPriceRange({ bazinFairPrice: 20, savedFairPrice: 60 }, 10)!
    expect(r.entries.map((e) => e.method)).toEqual(['Bazin', 'Teto salvo'])
    expect(r.max).toBe(60)
  })

  it('ignora preço não positivo e nulo', () => {
    const r = buildFairPriceRange({ bazinFairPrice: 0, grahamFairPrice: -5, lynchFairPrice: 30 }, 10)!
    expect(r.available).toBe(1)
    expect(r.min).toBe(30)
    expect(r.max).toBe(30)
  })

  it('devolve null quando nenhum método produz preço', () => {
    expect(buildFairPriceRange({}, 10)).toBeNull()
  })

  it('sem cotação, a posição fica indefinida em vez de mentir', () => {
    expect(buildFairPriceRange({ bazinFairPrice: 20, grahamFairPrice: 40 }, null)!.position).toBeNull()
  })

  it('PRICE_METHODS não inclui Joel — ele não produz preço por construção', () => {
    expect(PRICE_METHODS).not.toContain('Joel')
    expect(PRICE_METHODS).toHaveLength(4)
  })
})
