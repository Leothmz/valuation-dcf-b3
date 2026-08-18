import { useState, useMemo, useCallback } from 'react'
import { Building2 } from 'lucide-react'
import { useBatchFIIs } from '../../api/fiis'
import type { FIIData as ApiFIIData } from '../../api/fiis'
import { B3_FII_TICKERS } from '../../data/b3Tickers'
import { calcThomazFIIScore } from '../../engines/fii-scores'
import type { FIIData as EngineFIIData, RankedFII } from '../../engines/fii-scores'
import { ScrollableTabs } from '../../components/ScrollableTabs'
import type { TabItem } from '../../components/ScrollableTabs'
import { BottomSheet } from '../../components/BottomSheet'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { FIIFilterChips } from './FIIFilterChips'
import type { FIIFilterConfig } from './FIIFilterChips'
import { FIITable } from './FIITable'
import { FIIMobileList } from './FIIMobileList'

const DEFAULT_FILTER: FIIFilterConfig = {
  dyMin:       0.06,
  liquidezMin: 500_000,
  vacanciMax:  0.25,
  pvpMin:      0.70,
  ffoYieldMin: null,
}

// Chaves de FIIFilterConfig que representam filtros de fato — usado para contar o
// badge do botão "Filtros" no mobile (mesmo padrão de RankingPage/index.tsx).
const FILTERABLE_KEYS: (keyof FIIFilterConfig)[] = [
  'dyMin', 'liquidezMin', 'vacanciMax', 'pvpMin', 'ffoYieldMin',
]

function countActiveFilters(fc: FIIFilterConfig): number {
  return FILTERABLE_KEYS.filter((k) => fc[k] !== DEFAULT_FILTER[k]).length
}

const SEGMENT_TABS: TabItem<string>[] = [
  { key: 'todos',        label: 'Todos'        },
  { key: 'Logística',    label: 'Logística'    },
  { key: 'Shoppings',    label: 'Shoppings'    },
  { key: 'Lajes Corp.',  label: 'Lajes Corp.'  },
  { key: 'Papel/CRI',    label: 'Papel/CRI'    },
  { key: 'Residencial',  label: 'Residencial'  },
  { key: 'Híbrido',      label: 'Híbrido'      },
  { key: 'Renda Urbana', label: 'Renda Urbana' },
  { key: 'Hotel',        label: 'Hotel'        },
  { key: 'Fiagro',       label: 'Fiagro'       },
]

function fPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}
function fNum2(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function applyFilters(fiis: ApiFIIData[], fc: FIIFilterConfig, segment: string): ApiFIIData[] {
  let result = fiis.filter((f) => {
    if (fc.dyMin != null && f.dy != null && f.dy < fc.dyMin) return false
    if (fc.liquidezMin != null && (f.liquidez == null || f.liquidez < fc.liquidezMin)) return false
    if (fc.vacanciMax != null && f.vacancia != null && f.vacancia > fc.vacanciMax) return false
    if (fc.pvpMin != null && f.pvp != null && f.pvp < fc.pvpMin) return false
    if (fc.ffoYieldMin != null && (f.ffoYield == null || f.ffoYield < fc.ffoYieldMin)) return false
    return true
  })
  if (segment !== 'todos') {
    result = result.filter((f) => f.segmento === segment)
  }
  return result
}

export function FIIRankingPage() {
  const [filterConfig, setFilterConfig] = useState<FIIFilterConfig>(DEFAULT_FILTER)
  const [segment, setSegment] = useState('todos')
  const [customTickers, setCustomTickers] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)
  const [sortCol, setSortCol] = useState('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const isMobile = useIsMobile()

  const allTickers = useMemo(
    () => [...new Set([...B3_FII_TICKERS, ...customTickers])],
    [customTickers]
  )

  const { data: rawFIIs, isLoading } = useBatchFIIs(allTickers)

  // Re-fetch by changing the key
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const rankedRows = useMemo((): RankedFII[] => {
    if (!rawFIIs || rawFIIs.length === 0) return []
    const filtered = applyFilters(rawFIIs, filterConfig, segment)
    // Cast api FIIData to engine FIIData — structurally compatible via index signature
    const scored = calcThomazFIIScore(filtered as unknown as EngineFIIData[])

    // "rank" (posição no Rank Thomaz FII) é o próprio _scoreThomazFII — calcThomazFIIScore
    // já devolve a lista ordenada por ele; os outros critérios reordenam por cima.
    const col = sortCol === 'rank' ? '_scoreThomazFII' : sortCol
    const dir = sortDir === 'asc' ? 1 : -1
    return [...scored].sort((a, b) => {
      const va = (a as unknown as Record<string, number | string | null | undefined>)[col]
      const vb = (b as unknown as Record<string, number | string | null | undefined>)[col]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'string' && typeof vb === 'string') return dir * va.localeCompare(vb, 'pt-BR')
      return dir * ((va as number) - (vb as number))
    })
  }, [rawFIIs, filterConfig, segment, refreshKey, sortCol, sortDir])

  // Hero stats
  const stats = useMemo(() => {
    if (!rankedRows.length) return null
    const validDY = rankedRows.filter((f) => f.dy != null)
    const validPVP = rankedRows.filter((f) => f.pvp != null)
    const validVac = rankedRows.filter((f) => (f as unknown as ApiFIIData).vacancia != null)
    const avg = (arr: RankedFII[], key: string) =>
      arr.reduce((s, f) => s + (f[key] as number), 0) / arr.length
    return {
      count: rankedRows.length,
      dy: validDY.length ? avg(validDY, 'dy') : null,
      pvp: validPVP.length ? avg(validPVP, 'pvp') : null,
      vac: validVac.length ? avg(validVac, 'vacancia') : null,
    }
  }, [rankedRows])

  function toggleFavorite(ticker: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(ticker)) next.delete(ticker)
      else next.add(ticker)
      return next
    })
  }

  function addCustomTicker(ticker: string) {
    if (!customTickers.includes(ticker)) {
      setCustomTickers((prev) => [...prev, ticker])
    }
  }

  function removeCustomTicker(ticker: string) {
    setCustomTickers((prev) => prev.filter((t) => t !== ticker))
  }

  // Segmento conta junto: escondido dentro do painel, precisa aparecer no contador.
  const activeControlCount = countActiveFilters(filterConfig) + (segment !== 'todos' ? 1 : 0)

  // Mesmo elemento reaproveitado no BottomSheet (mobile) e inline (desktop) — evita
  // duplicar o JSX de props idênticas nos dois lugares.
  const filterChipsEl = (
    <div className="flex flex-col gap-3">
      {/* Ordenação mora com os filtros: no mobile ocupava uma faixa inteira acima
          da lista e é decisão eventual, não a cada varredura. */}
      {isMobile && (
      <div className="flex gap-2">
        <select
          value={sortCol}
          onChange={(e) => setSortCol(e.target.value)}
          className="flex-1 min-h-[44px] rounded-[9px] border border-border px-3 text-[16px] text-text-base"
          style={{ background: 'var(--color-bg-2)' }}
          aria-label="Ordenar por"
        >
          <option value="rank">Rank</option>
          <option value="ticker">Ticker</option>
          <option value="price">Cotação</option>
          <option value="dy">DY</option>
          <option value="pvp">P/VP</option>
          <option value="ffoYield">FFO Yield</option>
          <option value="vacancia">Vacância</option>
          <option value="liquidez">Liquidez</option>
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
      )}

      <FIIFilterChips
        config={filterConfig}
        customTickers={customTickers}
        onChange={setFilterConfig}
        onAddTicker={addCustomTicker}
        onRemoveTicker={removeCustomTicker}
        onRefresh={handleRefresh}
        count={rankedRows.length}
        loading={isLoading}
      />

      {/* Segmento entra aqui: é filtro, e filtro mora com os outros filtros. Solta
          no fluxo principal, essa faixa de 10 segmentos empurrava a primeira linha
          de dado para baixo. */}
      <div>
        <div className="text-[11px] font-semibold text-text-muted tracking-[0.08em] uppercase mb-2">
          Segmento
        </div>
        <ScrollableTabs ariaLabel="Segmento" fadeColor="var(--color-bg-2)" tabs={SEGMENT_TABS} active={segment} onSelect={setSegment} />
      </div>
    </div>
  )

  const filtersButton = (
    <button
      onClick={() => setFiltersOpen((v) => !v)}
      aria-expanded={filtersOpen}
      className="flex items-center justify-between gap-3 min-h-[44px] px-3 rounded-[9px] border border-border text-[13px] text-text-sec cursor-pointer hover:border-cyan hover:text-cyan transition-colors"
      style={{ background: 'var(--color-bg-2)' }}
    >
      Filtros
      {activeControlCount > 0 && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
          style={{ background: 'var(--color-cyan)', color: '#04121a' }}
        >
          {activeControlCount}
        </span>
      )}
    </button>
  )

  const loadingBox = (
    <div className="bg-bg-2 border border-border rounded-[14px] p-10 text-center text-text-muted text-[13px]">
      Carregando FIIs...
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-7 md:py-6 flex flex-col gap-4">
      {/* Hero */}
      {/* Hero enxuto no mobile: sem moldura, sem gradiente e com o ícone menor —
          numa tela cujo conteúdo é lista, o cabeçalho custava ~180px antes da
          primeira linha. No desktop a moldura fica. */}
      <div
        className="md:rounded-[20px] md:px-8 md:py-7 md:border md:border-border"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,.06) 0%, var(--color-bg-2) 60%)' }}
      >
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-5">
          <div
            className="w-9 h-9 md:w-12 md:h-12 rounded-[14px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.3)' }}
          >
            <Building2 size={20} className="text-cyan md:hidden" />
            <Building2 size={24} className="text-cyan hidden md:block" />
          </div>
          <div className="min-w-0">
            <div className="text-[19px] md:text-[24px] font-extrabold">Ranking de FIIs · B3</div>
            <div className="text-[12px] md:text-[13px] text-text-sec mt-0.5">Rank Thomaz FII — rank DY + rank P/VP</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:gap-4 md:flex-wrap">
          {[
            { id: 'count', label: 'FIIs analisados', val: stats?.count ?? '—', color: 'text-cyan' },
            { id: 'dy', label: 'DY médio', val: fPct(stats?.dy), color: 'text-green' },
            { id: 'pvp', label: 'P/VP médio', val: fNum2(stats?.pvp), color: 'text-cyan' },
            { id: 'vac', label: 'Vacância média', val: fPct(stats?.vac), color: 'text-amber' },
          ].map(({ id, label, val, color }) => (
            <div
              key={id}
              className="bg-bg-3 border border-border rounded-[10px] px-3 py-2 md:px-5 md:py-3 text-center md:min-w-[110px]"
            >
              <div className={`font-mono text-[16px] md:text-[20px] font-bold ${color}`}>
                {isLoading ? <span className="skeleton inline-block w-12 h-5 rounded" /> : String(val)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>


      {/* Botão de filtros — mesmo controle nos dois viewports: abre o BottomSheet
          no mobile e o painel colapsável no desktop. */}
      <div className="flex">{filtersButton}</div>

      {/* Filter chips — uma instância só: dentro do BottomSheet no mobile, no painel
          colapsável no desktop. Nunca as duas montadas ao mesmo tempo. */}
      {isMobile ? (
        <BottomSheet
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filtros"
          footer={
            <div className="flex gap-2">
              <button
                onClick={() => setFilterConfig(DEFAULT_FILTER)}
                className="flex-1 min-h-[44px] rounded-[9px] border border-border text-[13px] font-semibold text-text-sec cursor-pointer"
                style={{ background: 'var(--color-bg-1)' }}
              >
                Limpar
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="flex-1 min-h-[44px] rounded-[9px] text-[13px] font-semibold cursor-pointer"
                style={{ background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)', border: '1px solid var(--color-border-glow)' }}
              >
                Aplicar ({rankedRows.length})
              </button>
            </div>
          }
        >
          {filterChipsEl}
        </BottomSheet>
      ) : (
        filtersOpen && (
          <div
            className="rounded-[12px] border border-border px-4 py-3"
            style={{ background: 'var(--color-bg-2)' }}
          >
            {filterChipsEl}
          </div>
        )
      )}

      {/* Montagem condicional (não CSS): lista compacta OU tabela, nunca as duas ao mesmo
          tempo — evita renderizar linhas em dobro e duplicatas no DOM. */}
      {isMobile ? (
        isLoading ? loadingBox : (
          <FIIMobileList rows={rankedRows} favorites={Array.from(favorites)} onToggleFavorite={toggleFavorite} />
        )
      ) : (
        isLoading ? loadingBox : (
          <FIITable rows={rankedRows} favorites={favorites} onToggleFavorite={toggleFavorite} />
        )
      )}

      {/* Perfil legend */}
      <div
        className="flex gap-5 items-center flex-wrap px-4 py-2.5 rounded-[10px]"
        style={{ background: 'rgba(6,182,212,.04)', border: '1px dashed rgba(6,182,212,.2)' }}
      >
        <span className="text-[11px] text-text-muted font-semibold">PERFIL (P/VP):</span>
        <div className="flex items-center gap-1.5 text-[11px] text-text-sec">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[12px] text-[10px] font-bold border bg-green/10 border-green/30 text-green">
            Ancoragem
          </span>
          &gt; 0,95
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-sec">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[12px] text-[10px] font-bold border bg-amber/10 border-amber/30 text-amber">
            Crescimento
          </span>
          0,81–0,95
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-sec">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[12px] text-[10px] font-bold border bg-red/10 border-red/30 text-red">
            Risco
          </span>
          ≤ 0,80
        </div>
      </div>
    </div>
  )
}
