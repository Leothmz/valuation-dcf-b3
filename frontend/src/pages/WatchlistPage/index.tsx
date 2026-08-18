import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { X, Download, BellRing, Bookmark } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { HeroMetric } from '../../components/HeroMetric'
import { fBRL, fPctSigned } from '../../engines/formatters'
import { useWatchlistStore } from '../../stores'
import { useBatchQuotes } from '../../api/stocks'
import { isPriceInBuyRange, shouldRecordAlert } from '../../engines/alert-engine'
import { useEscapeToClose } from '../../hooks/useKeyBinding'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { WatchlistAlertModal } from './WatchlistAlertModal'
import { WatchlistContextMenu, type ContextMenuState } from './WatchlistContextMenu'
import { WatchlistHistoryModal } from './WatchlistHistoryModal'
import { WatchlistNotesModal } from './WatchlistNotesModal'
import { WatchlistRow } from './WatchlistRow'

// ── Format last-updated time ──────────────────────────────────────────────────
function fTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Main component ────────────────────────────────────────────────────────────
export function WatchlistPage() {
  const { entries, remove, updateNotes, updateHistoryAnnotation, toggleAlert, recordAlertFired } = useWatchlistStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

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

  // rows já vem ordenada por upside decrescente; a melhor é a primeira com upside.
  const bestOpportunity = rows.find((r) => r.upside != null) as
    | { entry: { ticker: string; fairPrice: number }; upside: number }
    | undefined

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

  function handleViewAnalysis(ticker: string) {
    navigate(`/analise?ticker=${encodeURIComponent(ticker)}`)
    setContextMenu(null)
  }

  function handleEditNote(ticker: string) {
    setNotesModalTicker(ticker)
    setContextMenu(null)
  }

  function handleViewHistory(ticker: string) {
    setHistoryModal(ticker)
    setContextMenu(null)
  }

  function handleViewAlerts(ticker: string) {
    setAlertHistoryModal(ticker)
    setContextMenu(null)
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
  // Mesmo componente da Carteira vazia: o padrão daqui (ícone + explicação + CTA)
  // era o bom, e virou o compartilhado.
  if (tickers.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="Nenhum valuation salvo ainda"
        description={'Calcule o valuation de uma ação e clique em "Salvar Preço Teto" para acompanhar aqui.'}
        action={{ label: '+ Calcular primeiro valuation', onClick: () => navigate('/dcf') }}
      />
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

      {/* Número principal da rota: a lista respondia "o que eu salvei", não "o que
          está barato agora". `rows` já vem ordenada por upside decrescente, então
          a melhor oportunidade é a primeira com upside calculável. */}
      {bestOpportunity && (
        <div className="mb-5">
          <HeroMetric
            eyebrow="Melhor Oportunidade Salva"
            value={fPctSigned(bestOpportunity.upside)}
            note={`${bestOpportunity.entry.ticker} · teto ${fBRL.format(bestOpportunity.entry.fairPrice)} · upside contra a cotação de agora`}
          />
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
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            aria-label="Exportar CSV"
            title="Exportar CSV"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-border rounded-[10px]
                       text-text-sec cursor-pointer hover:bg-bg-3 hover:text-text-base transition-colors"
            style={{ background: 'none' }}
          >
            <Download size={16} />
          </button>
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
          <span className="ml-auto text-[12px] text-text-muted">
            Atualizado às {fTime(new Date(dataUpdatedAt))} · próximo em 3 min
          </span>
        )}
      </div>

      {/*
        Montagem condicional (não CSS): lista de cards OU tabela, nunca as duas ao
        mesmo tempo — <tr> e <div> não podem ser irmãos dentro de <tbody>, e montar
        as duas árvores em paralelo duplicaria todo texto no DOM (queries sem escopo
        quebrariam, inclusive no Playwright). Ver useIsMobile() acima.
      */}
      {isMobile ? (
        <div>
          {rows.map(({ entry }) => (
            <WatchlistRow
              key={entry.ticker}
              variant="card"
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
        </div>
      ) : (
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
                  style={{ width: 84 }}
                />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry }) => (
                <WatchlistRow
                  key={entry.ticker}
                  variant="table"
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
      )}

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
      <WatchlistHistoryModal
        isOpen={!!historyModal}
        onClose={() => setHistoryModal(null)}
        ticker={historyModal}
        history={historyModal ? entries[historyModal]?.priceHistory ?? [] : []}
        onUpdateAnnotation={(savedAt, annotation) => {
          if (historyModal) updateHistoryAnnotation(historyModal, savedAt, annotation)
        }}
      />

      {/* Alert history modal */}
      <WatchlistAlertModal
        isOpen={!!alertHistoryModal}
        onClose={() => setAlertHistoryModal(null)}
        ticker={alertHistoryModal}
        history={alertHistoryModal ? entries[alertHistoryModal]?.alertHistory ?? [] : []}
      />

      {/* Context menu */}
      <WatchlistContextMenu
        menu={contextMenu}
        menuRef={contextMenuRef}
        onViewAnalysis={handleViewAnalysis}
        onEditNote={handleEditNote}
        onViewHistory={handleViewHistory}
        onViewAlerts={handleViewAlerts}
        onDelete={handleDelete}
      />
    </div>
  )
}
