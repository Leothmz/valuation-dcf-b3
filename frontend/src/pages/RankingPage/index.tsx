import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRankingStore } from '../../stores'
import { useBatchFundamentals } from '../../api/stocks'
import type { FundamentalsData } from '../../api/stocks'
import { B3_TICKERS } from '../../data/b3Tickers'
import {
  calcThomazScore,
  calcBazinScore,
  calcGrahamScore,
  calcLynchScore,
  calcJoelScore,
} from '../../engines/ranking-scores'
import type { StockData } from '../../engines/ranking-scores'
import { DEFAULT_FILTER_CONFIG } from '../../stores/rankingStore'
import type { FilterConfig, RankingMethod } from '../../stores/rankingStore'
import { ScrollableTabs } from '../../components/ScrollableTabs'
import type { TabItem } from '../../components/ScrollableTabs'
import { BottomSheet } from '../../components/BottomSheet'
import { FilterChips } from './FilterChips'
import { RankingTable } from './RankingTable'
import { RankingMobileList } from './RankingMobileList'

const MAX_COMPARE = 3

type SectorTab = '' | 'insurance' | 'banks'

const METHOD_TABS: TabItem<RankingMethod>[] = [
  { key: 'thomaz', label: 'Rank Thomaz' },
  { key: 'bazin',  label: 'Rank Bazin'  },
  { key: 'graham', label: 'Rank Graham' },
  { key: 'lynch',  label: 'Rank Lynch'  },
  { key: 'joel',   label: 'Rank Joel'   },
]

const SECTOR_TABS: TabItem<SectorTab>[] = [
  { key: '',          label: 'Todos'       },
  { key: 'insurance', label: 'Seguradoras' },
  { key: 'banks',     label: 'Bancos'      },
]

// Chaves de FilterConfig que representam filtros de fato (exclui campos de estado de UI
// como `show`, `sectorTab`, `extrasOpen`) — usado para contar o badge do botão "Filtros".
const FILTERABLE_KEYS: (keyof FilterConfig)[] = [
  'taxaBazin', 'taxaGraham', 'taxaLynch', 'plMin', 'plMax',
  'deMin', 'deMax', 'dyMin', 'margemMin', 'roeMin', 'liquidezMin',
]

function countActiveFilters(fc: FilterConfig): number {
  return FILTERABLE_KEYS.filter((k) => fc[k] !== DEFAULT_FILTER_CONFIG[k]).length
}

// Enriched ranked row — includes valuation columns from all 4 methods
export interface RankedRow extends StockData {
  rank: number
  score: number | null
  fairPrice?: number | null
  bazinFairPrice: number | null
  grahamFairPrice: number | null
  lynchVal: number | null
  joelVal: number | null
  setor?: string
  subsetor?: string
  isCustom?: boolean
}

// Deduplicate tickers from the same company — keep the one with highest liquidity
function deduplicateByCompany(stocks: StockData[]): StockData[] {
  const map = new Map<string, StockData>()
  for (const s of stocks) {
    const key = s.ticker.slice(0, 4)
    const prev = map.get(key)
    if (!prev || ((s.liquidezMedia ?? 0) > (prev.liquidezMedia ?? 0))) {
      map.set(key, s)
    }
  }
  return [...map.values()]
}

export function RankingPage() {
  const {
    method,
    filterConfig,
    weights,
    favorites,
    customTickers,
    sortCol,
    sortDir,
    setMethod,
    setFilterConfig,
    resetFilterConfig,
    toggleFavorite,
    addCustomTicker,
    removeCustomTicker,
    setSortCol,
    setSortDir,
  } = useRankingStore()

  const navigate = useNavigate()
  const [sectorTab, setSectorTab] = useState<SectorTab>('')
  const [search, setSearch] = useState('')
  const [newTicker, setNewTicker] = useState('')
  const [compareSelection, setCompareSelection] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  function toggleCompareSelection(ticker: string) {
    setCompareSelection((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : prev.length < MAX_COMPARE ? [...prev, ticker] : prev
    )
  }

  function handleCompareGo() {
    if (compareSelection.length < 2) return
    navigate(`/compare?tickers=${compareSelection.join(',')}`)
  }

  const allTickers = useMemo(
    () => [...B3_TICKERS, ...customTickers.filter((t) => !B3_TICKERS.includes(t))],
    [customTickers]
  )

  const { data: rawStocks, isLoading } = useBatchFundamentals(allTickers)

  function handleAddTicker() {
    const t = newTicker.trim().toUpperCase()
    if (!t) return
    addCustomTicker(t)
    setNewTicker('')
  }

  // Apply full pipeline: filter → deduplicate → score all 4 methods → rank active method
  const rankedRows = useMemo((): RankedRow[] => {
    if (!rawStocks || rawStocks.length === 0) return []

    const fc = filterConfig
    const isSectorTab = sectorTab === 'insurance' || sectorTab === 'banks'

    // Cast FundamentalsData → StockData (they are structurally compatible)
    let stocks = (rawStocks as StockData[])

    if (isSectorTab) {
      // Bancos/Seguradoras: show every ticker of the sector, ranked by the same
      // method as "Todos" — the generic pre-filters below target non-financial
      // companies (DY/P-L/DL-EBITDA/margem/ROE conventions don't hold for banks
      // and insurers) and would otherwise hide most or all of the sector.
      const keyword = sectorTab === 'insurance' ? 'insurance' : 'bank'
      stocks = stocks.filter((s) => String(s.subsetor ?? '').toLowerCase().includes(keyword))
    } else {
      // 1. Liquidity pre-filter
      stocks = stocks.filter((s) => (s.liquidezMedia ?? 0) >= (fc.liquidezMin ?? 0))
    }

    // 2. Deduplication (same company, multiple tickers)
    stocks = deduplicateByCompany(stocks)

    // 3. Pre-filters (skipped entirely for Bancos/Seguradoras tabs)
    if (!isSectorTab) {
      stocks = stocks.filter((s) => {
        const isFinancial = /bank|insurance/.test(String(s.subsetor ?? '').toLowerCase())
        if (fc.plMin != null && (s.pl == null || s.pl < fc.plMin)) return false
        if (fc.plMax != null && (s.pl == null || s.pl > fc.plMax)) return false
        // DL/EBITDA doesn't apply to banks/insurers — they don't report EBITDA
        if (!isFinancial) {
          if (fc.deMin != null && (s.dividaLiquidaEbit == null || s.dividaLiquidaEbit < fc.deMin)) return false
          if (fc.deMax != null && (s.dividaLiquidaEbit == null || s.dividaLiquidaEbit > fc.deMax)) return false
        }
        if (fc.dyMin != null && fc.dyMin > 0 && (s.dy == null || s.dy < fc.dyMin)) return false
        if (fc.margemMin != null && fc.margemMin > 0 && (s.margemLiquida == null || s.margemLiquida < fc.margemMin)) return false
        if (fc.roeMin != null && fc.roeMin > 0 && (s.roe == null || s.roe < fc.roeMin)) return false
        return true
      })
    }

    // 4. Calculate valuation fields for ALL methods (for table columns)
    const bazinScored  = calcBazinScore(stocks, fc.taxaBazin)
    const grahamScored = calcGrahamScore(stocks, fc.taxaGraham)
    const lynchScored  = calcLynchScore(stocks)
    const joelScored   = calcJoelScore(stocks)

    const stocksWithVals = stocks.map((s, i) => ({
      ...s,
      bazinFairPrice:  bazinScored[i]?.fairPrice ?? null,
      grahamFairPrice: grahamScored[i]?.fairPrice ?? null,
      lynchVal:        (lynchScored[i] as { _peg?: number | null })?._peg ?? null,
      joelVal:         (joelScored[i] as { _earningsYield?: number | null })?._earningsYield ?? null,
      isCustom:        customTickers.includes(s.ticker),
    }))

    // 5. Score with active method
    let ranked
    switch (method) {
      case 'thomaz': ranked = calcThomazScore(stocksWithVals, weights); break
      case 'bazin':  ranked = calcBazinScore(stocksWithVals, fc.taxaBazin); break
      case 'graham': ranked = calcGrahamScore(stocksWithVals, fc.taxaGraham); break
      case 'lynch':  ranked = calcLynchScore(stocksWithVals); break
      case 'joel':   ranked = calcJoelScore(stocksWithVals); break
      default:       ranked = stocksWithVals.map((s) => ({ ...s, score: null }))
    }

    // Preserve valuation columns (scoring may overwrite them)
    const rankedWithVals = ranked.map((s, i) => ({
      bazinFairPrice:  stocksWithVals[i]?.bazinFairPrice  ?? null,
      grahamFairPrice: stocksWithVals[i]?.grahamFairPrice ?? null,
      lynchVal:        stocksWithVals[i]?.lynchVal        ?? null,
      joelVal:         stocksWithVals[i]?.joelVal         ?? null,
      ...s,
    })) as (typeof stocksWithVals[0] & { score: number | null; fairPrice?: number | null })[]

    // 6. Sort
    const dir = sortDir === 'asc' ? 1 : -1
    const sorted = [...rankedWithVals].sort((a, b) => {
      const col = sortCol as keyof typeof a
      const va = a[col] as number | string | null
      const vb = b[col] as number | string | null
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'string' && typeof vb === 'string') return dir * va.localeCompare(vb, 'pt-BR')
      return dir * ((va as number) - (vb as number))
    })

    // 7. Assign rank
    const withRank = sorted.map((s, i) => ({ ...s, rank: i + 1 })) as RankedRow[]

    // 8. Display filters (sector already applied above; favorites, search)
    let result = withRank
    if (fc.show === 'favoritos') {
      result = result.filter((s) => favorites.includes(s.ticker))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((s) =>
        s.ticker.toLowerCase().includes(q) ||
        ((s as FundamentalsData).name ?? '').toLowerCase().includes(q)
      )
    }

    return result
  }, [rawStocks, method, filterConfig, weights, sortCol, sortDir, sectorTab, favorites, search, customTickers])

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const totalLoaded = rawStocks?.length ?? 0
  const showing = rankedRows.length
  const activeFilterCount = countActiveFilters(filterConfig)

  // Mesmo elemento reaproveitado no BottomSheet (mobile) e no painel fixo (desktop) —
  // evita duplicar o JSX de props idênticas nos dois lugares.
  const filterChipsEl = (
    <FilterChips
      config={filterConfig}
      onChange={setFilterConfig}
      onReset={resetFilterConfig}
    />
  )

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-4 md:px-6 md:py-7 pb-16 flex flex-col gap-5">
      {/* Hero header */}
      <div
        className="rounded-[16px] border border-border p-6"
        style={{ background: 'linear-gradient(180deg, #0d1829 0%, #0b0f17 100%)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[24px] font-bold text-text-base leading-tight">
              Ranking de Ações · B3
            </h1>
            <p className="text-[13px] text-text-muted mt-1">
              {isLoading
                ? `Carregando ${allTickers.length} tickers…`
                : `${totalLoaded} tickers carregados · exibindo ${showing}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Add custom ticker */}
            <input
              type="text"
              className="rounded-[10px] border border-border bg-bg-3 text-text-base text-[13px] px-[14px] py-[7px] outline-none w-36 placeholder-text-muted focus:border-cyan"
              placeholder="Adicionar ticker…"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTicker() }}
            />
            <button
              onClick={handleAddTicker}
              className="rounded-[10px] border border-border bg-bg-3 text-text-sec text-[13px] px-3 py-[7px] cursor-pointer hover:border-cyan hover:text-cyan"
            >
              + Add
            </button>
            {/* Search */}
            <input
              type="text"
              className="rounded-[10px] border border-border bg-bg-3 text-text-base text-[13px] px-[14px] py-[7px] outline-none w-56 placeholder-text-muted focus:border-cyan"
              placeholder="Buscar ticker ou empresa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Custom tickers chips */}
        {customTickers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {customTickers.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-[6px]"
                style={{ background: 'var(--color-amber-dim)', color: 'var(--color-amber)', border: '1px solid rgba(245,158,11,.2)' }}
              >
                {t}
                <button
                  onClick={() => removeCustomTicker(t)}
                  title={`Remover ${t}`}
                  className="cursor-pointer leading-none"
                  style={{ background: 'none', border: 'none', padding: 0, color: 'inherit' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Method tabs — pills fixas no desktop, faixa rolável no mobile */}
        <ScrollableTabs ariaLabel="Método de ranking" tabs={METHOD_TABS} active={method} onSelect={setMethod} />
      </div>

      {/* Mobile toolbar: ordenação + filtros + comparar */}
      <div className="md:hidden flex gap-2">
        <select
          value={sortCol}
          onChange={(e) => setSortCol(e.target.value)}
          className="flex-1 min-h-[44px] rounded-[9px] border border-border px-3 text-[16px] text-text-base"
          style={{ background: 'var(--color-bg-2)' }}
          aria-label="Ordenar por"
        >
          <option value="rank">Posição</option>
          <option value="ticker">Ticker</option>
          <option value="price">Cotação</option>
          <option value="dy">DY</option>
          <option value="pl">P/L</option>
          <option value="roe">ROE</option>
          <option value="margemLiquida">Margem Líquida</option>
          <option value="dividaLiquidaEbit">DL/EBITDA</option>
        </select>
        <button
          onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
          aria-label={sortDir === 'desc' ? 'Ordem decrescente' : 'Ordem crescente'}
          className="min-w-[44px] min-h-[44px] rounded-[9px] border border-border text-text-sec cursor-pointer"
          style={{ background: 'var(--color-bg-2)' }}
        >
          {sortDir === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      <div className="md:hidden flex gap-2">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex-1 flex items-center justify-between min-h-[44px] px-3 rounded-[9px] border border-border text-[13px] text-text-sec cursor-pointer"
          style={{ background: 'var(--color-bg-2)' }}
        >
          Filtros
          {activeFilterCount > 0 && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                  style={{ background: 'var(--color-cyan)', color: '#04121a' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setCompareMode((v) => !v)}
          aria-pressed={compareMode}
          className="min-h-[44px] px-3 rounded-[9px] border text-[13px] font-semibold cursor-pointer"
          style={{
            background: compareMode ? 'rgba(6,182,212,.15)' : 'var(--color-bg-2)',
            color: compareMode ? 'var(--color-cyan)' : 'var(--color-text-sec)',
            borderColor: compareMode ? 'rgba(6,182,212,.4)' : 'var(--color-border)',
          }}
        >
          Comparar
        </button>
      </div>

      <BottomSheet isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
        {filterChipsEl}
      </BottomSheet>

      {/* Filter chips — desktop apenas; no mobile vivem dentro do BottomSheet acima */}
      <div
        className="hidden md:block rounded-[12px] border border-border px-4 py-3"
        style={{ background: 'var(--color-bg-2)' }}
      >
        {filterChipsEl}
      </div>

      {/* Sector tabs + lista/tabela */}
      <div>
        <ScrollableTabs ariaLabel="Setor" tabs={SECTOR_TABS} active={sectorTab} onSelect={setSectorTab} />

        <RankingMobileList
          rows={rankedRows}
          method={method}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onRemoveCustom={removeCustomTicker}
          compareMode={compareMode}
          compareSelection={compareSelection}
          onToggleCompare={toggleCompareSelection}
          maxCompare={MAX_COMPARE}
        />

        <div className="hidden md:block mt-4">
          <RankingTable
            rows={rankedRows}
            isLoading={isLoading}
            favorites={favorites}
            onToggleFav={toggleFavorite}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={handleSort}
            onRemoveCustom={removeCustomTicker}
            compareSelection={compareSelection}
            onToggleCompare={toggleCompareSelection}
            maxCompare={MAX_COMPARE}
          />
        </div>
      </div>

      {compareSelection.length > 0 && (
        <div
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-[12px] border border-border px-4 py-3"
          style={{ background: 'var(--color-bg-2)', boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}
        >
          <span className="text-[13px] text-text-sec">
            {compareSelection.length} ticker{compareSelection.length > 1 ? 's' : ''} selecionado{compareSelection.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleCompareGo}
            disabled={compareSelection.length < 2}
            className="rounded-[8px] text-[13px] font-medium px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)', border: '1px solid var(--color-border-glow)' }}
          >
            Comparar
          </button>
          <button
            onClick={() => setCompareSelection([])}
            className="text-[13px] text-text-muted cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            Limpar
          </button>
        </div>
      )}
    </div>
  )
}
