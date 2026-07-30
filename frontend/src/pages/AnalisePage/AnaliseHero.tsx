import { Skeleton } from '../../components/Skeleton'
import { fBRL, fPct } from '../../engines/formatters'
import type { FundamentalsData, StockQuote } from '../../api/stocks'

interface Props {
  data: FundamentalsData | undefined
  quote: StockQuote | undefined
  isLoading: boolean
}

function fMktCap(n: number | null | undefined): string {
  if (!n) return '—'
  if (n >= 1e12) return 'R$ ' + (n / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'T'
  if (n >= 1e9) return 'R$ ' + (n / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'B'
  if (n >= 1e6) return 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
  return fBRL.format(n)
}

function fNum(n: number | null | undefined, dec = 2): string {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export function AnaliseHero({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-bg-2 to-[rgba(6,182,212,0.04)] border border-border rounded-[14px] p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <Skeleton width="60px" height="22px" className="rounded-full" />
            <Skeleton width="240px" height="28px" className="mt-1" />
          </div>
          <div className="text-right">
            <Skeleton width="120px" height="36px" />
            <Skeleton width="80px" height="18px" className="mt-1 ml-auto" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2.5 mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-bg-3 border border-border rounded-[10px] px-3.5 py-2 md:min-w-[110px]">
              <Skeleton width="60px" height="10px" className="mb-1" />
              <Skeleton width="70px" height="18px" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width="70px" height="14px" />
          <Skeleton className="flex-1 h-1.5 rounded" />
          <Skeleton width="70px" height="14px" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const price = data.price ?? 0
  const chg = data.changePercent ?? 0
  const lo = data.fiftyTwoWeekLow
  const hi = data.fiftyTwoWeekHigh
  const pct = lo && hi && hi > lo
    ? Math.min(100, Math.max(0, ((price - lo) / (hi - lo)) * 100))
    : 50

  return (
    <div className="bg-gradient-to-br from-bg-2 to-[rgba(6,182,212,0.04)] border border-border rounded-[14px] p-5 mb-5">
      {/* Top */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[13px] font-bold text-cyan bg-cyan-dim border border-cyan/20
                       rounded-full px-3 py-0.5 inline-block"
          >
            {data.ticker}
          </span>
          <div className="text-[22px] font-bold text-text-base mt-1">{data.name ?? '—'}</div>
        </div>
        <div className="text-right whitespace-nowrap">
          <span className="font-mono text-[32px] font-bold block">{fBRL.format(price)}</span>
          <span className={`text-[15px] font-semibold block mt-0.5 ${chg >= 0 ? 'text-green' : 'text-red'}`}>
            {chg >= 0 ? '▲ +' : '▼ '}{fPct(chg / 100)}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2.5 mb-4">
        <KpiChip label="Mkt Cap" value={fMktCap(data.marketCap)} />
        <KpiChip label="52s Mín" value={lo ? fBRL.format(lo) : '—'} />
        <KpiChip label="52s Máx" value={hi ? fBRL.format(hi) : '—'} />
        <KpiChip label="DY" value={data.dy ? fPct(data.dy) : '—'} valueClass="text-green" />
        <KpiChip label="P/L" value={data.pl ? fNum(data.pl) : '—'} />
      </div>

      {/* 52-week range bar */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px] text-text-sec min-w-[70px]">
          {lo ? fBRL.format(lo) : '—'}
        </span>
        <div className="flex-1 h-1.5 bg-bg-3 rounded-full relative">
          <div
            className="h-full bg-gradient-to-r from-red via-amber to-green rounded-full"
            style={{ width: '100%' }}
          />
          <div
            className="w-3 h-3 bg-text-base border-2 border-bg-1 rounded-full absolute top-[-3px] -translate-x-1/2"
            style={{ left: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-[12px] text-text-sec min-w-[70px] text-right">
          {hi ? fBRL.format(hi) : '—'}
        </span>
      </div>
    </div>
  )
}

function KpiChip({
  label,
  value,
  valueClass = 'text-text-base',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-bg-3 border border-border rounded-[10px] px-3.5 py-2 flex flex-col gap-0.5 md:min-w-[110px]">
      <span className="text-[10px] uppercase tracking-[0.06em] text-text-muted">{label}</span>
      <span className={`font-mono text-[15px] font-semibold ${valueClass}`}>{value}</span>
    </div>
  )
}
