import { contrastRatio, relativeLuminance } from './contrast'

describe('relativeLuminance', () => {
  it('vale 0 para preto e 1 para branco', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })

  it('aceita hex de 3 dígitos', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(relativeLuminance('#ffffff'), 5)
  })
})

describe('contrastRatio', () => {
  it('bate o valor canônico de branco sobre preto', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
  })

  it('é simétrico na ordem dos argumentos', () => {
    expect(contrastRatio('#7c8aa3', '#111827')).toBeCloseTo(contrastRatio('#111827', '#7c8aa3'), 5)
  })

  it('o text-muted antigo (#4a5568) reprova AA sobre bg-2', () => {
    expect(contrastRatio('#4a5568', '#111827')).toBeLessThan(4.5)
  })

  it('o text-muted novo passa AA (4,5:1) sobre bg-1 e bg-2', () => {
    expect(contrastRatio('#7c8aa3', '#111827')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#7c8aa3', '#0b0f17')).toBeGreaterThanOrEqual(4.5)
  })

  it('o text-sec (#94a3b8) continua passando AA sobre bg-2', () => {
    expect(contrastRatio('#94a3b8', '#111827')).toBeGreaterThanOrEqual(4.5)
  })
})
