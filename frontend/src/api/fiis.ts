import { useQuery } from '@tanstack/react-query'

export interface FIIData {
  ticker: string
  name?: string
  price?: number | null
  changePercent?: number | null
  dy?: number | null
  pvp?: number | null
  dpa?: number | null
  marketCap?: number | null
  liquidez?: number | null
  fiftyTwoWeekHigh?: number | null
  fiftyTwoWeekLow?: number | null
  ffoYield?: number | null
  vacancia?: number | null
  numImoveis?: number | null
  segmento?: string | null
  dividends: Array<{ date: string; amount: number }>
  code?: string
}

export function useFIIData(ticker: string | null) {
  return useQuery({
    queryKey: ['fii', ticker],
    queryFn: async () => {
      const res = await fetch(`/api/fii/${ticker}`)
      if (!res.ok) throw new Error('NOT_FOUND')
      const data = await res.json() as FIIData
      if (data.code === 'NOT_FOUND' || data.code === 'NO_YFINANCE') throw new Error(data.code)
      if (!data.price) throw new Error('NOT_FOUND')
      return data
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBatchFIIs(tickers: string[]) {
  const sortedKey = [...tickers].sort().join(',')
  return useQuery({
    queryKey: ['batch-fiis', sortedKey],
    queryFn: async (): Promise<FIIData[]> => {
      if (!tickers.length) return []
      const res = await fetch(`/api/batch-fii?tickers=${tickers.join(',')}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const dict = await res.json() as Record<string, FIIData>
      return tickers
        .map((t) => dict[t])
        .filter((d): d is FIIData => !!d && !d.code && !!d.price)
    },
    enabled: tickers.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
