import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'
import { Skeleton } from '../../components/Skeleton'
import type { HoldingSummary } from '../../engines/portfolio-engine'
import type { LiveQuote } from '../../api/stocks'

const fBRL = (v: number) => fBRLFormatter.format(v)

const ALLOC_COLORS: Record<string, string> = {
  acao_br: '#06b6d4',
  fii: '#8b5cf6',
  etf: '#f59e0b',
  stock_intl: '#10b981',
  rf: '#818cf8',
}

const ALLOC_LABELS: Record<string, string> = {
  acao_br: 'Ações BR',
  fii: 'FIIs',
  etf: 'ETFs',
  stock_intl: 'Stocks Intl',
  rf: 'Renda Fixa',
}

interface CarteiraVisaoGeralProps {
  holdings: HoldingSummary[]
  quotes: LiveQuote[]
  rfValue: number
  loading: boolean
}

export function CarteiraVisaoGeral({
  holdings,
  quotes,
  rfValue,
  loading,
}: CarteiraVisaoGeralProps) {
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.ticker, q]))

  // Class values
  const classValues: Record<string, number> = {
    acao_br: 0,
    fii: 0,
    etf: 0,
    stock_intl: 0,
    rf: rfValue,
  }
  for (const h of holdings) {
    const price = quoteMap[h.ticker]?.price
    if (price != null) {
      classValues[h.assetClass] = (classValues[h.assetClass] ?? 0) + h.qty * price
    }
  }

  const totalValue = Object.values(classValues).reduce((s, v) => s + v, 0)
  const entries = Object.entries(classValues)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  // Performances
  const performances = holdings
    .filter((h) => h.precoMedio != null && quoteMap[h.ticker]?.price != null)
    .map((h) => ({
      ticker: h.ticker,
      retorno: ((quoteMap[h.ticker]?.price ?? 0) - h.precoMedio!) / h.precoMedio!,
    }))
    .sort((a, b) => b.retorno - a.retorno)

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* Allocation */}
      <Card title="Alocação por Classe">
        {loading ? (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : !entries.length ? (
          <p className="text-text-muted text-xs mt-2">Sem posições.</p>
        ) : (
          <div className="mt-2">
            {entries.map(([cls, val]) => {
              const pct = totalValue > 0 ? (val / totalValue) * 100 : 0
              return (
                <div key={cls} className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-[90px] text-xs text-text-sec shrink-0">
                    {ALLOC_LABELS[cls] ?? cls}
                  </div>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: '#1f2a3f' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct.toFixed(0)}%`,
                        background: ALLOC_COLORS[cls] ?? '#94a3b8',
                      }}
                    />
                  </div>
                  <div
                    className="w-10 text-right text-xs"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {pct.toFixed(0)}%
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Highlights */}
      <Card title="Destaques">
        {loading ? (
          <div className="flex flex-col gap-2 mt-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div
            className="grid gap-6 mt-2"
            style={{ gridTemplateColumns: '1fr 1fr' }}
          >
            <div>
              <div className="text-[11px] font-semibold text-green mb-2.5 uppercase tracking-wider">
                ↑ Melhores
              </div>
              {performances.length ? (
                performances.slice(0, 3).map((p) => (
                  <PerfRow key={p.ticker} ticker={p.ticker} retorno={p.retorno} />
                ))
              ) : (
                <span className="text-text-muted text-xs">—</span>
              )}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-red mb-2.5 uppercase tracking-wider">
                ↓ Piores
              </div>
              {performances.length ? (
                [...performances].reverse().slice(0, 3).map((p) => (
                  <PerfRow key={p.ticker} ticker={p.ticker} retorno={p.retorno} />
                ))
              ) : (
                <span className="text-text-muted text-xs">—</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card title="Resumo da Carteira" style={{ gridColumn: '1 / -1' }}>
        {loading ? (
          <Skeleton className="h-20 w-full mt-2" />
        ) : (
          <div className="flex gap-8 mt-2 flex-wrap">
            <SummaryItem label="Patrimônio total" value={totalValue > 0 ? fBRL(totalValue) : '—'} />
            <SummaryItem label="Ações BR" value={classValues.acao_br > 0 ? fBRL(classValues.acao_br) : '—'} />
            <SummaryItem label="FIIs" value={classValues.fii > 0 ? fBRL(classValues.fii) : '—'} />
            <SummaryItem label="ETFs" value={classValues.etf > 0 ? fBRL(classValues.etf) : '—'} />
            <SummaryItem label="Renda Fixa" value={rfValue > 0 ? fBRL(rfValue) : '—'} />
          </div>
        )}
      </Card>
    </div>
  )
}

function Card({
  title,
  children,
  style,
}: {
  title: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      className="rounded-[14px] p-[18px_20px]"
      style={{ background: '#111827', border: '1px solid #1e2d42', ...style }}
    >
      <div className="text-[13px] font-semibold text-text-sec uppercase tracking-[0.5px]">
        {title}
      </div>
      {children}
    </div>
  )
}

function PerfRow({ ticker, retorno }: { ticker: string; retorno: number }) {
  return (
    <div
      className="flex items-center gap-2.5 py-2"
      style={{ borderBottom: '1px solid #151e2d' }}
    >
      <span className="flex-1 text-sm">{ticker}</span>
      <span
        className="text-sm font-semibold"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          color: retorno >= 0 ? '#10b981' : '#ef4444',
        }}
      >
        {retorno >= 0 ? '+' : ''}
        {fPct(retorno, 1)}
      </span>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-text-muted mb-1">{label}</div>
      <div className="text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
    </div>
  )
}
