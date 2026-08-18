import { buildDCFWarnings } from './dcf-warnings'
import type { DCFResult } from './dcf-engine'

/** Só os campos que os avisos leem; o resto do DCFResult é irrelevante aqui. */
function result(pvTV: number, ev: number): DCFResult {
  return { pvTV, ev } as DCFResult
}

describe('buildDCFWarnings', () => {
  it('avisa quando o payout passa de 100%', () => {
    const ws = buildDCFWarnings({ payout: 1.2589, g: 0.05 }, result(10, 100))
    expect(ws.map((w) => w.id)).toEqual(['payout'])
    expect(ws[0].text).toContain('125,9%')
  })

  it('avisa quando o crescimento estimado é negativo', () => {
    const ws = buildDCFWarnings({ payout: 0.4, g: -0.0784 }, result(10, 100))
    expect(ws.map((w) => w.id)).toEqual(['growth'])
  })

  it('avisa quando a perpetuidade passa de 50% do valor da empresa', () => {
    const ws = buildDCFWarnings({ payout: 0.4, g: 0.09 }, result(57, 100))
    expect(ws.map((w) => w.id)).toEqual(['terminal'])
    expect(ws[0].text).toContain('57%')
  })

  it('não avisa quando a perpetuidade fica em exatamente 50%', () => {
    expect(buildDCFWarnings({ payout: 0.4, g: 0.09 }, result(50, 100))).toEqual([])
  })

  it('acumula os três avisos na ordem causa → efeito → composição', () => {
    const ws = buildDCFWarnings({ payout: 1.2589, g: -0.0784 }, result(80, 100))
    expect(ws.map((w) => w.id)).toEqual(['payout', 'growth', 'terminal'])
  })

  it('não avisa nada num cenário saudável', () => {
    expect(buildDCFWarnings({ payout: 0.4, g: 0.09 }, result(40, 100))).toEqual([])
  })

  it('não quebra sem resultado nem premissas', () => {
    expect(buildDCFWarnings({ payout: null, g: null }, null)).toEqual([])
    expect(buildDCFWarnings({}, null)).toEqual([])
  })

  it('ignora a checagem de perpetuidade quando o valor da empresa é zero', () => {
    expect(buildDCFWarnings({ payout: 0.4, g: 0.09 }, result(10, 0))).toEqual([])
  })
})
