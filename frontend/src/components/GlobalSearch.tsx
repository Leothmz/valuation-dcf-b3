import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, X } from 'lucide-react'
import { B3_TICKERS } from '../data/b3Tickers'

const RECENT_KEY = 'global_search_recent'
const MAX_RECENT = 5

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(ticker: string) {
  const prev = getRecent().filter(t => t !== ticker)
  localStorage.setItem(RECENT_KEY, JSON.stringify([ticker, ...prev].slice(0, MAX_RECENT)))
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = query
    ? B3_TICKERS.filter(t => t.startsWith(query)).slice(0, 8)
    : []

  const listItems = query ? suggestions : recent

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setFocusedIdx(-1)
      setRecent(getRecent())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const selectTicker = useCallback((ticker: string) => {
    saveRecent(ticker)
    navigate(`/analise?ticker=${ticker}`)
    onClose()
  }, [navigate, onClose])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, listItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIdx >= 0) {
        selectTicker(listItems[focusedIdx])
      } else if (query && B3_TICKERS.includes(query)) {
        selectTicker(query)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(6,9,16,0.8)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl mx-4 bg-bg-2 border border-border rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(6,182,212,0.1), 0 25px 50px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value.toUpperCase()); setFocusedIdx(-1) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar ticker... Ex: WEGE3"
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent font-mono text-sm text-text-base
                       placeholder:text-text-muted placeholder:normal-case uppercase outline-none"
          />
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-base transition-colors p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {listItems.length > 0 && (
          <div>
            {!query && (
              <div className="px-4 pt-2.5 pb-1">
                <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">
                  Buscas recentes
                </span>
              </div>
            )}
            {listItems.map((t, i) => (
              <div
                key={t}
                onMouseDown={(e) => { e.preventDefault(); selectTicker(t) }}
                onMouseEnter={() => setFocusedIdx(i)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                            ${i === focusedIdx
                              ? 'bg-bg-4 text-cyan'
                              : 'text-text-base hover:bg-bg-4 hover:text-cyan'}`}
              >
                {!query && <Clock size={13} className="text-text-muted shrink-0" />}
                <span className="font-mono text-sm">{t}</span>
              </div>
            ))}
          </div>
        )}

        {query && suggestions.length === 0 && (
          <div className="px-4 py-6 text-center text-text-muted text-sm">
            Nenhum ticker encontrado para "{query}"
          </div>
        )}

        <div className="flex items-center gap-4 px-4 py-2 border-t border-border-muted">
          <span className="text-[11px] text-text-muted">
            <kbd className="font-mono bg-bg-3 px-1.5 py-0.5 rounded text-[10px] border border-border mr-1">↑↓</kbd>
            navegar
          </span>
          <span className="text-[11px] text-text-muted">
            <kbd className="font-mono bg-bg-3 px-1.5 py-0.5 rounded text-[10px] border border-border mr-1">↵</kbd>
            abrir
          </span>
          <span className="text-[11px] text-text-muted">
            <kbd className="font-mono bg-bg-3 px-1.5 py-0.5 rounded text-[10px] border border-border mr-1">Esc</kbd>
            fechar
          </span>
        </div>
      </div>
    </div>
  )
}
