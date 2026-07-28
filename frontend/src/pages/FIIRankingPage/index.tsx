import { useState, useMemo, useCallback } from 'react'
import { Building2 } from 'lucide-react'
import { useBatchFIIs } from '../../api/fiis'
import type { FIIData as ApiFIIData } from '../../api/fiis'
import { B3_FII_TICKERS } from '../../data/b3Tickers'
import { calcThomazFIIScore } from '../../engines/fii-scores'
import type { FIIData as EngineFIIData, RankedFII } from '../../engines/fii-scores'
import { FIISegmentTabs } from './FIISegmentTabs'
import { FIIFilterChips } from './FIIFilterChips'
import type { FIIFilterConfig } from './FIIFilterChips'
import { FIITable } from './FIITable'

const DEFAULT_FILTER: FIIFilterConfig = {
  dyMin:       0.06,
  liquidezMin: 500_000,
  vacanciMax:  0.25,
  pvpMin:      0.70,
  ffoYieldMin: null,
}

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
    return calcThomazFIIScore(filtered as unknown as EngineFIIData[])
  }, [rawFIIs, filterConfig, segment, refreshKey])

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

  return (
    <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-4">
      {/* Hero */}
      <div
        className="rounded-[20px] px-8 py-7 border border-border"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,.06) 0%, var(--bg-2) 60%)' }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center"
            style={{ background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.3)' }}
          >
            <Building2 size={24} className="text-cyan" />
          </div>
          <div>
            <div className="text-[24px] font-extrabold">Ranking de FIIs · B3</div>
            <div className="text-[13px] text-text-sec mt-0.5">Rank Thomaz FII — rank DY + rank P/VP</div>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          {[
            { id: 'count', label: 'FIIs analisados', val: stats?.count ?? '—', color: 'text-cyan' },
            { id: 'dy', label: 'DY médio', val: fPct(stats?.dy), color: 'text-green' },
            { id: 'pvp', label: 'P/VP médio', val: fNum2(stats?.pvp), color: 'text-cyan' },
            { id: 'vac', label: 'Vacância média', val: fPct(stats?.vac), color: 'text-amber' },
          ].map(({ id, label, val, color }) => (
            <div
              key={id}
              className="bg-bg-3 border border-border rounded-[10px] px-5 py-3 text-center min-w-[110px]"
            >
              <div className={`font-mono text-[20px] font-bold ${color}`}>
                {isLoading ? <span className="skeleton inline-block w-12 h-5 rounded" /> : String(val)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Segment tabs */}
      <FIISegmentTabs active={segment} onChange={setSegment} />

      {/* Filter chips */}
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

      {/* Table */}
      {isLoading ? (
        <div className="bg-bg-2 border border-border rounded-[14px] p-10 text-center text-text-muted text-[13px]">
          Carregando FIIs...
        </div>
      ) : (
        <FIITable rows={rankedRows} favorites={favorites} onToggleFavorite={toggleFavorite} />
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
