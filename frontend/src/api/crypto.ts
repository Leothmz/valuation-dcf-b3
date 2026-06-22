import { useQuery } from '@tanstack/react-query'
import type { LiveQuote } from './stocks'

export interface CryptoListEntry {
  id: string
  symbol: string
  name: string
}

// Batch live quotes for CoinGecko coin ids — shaped like LiveQuote so callers can
// merge crypto + stock quotes into a single array/map.
export function useBatchCryptoQuotes(coinIds: string[]) {
  const sortedKey = [...coinIds].sort().join(',')
  return useQuery({
    queryKey: ['batch-crypto-quotes', sortedKey],
    queryFn: async (): Promise<LiveQuote[]> => {
      if (!coinIds.length) return []
      const res = await fetch(`/api/crypto/quotes?ids=${coinIds.join(',')}`)
      if (!res.ok) throw new Error('FETCH_ERROR')
      const dict = await res.json() as Record<string, { price: number; change24h: number }>
      return coinIds.map((id) => {
        const q = dict[id]
        return q
          ? { ticker: id, price: q.price, changePercent: q.change24h, dividendYield: null, error: false }
          : { ticker: id, price: null, changePercent: null, dividendYield: null, error: true }
      })
    },
    enabled: coinIds.length > 0,
    staleTime: 3 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  })
}

export function useCryptoList() {
  return useQuery({
    queryKey: ['crypto-list'],
    queryFn: async (): Promise<CryptoListEntry[]> => {
      const res = await fetch('/api/crypto/list')
      if (!res.ok) throw new Error('FETCH_ERROR')
      return res.json() as Promise<CryptoListEntry[]>
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
