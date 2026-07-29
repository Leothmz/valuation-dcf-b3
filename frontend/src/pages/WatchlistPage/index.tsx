import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { StickyNote, History, X, Download, Bell, BellRing } from 'lucide-react'
import { useWatchlistStore } from '../../stores'
import { useBatchQuotes } from '../../api/stocks'
import { fBRL } from '../../engines/formatters'
import { isPriceInBuyRange, shouldRecordAlert } from '../../engines/alert-engine'
import { useEscapeToClose } from '../../hooks/useKeyBinding'
import { WatchlistAlertModal } from './WatchlistAlertModal'
import { WatchlistNotesModal } from './WatchlistNotesModal'
import { WatchlistRow } from './WatchlistRow'

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
  const { entries, remove, updateNotes, updateHistoryAnnotation, toggleAlert, recordAlertFired } = useWatchlistStore()
  const navigate = useNavigate()

  const tickers = Object.keys(entries)
  const { data: liveQuotes, isLoading, dataUpdatedAt } = useBatchQuotes(tickers)

  const [filterText, setFilterText] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [notesModalTicker, setNotesModalTicker] = useState<string | null>(null)
  const [historyModal, setHistoryModal] = useState<string | null>(null) // ticker
  const [alertHistoryModal, setAlertHistoryModal] = useState<string | null>(null) // ticker
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Build live price map: ticker → LiveQuote
  const liveMap = Object.fromEntries(
    (liveQuotes ?? []).map((q) => [q.ticker, q])
  )

  // Detect tickers currently in the buy range (price <= fair price) with alerts enabled
  const triggeredTickers = tickers.filter((ticker) => {
    const entry = entries[ticker]
    if ((entry.alertEnabled ?? true) === false) return false
    return isPriceInBuyRange(liveMap[ticker]?.price, entry.fairPrice)
  })

  // Record one alert event per ticker per day when it enters the buy range
  useEffect(() => {
    const now = new Date().toISOString()
    for (const ticker of triggeredTickers) {
      const entry = entries[ticker]
      const live = liveMap[ticker]
      if (live?.price == null) continue
      if (shouldRecordAlert(entry.alertHistory ?? [], now)) {
        recordAlertFired(ticker, { firedAt: now, price: live.price, fairPrice: entry.fairPrice })
      }
    }
  }, [triggeredTickers.join(','), dataUpdatedAt]) // eslint: deps narrowed on purpose — entries/liveMap/recordAlertFired are stable per render

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

  useEscapeToClose(!!notesModalTicker || !!historyModal || !!alertHistoryModal, () => {
    setNotesModalTicker(null)
    setHistoryModal(null)
    setAlertHistoryModal(null)
  })

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
      return { entry, upside }
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

  function exportCSV() {
    const BOM = '﻿'
    const SEP = ';'
    const headers = [
      'Ticker', 'Empresa', 'Preço Teto', 'Preço Atual', 'Upside (%)',
      'DY (%)', 'Salvo Em', 'g (%)', 'Disc (%)', 'Perp (%)',
      'Payout (%)', 'ROE (%)', 'LL Base', 'Shares',
    ]

    const fNum = (v: number | null | undefined, mult = 1, dec = 2): string => {
      if (v == null) return ''
      return (v * mult).toFixed(dec).replace('.', ',')
    }

    const dataRows = Object.values(entries).map((entry) => {
      const live = liveMap[entry.ticker]
      const price = live?.price ?? null
      const dy = live?.dividendYield ?? null
      const upside =
        price != null && entry.fairPrice
          ? ((entry.fairPrice - price) / entry.fairPrice) * 100
          : null
      const a = entry.assumptions
      return [
        entry.ticker,
        `"${(entry.name ?? '').replace(/"/g, '""')}"`,
        fNum(entry.fairPrice),
        fNum(price),
        fNum(upside, 1),
        fNum(dy, 100),
        new Date(entry.savedAt).toLocaleDateString('pt-BR'),
        fNum(a.g as number | null, 100),
        fNum(a.disc as number | null, 100),
        fNum(a.perp as number | null, 100),
        fNum(a.payout as number | null, 100),
        fNum(a.roe as number | null, 100),
        fNum(a.ll as number | null, 1, 0),
        fNum(a.shares as number | null, 1, 0),
      ].join(SEP)
    })

    const csv = BOM + [headers.join(SEP), ...dataRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `watchlist-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
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
    <div className="max-w-[1340px] mx-auto px-4 py-4 md:px-6 md:py-7 pb-16">
      {/* Buy-range alert banner */}
      {!bannerDismissed && triggeredTickers.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-[12px] border px-4 py-3 mb-5"
          style={{ background: 'var(--color-green-dim)', borderColor: 'rgba(16,185,129,.25)' }}
        >
          <BellRing size={16} style={{ color: 'var(--color-green)' }} className="shrink-0" />
          <p className="text-[13px] text-text-base flex-1" title={triggeredTickers.join(', ')}>
            <strong style={{ color: 'var(--color-green)' }}>{triggeredTickers.length}</strong>{' '}
            ativo{triggeredTickers.length > 1 ? 's' : ''} {triggeredTickers.length > 1 ? 'estão' : 'está'} na faixa de compra (preço ≤ preço teto) — veja o sino na tabela.
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-text-muted cursor-pointer shrink-0"
            style={{ background: 'none', border: 'none', padding: 0 }}
            title="Dispensar"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
        <div className="ml-auto flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-[12px] text-text-muted">
              Atualizado às {fTime(new Date(dataUpdatedAt))} · próximo em 3 min
            </span>
          )}
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 border border-border rounded-[10px] text-text-sec
                       text-[13px] font-ui px-[14px] h-[36px] cursor-pointer hover:bg-bg-3
                       hover:text-text-base transition-colors"
            style={{ background: 'none' }}
          >
            <Download size={13} />
            Exportar CSV
          </button>
        </div>
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
                style={{ width: 40 }}
              />
              <th
                className="bg-bg-2 border-b border-border py-3 px-4 text-center"
                style={{ width: 48 }}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry }) => (
              <WatchlistRow
                key={entry.ticker}
                entry={entry}
                quote={liveMap[entry.ticker]}
                isTriggered={triggeredTickers.includes(entry.ticker)}
                isLoading={isLoading}
                onNavigate={(t) => navigate(`/dcf?wl=${encodeURIComponent(t)}`)}
                onToggleAlert={toggleAlert}
                onOpenMenu={handleContextMenu}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes modal */}
      {notesModalTicker && (
        <WatchlistNotesModal
          isOpen
          onClose={() => setNotesModalTicker(null)}
          ticker={notesModalTicker}
          note={entries[notesModalTicker]?.notes ?? ''}
          onSave={(note) => {
            updateNotes(notesModalTicker, note)
            setNotesModalTicker(null)
          }}
        />
      )}

      {/* History modal */}
      {historyModal && (() => {
        const entry = entries[historyModal]
        const hist = entry?.priceHistory ?? []
        return (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setHistoryModal(null) }}
          >
            <div
              className="bg-bg-2 border border-border rounded-[16px] p-6 w-[640px] max-w-[94vw]"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="text-[16px] font-semibold">
                  Histórico · <span style={{ color: 'var(--color-cyan)' }}>{historyModal}</span>
                </div>
                <button
                  className="text-text-muted hover:text-text-base transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setHistoryModal(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {hist.length === 0 ? (
                <p className="text-[13px] text-text-muted text-center py-6">
                  Nenhum histórico ainda — salve o preço teto mais de uma vez para registrar a evolução.
                </p>
              ) : (
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {['Data', 'Preço Teto', 'Variação', 'Anotação'].map((h) => (
                          <th
                            key={h}
                            className="text-[11px] text-text-muted uppercase tracking-[.08em] font-semibold
                                       py-2 px-3 text-left border-b border-border bg-bg-3"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hist.map((h, i) => {
                        const prev = hist[i + 1]
                        const diff = prev ? ((h.fairPrice - prev.fairPrice) / prev.fairPrice) : null
                        return (
                          <tr key={h.savedAt} className="border-b border-border-muted last:border-b-0">
                            <td className="font-mono text-[13px] py-3 px-3 text-text-sec whitespace-nowrap">
                              {fDate(h.savedAt)}
                            </td>
                            <td className="font-mono text-[13px] py-3 px-3 font-semibold"
                                style={{ color: 'var(--color-cyan)' }}>
                              {fBRL.format(h.fairPrice)}
                            </td>
                            <td className="font-mono text-[13px] py-3 px-3 whitespace-nowrap">
                              {diff == null ? (
                                <span className="text-text-muted">—</span>
                              ) : (
                                <span style={{ color: diff >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                                  {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <input
                                type="text"
                                className="bg-bg-3 border border-border rounded-[6px] text-text-sec text-[12px]
                                           px-2 py-1 outline-none w-full placeholder-text-muted
                                           focus:border-cyan"
                                defaultValue={h.annotation ?? ''}
                                placeholder="Anotação…"
                                onBlur={(e) => updateHistoryAnnotation(historyModal, h.savedAt, e.target.value)}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Alert history modal */}
      <WatchlistAlertModal
        isOpen={!!alertHistoryModal}
        onClose={() => setAlertHistoryModal(null)}
        ticker={alertHistoryModal}
        history={alertHistoryModal ? entries[alertHistoryModal]?.alertHistory ?? [] : []}
      />

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
              setNotesModalTicker(contextMenu!.ticker)
              setContextMenu(null)
            }}
          >
            <StickyNote size={13} />
            Editar nota
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
            style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
            onClick={() => {
              setHistoryModal(contextMenu!.ticker)
              setContextMenu(null)
            }}
          >
            <History size={13} />
            Histórico de preço teto
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-[10px] text-[13px] text-text-sec text-left cursor-pointer hover:bg-bg-4 hover:text-text-base"
            style={{ background: 'none', border: 'none', transition: 'background .12s ease, color .12s ease' }}
            onClick={() => {
              setAlertHistoryModal(contextMenu!.ticker)
              setContextMenu(null)
            }}
          >
            <Bell size={13} />
            Histórico de alertas
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
