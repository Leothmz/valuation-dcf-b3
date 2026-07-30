import { useState, useRef, useEffect } from 'react'
import { B3_TICKERS } from '../../data/b3Tickers'

interface CompareTickerChipsProps {
  tickers: string[]
  onRemove: (t: string) => void
  onAdd: (t: string) => void
  max: number
}

export function CompareTickerChips({ tickers, onRemove, onAdd, max }: CompareTickerChipsProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  function add(t: string) {
    if (!t) return
    onAdd(t)
    setInput('')
    setSuggestions([])
    setFocusedIdx(-1)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value.toUpperCase()
    setInput(q)
    setFocusedIdx(-1)
    // Já comparados saem da lista: sugerir algo que onAdd vai descartar é ruído.
    setSuggestions(
      q ? B3_TICKERS.filter((t) => t.startsWith(q) && !tickers.includes(t)).slice(0, 8) : []
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add(focusedIdx >= 0 ? suggestions[focusedIdx] : input.trim().toUpperCase())
      return
    }
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setFocusedIdx(-1)
    }
  }

  // Fecha ao tocar fora — no mobile o dropdown cobre a tabela abaixo dele.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSuggestions([])
        setFocusedIdx(-1)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tickers.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 font-mono text-[13px] pl-3 pr-1 py-1.5 rounded-[8px]"
          style={{ background: 'rgba(6,182,212,.14)', border: '1px solid rgba(6,182,212,.35)', color: 'var(--color-cyan)' }}
        >
          {t}
          <button
            type="button"
            onClick={() => onRemove(t)}
            aria-label={`Remover ${t}`}
            className="flex items-center justify-center leading-none cursor-pointer w-11 h-11 shrink-0"
            style={{ background: 'none', border: 'none', color: 'inherit' }}
          >
            ×
          </button>
        </span>
      ))}

      {tickers.length < max && (
        <div ref={wrapRef} className="relative">
          <input
            type="text"
            className="h-11 rounded-[10px] border border-border bg-bg-3 text-text-base text-[16px] px-[14px] outline-none w-32 placeholder-text-muted focus:border-cyan"
            placeholder="+ ticker"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls="compare-ticker-suggestions"
            aria-label="Adicionar ticker"
          />
          {suggestions.length > 0 && (
            <div
              id="compare-ticker-suggestions"
              role="listbox"
              className="absolute top-[calc(100%+4px)] left-0 min-w-full bg-bg-2 border border-border
                         rounded-[10px] overflow-hidden z-50 shadow-lg"
            >
              {suggestions.map((t, i) => (
                <div
                  key={t}
                  role="option"
                  aria-selected={i === focusedIdx}
                  // onMouseDown, não onClick: o blur do input dispararia antes do click.
                  onMouseDown={(e) => { e.preventDefault(); add(t) }}
                  className={`px-[14px] py-[9px] font-mono text-[13px] cursor-pointer text-text-base
                              hover:bg-bg-4 hover:text-cyan ${i === focusedIdx ? 'bg-bg-4 text-cyan' : ''}`}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
