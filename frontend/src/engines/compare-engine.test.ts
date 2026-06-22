import { describe, it, expect } from 'vitest'
import { bestWorstIndices } from './compare-engine'

describe('bestWorstIndices', () => {
  it('picks highest as best when direction is desc', () => {
    expect(bestWorstIndices([10, 20, 5], 'desc')).toEqual({ best: 1, worst: 2 })
  })

  it('picks lowest as best when direction is asc', () => {
    expect(bestWorstIndices([10, 20, 5], 'asc')).toEqual({ best: 2, worst: 1 })
  })

  it('ignores null/undefined values', () => {
    expect(bestWorstIndices([null, 20, undefined], 'desc')).toEqual({ best: null, worst: null })
  })

  it('returns nulls when fewer than 2 valid values', () => {
    expect(bestWorstIndices([10, null, null], 'desc')).toEqual({ best: null, worst: null })
  })

  it('returns nulls when all values tie', () => {
    expect(bestWorstIndices([10, 10, 10], 'desc')).toEqual({ best: null, worst: null })
  })

  it('handles exactly 2 values', () => {
    expect(bestWorstIndices([5, 15], 'asc')).toEqual({ best: 0, worst: 1 })
  })
})
