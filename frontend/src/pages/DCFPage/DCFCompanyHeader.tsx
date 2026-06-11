import { fBRL } from '../../engines/formatters'
import type { StockQuote } from '../../api/stocks'

interface DCFCompanyHeaderProps {
  data: StockQuote | null
  isLoading: boolean
}

export function DCFCompanyHeader({ data, isLoading }: DCFCompanyHeaderProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-3 border border-border rounded-[14px] p-4 mb-5 min-h-[80px]">
        <div className="skeleton h-3 w-16 mb-2 rounded" />
        <div className="skeleton h-4 w-40 mb-3 rounded" />
        <div className="skeleton h-7 w-24 rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-bg-3 border border-border rounded-[14px] p-4 mb-5 min-h-[80px]
                      flex items-center justify-center text-text-muted text-sm">
        Busque um ticker para começar
      </div>
    )
  }

  const chg = data.changePercent ?? 0
  const isPos = chg >= 0
  const sign = isPos ? '+' : ''

  return (
    <div className="bg-bg-3 border border-border rounded-[14px] p-4 mb-5">
      <div className="text-[12px] text-cyan font-mono font-semibold tracking-[0.05em]">
        {data.ticker}
      </div>
      <div className="text-[15px] font-semibold mt-0.5">
        {data.name || data.ticker}
      </div>
      <div className="flex items-baseline gap-2.5 mt-2.5">
        <div className="text-[28px] font-bold font-mono">
          {fBRL.format(data.price ?? 0)}
        </div>
        <span className={`text-[13px] font-mono px-2 py-0.5 rounded-full
                          ${isPos
                            ? 'text-green bg-green-dim'
                            : 'text-red bg-red-dim'}`}>
          {sign}{chg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
        </span>
      </div>
      {(data.fiftyTwoWeekHigh != null || data.fiftyTwoWeekLow != null) && (
        <div className="flex gap-4 mt-2">
          {data.fiftyTwoWeekHigh != null && (
            <div className="text-[12px] text-text-sec">
              52s Máx: <span className="text-text-base font-mono">{fBRL.format(data.fiftyTwoWeekHigh)}</span>
            </div>
          )}
          {data.fiftyTwoWeekLow != null && (
            <div className="text-[12px] text-text-sec">
              52s Mín: <span className="text-text-base font-mono">{fBRL.format(data.fiftyTwoWeekLow)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
