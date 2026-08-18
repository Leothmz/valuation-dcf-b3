import { explainMethod, METHOD_EXPLAINERS } from './method-explainer'
import type { RankingMethod } from '../stores/rankingStore'

const METHODS: RankingMethod[] = ['thomaz', 'bazin', 'graham', 'lynch', 'joel']

describe('explainMethod', () => {
  it.each(METHODS)('%s tem os quatro campos preenchidos', (m) => {
    const e = explainMethod(m)
    expect(e.title.length).toBeGreaterThan(0)
    expect(e.privileges.length).toBeGreaterThan(0)
    expect(e.formula.length).toBeGreaterThan(0)
    expect(e.blindSpot.length).toBeGreaterThan(0)
  })

  it('cobre exatamente os cinco métodos do ranking', () => {
    expect(Object.keys(METHOD_EXPLAINERS).sort()).toEqual([...METHODS].sort())
  })

  it('descreve o Joel como ranqueador, não avaliador de preço', () => {
    expect(explainMethod('joel').blindSpot).toMatch(/não calcula preço/i)
  })

  it('a fórmula do Bazin cita a taxa de 6%', () => {
    expect(explainMethod('bazin').formula).toContain('6%')
  })

  it('a fórmula do Graham cita o multiplicador 22,5', () => {
    expect(explainMethod('graham').formula).toContain('22,5')
  })

  it('o Thomaz é descrito como comparativo, não absoluto', () => {
    expect(explainMethod('thomaz').blindSpot).toMatch(/comparativ|relativ/i)
  })
})
