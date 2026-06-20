import { describe, it, expect, beforeEach } from 'vitest'
import { useDCFStore } from './dcfStore'

beforeEach(() => {
  useDCFStore.getState().reset()
})

describe('scenarios', () => {
  it('starts with scenarios disabled', () => {
    const { scenarios } = useDCFStore.getState()
    expect(scenarios.enabled).toBe(false)
    expect(scenarios.bear).toBeNull()
    expect(scenarios.base).toBeNull()
    expect(scenarios.bull).toBeNull()
  })

  it('toggleScenarios enables and pre-fills from currentG', () => {
    const { toggleScenarios } = useDCFStore.getState()
    toggleScenarios(0.10)
    const { scenarios } = useDCFStore.getState()
    expect(scenarios.enabled).toBe(true)
    expect(scenarios.base).toBeCloseTo(0.10, 5)
    expect(scenarios.bear).toBeCloseTo(0.07, 5)
    expect(scenarios.bull).toBeCloseTo(0.13, 5)
  })

  it('toggleScenarios disables and clears when already enabled', () => {
    const { toggleScenarios } = useDCFStore.getState()
    toggleScenarios(0.10)
    toggleScenarios(0.10)
    const { scenarios } = useDCFStore.getState()
    expect(scenarios.enabled).toBe(false)
    expect(scenarios.bear).toBeNull()
  })

  it('setScenario updates individual key', () => {
    const { toggleScenarios, setScenario } = useDCFStore.getState()
    toggleScenarios(0.10)
    setScenario('bear', 0.05)
    expect(useDCFStore.getState().scenarios.bear).toBeCloseTo(0.05, 5)
  })

  it('setTicker resets scenarios', () => {
    const { toggleScenarios, setTicker } = useDCFStore.getState()
    toggleScenarios(0.10)
    setTicker('WEGE3', 'Weg S.A.', {})
    expect(useDCFStore.getState().scenarios.enabled).toBe(false)
  })
})
