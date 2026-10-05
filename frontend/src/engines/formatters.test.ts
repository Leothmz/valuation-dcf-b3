import { fBRL, fPct, fShort, fInputLL, fInputPct, fPctSigned } from './formatters'

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
  it('abrevia a partir de mil — antes era um alias de fBRL.format e não abreviava nada', () => {
    expect(fShort(1234.56)).toBe('R$ 1,2 mil')
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

describe('fPctSigned', () => {
  it('prefixa "+" em valor positivo', () => {
    expect(fPctSigned(0.263, 1)).toBe('+26,3%')
  })

  it('mantém o sinal negativo visível', () => {
    expect(fPctSigned(-0.041, 1)).toBe('-4,1%')
  })

  it('trata zero como positivo', () => {
    expect(fPctSigned(0, 1)).toBe('+0,0%')
  })

  it('usa 2 casas por padrão', () => {
    expect(fPctSigned(0.1425)).toBe('+14,25%')
  })
})

describe('fShort — abreviação de verdade', () => {
  // Intl usa espaço não-quebrável antes do número; normalizar mantém o teste legível.
  const norm = (s: string) => s.replace(/ /g, ' ')

  it('abrevia bilhões com uma casa decimal', () => {
    expect(fShort(690_769_356_620.44)).toBe('R$ 690,8 bi')
    expect(fShort(1_778_452_568.85)).toBe('R$ 1,8 bi')
  })

  it('abrevia milhões e milhares', () => {
    expect(fShort(583_800_000)).toBe('R$ 583,8 mi')
    expect(fShort(12_500)).toBe('R$ 12,5 mil')
  })

  it('mantém valores abaixo de mil por extenso, com centavos', () => {
    expect(norm(fShort(942.7))).toBe('R$ 942,70')
  })

  it('preserva o sinal negativo', () => {
    expect(fShort(-2_400_000)).toBe('-R$ 2,4 mi')
  })

  it('trata o zero sem abreviar', () => {
    expect(norm(fShort(0))).toBe('R$ 0,00')
  })
})
