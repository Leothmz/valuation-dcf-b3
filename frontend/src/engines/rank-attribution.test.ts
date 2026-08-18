import { explainRank } from './rank-attribution'

describe('explainRank', () => {
  it('no Bazin, o motor é o DPA', () => {
    const f = explainRank({ dpa: 4.5, price: 30, bazinFairPrice: 75 }, 'bazin')
    expect(f.map((x) => x.label)).toContain('DPA')
  })

  it('no Graham, cita LPA e VPA', () => {
    const f = explainRank({ lpa: 10.4, vpa: 34.5 }, 'graham')
    expect(f.map((x) => x.label)).toEqual(expect.arrayContaining(['LPA', 'VPA']))
  })

  it('no Lynch, o fator é crescimento e PEG', () => {
    const f = explainRank({ crescimentoLucros: 0.22, lynchVal: 0.45 }, 'lynch')
    expect(f.map((x) => x.label)).toEqual(expect.arrayContaining(['PEG', 'Crescimento']))
    expect(f.find((x) => x.label === 'PEG')!.verdict).toBe('forte')
  })

  it('PEG acima de 1,5 é fraco — o método considera caro para o crescimento', () => {
    const f = explainRank({ crescimentoLucros: 0.05, lynchVal: 2.08 }, 'lynch')
    expect(f.find((x) => x.label === 'PEG')!.verdict).toBe('fraco')
  })

  it('no Joel, cita earnings yield e ROIC', () => {
    const f = explainRank({ joelVal: 0.2433, roic: 0.18 }, 'joel')
    expect(f.map((x) => x.label)).toEqual(expect.arrayContaining(['Earnings Yield', 'ROIC']))
  })

  it('no Thomaz, aponta os indicadores que puxaram a linha', () => {
    const f = explainRank({ dy: 0.33, roe: 0.37, pl: 4.4, margemLiquida: 0.24 }, 'thomaz')
    expect(f.length).toBeGreaterThanOrEqual(2)
    expect(f.every((x) => x.value.length > 0)).toBe(true)
  })

  it('dado ausente vira fator neutro em vez de sumir da explicação', () => {
    const f = explainRank({ dpa: null, price: 30 }, 'bazin')
    const dpa = f.find((x) => x.label === 'DPA')!
    expect(dpa.verdict).toBe('neutro')
    expect(dpa.value).toBe('—')
  })

  it('nunca devolve mais de três fatores — a linha explica, não ensina', () => {
    const f = explainRank({ dy: 0.33, roe: 0.37, pl: 4.4, margemLiquida: 0.24, roic: 0.2, dividaLiquidaEbit: 0.5 }, 'thomaz')
    expect(f.length).toBeLessThanOrEqual(3)
  })
})
