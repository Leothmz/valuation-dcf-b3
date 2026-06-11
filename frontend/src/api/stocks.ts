import { useQuery } from '@tanstack/react-query'

export interface StockQuote {
  ticker: string
  name?: string
  price?: number
  changePercent?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  sharesOutstanding?: number
  roe?: number
  payout?: number
  netIncomeHistory: Array<{ year: number; netIncome: number }>
  marketCap?: number
  dividendYield?: number
}

export interface LiveQuote {
  ticker: string
  price: number | null
  changePercent: number | null
  dividendYield: number | null
  error?: boolean
}

export function useStockQuote(ticker: string | null) {
  return useQuery({
    queryKey: ['quote', ticker],
    queryFn: async () => {
      const res = await fetch(`/api/quote/${ticker}`)
      if (!res.ok) throw new Error('NOT_FOUND')
      const data = await res.json()
      if (data.code === 'NOT_FOUND') throw new Error('NOT_FOUND')
      if (data.code === 'NO_YFINANCE') throw new Error('NO_YFINANCE')
      if (!data.price) throw new Error('NOT_FOUND')
      return data as StockQuote
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBatchQuotes(tickers: string[]) {
  const sortedKey = [...tickers].sort().join(',')
  return useQuery({
    queryKey: ['batch-quotes', sortedKey],
    queryFn: async (): Promise<LiveQuote[]> => {
      if (!tickers.length) return []
      const results = await Promise.allSettled(
        tickers.map(async (t) => {
          const res = await fetch(`/api/quote/${encodeURIComponent(t.toUpperCase())}`)
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const data = await res.json()
          if (data.code === 'NOT_FOUND' || data.code === 'NO_YFINANCE') {
            throw new Error(data.code)
          }
          return {
            ticker: t,
            price: data.price ?? null,
            changePercent: data.changePercent ?? null,
            dividendYield: data.dividendYield ?? null,
            error: false,
          } as LiveQuote
        })
      )
      return results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value
        return {
          ticker: tickers[i],
          price: null,
          changePercent: null,
          dividendYield: null,
          error: true,
        } as LiveQuote
      })
    },
    enabled: tickers.length > 0,
    staleTime: 3 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  })
}
