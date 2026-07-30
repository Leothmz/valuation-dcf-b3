import { useState, useRef, useEffect } from 'react'

export interface FIIFilterConfig {
  dyMin: number | null
  liquidezMin: number | null
  vacanciMax: number | null
  pvpMin: number | null
  ffoYieldMin: number | null
}

interface Props {
  config: FIIFilterConfig
  customTickers: string[]
  onChange: (config: FIIFilterConfig) => void
  onAddTicker: (ticker: string) => void
  onRemoveTicker: (ticker: string) => void
  onRefresh: () => void
  count: number | null
  loading: boolean
}

function fLiq(v: number | null): string {
  if (v == null) return '—'
  if (v >= 1e9) return 'R$ ' + (v / 1e9).toFixed(1).replace('.', ',') + 'B'
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toFixed(1).replace('.', ',') + 'M'
  if (v >= 1e3) return 'R$ ' + Math.round(v / 1e3) + 'k'
  return 'R$ ' + v.toLocaleString('pt-BR')
}
function fPct(v: number | null): string {
  if (v == null) return '—'
  return (v * 100).toFixed(1).replace('.', ',') + '%'
}
function fNum2(v: number | null): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type FilterKey = keyof FIIFilterConfig

interface ChipDef {
  id: FilterKey
  label: (v: number | null) => string
  inputLabel: string
  toDisplay: (v: number | null) => string
  fromInput: (s: string) => number | null
}

const CHIPS: ChipDef[] = [
  {
    id: 'dyMin',
    label: (v) => v != null ? `DY ≥ ${fPct(v)}` : 'DY mín',
    inputLabel: 'DY mínimo (%)',
    toDisplay: (v) => v != null ? (v * 100).toFixed(1) : '',
    fromInput: (s) => s === '' ? null : parseFloat(s.replace(',', '.')) / 100,
  },
  {
    id: 'liquidezMin',
    label: (v) => v != null ? `Liq ≥ ${fLiq(v)}` : 'Liquidez mín',
    inputLabel: 'Liquidez mínima (R$)',
    toDisplay: (v) => v != null ? String(v) : '',
    fromInput: (s) => s === '' ? null : parseFloat(s.replace(/\./g, '').replace(',', '.')),
  },
  {
    id: 'vacanciMax',
    label: (v) => v != null ? `Vac ≤ ${fPct(v)}` : 'Vacância máx',
    inputLabel: 'Vacância máxima (%)',
    toDisplay: (v) => v != null ? (v * 100).toFixed(1) : '',
    fromInput: (s) => s === '' ? null : parseFloat(s.replace(',', '.')) / 100,
  },
  {
    id: 'pvpMin',
    label: (v) => v != null ? `P/VP ≥ ${fNum2(v)}` : 'P/VP mín',
    inputLabel: 'P/VP mínimo',
    toDisplay: (v) => v != null ? v.toFixed(2) : '',
    fromInput: (s) => s === '' ? null : parseFloat(s.replace(',', '.')),
  },
  {
    id: 'ffoYieldMin',
    label: (v) => v != null ? `FFO ≥ ${fPct(v)}` : 'FFO Yield mín',
    inputLabel: 'FFO Yield mínimo (%)',
    toDisplay: (v) => v != null ? (v * 100).toFixed(1) : '',
    fromInput: (s) => s === '' ? null : parseFloat(s.replace(',', '.')) / 100,
  },
]

function FilterPopover({
  chip,
  value,
  onApply,
  onClear,
  onClose,
}: {
  chip: ChipDef
  value: number | null
  onApply: (v: number | null) => void
  onClear: () => void
  onClose: () => void
}) {
  const [input, setInput] = useState(chip.toDisplay(value))
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div
      className="absolute top-[calc(100%+6px)] left-0 z-50 rounded-[14px] p-4 min-w-[200px]"
      style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="block text-[11px] text-text-muted mb-1 uppercase tracking-[0.04em]">
        {chip.inputLabel}
      </label>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onApply(chip.fromInput(input.trim()))
          if (e.key === 'Escape') onClose()
        }}
        className="w-full px-2.5 py-1.5 bg-bg-3 border border-border rounded-[6px] text-text-base
                   text-[13px] font-mono outline-none focus:border-cyan"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-[12px] bg-transparent border border-border rounded-[6px] text-text-muted cursor-pointer"
        >
          Limpar
        </button>
        <button
          onClick={() => onApply(chip.fromInput(input.trim()))}
          className="flex-1 py-1.5 text-[12px] font-semibold bg-cyan/10 border border-cyan/40 rounded-[6px] text-cyan cursor-pointer hover:bg-cyan/20"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

export function FIIFilterChips({ config, customTickers, onChange, onAddTicker, onRemoveTicker, onRefresh, count, loading }: Props) {
  const [activePopover, setActivePopover] = useState<FilterKey | 'add' | null>(null)
  const [addTickerInput, setAddTickerInput] = useState('')
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setActivePopover(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function applyChip(key: FilterKey, value: number | null) {
    onChange({ ...config, [key]: value })
    setActivePopover(null)
  }

  function clearChip(key: FilterKey) {
    onChange({ ...config, [key]: null })
    setActivePopover(null)
  }

  return (
    <div ref={rowRef} className="flex items-center gap-2 flex-wrap">
      {CHIPS.map((chip) => {
        const val = config[chip.id]
        const isActive = val != null
        const isOpen = activePopover === chip.id
        return (
          <div key={chip.id} className="relative">
            <button
              onClick={() => setActivePopover(isOpen ? null : chip.id)}
              className={`px-3.5 py-1.5 rounded-[16px] border text-[12px] cursor-pointer whitespace-nowrap transition-colors
                          ${isActive
                            ? 'bg-cyan/10 border-cyan/35 text-cyan'
                            : 'bg-bg-3 border-border text-text-muted hover:border-cyan/30 hover:text-text-sec'
                          }`}
            >
              {chip.label(val)}
            </button>
            {isOpen && (
              <FilterPopover
                chip={chip}
                value={val}
                onApply={(v) => applyChip(chip.id, v)}
                onClear={() => clearChip(chip.id)}
                onClose={() => setActivePopover(null)}
              />
            )}
          </div>
        )
      })}

      {/* Add ticker chip */}
      <div className="relative">
        <button
          onClick={() => setActivePopover(activePopover === 'add' ? null : 'add')}
          className={`px-3.5 py-1.5 rounded-[16px] border text-[12px] cursor-pointer whitespace-nowrap transition-colors
                      ${customTickers.length > 0
                        ? 'bg-cyan/10 border-cyan/35 text-cyan'
                        : 'bg-bg-3 border-border text-text-muted hover:border-cyan/30 hover:text-text-sec'
                      }`}
        >
          {customTickers.length > 0 ? `+ ${customTickers.length} ticker${customTickers.length > 1 ? 's' : ''}` : '+ Ticker'}
        </button>
        {activePopover === 'add' && (
          <div
            className="absolute top-[calc(100%+6px)] left-0 z-50 rounded-[14px] p-4 min-w-[230px]"
            style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <label className="block text-[11px] text-text-muted mb-1 uppercase tracking-[0.04em]">
              Adicionar ticker (ex: HGBS11)
            </label>
            <input
              value={addTickerInput}
              onChange={(e) => setAddTickerInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addTickerInput.trim()) {
                  onAddTicker(addTickerInput.trim())
                  setAddTickerInput('')
                  setActivePopover(null)
                }
                if (e.key === 'Escape') setActivePopover(null)
              }}
              placeholder="XXXX11"
              className="w-full px-2.5 py-1.5 bg-bg-3 border border-border rounded-[6px] text-text-base
                         text-[13px] font-mono outline-none focus:border-cyan uppercase"
              autoFocus
            />
            {customTickers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {customTickers.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-3 border border-border rounded text-[11px] font-mono"
                  >
                    {t}
                    <button
                      onClick={() => onRemoveTicker(t)}
                      className="text-red cursor-pointer bg-none border-0 text-[11px] p-0 leading-none"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                if (addTickerInput.trim()) {
                  onAddTicker(addTickerInput.trim())
                  setAddTickerInput('')
                  setActivePopover(null)
                }
              }}
              className="mt-2 w-full py-1.5 text-[12px] font-semibold bg-cyan/10 border border-cyan/40 rounded-[6px] text-cyan cursor-pointer hover:bg-cyan/20"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onRefresh}
        className="px-3.5 py-1.5 rounded-[16px] border border-border bg-bg-3 text-text-muted text-[12px] cursor-pointer hover:text-cyan hover:border-cyan/30"
      >
        ↺ Atualizar
      </button>
      <span className="ml-auto text-[12px] text-text-muted whitespace-nowrap">
        {loading ? 'Carregando...' : count != null ? `${count} FII${count !== 1 ? 's' : ''}` : ''}
      </span>
    </div>
  )
}
