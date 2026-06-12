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
