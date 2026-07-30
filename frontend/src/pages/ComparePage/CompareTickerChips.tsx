import { useState } from 'react'

interface CompareTickerChipsProps {
  tickers: string[]
  onRemove: (t: string) => void
  onAdd: (t: string) => void
  max: number
}

export function CompareTickerChips({ tickers, onRemove, onAdd, max }: CompareTickerChipsProps) {
  const [input, setInput] = useState('')

  function handleSubmit() {
    const t = input.trim().toUpperCase()
    if (!t) return
    onAdd(t)
    setInput('')
  }

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
        <input
          type="text"
          className="h-11 rounded-[10px] border border-border bg-bg-3 text-text-base text-[16px] px-[14px] outline-none w-32 placeholder-text-muted focus:border-cyan"
          placeholder="+ ticker"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        />
      )}
    </div>
  )
}
