import { presentValueFactor, buildDiscountField } from './discount-field'

describe('presentValueFactor', () => {
  it('o presente vale 1 — nenhum desconto no ano zero', () => {
    expect(presentValueFactor(0, 0.12)).toBe(1)
  })

  it('decai conforme a fórmula do VPL: 1 / (1 + r)^t', () => {
    expect(presentValueFactor(1, 0.1)).toBeCloseTo(1 / 1.1, 6)
    expect(presentValueFactor(5, 0.15)).toBeCloseTo(1 / Math.pow(1.15, 5), 6)
  })

  it('taxa maior desconta mais o mesmo ano', () => {
    expect(presentValueFactor(6, 0.18)).toBeLessThan(presentValueFactor(6, 0.1))
  })
})

describe('buildDiscountField', () => {
  const field = buildDiscountField({ cols: 6, rows: 4, rate: 0.14, width: 1200, height: 600 })

  it('cobre a grade inteira', () => {
    expect(field).toHaveLength(24)
  })

  it('a primeira coluna é a mais forte e o brilho cai monotonicamente', () => {
    const porColuna = [...new Set(field.map((d) => d.col))].map(
      (c) => field.find((d) => d.col === c)!.opacity
    )
    expect(porColuna[0]).toBeGreaterThan(porColuna[porColuna.length - 1])
    for (let i = 1; i < porColuna.length; i++) {
      expect(porColuna[i]).toBeLessThan(porColuna[i - 1])
    }
  })

  it('espalha as colunas uniformemente na largura', () => {
    const xs = [...new Set(field.map((d) => d.x))].sort((a, b) => a - b)
    const passo = xs[1] - xs[0]
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeCloseTo(passo, 6)
    }
  })

  it('mantém um piso de brilho — o futuro distante fica fraco, não invisível', () => {
    const distante = buildDiscountField({ cols: 20, rows: 2, rate: 0.3, width: 100, height: 100 })
    expect(Math.min(...distante.map((d) => d.opacity))).toBeGreaterThan(0)
  })

  it('o raio acompanha o valor presente, com mínimo legível', () => {
    const primeiro = field.find((d) => d.col === 0)!
    const ultimo = field.find((d) => d.col === 5)!
    expect(primeiro.r).toBeGreaterThan(ultimo.r)
    expect(ultimo.r).toBeGreaterThanOrEqual(0.6)
  })

  it('cada ponto carrega o ano que representa — a malha é uma linha do tempo', () => {
    expect(field.filter((d) => d.col === 3).every((d) => d.year === 3)).toBe(true)
  })
})
