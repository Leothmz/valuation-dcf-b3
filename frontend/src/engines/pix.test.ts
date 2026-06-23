import { describe, it, expect } from 'vitest'
import { crc16, buildPixPayload } from './pix'

describe('crc16', () => {
  it('matches the CRC-16/CCITT-FALSE standard check value for "123456789"', () => {
    // Canonical check value for this exact variant (poly 0x1021, init 0xFFFF, no reflect, no xorout)
    expect(crc16('123456789')).toBe('29B1')
  })

  it('produces a 4-character uppercase hex string', () => {
    expect(crc16('anything')).toMatch(/^[0-9A-F]{4}$/)
  })
})

describe('buildPixPayload', () => {
  const base = { key: '67572db5-ac2a-4a56-9659-7733b1fcfcc7', name: 'VALUATION DCF B3', city: 'RIO DE JANEIRO' }

  it('starts with the payload format indicator', () => {
    expect(buildPixPayload(base).startsWith('000201')).toBe(true)
  })

  it('embeds the pix key and the bcb GUI', () => {
    const payload = buildPixPayload(base)
    expect(payload).toContain('br.gov.bcb.pix')
    expect(payload).toContain(base.key)
  })

  it('embeds merchant name and city', () => {
    const payload = buildPixPayload(base)
    expect(payload).toContain('VALUATION DCF B3')
    expect(payload).toContain('RIO DE JANEIRO')
  })

  it('ends with a 4-character CRC matching an independent recomputation', () => {
    const payload = buildPixPayload(base)
    const withoutCRC = payload.slice(0, -4)
    expect(payload.slice(-4)).toBe(crc16(withoutCRC))
  })

  it('truncates merchant name beyond 25 chars and city beyond 15 chars', () => {
    const payload = buildPixPayload({
      ...base,
      name: 'A'.repeat(40),
      city: 'B'.repeat(40),
    })
    expect(payload).toContain(`59${'25'}${'A'.repeat(25)}`)
    expect(payload).toContain(`60${'15'}${'B'.repeat(15)}`)
  })

  it('defaults the reference label to "***" when txid is omitted', () => {
    expect(buildPixPayload(base)).toContain('0503***')
  })

  it('produces a different CRC when the key changes (sanity check it is content-derived)', () => {
    const a = buildPixPayload(base)
    const b = buildPixPayload({ ...base, key: 'a-different-key' })
    expect(a.slice(-4)).not.toBe(b.slice(-4))
  })
})
