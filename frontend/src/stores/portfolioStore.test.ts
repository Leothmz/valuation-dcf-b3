import { describe, it, expect, beforeEach } from 'vitest'
import { usePortfolioStore, CATEGORIES } from './portfolioStore'

const ZERO_TARGETS = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
  (typeof CATEGORIES)[number],
  number
>

beforeEach(() => {
  usePortfolioStore.setState({ cashBalance: 0, allocationTargets: { ...ZERO_TARGETS } })
})

describe('cashBalance', () => {
  it('starts at 0', () => {
    expect(usePortfolioStore.getState().cashBalance).toBe(0)
  })

  it('setCashBalance updates the value', () => {
    usePortfolioStore.getState().setCashBalance(1500)
    expect(usePortfolioStore.getState().cashBalance).toBe(1500)
  })
})

describe('allocationTargets', () => {
  it('starts with every category at 0', () => {
    const targets = usePortfolioStore.getState().allocationTargets
    for (const category of CATEGORIES) {
      expect(targets[category]).toBe(0)
    }
  })

  it('setAllocationTarget updates only the given category', () => {
    usePortfolioStore.getState().setAllocationTarget('fiis', 25)
    const targets = usePortfolioStore.getState().allocationTargets
    expect(targets.fiis).toBe(25)
    expect(targets.acoes_br).toBe(0)
  })

  it('setAllocationTarget overwrites a previous value for the same category', () => {
    usePortfolioStore.getState().setAllocationTarget('caixa', 10)
    usePortfolioStore.getState().setAllocationTarget('caixa', 15)
    expect(usePortfolioStore.getState().allocationTargets.caixa).toBe(15)
  })
})

describe('CATEGORIES', () => {
  it('has exactly the six expected keys in order', () => {
    expect(CATEGORIES).toEqual([
      'acoes_br',
      'fiis',
      'renda_fixa',
      'internacional',
      'criptoativos',
      'caixa',
    ])
  })
})
