import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { StickyNote } from 'lucide-react'
import { useWatchlistStore } from '../stores'
import { useBatchQuotes } from '../api/stocks'
import { fBRL, fPct } from '../engines/formatters'
import { Skeleton } from '../components'

// ── Ticker logo helpers ───────────────────────────────────────────────────────
const PALETTE: [string, string][] = [
  ['#06b6d4', 'rgba(6,182,212,.12)'],
  ['#10b981', 'rgba(16,185,129,.12)'],
  ['#f59e0b', 'rgba(245,158,11,.12)'],
  ['#8b5cf6', 'rgba(139,92,246,.12)'],
  ['#ef4444', 'rgba(239,68,68,.12)'],
  ['#06b6d4', 'rgba(6,182,212,.15)'],
  ['#10b981', 'rgba(16,185,129,.15)'],
  ['#f59e0b', 'rgba(245,158,11,.15)'],
]

function tickerColors(ticker: string): [string, string] {
  let h = 0
  for (let i = 0; i < ticker.length; i++) h = ((h * 31) + ticker.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

interface TickerLogoProps {
  ticker: string
}

function TickerLogo({ ticker }: TickerLogoProps) {
  const [fg, bg] = tickerColors(ticker)
  const label = ticker.replace(/\d+$/, '').slice(0, 4)
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-[10px] text-[10px] font-bold font-mono tracking-[.02em]"
      style={{
        width: 38,
        height: 38,
        background: bg,
        color: fg,
        border: `1px solid ${fg}33`,
      }}
    >
      {label}
    </div>
  )
}

// ── Format date ───────────────────────────────────────────────────────────────
function fDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ── Format last-updated time ──────────────────────────────────────────────────
function fTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Context menu state ────────────────────────────────────────────────────────
interface ContextMenuState {
  x: number
  y: number
  ticker: string
}

// ── Main component ────────────────────────────────────────────────────────────
export function WatchlistPage() {
  const { entries, remove, updateNotes } = useWatchlistStore()
  const navigate = useNavigate()

  const tickers = Object.keys(entries)
  const { data: liveQuotes, isLoading, dataUpdatedAt } = useBatchQuotes(tickers)

  const [filterText, setFilterText] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [notesModal, setNotesModal] = useState<{ ticker: string; draft: string } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Build live price map: ticker → LiveQuote
  const liveMap = Object.fromEntries(
    (liveQuotes ?? []).map((q) => [q.ticker, q])
  )

  // Close context menu on outside click or Escape
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setContextMenu(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // Build and sort rows
  const q = filterText.toLowerCase()
  const rows = tickers
    .filter((ticker) => {
      if (!q) return true
      const entry = entries[ticker]
      return (
        ticker.toLowerCase().includes(q) ||
        (entry.name ?? '').toLowerCase().includes(q)
      )
    })
    .map((ticker) => {
      const entry = entries[ticker]
      const live = liveMap[ticker]
      const currentPrice = live?.price ?? null
      const fairPrice = entry.fairPrice
      const upside =
        currentPrice && fairPrice ? (fairPrice - currentPrice) / fairPrice : null
      return {
        ticker,
        entry,
        currentPrice,
        upside,
        changePercent: live?.changePercent ?? null,
        dividendYield: live?.dividendYield ?? null,
        liveError: live?.error ?? false,
        liveLoading: !live,
      }
    })
    .sort((a, b) => {
      if (a.upside !== null && b.upside !== null) return b.upside - a.upside
      if (a.upside !== null) return -1
      if (b.upside !== null) return 1
      return new Date(b.entry.savedAt).getTime() - new Date(a.entry.savedAt).getTime()
    })

  function handleDelete(ticker: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Remover ${ticker} dos seus valuations salvos?`)) return
    remove(ticker)
    setContextMenu(null)
  }

  function handleContextMenu(e: React.MouseEvent, ticker: string) {
    e.preventDefault()
    const x = Math.min(e.clientX, window.innerWidth - 220)
    const y = Math.min(e.clientY, window.innerHeight - 100)
    setContextMenu({ x, y, ticker })
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (tickers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[90px] px-6 gap-3 text-center">
        <div style={{ opacity: 0.15, color: 'var(--color-cyan)' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </div>
        <p className="text-[17px] font-semibold text-text-sec">Nenhum valuation salvo ainda</p>
        <p className="text-[14px] text-text-sec max-w-[300px] leading-relaxed">
          Calcule o valuation de uma ação e clique em "Salvar Preço Teto" para acompanhar aqui.
        </p>
        <Link
          to="/dcf"
          className="mt-4 inline-flex items-center gap-1 px-4 py-[7px] rounded-[10px] text-[13px] font-semibold"
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: '#060910',
            boxShadow: '0 2px 8px rgba(6,182,212,.2)',
          }}
        >
          + Calcular primeiro valuation
        </Link>
      </div>
    )
  }

  const totalCount = tickers.length

  return (
    <div className="max-w-[1340px] mx-auto px-6 py-7 pb-16">
      {/* Page header */}
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] font-bold text-text-base">Meus Valuations</h1>
          <p className="text-[13px] text-text-muted mt-1">
            {totalCount} ativo{totalCount !== 1 ? 's' : ''} salvo{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/dcf"
          className="inline-flex items-center gap-1 px-4 py-[7px] rounded-[10px] text-[13px] font-semibold"
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: '#060910',
            boxShadow: '0 2px 8px rgba(6,182,212,.2)',
          }}
        >
          + Nova Análise
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          type="text"
          className="bg-bg-2 border border-border rounded-[10px] text-text-base text-[13px] px-[14px] py-[7px] outline-none w-60 placeholder-text-muted focus:border-cyan focus:shadow-[0_0_0_3px_rgba(6,182,212,.06)]"
          placeholder="Filtrar por ticker ou empresa…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {dataUpdatedAt > 0 && (
          <span className="text-[12px] text-text-muted ml-auto">
            Atualizado às {fTime(new Date(dataUpdatedAt))} · próximo em 3 min
          </span>
        )}
      </div>

      {/* Table */}
      <div
        className="border border-border rounded-[14px] overflow-hidden"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-left whitespace-nowrap"
                style={{ minWidth: 180 }}
              >
                Ticker
              </th>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-left whitespace-nowrap">
                Empresa
              </th>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-right whitespace-nowrap">
                Preço
              </th>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-right whitespace-nowrap">
                Variação
              </th>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-right whitespace-nowrap">
                Dividend Yield
              </th>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-right whitespace-nowrap">
                Preço Teto
              </th>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-right whitespace-nowrap">
                Upside
              </th>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.1em] uppercase py-3 px-4 text-right whitespace-nowrap">
                Salvo em
              </th>
              <th
                className="bg-bg-2 border-b border-border py-3 px-4 text-center"
                style={{ width: 48 }}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map(
              ({
                ticker,
                entry,
                currentPrice,
                upside,
                changePercent,
                dividendYield,
                liveError,
                liveLoading,
              }) => (
                <tr
                  key={ticker}
                  className="border-b border-border-muted last:border-b-0 cursor-pointer"
                  style={{ transition: 'background .15s ease, transform .15s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6,182,212,.03)'
                    e.currentTarget.style.transform = 'translateX(2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = ''
                    e.currentTarget.style.transform = ''
                  }}
                  onClick={() => navigate(`/dcf?wl=${encodeURIComponent(ticker)}`)}
                  onContextMenu={(e) => handleContextMenu(e, ticker)}
                >
                  {/* Ticker */}
                  <td className="font-mono text-[14px] py-[14px] px-4 text-left align-middle">
                    <div className="flex items-center gap-[10px]">
                      <TickerLogo ticker={ticker} />
                      <span className="font-semibold text-[14px] font-mono text-cyan">
                        {ticker}
                      </span>
                      {entry.notes && (
                        <span
                          title={entry.notes.slice(0, 80)}
                          style={{ color: 'var(--color-amber)', display: 'flex', alignItems: 'center' }}
                        >
                          <StickyNote size={11} />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Company name */}
                  <td className="font-ui text-[13px] text-text-sec py-[14px] px-4 text-left align-middle">
                    {entry.name || '—'}
                  </td>

                  {/* Current price */}
                  <td className="font-mono text-[14px] py-[14px] px-4 text-right align-middle">
                    {liveLoading || isLoading ? (
                      <Skeleton width="72px" height="14px" className="inline-block" />
                    ) : liveError ? (
                      <span className="text-text-muted">—</span>
                    ) : currentPrice != null ? (
                      <span className="text-text-base">{fBRL.format(currentPrice)}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>

                  {/* Change % */}
                  <td className="font-mono text-[14px] py-[14px] px-4 text-right align-middle">
                    {liveLoading || isLoading ? (
                      <Skeleton width="60px" height="14px" className="inline-block" />
                    ) : liveError || changePercent == null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span
                        className="inline-block text-[12px] font-semibold font-mono px-2 py-[2px] rounded-full"
                        style={{
                          background:
                            changePercent >= 0
                              ? 'var(--color-green-dim)'
                              : 'var(--color-red-dim)',
                          color: changePercent >= 0 ? 'var(--color-green)' : 'var(--color-red)',
                          border: `1px solid ${changePercent >= 0 ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`,
                        }}
                      >
                        {changePercent >= 0 ? '+' : ''}
                        {changePercent.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        %
                      </span>
                    )}
                  </td>

                  {/* Dividend yield */}
                  <td className="font-mono text-[14px] py-[14px] px-4 text-right align-middle">
                    {liveLoading || isLoading ? (
                      <Skeleton width="50px" height="14px" className="inline-block" />
                    ) : liveError || dividendYield == null || dividendYield <= 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className="text-green">{fPct(dividendYield)}</span>
                    )}
                  </td>

                  {/* Fair price */}
                  <td className="font-mono text-[14px] py-[14px] px-4 text-right align-middle font-semibold text-cyan">
                    {fBRL.format(entry.fairPrice)}
                  </td>

                  {/* Upside */}
                  <td className="font-mono text-[14px] py-[14px] px-4 text-right align-middle">
                    {liveLoading || isLoading ? (
                      <Skeleton width="80px" height="14px" className="inline-block" />
                    ) : liveError || upside === null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[13px] font-bold font-mono px-3 py-1 rounded-full"
                        style={{
                          background:
                            upside >= 0 ? 'var(--color-green-dim)' : 'var(--color-red-dim)',
                          color: upside >= 0 ? 'var(--color-green)' : 'var(--color-red)',
                          border: `1px solid ${upside >= 0 ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
                        }}
                      >
                        {upside >= 0 ? '↑' : '↓'} {upside >= 0 ? '+' : ''}
                        {fPct(upside)}
                      </span>
                    )}
                  </td>

                  {/* Saved at */}
                  <td className="font-ui text-[12px] text-text-muted py-[14px] px-4 text-right align-middle">
                    {fDate(entry.savedAt)}
                  </td>

                  {/* Delete */}
                  <td
                    className="py-[14px] px-4 text-center align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="border border-transparent rounded-[6px] text-text-muted text-[13px] px-2 py-1 leading-none cursor-pointer"
                      title="Remover"
                      onClick={(e) => handleDelete(ticker, e)}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget
                        el.style.borderColor = 'var(--color-red)'
                        el.style.color = 'var(--color-red)'
                        el.style.background = 'var(--color-red-dim)'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget
                        el.style.borderColor = 'transparent'
                        el.style.color = ''
                        el.style.background = ''
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Notes modal */}
      {notesModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setNotesModal(null) }}
        >
          <div className="bg-bg-2 border border-border rounded-[16px] p-6 w-[440px] max-w-[92vw]"
               style={{ boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}>
            <div className="text-[16px] font-semibold mb-4">
              Nota · <span style={{ color: 'var(--color-cyan)' }}>{notesModal.ticker}</span>
            </div>
            <textarea
              className="w-full bg-bg-3 border border-border rounded-[10px] text-text-base text-[13px]
                         p-3 resize-none outline-none h-[120px] placeholder-text-muted
                         focus:border-cyan focus:shadow-[0_0_0_3px_rgba(6,182,212,.06)]"
              maxLength={500}
              value={notesModal.draft}
              onChange={(e) => setNotesModal({ ...notesModal, draft: e.target.value })}
              placeholder="Adicione suas observações sobre este ativo…"
              autoFocus
            />
            <div className="text-[11px] text-text-muted text-right mt-1">
              {notesModal.draft.length}/500
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="border border-border rounded-[10px] text-text-sec text-[13px] font-ui
                           px-4 h-[38px] cursor-pointer hover:bg-bg-3 hover:text-text-base transition-colors"
                style={{ background: 'none' }}
                onClick={() => setNotesModal(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-[10px] text-[13px] font-semibold font-ui px-4 h-[38px] cursor-pointer
                           hover:-translate-y-px transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--color-cyan) 0%, #0891b2 100%)',
                  color: 'var(--bg-0)',
                  boxShadow: '0 2px 8px rgba(6,182,212,.2)',
                }}
                onClick={() => {
                  updateNotes(notesModal.ticker, notesModal.draft)
                  setNotesModal(null)
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] bg-bg-2 border border-border rounded-[10px] overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,.6)',
          }}
        >
          <button
            className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
            style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
            onClick={() => {
              navigate(`/analise?ticker=${encodeURIComponent(contextMenu.ticker)}`)
              setContextMenu(null)
            }}
          >
            Ver Análise Avançada
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
            style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
            onClick={() => {
              const entry = entries[contextMenu!.ticker]
              setNotesModal({ ticker: contextMenu!.ticker, draft: entry?.notes ?? '' })
              setContextMenu(null)
            }}
          >
            <StickyNote size={13} />
            Editar nota
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer"
            style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-red-dim)'
              e.currentTarget.style.color = 'var(--color-red)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = ''
            }}
            onClick={(e) => handleDelete(contextMenu.ticker, e)}
          >
            Excluir da watchlist
          </button>
        </div>
      )}
    </div>
  )
}
