import { useState, useMemo, useRef } from 'react'
import { Briefcase } from 'lucide-react'
import { ScrollableTabs } from '../../components/ScrollableTabs'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { useWatchlistStore } from '../../stores/watchlistStore'
import { useBatchQuotes, usePortfolioHistory, useBatchDividendHistory, useDpaMap } from '../../api/stocks'
import { useBatchCryptoQuotes } from '../../api/crypto'
import {
  buildHoldingSummaries,
  aggregateTitle,
  buildHistoricalPriceMap,
  buildAssetTWRRMap,
} from '../../engines/portfolio-engine'
import { CarteiraKPIs } from './CarteiraKPIs'
import { CarteiraVisaoGeral } from './CarteiraVisaoGeral'
import { CarteiraAtivos } from './CarteiraAtivos'
import { CarteiraOperacoes } from './CarteiraOperacoes'
import { CarteiraProventos } from './CarteiraProventos'
import { CarteiraRF } from './CarteiraRF'
import { CarteiraMetas } from './CarteiraMetas'
import { CarteiraIR } from './CarteiraIR'
import { CarteiraFab } from './CarteiraFab'
import type { Operation, Provento, RFTitle, SplitEvent } from '../../stores/portfolioStore'
import { useTabArrowNav } from '../../hooks/useKeyBinding'

export type Tab = 'visao' | 'ativos' | 'operacoes' | 'proventos' | 'rf' | 'metas' | 'ir'

const TABS: { key: Tab; label: string }[] = [
  { key: 'visao', label: 'Visão Geral' },
  { key: 'ativos', label: 'Ativos' },
  { key: 'operacoes', label: 'Operações' },
  { key: 'proventos', label: 'Proventos' },
  { key: 'rf', label: 'Renda Fixa' },
  { key: 'metas', label: 'Metas' },
  { key: 'ir', label: 'IR/DARF' },
]

const CDI_DEFAULT = 0.1415 // approx CDI accumulated 2024 — fetched from /api/cdi when available

export function CarteiraPage() {
  const [tab, setTab] = useState<Tab>('visao')
  const [cdiAccumulated] = useState(CDI_DEFAULT)
  const touchStartX = useRef(0)

  useTabArrowNav(TABS.map((t) => t.key), tab, setTab)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 60) return
    const i = TABS.findIndex((t) => t.key === tab)
    const next = dx < 0 ? i + 1 : i - 1
    if (next >= 0 && next < TABS.length) setTab(TABS[next].key) // sem dar volta nas pontas
  }

  // O FAB abre o formulário de adicionar da aba ativa. As abas com formulário (Operações,
  // Proventos, Renda Fixa) já têm seu próprio botão "+" e estado de modal local — abrir esse
  // modal remotamente exigiria elevar o estado para cá em 3+ componentes. Adiado para a Task 21,
  // que já vai mexer nesses formulários (ver task-19-report.md).
  function handleFabAction(tab: Tab) {
    // placeholder intencional — ver comentário acima
    void tab
  }

  const {
    operations,
    fixedIncome,
    proventos,
    cashBalance,
    allocationTargets,
    splitEvents,
    addOperation,
    deleteOperation,
    addFixedIncomeTitle,
    deleteFixedIncomeTitle,
    deleteDeposit,
    addProvento,
    deleteProvento,
    importProventos,
    setCashBalance,
    setAllocationTarget,
    addSplitEvent,
    deleteSplitEvent,
  } = usePortfolioStore()

  const watchlistEntries = useWatchlistStore((s) => s.entries)

  // Compute holdings
  const holdings = useMemo(() => buildHoldingSummaries(operations), [operations])
  const stockTickers = useMemo(
    () => holdings.filter((h) => h.assetClass !== 'cripto').map((h) => h.ticker),
    [holdings]
  )
  const cryptoTickers = useMemo(
    () => holdings.filter((h) => h.assetClass === 'cripto').map((h) => h.ticker),
    [holdings]
  )

  // Fetch live quotes — crypto goes through CoinGecko, everything else through yfinance
  const { data: stockQuotes = [], isLoading: stockQuotesLoading } = useBatchQuotes(stockTickers)
  const { data: cryptoQuotes = [], isLoading: cryptoQuotesLoading } = useBatchCryptoQuotes(cryptoTickers)
  const quotes = useMemo(() => [...stockQuotes, ...cryptoQuotes], [stockQuotes, cryptoQuotes])
  const quotesLoading = stockQuotesLoading || cryptoQuotesLoading

  // Compute totals
  const quoteMap = useMemo(
    () => Object.fromEntries(quotes.map((q) => [q.ticker, q])),
    [quotes]
  )

  const operationDates = useMemo(
    () => [...new Set(operations.map((o) => o.date))],
    [operations]
  )

  const { data: historyResponse, isLoading: historyLoading } = usePortfolioHistory(
    stockTickers,
    operationDates
  )

  const currentPriceMap = useMemo(
    () =>
      Object.fromEntries(
        quotes.filter((q) => q.price != null).map((q) => [q.ticker, q.price as number])
      ),
    [quotes]
  )

  const twrrMap = useMemo(() => {
    if (!historyResponse) return {}
    const historicalPrices = buildHistoricalPriceMap(historyResponse)
    return buildAssetTWRRMap(operations, historicalPrices, currentPriceMap)
  }, [historyResponse, operations, currentPriceMap])

  const { data: dividendHistoryByTicker = {}, isLoading: dividendHistoryLoading } =
    useBatchDividendHistory(stockTickers)

  const { data: dpaMap = {}, isLoading: dpaLoading } = useDpaMap(stockTickers)

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

  function handleImportProventos(provs: Provento[]) {
    importProventos(provs)
  }

  function handleAddRFTitle(title: Omit<RFTitle, 'id'>) {
    addFixedIncomeTitle({ ...title, id: crypto.randomUUID() })
  }

  function handleAddSplitEvent(event: Omit<SplitEvent, 'id'>) {
    addSplitEvent({ ...event, id: crypto.randomUUID() })
  }

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: '#0b0f17' }}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
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
        <div className="mt-6 mb-5">
          <ScrollableTabs
            tabs={TABS.map(({ key, label }) => ({ key, label }))}
            active={tab}
            onSelect={setTab}
            ariaLabel="Seções da carteira"
          />
        </div>

        {/* Tab content */}
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
              twrrMap={twrrMap}
              twrrLoading={historyLoading}
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
              onImport={handleImportProventos}
              holdings={holdings}
              operations={operations}
              dividendHistoryByTicker={dividendHistoryByTicker}
              dpaMap={dpaMap}
              dividendDataLoading={dividendHistoryLoading || dpaLoading}
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
          {tab === 'metas' && (
            <CarteiraMetas
              holdings={holdings}
              priceMap={currentPriceMap}
              rfValue={rfValue}
              cashBalance={cashBalance}
              allocationTargets={allocationTargets}
              onSetCashBalance={setCashBalance}
              onSetTarget={setAllocationTarget}
            />
          )}
          {tab === 'ir' && (
            <CarteiraIR
              operations={operations}
              splitEvents={splitEvents}
              onAddSplitEvent={handleAddSplitEvent}
              onDeleteSplitEvent={deleteSplitEvent}
            />
          )}
        </div>
      </div>

      <CarteiraFab tab={tab} onAction={handleFabAction} />
    </div>
  )
}
