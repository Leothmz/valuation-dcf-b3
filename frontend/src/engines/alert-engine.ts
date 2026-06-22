export interface AlertEvent {
  firedAt: string  // ISO string
  price: number
  fairPrice: number
}

// Price alert fires when the current quote enters the "buy range" — at or below fair price.
export function isPriceInBuyRange(currentPrice: number | null | undefined, fairPrice: number): boolean {
  return currentPrice != null && currentPrice <= fairPrice
}

// Avoid spamming history with one entry per refresh — at most one fired event per calendar day.
export function shouldRecordAlert(history: AlertEvent[], firedAt: string): boolean {
  const day = firedAt.slice(0, 10)
  return !history.some((h) => h.firedAt.slice(0, 10) === day)
}
