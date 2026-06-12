import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../components/Skeleton'
import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'
import type { HoldingSummary } from '../../engines/portfolio-engine'
import type { LiveQuote } from '../../api/stocks'
import type { WatchlistEntry } from '../../stores/watchlistStore'

const fBRL = (v: number) => fBRLFormatter.format(v)

const CLASS_LABELS: Record<string, string> = {
  acao_br: 'Ação BR',
  fii: 'FII',
  etf: 'ETF',
  stock_intl: 'Stock Intl',
}

const CLASS_BADGE_CLASS: Record<string, string> = {
  acao_br: 'text-cyan bg-cyan-dim border-cyan/20',
  fii: 'text-[#818cf8] bg-[rgba(99,102,241,.15)] border-[rgba(99,102,241,.25)]',
  etf: 'text-amber bg-amber-dim border-amber/20',
  stock_intl: 'text-purple bg-purple-dim border-purple/20',
}

type AssetFilter = 'all' | 'acao_br' | 'fii' | 'etf' | 'stock_intl'

interface CarteiraAtivosProps {
  holdings: HoldingSummary[]
  quotes: LiveQuote[]
  watchlistEntries: Record<string, WatchlistEntry>
  quotesLoading: boolean
}

export function CarteiraAtivos({
  holdings,
  quotes,
  watchlistEntries,
  quotesLoading,
}: CarteiraAtivosProps) {
  const [filter, setFilter] = useState<AssetFilter>('all')

  const quoteMap = Object.fromEntries(quotes.map((q) => [q.ticker, q]))

  const filtered =
    filter === 'all' ? holdings : holdings.filter((h) => h.assetClass === filter)

  if (!holdings.length) {
    return (
      <p className="text-center text-text-muted py-10 text-sm">
        Nenhum ativo. Adicione operações na aba Operações.
      </p>
    )
  }

  const FILTERS: { key: AssetFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'acao_br', label: 'Ações BR' },
    { key: 'fii', label: 'FIIs' },
    { key: 'etf', label: 'ETFs' },
    { key: 'stock_intl', label: 'Stocks Intl' },
  ]

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-md text-xs border cursor-pointer transition-colors
                       ${filter === key
                         ? 'bg-cyan-dim text-cyan border-cyan'
                         : 'bg-transparent text-text-muted border-border hover:text-text-sec'
                       }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Ticker', 'Classe', 'Qtd', 'Preço Médio', 'Cotação Atual', 'Valor em Carteira', 'Retorno', 'Preço Teto (DCF)', 'Situação'].map(
                (col, i) => (
                  <th
                    key={col}
                    className={`text-[11px] text-text-muted uppercase tracking-[0.4px]
                                py-2.5 px-2.5 text-left border-b border-border whitespace-nowrap
                                ${i >= 2 ? 'text-right' : ''}`}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => {
              const quote = quoteMap[h.ticker]
              const cotacao = quote?.price ?? null
              const valorCarteira = cotacao != null ? h.qty * cotacao : null
              const retorno =
                h.precoMedio && cotacao
                  ? (cotacao - h.precoMedio) / h.precoMedio
                  : null
              const fairPrice = watchlistEntries[h.ticker]?.fairPrice ?? null
              const badgeClass = CLASS_BADGE_CLASS[h.assetClass] ?? ''

              return (
                <tr
                  key={h.ticker}
                  className="border-b border-border-muted hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-2.5 py-2.5 text-sm font-bold">{h.ticker}</td>
                  <td className="px-2.5 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClass}`}>
                      {CLASS_LABELS[h.assetClass] ?? h.assetClass}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">{h.qty}</td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                    {h.precoMedio != null ? fBRL(h.precoMedio) : '—'}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                    {quotesLoading && cotacao == null ? (
                      <Skeleton className="h-4 w-16 inline-block" />
                    ) : cotacao != null ? (
                      fBRL(cotacao)
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                    {valorCarteira != null ? fBRL(valorCarteira) : '—'}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                    {retorno != null ? (
                      <span className={retorno >= 0 ? 'text-green' : 'text-red'}>
                        {retorno >= 0 ? '+' : ''}
                        {fPct(retorno, 1)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-mono">
                    {fairPrice ? (
                      fBRL(fairPrice)
                    ) : (
                      <Link
                        to={`/dcf?ticker=${h.ticker}`}
                        className="text-text-muted text-[11px] hover:text-cyan"
                      >
                        → calcular
                      </Link>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-sm">
                    <DCFStatus cotacao={cotacao} fairPrice={fairPrice} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DCFStatus({
  cotacao,
  fairPrice,
}: {
  cotacao: number | null
  fairPrice: number | null
}) {
  if (!fairPrice || !cotacao) {
    return <span className="text-text-muted text-[11px]">sem DCF</span>
  }
  if (cotacao > fairPrice) {
    return <span className="text-red font-semibold text-xs">● Caro</span>
  }
  if (cotacao < fairPrice * 0.9) {
    return <span className="text-green font-semibold text-xs">● Barato</span>
  }
  return <span className="text-amber font-semibold text-xs">● Justo</span>
}
