import { useState, useMemo } from 'react'
import { Briefcase } from 'lucide-react'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { useWatchlistStore } from '../../stores/watchlistStore'
import { useBatchQuotes } from '../../api/stocks'
import { buildHoldingSummaries, aggregateTitle } from '../../engines/portfolio-engine'
import { CarteiraKPIs } from './CarteiraKPIs'
import { CarteiraVisaoGeral } from './CarteiraVisaoGeral'
import { CarteiraAtivos } from './CarteiraAtivos'
import { CarteiraOperacoes } from './CarteiraOperacoes'
import { CarteiraProventos } from './CarteiraProventos'
import { CarteiraRF } from './CarteiraRF'
import type { Operation, Provento, RFTitle } from '../../stores/portfolioStore'

type Tab = 'visao' | 'ativos' | 'operacoes' | 'proventos' | 'rf'

const TABS: { key: Tab; label: string }[] = [
  { key: 'visao', label: 'Visão Geral' },
  { key: 'ativos', label: 'Ativos' },
  { key: 'operacoes', label: 'Operações' },
  { key: 'proventos', label: 'Proventos' },
  { key: 'rf', label: 'Renda Fixa' },
]

const CDI_DEFAULT = 0.1415 // approx CDI accumulated 2024 — fetched from /api/cdi when available

export function CarteiraPage() {
  const [tab, setTab] = useState<Tab>('visao')
  const [cdiAccumulated] = useState(CDI_DEFAULT)

  const {
    operations,
    fixedIncome,
    proventos,
    addOperation,
    deleteOperation,
    addFixedIncomeTitle,
    deleteFixedIncomeTitle,
    deleteDeposit,
    addProvento,
    deleteProvento,
  } = usePortfolioStore()

  const watchlistEntries = useWatchlistStore((s) => s.entries)

  // Compute holdings
  const holdings = useMemo(() => buildHoldingSummaries(operations), [operations])
  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])

  // Fetch live quotes
  const { data: quotes = [], isLoading: quotesLoading } = useBatchQuotes(tickers)

  // Compute totals
  const quoteMap = useMemo(
    () => Object.fromEntries(quotes.map((q) => [q.ticker, q])),
    [quotes]
  )

  const today = new Date().toISOString().slice(0, 10)

  const rfValue = useMemo(
    () =>
      fixedIncome.reduce((sum, t) => {
        const agg = aggregateTitle(t, { cdiAccumulated }, today)
        return sum + agg.totalProjected
      }, 0),
    [fixedIncome, cdiAccumulated, today]
  )

  const totalValue = useMemo(() => {
    const equityValue = holdings.reduce((sum, h) => {
      const price = quoteMap[h.ticker]?.price
      return price != null ? sum + h.qty * price : sum
    }, 0)
    return equityValue + rfValue
  }, [holdings, quoteMap, rfValue])

  const totalInvested = useMemo(() => {
    const equityInvested = holdings.reduce((sum, h) => {
      return h.investido != null ? sum + h.investido : sum
    }, 0)
    const rfInvested = fixedIncome.reduce(
      (sum, t) => sum + t.deposits.reduce((s, d) => s + d.amount, 0),
      0
    )
    return equityInvested + rfInvested
  }, [holdings, fixedIncome])

  function handleAddOperation(op: Omit<Operation, 'id'>) {
    addOperation({ ...op, id: crypto.randomUUID() })
  }

  function handleAddProvento(p: Omit<Provento, 'id'>) {
    addProvento({ ...p, id: crypto.randomUUID() })
  }

  function handleAddRFTitle(title: Omit<RFTitle, 'id'>) {
    addFixedIncomeTitle({ ...title, id: crypto.randomUUID() })
  }

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: '#0b0f17' }}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Briefcase size={22} className="text-cyan" />
          <h1 className="text-[22px] font-bold text-text-base">Minha Carteira</h1>
        </div>
        <p className="text-text-muted text-[13px] mb-0">
          {holdings.length > 0
            ? `${holdings.length} ativo${holdings.length > 1 ? 's' : ''} · ${operations.length} operação${operations.length !== 1 ? 'ões' : ''}`
            : 'Nenhum ativo. Registre uma operação para começar.'}
        </p>

        {/* KPIs */}
        <CarteiraKPIs
          totalInvested={totalInvested}
          totalValue={totalValue}
          loading={quotesLoading && holdings.length > 0}
        />

        {/* Tabs */}
        <div
          className="flex gap-1 mt-6 mb-5 overflow-x-auto scrollbar-none"
          style={{ borderBottom: '1px solid #1e2d42' }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-[18px] py-2.5 text-[13px] font-medium cursor-pointer
                         border-0 bg-transparent border-b-2 -mb-px transition-colors
                         ${tab === key
                           ? 'text-cyan border-cyan'
                           : 'text-text-muted border-transparent hover:text-text-sec'
                         }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'visao' && (
          <CarteiraVisaoGeral
            holdings={holdings}
            quotes={quotes}
            rfValue={rfValue}
            loading={quotesLoading && holdings.length > 0}
          />
        )}
        {tab === 'ativos' && (
          <CarteiraAtivos
            holdings={holdings}
            quotes={quotes}
            watchlistEntries={watchlistEntries}
            quotesLoading={quotesLoading}
          />
        )}
        {tab === 'operacoes' && (
          <CarteiraOperacoes
            operations={operations}
            onAdd={handleAddOperation}
            onDelete={deleteOperation}
          />
        )}
        {tab === 'proventos' && (
          <CarteiraProventos
            proventos={proventos}
            onAdd={handleAddProvento}
            onDelete={deleteProvento}
          />
        )}
        {tab === 'rf' && (
          <CarteiraRF
            titles={fixedIncome}
            cdiAccumulated={cdiAccumulated}
            onAdd={handleAddRFTitle}
            onDelete={deleteFixedIncomeTitle}
            onDeleteDeposit={deleteDeposit}
          />
        )}
      </div>
    </div>
  )
}
