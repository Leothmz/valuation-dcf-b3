// Builds a static Pix "BR Code" payload (EMV QRCPS spec) — the string encoded
// into the QR a banking app scans to start a Pix payment with no fixed amount.

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

// CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no final xor.
// This exact variant is what the Pix BR Code spec requires (field "63").
export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixPayloadInput {
  key: string
  name: string  // merchant name shown on the confirmation screen, max 25 chars
  city: string  // merchant city, max 15 chars
  txid?: string // reference label, max 25 chars — "***" means "no fixed reference"
}

export function buildPixPayload({ key, name, city, txid = '***' }: PixPayloadInput): string {
  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('01', key)
  const additionalData = tlv('05', txid)

  const withoutCRC =
    tlv('00', '01') +
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('58', 'BR') +
    tlv('59', name.slice(0, 25)) +
    tlv('60', city.slice(0, 15)) +
    tlv('62', additionalData) +
    '6304'

  return withoutCRC + crc16(withoutCRC)
}
