import { buildDecayStops, travelDuration } from './light-decay'

describe('buildDecayStops', () => {
  const stops = buildDecayStops(8, 0.14)

  it('cobre de 0% a 100% da largura', () => {
    expect(stops[0].offset).toBe(0)
    expect(stops[stops.length - 1].offset).toBe(100)
  })

  it('começa cheio: no presente não há desconto', () => {
    expect(stops[0].opacity).toBe(1)
  })

  it('mingua monotonicamente rumo ao futuro', () => {
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].opacity).toBeLessThan(stops[i - 1].opacity)
    }
  })

  it('segue a curva do valor presente, não uma reta', () => {
    // Numa reta o ponto do meio seria 0,5. Como 1/(1+r)^t é convexa, ele cai mais rápido.
    const meio = stops[Math.floor(stops.length / 2)]
    expect(meio.opacity).toBeLessThan(0.5)
  })

  it('taxa maior apaga o futuro mais cedo', () => {
    const suave = buildDecayStops(8, 0.05)
    const dura = buildDecayStops(8, 0.30)
    expect(dura[4].opacity).toBeLessThan(suave[4].opacity)
  })

  it('termina em zero — a luz se apaga, não trunca', () => {
    expect(stops[stops.length - 1].opacity).toBe(0)
  })
})

describe('travelDuration', () => {
  it('dá a cada feixe uma duração própria para não andarem em bloco', () => {
    expect(travelDuration(0)).not.toBe(travelDuration(1))
  })

  it('mantém a travessia numa faixa lenta e legível', () => {
    for (let i = 0; i < 4; i++) {
      expect(travelDuration(i)).toBeGreaterThanOrEqual(14)
      expect(travelDuration(i)).toBeLessThanOrEqual(30)
    }
  })
})
