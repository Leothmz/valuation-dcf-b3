import { describe, it, expect } from 'vitest'
import { isPriceInBuyRange, shouldRecordAlert } from './alert-engine'
import type { AlertEvent } from './alert-engine'

describe('isPriceInBuyRange', () => {
  it('returns true when price is below fair price', () => {
    expect(isPriceInBuyRange(30, 40)).toBe(true)
  })

  it('returns true when price equals fair price', () => {
    expect(isPriceInBuyRange(40, 40)).toBe(true)
  })

  it('returns false when price is above fair price', () => {
    expect(isPriceInBuyRange(50, 40)).toBe(false)
  })

  it('returns false when price is null or undefined', () => {
    expect(isPriceInBuyRange(null, 40)).toBe(false)
    expect(isPriceInBuyRange(undefined, 40)).toBe(false)
  })
})

describe('shouldRecordAlert', () => {
  it('returns true when history is empty', () => {
    expect(shouldRecordAlert([], '2026-06-22T10:00:00.000Z')).toBe(true)
  })

  it('returns false when an event already fired the same day', () => {
    const history: AlertEvent[] = [{ firedAt: '2026-06-22T08:00:00.000Z', price: 30, fairPrice: 40 }]
    expect(shouldRecordAlert(history, '2026-06-22T18:00:00.000Z')).toBe(false)
  })

  it('returns true when the last event fired on a different day', () => {
    const history: AlertEvent[] = [{ firedAt: '2026-06-21T08:00:00.000Z', price: 30, fairPrice: 40 }]
    expect(shouldRecordAlert(history, '2026-06-22T08:00:00.000Z')).toBe(true)
  })
})
