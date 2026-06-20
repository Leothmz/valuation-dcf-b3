import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useDCFStore, useWatchlistStore } from '../../stores'
import { notify } from '../../components'
import { runDCF, growthRate } from '../../engines/dcf-engine'
import { fBRL } from '../../engines/formatters'
import type { NullableDCFAssumptions } from '../../stores/dcfStore'
import type { StockQuote } from '../../api/stocks'
import { DCFSearch } from './DCFSearch'
import { DCFCompanyHeader } from './DCFCompanyHeader'
import { DCFInputPanel } from './DCFInputPanel'
import { DCFResultPanel } from './DCFResultPanel'
import { DCFTable } from './DCFTable'
import { DCFMethodModal } from './DCFMethodModal'
import { buildExportHTML } from '../../utils/exportHTML'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function DCFPage() {
  const [searchParams] = useSearchParams()
  const [searchTicker, setSearchTicker] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [apiData, setApiData] = useState<StockQuote | null>(null)
  const [methodModalOpen, setMethodModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const store = useDCFStore()
  const watchlist = useWatchlistStore()

  // Re-run DCF whenever assumptions, yearOverrides, projYears, or dcfMethod change
  const debouncedAssumptions = useDebounce(store.assumptions, 300)
  const debouncedYearOverrides = useDebounce(store.yearOverrides, 300)

  useEffect(() => {
    const a = store.assumptions
    if (!a.ll || !a.shares) {
      store.setResults(null, null, null)
      return
    }

    const strictAssumptions = {
      ll: a.ll,
      payout: a.payout ?? undefined,
      roe: a.roe ?? undefined,
      g: a.g ?? undefined,
      disc: a.disc,
      perp: a.perp,
      shares: a.shares,
      price: a.price ?? undefined,
    }

    const classic = runDCF(strictAssumptions, store.history, store.projYears, store.yearOverrides)
    const buffett = runDCF(
      { ...strictAssumptions, tvDisc: 0.10 },
      store.history,
      store.projYears,
      store.yearOverrides
    )
    const active = store.dcfMethod === 'buffett' ? buffett : classic
    store.setResults(
      active && !('error' in active) ? active : null,
      classic && !('error' in classic) ? classic : null,
      buffett && !('error' in buffett) ? buffett : null,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAssumptions, debouncedYearOverrides, store.projYears, store.dcfMethod, store.history])

  const scenarioResults = useMemo(() => {
    if (!store.scenarios.enabled) return null
    const a = store.assumptions
    if (!a.ll || !a.shares) return null

    function computePrice(g: number | null): number | null {
      if (g == null) return null
      const res = runDCF(
        { ll: a.ll!, payout: a.payout ?? undefined, roe: a.roe ?? undefined,
          g, disc: a.disc, perp: a.perp, shares: a.shares! },
        store.history,
        store.projYears,
        store.yearOverrides as Record<number, number>,
      )
      return res && !('error' in res) ? res.fairPrice : null
    }

    return {
      bear: computePrice(store.scenarios.bear),
      base: computePrice(store.scenarios.base),
      bull: computePrice(store.scenarios.bull),
    }
  }, [store.scenarios, store.assumptions, store.history, store.projYears, store.yearOverrides])

  // On first mount: handle URL params and restore persisted state
  useEffect(() => {
    if (hasLoaded) return
    setHasLoaded(true)

    const wlTicker = searchParams.get('wl')
    const autoTicker = searchParams.get('ticker')

    if (wlTicker) {
      restoreFromWatchlist(wlTicker.toUpperCase())
    } else if (autoTicker) {
      handleSearch(autoTicker.toUpperCase())
    } else if (store.ticker) {
      // Restore session: existing store state already has everything
      notify(`Dados de ${store.ticker} restaurados.`, 'success')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchQuote(ticker: string): Promise<StockQuote> {
    const res = await fetch(`/api/quote/${encodeURIComponent(ticker.toUpperCase())}`)
    if (!res.ok) throw new Error('NOT_FOUND')
    const data = await res.json()
    if (data.code === 'NOT_FOUND') throw new Error('NOT_FOUND')
    if (data.code === 'NO_YFINANCE') throw new Error('NO_YFINANCE')
    if (!data.price) throw new Error('NOT_FOUND')
    return data as StockQuote
  }

  async function handleSearch(ticker: string) {
    if (!ticker) return
    setIsFetching(true)
    setSearchTicker(ticker)

    try {
      const d = await fetchQuote(ticker)
      const history = (d.netIncomeHistory || []).map(h => ({ year: h.year, value: h.netIncome }))
      const shares = d.sharesOutstanding || null
      const roe = (d.roe != null && d.roe > 0) ? d.roe : null
      const payout = (d.payout != null && d.payout > 0) ? d.payout : null
      const baseCF = history.length ? history[0].value : null
      const g = (roe != null && payout != null) ? growthRate(payout, roe) : null

      // Update store
      store.setTicker(ticker, d.name || ticker, d as unknown as Record<string, unknown>)
      store.setHistory(history)
      store.clearAllOverrides()
      store.clearAllYearOverrides()
      store.setApiVals({ ll: baseCF, payout, roe, g, shares } as Record<string, number>)

      // Set assumptions
      store.setAssumption('ll', baseCF)
      store.setAssumption('payout', payout)
      store.setAssumption('roe', roe)
      store.setAssumption('g', g)
      store.setAssumption('shares', shares)
      store.setAssumption('price', d.price ?? null)

      setApiData(d)

      // Warnings
      if (!baseCF) notify('Lucro Líquido histórico não disponível. Insira manualmente.', 'warning')
      if (!roe) notify('ROE não disponível. Insira manualmente.', 'warning')
      if (!payout) notify('Payout não disponível. Insira manualmente (sugestão: 30–50%).', 'warning')
      if (!shares) notify('Número de ações não disponível. Preço Teto pode estar incorreto.', 'warning')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'NOT_FOUND') {
        notify(`Ticker "${ticker}" não encontrado. Verifique o código (ex: WEGE3, ITUB4).`, 'error')
      } else if (msg === 'NO_YFINANCE') {
        notify('yfinance não instalado. Execute: pip install yfinance no terminal.', 'error')
      } else {
        notify('Não foi possível conectar ao servidor local. Verifique se o start.bat está rodando.', 'error')
      }
      setApiData(null)
    } finally {
      setIsFetching(false)
    }
  }

  async function restoreFromWatchlist(ticker: string) {
    const entry = watchlist.entries[ticker]
    if (!entry) return

    store.setTicker(entry.ticker, entry.name, {})
    store.setHistory(entry.history)
    store.clearAllOverrides()
    store.clearAllYearOverrides()
    store.setApiVals(entry.apiVals)
    store.setProjYears((entry.projYears as 3 | 5) ?? 5)

    // Restore overrides
    entry.overrides.forEach(f => store.addOverride(f))

    // Restore year overrides
    Object.entries(entry.yearOverrides).forEach(([yr, val]) =>
      store.setYearOverride(Number(yr), val as number)
    )

    // Restore assumptions
    const a = entry.assumptions as Partial<NullableDCFAssumptions>
    if (a.ll !== undefined) store.setAssumption('ll', a.ll)
    if (a.payout !== undefined) store.setAssumption('payout', a.payout)
    if (a.roe !== undefined) store.setAssumption('roe', a.roe)
    if (a.g !== undefined) store.setAssumption('g', a.g)
    if (a.shares !== undefined) store.setAssumption('shares', a.shares)
    if (a.price !== undefined) store.setAssumption('price', a.price)
    if (a.disc !== undefined) store.setAssumption('disc', a.disc)
    if (a.perp !== undefined) store.setAssumption('perp', a.perp)

    setSearchTicker(entry.ticker)

    // Fetch live price in background
    try {
      const d = await fetchQuote(entry.ticker)
      store.setAssumption('price', d.price ?? null)
      setApiData(d)
    } catch {
      setApiData({
        ticker: entry.ticker,
        name: entry.name,
        price: (entry.assumptions as Record<string, number>).price ?? 0,
        changePercent: 0,
        netIncomeHistory: [],
      })
    }
  }

  const handleAssumptionChange = useCallback((
    field: keyof NullableDCFAssumptions,
    value: number | null,
    isOverrideField: boolean,
  ) => {
    store.setAssumption(field, value)
    if (isOverrideField) store.addOverride(field as string)

    // Auto-recompute g if payout or roe changed and g is not overridden
    if ((field === 'payout' || field === 'roe') && !store.overrides.includes('g')) {
      const payout = field === 'payout' ? value : store.assumptions.payout
      const roe = field === 'roe' ? value : store.assumptions.roe
      if (payout != null && roe != null) {
        store.setAssumption('g', growthRate(payout, roe))
        store.clearAllYearOverrides()
      }
    }
    if (field === 'g') {
      store.clearAllYearOverrides()
    }
  }, [store])

  const handleRestore = useCallback((field: string) => {
    store.removeOverride(field)
    if (field === 'g') {
      const { payout, roe } = store.assumptions
      if (payout != null && roe != null) {
        store.setAssumption('g', growthRate(payout, roe))
      } else {
        store.setAssumption('g', (store.apiVals.g as number | undefined) ?? null)
      }
      store.clearAllYearOverrides()
    } else {
      const apiVal = store.apiVals[field]
      store.setAssumption(
        field as keyof NullableDCFAssumptions,
        typeof apiVal === 'number' ? apiVal : null
      )
    }
  }, [store])

  const handleYearLLChange = useCallback((year: number, value: number) => {
    // Cascade: preserve growth rates of subsequent years
    const pvFlows = store.results?.pvFlows ?? []
    const subsequentGrowths: Array<{ year: number; g: number }> = []
    let afterEdit = false
    for (const flow of pvFlows) {
      if (afterEdit) subsequentGrowths.push({ year: flow.year, g: flow.g })
      if (flow.year === year) afterEdit = true
    }

    store.setYearOverride(year, value)

    let prevLL = value
    for (const { year: nextYear, g } of subsequentGrowths) {
      const newLL = prevLL * (1 + g)
      store.setYearOverride(nextYear, newLL)
      prevLL = newLL
    }
  }, [store])

  const handleYearGrowthChange = useCallback((year: number, g: number) => {
    const pvFlows = store.results?.pvFlows ?? []
    const flowIdx = pvFlows.findIndex(f => f.year === year)
    if (flowIdx < 0) return
    const prevCF = flowIdx === 0 ? store.assumptions.ll : pvFlows[flowIdx - 1].cf
    if (!prevCF || prevCF <= 0) return
    const newLL = prevCF * (1 + g)
    store.setYearOverride(year, newLL)
  }, [store])

  function handleSave() {
    if (!store.ticker || !store.results) return
    const r = store.results
    const rc = store.resultsClassico
    const rb = store.resultsBuffett

    const fpC = rc ? rc.fairPrice : null
    const fpB = rb ? rb.fairPrice : null
    const valid = [fpC, fpB].filter((p): p is number => p != null && isFinite(p))
    const fpMin = valid.length ? Math.min(...valid) : r.fairPrice

    watchlist.save({
      ticker: store.ticker,
      name: store.companyName || store.ticker,
      fairPrice: fpMin,
      savedAt: new Date().toISOString(),
      projYears: store.projYears,
      dcfMethod: store.dcfMethod,
      assumptions: store.assumptions as unknown as Record<string, number | null>,
      overrides: store.overrides,
      apiVals: store.apiVals,
      yearOverrides: store.yearOverrides as Record<number, number>,
      history: store.history,
    })
    notify(`Preço Teto de ${store.ticker} (${fBRL.format(r.fairPrice)}) salvo!`, 'success')
  }

  async function handleExportHTML() {
    if (!store.ticker || !store.results || 'error' in store.results) return
    setIsExporting(true)
    try {
      let fundamentals = null
      try {
        const res = await fetch(`/api/fundamentals/${encodeURIComponent(store.ticker)}`)
        if (res.ok) fundamentals = await res.json()
      } catch {
        // fundamentals are optional; export proceeds without them
      }
      const html = buildExportHTML({
        ticker: store.ticker,
        name: store.companyName ?? store.ticker,
        exportDate: new Date().toISOString().slice(0, 10),
        assumptions: store.assumptions,
        results: store.results,
        resultsClassico: store.resultsClassico,
        resultsBuffett: store.resultsBuffett,
        history: store.history,
        projYears: store.projYears,
        scenarios: store.scenarios,
        scenarioResults,
        fundamentals,
      })
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${store.ticker}-valuation-${new Date().toISOString().slice(0, 10)}.html`
      anchor.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const llHint = store.history.length
    ? `Fonte: ${store.history[0].year} · ${store.history[0].value.toLocaleString('pt-BR')}`
    : 'Ano de referência para projeção'

  const currentTicker = store.ticker || searchTicker
  const isSaved = currentTicker ? watchlist.has(currentTicker) : false

  // Determine what to show as the company header data
  const headerData = apiData ?? (store.ticker ? {
    ticker: store.ticker,
    name: store.companyName ?? store.ticker,
    price: store.assumptions.price ?? 0,
    changePercent: 0,
    netIncomeHistory: [],
  } as StockQuote : null)

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:overflow-hidden">
      {/* Header */}
      <header className="bg-bg-2 border-b border-border px-5 py-[10px]
                          flex items-center gap-4 sticky top-0 z-40 flex-shrink-0">
        <DCFSearch
          initialValue={currentTicker ?? ''}
          isLoading={isFetching}
          onSearch={handleSearch}
        />
        <button
          onClick={() => setSettingsOpen(true)}
          className="ml-auto bg-none border border-border rounded-[10px] text-text-sec text-[13px]
                     font-ui px-[14px] h-[38px] cursor-pointer flex items-center gap-1.5
                     hover:bg-bg-3 hover:text-text-base transition-colors shrink-0"
        >
          <Settings size={14} />
          <span className="hidden sm:inline">Configurações</span>
        </button>
      </header>

      {/* Main layout */}
      {!store.ticker && !isFetching ? (
        <div className="flex flex-col flex-1 items-center justify-center gap-[14px]
                        text-text-muted text-center p-10">
          <div className="opacity-[0.15] text-cyan flex justify-center">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="16" height="16" x="2" y="2" rx="2"/>
              <path d="M8 8h8M8 12h8M8 16h4"/>
            </svg>
          </div>
          <div className="text-[18px] text-text-sec font-semibold">Calculadora DCF</div>
          <div className="text-[14px] max-w-[340px] leading-[1.7] text-text-sec">
            Digite o código de uma ação da B3 acima para calcular o preço teto por
            Fluxo de Caixa Descontado.
          </div>
        </div>
      ) : (
        <div className="grid flex-1 md:overflow-hidden grid-cols-1 md:grid-cols-[390px_1fr]">
          {/* Left panel */}
          <div className="bg-bg-2 border-b md:border-b-0 md:border-r border-border md:overflow-y-auto p-5">
            <div className="text-[11px] font-semibold text-text-muted tracking-[0.12em] uppercase mb-[14px]">
              Premissas
            </div>

            <DCFCompanyHeader data={headerData} isLoading={isFetching} />

            <DCFInputPanel
              assumptions={store.assumptions}
              overrides={store.overrides}
              apiVals={store.apiVals}
              llHint={llHint}
              onAssumptionChange={handleAssumptionChange}
              onRestore={handleRestore}
            />

            <DCFResultPanel
              results={store.results}
              resultsClassico={store.resultsClassico}
              resultsBuffett={store.resultsBuffett}
              dcfMethod={store.dcfMethod}
              assumptions={store.assumptions}
              ticker={store.ticker}
              onSave={handleSave}
              isSaved={isSaved}
              onOpenMethodModal={() => setMethodModalOpen(true)}
              scenarios={store.scenarios}
              scenarioResults={scenarioResults}
              onToggleScenarios={(g) => store.toggleScenarios(g)}
              onSetScenario={(key, value) => store.setScenario(key, value)}
              onExportHTML={handleExportHTML}
              isExporting={isExporting}
            />
          </div>

          {/* Right panel */}
          <div className="bg-bg-1 md:overflow-y-auto p-5">
            <DCFTable
              results={store.results}
              history={store.history}
              assumptions={store.assumptions}
              yearOverrides={store.yearOverrides as Record<number, number>}
              projYears={store.projYears}
              onSetProjYears={(y) => store.setProjYears(y)}
              onYearLLChange={handleYearLLChange}
              onYearGrowthChange={handleYearGrowthChange}
            />
          </div>
        </div>
      )}

      {/* DCF Method Modal */}
      <DCFMethodModal
        open={methodModalOpen}
        currentMethod={store.dcfMethod}
        onApply={(method) => store.setDCFMethod(method)}
        onClose={() => setMethodModalOpen(false)}
      />

      {/* Settings Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
        >
          <div className="bg-bg-2 border border-border rounded-[20px] p-7 w-[420px] max-w-[92vw]
                          shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <div className="text-[17px] font-semibold mb-[18px]">Configurações</div>
            <div className="mb-[14px]">
              <div className="text-[13px] text-text-sec block mb-1.5">Fonte de dados</div>
              <div className="text-[13px] text-text-sec leading-relaxed">
                Os dados são obtidos via <strong className="text-text-base">yfinance</strong> pelo
                servidor local (<code className="font-mono text-cyan text-[12px]">server.py</code>).<br />
                Nenhuma API key necessária — funciona 100% offline após instalação.
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setSettingsOpen(false)}
                className="bg-none border border-border rounded-[10px] text-text-sec text-sm
                           font-ui h-[42px] px-[18px] cursor-pointer hover:bg-bg-3 hover:text-text-base
                           transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
