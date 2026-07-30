import { useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Building2, Search } from 'lucide-react'
import { useFIIData } from '../../api/fiis'
import { B3_FII_TICKERS } from '../../data/b3Tickers'
import { AnaliseFIIHero } from './AnaliseFIIHero'
import { AnaliseFIIIndicadores } from './AnaliseFIIIndicadores'
import { AnaliseFIIProventos } from './AnaliseFIIProventos'
import { AnaliseFIIGrafico } from './AnaliseFIIGrafico'
import { useTabArrowNav } from '../../hooks/useKeyBinding'
import { ScrollableTabs } from '../../components/ScrollableTabs'

type TabId = 'indicadores' | 'proventos' | 'grafico'

const TABS: { id: TabId; label: string }[] = [
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'proventos', label: 'Proventos' },
  { id: 'grafico', label: 'Gráfico' },
]

function SearchBar({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const navigate = useNavigate()

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value.toUpperCase()
    setValue(q)
    setFocusedIdx(-1)
    if (!q) { setSuggestions([]); return }
    const hits = B3_FII_TICKERS.filter((t) => t.startsWith(q)).slice(0, 8)
    setSuggestions(hits)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit(e as unknown as React.FormEvent)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      const t = suggestions[focusedIdx]
      setValue(t)
      setSuggestions([])
      navigate(`/analise-fii?ticker=${encodeURIComponent(t)}`)
    } else if (e.key === 'Escape') {
      setSuggestions([])
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = value.trim().toUpperCase()
    if (t) {
      setSuggestions([])
      navigate(`/analise-fii?ticker=${encodeURIComponent(t)}`)
    }
  }

  function handleSelect(ticker: string) {
    setValue(ticker)
    setSuggestions([])
    navigate(`/analise-fii?ticker=${encodeURIComponent(ticker)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-1 max-w-md">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Buscar FII… (ex: HGLG11)"
          autoComplete="off"
          spellCheck={false}
          className="w-full h-11 bg-bg-3 border border-border rounded-[10px] text-text-base
                     font-mono text-[16px] md:text-sm px-[14px] uppercase outline-none
                     placeholder:text-text-muted placeholder:normal-case
                     focus:border-cyan focus:shadow-[0_0_0_2px_rgba(6,182,212,0.15)]
                     transition-colors"
        />
        {suggestions.length > 0 && (
          <div
            className="absolute top-[calc(100%+4px)] left-0 right-0 bg-bg-2 border border-border
                       rounded-[10px] overflow-hidden z-50 shadow-lg"
          >
            {suggestions.map((t, i) => (
              <div
                key={t}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(t) }}
                className={`px-[14px] py-[9px] font-mono text-[13px] cursor-pointer text-text-base
                            hover:bg-bg-4 hover:text-cyan
                            ${i === focusedIdx ? 'bg-bg-4 text-cyan' : ''}`}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="h-11 min-w-[44px] px-5 bg-cyan text-bg-0 font-bold text-[13px] rounded-[10px]
                   cursor-pointer hover:bg-[#0891b2] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Search size={14} />
          Buscar
        </span>
      </button>
    </form>
  )
}

export function AnaliseFIIPage() {
  const [searchParams] = useSearchParams()
  const ticker = searchParams.get('ticker')?.toUpperCase() ?? null
  const [activeTab, setActiveTab] = useState<TabId>('indicadores')
  const touchStartX = useRef(0)

  useTabArrowNav(TABS.map((t) => t.id), activeTab, setActiveTab)

  const { data, isLoading, error } = useFIIData(ticker)

  const showContent = !!ticker
  const hasError = !!error && !isLoading

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 60) return
    const i = TABS.findIndex((t) => t.id === activeTab)
    const next = dx < 0 ? i + 1 : i - 1
    if (next >= 0 && next < TABS.length) setActiveTab(TABS[next].id) // sem dar volta nas pontas
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 md:px-6 md:py-3.5 border-b border-border bg-bg-2 flex gap-2.5 items-center">
        <SearchBar initialValue={ticker ?? ''} />
        {hasError && (
          <span className="text-red text-[13px]">
            FII &quot;{ticker}&quot; não encontrado
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 flex flex-col gap-5">
        {!showContent ? (
          <EmptyState />
        ) : hasError ? (
          <div
            className="rounded-[10px] px-5 py-4 text-red text-[14px]"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            FII &quot;{ticker}&quot; não encontrado. Verifique o código e tente novamente.
          </div>
        ) : (
          <>
            <AnaliseFIIHero data={data} isLoading={isLoading} />

            {/* Tabs */}
            <ScrollableTabs
              tabs={TABS.map((t) => ({ key: t.id, label: t.label }))}
              active={activeTab}
              onSelect={setActiveTab}
              ariaLabel="Seções da análise de FII"
            />

            {/* Tab panes */}
            <div className="pt-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              {activeTab === 'indicadores' && (
                data ? <AnaliseFIIIndicadores data={data} /> : <TabSkeleton />
              )}
              {activeTab === 'proventos' && (
                data ? <AnaliseFIIProventos data={data} /> : <TabSkeleton />
              )}
              {activeTab === 'grafico' && ticker && (
                <AnaliseFIIGrafico ticker={ticker} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3.5 text-text-muted text-center">
      <div className="opacity-15 text-cyan">
        <Building2 size={56} strokeWidth={1.2} />
      </div>
      <div className="text-[18px] text-text-sec font-semibold">Análise Avançada de FIIs</div>
      <div className="text-[14px] max-w-[340px] leading-7 text-text-sec">
        Digite o código de um FII da B3 acima para ver indicadores, histórico de proventos e gráfico de cotação.
      </div>
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="bg-bg-3 border border-border rounded-[10px] p-4 h-20 skeleton" />
          ))}
        </div>
      ))}
    </div>
  )
}
