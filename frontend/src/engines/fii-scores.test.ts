import { calcThomazFIIScore, classifyPerfil } from './fii-scores'

describe('calcThomazFIIScore', () => {
  it('soma o rank de DY com o rank de P/VP e ordena pelo menor score', () => {
    const result = calcThomazFIIScore([
      { ticker: 'AAA11', dy: 0.14, pvp: 1.20 }, // rankDY 1 + rankPVP 3 = 4
      { ticker: 'BBB11', dy: 0.12, pvp: 0.90 }, // rankDY 2 + rankPVP 1 = 3
      { ticker: 'CCC11', dy: 0.08, pvp: 1.00 }, // rankDY 3 + rankPVP 2 = 5
    ])

    expect(result.map((f) => f.ticker)).toEqual(['BBB11', 'AAA11', 'CCC11'])
    expect(result[0]._scoreThomazFII).toBe(3)
    expect(result[0]._rankDY).toBe(2)
    expect(result[0]._rankPVP).toBe(1)
  })

  it('joga tickers sem dado para o fim do ranking', () => {
    const result = calcThomazFIIScore([
      { ticker: 'AAA11', dy: 0.14, pvp: 1.20 },
      { ticker: 'ZZZ11', dy: null, pvp: null },
    ])
    expect(result[result.length - 1].ticker).toBe('ZZZ11')
  })

  it('devolve lista vazia para entrada vazia', () => {
    expect(calcThomazFIIScore([])).toEqual([])
  })
})

describe('classifyPerfil', () => {
  it('classifica pelo P/VP', () => {
    expect(classifyPerfil(0.75)).toBe('risco')
    expect(classifyPerfil(0.90)).toBe('crescimento')
    expect(classifyPerfil(1.10)).toBe('ancoragem')
    expect(classifyPerfil(null)).toBeNull()
  })
})
