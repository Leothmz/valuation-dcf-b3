import { explainGap } from './data-gaps'

describe('explainGap', () => {
  it('Lynch sem crescimento positivo não tem preço', () => {
    expect(explainGap({ crescimentoLucros: null }, 'lynchFairPrice')).toMatch(/crescimento/i)
    expect(explainGap({ crescimentoLucros: -0.1 }, 'lynchFairPrice')).toMatch(/crescimento/i)
  })

  it('Bazin sem DPA não tem preço', () => {
    expect(explainGap({ dpa: null }, 'bazinFairPrice')).toMatch(/dividendo/i)
  })

  it('Graham exige LPA e VPA positivos', () => {
    expect(explainGap({ lpa: -1, vpa: 10 }, 'grahamFairPrice')).toMatch(/LPA/)
    expect(explainGap({ lpa: 10, vpa: null }, 'grahamFairPrice')).toMatch(/VPA/)
  })

  it('Joel nunca tem preço, e isso é por construção', () => {
    expect(explainGap({}, 'joelFairPrice')).toMatch(/não calcula preço/i)
  })

  it('campo preenchido não gera explicação', () => {
    expect(explainGap({ dpa: 3 }, 'bazinFairPrice')).toBeNull()
    expect(explainGap({ lpa: 10, vpa: 30 }, 'grahamFairPrice')).toBeNull()
    expect(explainGap({ crescimentoLucros: 0.2 }, 'lynchFairPrice')).toBeNull()
  })

  it('teto salvo ausente diz o que fazer, não o que falta', () => {
    expect(explainGap({}, 'savedFairPrice')).toMatch(/calculadora|DCF/i)
  })

  it('PEG sem crescimento cai na mesma causa do preço do Lynch', () => {
    expect(explainGap({ crescimentoLucros: null }, 'lynchVal')).toMatch(/crescimento/i)
  })
})
