import { useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Skeleton } from '../../components/Skeleton'
import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'
import type { HoldingSummary, AssetTWRR } from '../../engines/portfolio-engine'
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

const COLUMNS = [
  'Ticker',
  'Classe',
  'Qtd',
  'Preço Médio',
  'Cotação Atual',
  'Valor em Carteira',
  'Retorno',
  'TWRR',
  'Preço Teto (DCF)',
  'Situação',
] as const

type AssetFilter = 'all' | 'acao_br' | 'fii' | 'etf' | 'stock_intl'
type SortKey = 'simple' | 'twrr' | null

interface CarteiraAtivosProps {
  holdings: HoldingSummary[]
  quotes: LiveQuote[]
  watchlistEntries: Record<string, WatchlistEntry>
  quotesLoading: boolean
  twrrMap: Record<string, AssetTWRR>
  twrrLoading: boolean
}

export function CarteiraAtivos({
  holdings,
  quotes,
  watchlistEntries,
  quotesLoading,
  twrrMap,
  twrrLoading,
}: CarteiraAtivosProps) {
  const [filter, setFilter] = useState<AssetFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)

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

  function toggleSort(key: 'simple' | 'twrr') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const enriched = filtered.map((h) => {
    const quote = quoteMap[h.ticker]
    const cotacao = quote?.price ?? null
    const valorCarteira = cotacao != null ? h.qty * cotacao : null
    const retorno = h.precoMedio && cotacao ? (cotacao - h.precoMedio) / h.precoMedio : null
    const fairPrice = watchlistEntries[h.ticker]?.fairPrice ?? null
    const twrr = twrrMap[h.ticker]?.twrr ?? null
    const subPeriods = twrrMap[h.ticker]?.subPeriods ?? []
    return { h, cotacao, valorCarteira, retorno, fairPrice, twrr, subPeriods }
  })

  const sorted = [...enriched].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = sortKey === 'simple' ? a.retorno : a.twrr
    const bVal = sortKey === 'simple' ? b.retorno : b.twrr
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

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
              {COLUMNS.map((col, i) => {
                const sortableKey: 'simple' | 'twrr' | null =
                  col === 'Retorno' ? 'simple' : col === 'TWRR' ? 'twrr' : null
                return (
                  <th
                    key={col}
                    onClick={sortableKey ? () => toggleSort(sortableKey) : undefined}
                    className={`text-[11px] text-text-muted uppercase tracking-[0.4px]
                                py-2.5 px-2.5 text-left border-b border-border whitespace-nowrap
                                ${i >= 2 ? 'text-right' : ''}
                                ${sortableKey ? 'cursor-pointer select-none' : ''}`}
                  >
                    {col}
                    {sortableKey &&
                      sortKey === sortableKey &&
                      (sortDir === 'desc' ? ' ▾' : ' ▴')}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ h, cotacao, valorCarteira, retorno, fairPrice, twrr, subPeriods }) => {
              const badgeClass = CLASS_BADGE_CLASS[h.assetClass] ?? ''
              const isExpanded = expandedTicker === h.ticker

              return (
                <Fragment key={h.ticker}>
                  <tr
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
                      {twrrLoading && twrr == null ? (
                        <Skeleton className="h-4 w-16 inline-block" />
                      ) : twrr != null ? (
                        <button
                          onClick={() => setExpandedTicker(isExpanded ? null : h.ticker)}
                          className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                        >
                          <span className={twrr >= 0 ? 'text-green' : 'text-red'}>
                            {twrr >= 0 ? '+' : ''}
                            {fPct(twrr, 1)}
                          </span>
                          <ChevronDown
                            size={12}
                            className="text-text-muted transition-transform"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                          />
                        </button>
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
                  {isExpanded && (
                    <tr className="border-b border-border-muted" style={{ background: 'rgba(255,255,255,.015)' }}>
                      <td colSpan={COLUMNS.length} className="px-2.5 py-3">
                        {subPeriods.length ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className="text-left text-text-muted font-normal pb-1">Período</th>
                                <th className="text-right text-text-muted font-normal pb-1">Valor Inicial</th>
                                <th className="text-right text-text-muted font-normal pb-1">Valor Final</th>
                                <th className="text-right text-text-muted font-normal pb-1">Retorno</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subPeriods.map((sp, i) => {
                                const periodReturn =
                                  sp.startValue > 0 ? (sp.endValue - sp.startValue) / sp.startValue : null
                                return (
                                  <tr key={i}>
                                    <td className="text-text-sec py-0.5">Período {i + 1}</td>
                                    <td className="text-right font-mono py-0.5">{fBRL(sp.startValue)}</td>
                                    <td className="text-right font-mono py-0.5">{fBRL(sp.endValue)}</td>
                                    <td
                                      className={`text-right font-mono py-0.5 ${
                                        periodReturn != null && periodReturn >= 0 ? 'text-green' : 'text-red'
                                      }`}
                                    >
                                      {periodReturn != null
                                        ? `${periodReturn >= 0 ? '+' : ''}${fPct(periodReturn, 1)}`
                                        : '—'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <span className="text-text-muted text-xs">
                            Sem sub-períodos suficientes para TWRR.
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
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
