import { useQuery } from '@tanstack/react-query'
import type { ApiDividendEntry, PortfolioHistoryResponse } from '../engines/portfolio-engine'

export interface FundamentalsData {
  ticker: string
  name?: string
  price?: number
  changePercent?: number
  pl?: number | null
  pvp?: number | null
  roe?: number | null
  roic?: number | null
  margemLiquida?: number | null
  dividaLiquidaEbit?: number | null
  liquidezMedia?: number | null
  dy?: number | null
  dpa?: number | null
  lpa?: number | null
  vpa?: number | null
  crescimentoLucros?: number | null
  pegRatio?: number | null
  setor?: string
  subsetor?: string
  fiftyTwoWeekHigh?: number | null
  fiftyTwoWeekLow?: number | null
  marketCap?: number | null
  shares?: number | null
}

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

export function useFundamentals(ticker: string | null) {
  return useQuery({
    queryKey: ['fundamentals', ticker],
    queryFn: async () => {
      const res = await fetch(`/api/fundamentals/${ticker}`)
      if (!res.ok) throw new Error('NOT_FOUND')
      const data = await res.json()
      if (data.code === 'NOT_FOUND') throw new Error('NOT_FOUND')
      if (data.code === 'NO_YFINANCE') throw new Error('NO_YFINANCE')
      return data as FundamentalsData
    },
    enabled: !!ticker,
    staleTime: 6 * 60 * 60 * 1000,
  })
}

export function usePortfolioHistory(tickers: string[], dates: string[]) {
  return useQuery({
    queryKey: ['portfolio-history', [...tickers].sort().join(',')],
    queryFn: async (): Promise<PortfolioHistoryResponse> => {
      const res = await fetch('/api/portfolio/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers, dates }),
      })
      if (!res.ok) throw new Error('FETCH_ERROR')
      return res.json()
    },
    enabled: tickers.length > 0 && dates.length > 0,
    staleTime: 60 * 60 * 1000,
  })
}

// Batch fundamentals — returns dict { ticker: FundamentalsData }, normalized to array
export function useBatchFundamentals(tickers: string[]) {
  const sortedKey = [...tickers].sort().join(',')
  return useQuery({
    queryKey: ['batch-fundamentals', sortedKey],
    queryFn: async (): Promise<FundamentalsData[]> => {
      if (!tickers.length) return []
      const res = await fetch(`/api/batch-fundamentals?tickers=${tickers.join(',')}`)
      if (!res.ok) throw new Error('FETCH_ERROR')
      const dict = await res.json() as Record<string, FundamentalsData>
      return Object.values(dict).filter((d) => d && !('code' in d))
    },
    enabled: tickers.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useBatchDividendHistory(tickers: string[]) {
  const sortedKey = [...tickers].sort().join(',')
  return useQuery({
    queryKey: ['batch-dividend-history', sortedKey],
    queryFn: async (): Promise<Record<string, ApiDividendEntry[]>> => {
      if (!tickers.length) return {}
      const results = await Promise.allSettled(
        tickers.map(async (t) => {
          const res = await fetch(`/api/dividends/${encodeURIComponent(t.toUpperCase())}`)
          if (!res.ok) throw new Error('HTTP ' + res.status)
          return (await res.json()) as ApiDividendEntry[]
        })
      )
      const map: Record<string, ApiDividendEntry[]> = {}
      results.forEach((r, i) => {
        map[tickers[i]] = r.status === 'fulfilled' ? r.value : []
      })
      return map
    },
    enabled: tickers.length > 0,
    staleTime: 60 * 60 * 1000,
  })
}

export function useDpaMap(tickers: string[]) {
  const sortedKey = [...tickers].sort().join(',')
  return useQuery({
    queryKey: ['dpa-map', sortedKey],
    queryFn: async (): Promise<Record<string, number | null>> => {
      if (!tickers.length) return {}
      const results = await Promise.allSettled(
        tickers.map(async (t) => {
          const res = await fetch(`/api/fundamentals/${encodeURIComponent(t.toUpperCase())}`)
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const data = await res.json()
          return (data.dpa ?? null) as number | null
        })
      )
      const map: Record<string, number | null> = {}
      results.forEach((r, i) => {
        map[tickers[i]] = r.status === 'fulfilled' ? r.value : null
      })
      return map
    },
    enabled: tickers.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
  })
}
