import { StickyNote, Bell, BellOff, BellRing, MoreHorizontal } from 'lucide-react'
import { ExpandableRow } from '../../components/ExpandableRow'
import { fBRL, fPct, fPctSigned } from '../../engines/formatters'
import { Skeleton } from '../../components'
import type { WatchlistEntry } from '../../stores/watchlistStore'
import type { LiveQuote } from '../../api/stocks'

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

interface WatchlistRowProps {
  entry: WatchlistEntry
  quote: LiveQuote | undefined
  isTriggered: boolean
  isLoading: boolean
  onNavigate: (ticker: string) => void
  onToggleAlert: (ticker: string) => void
  onOpenMenu: (e: React.MouseEvent, ticker: string) => void
  onDelete: (ticker: string, e: React.MouseEvent) => void
  /** 'table' = <tr> desktop (inalterado); 'card' = ExpandableRow mobile (padrão C). */
  variant: 'table' | 'card'
}

export function WatchlistRow({
  entry,
  quote,
  isTriggered,
  isLoading,
  onNavigate,
  onToggleAlert,
  onOpenMenu,
  onDelete,
  variant,
}: WatchlistRowProps) {
  const ticker = entry.ticker
  const currentPrice = quote?.price ?? null
  const fairPrice = entry.fairPrice
  const upside = currentPrice && fairPrice ? (fairPrice - currentPrice) / fairPrice : null
  const changePercent = quote?.changePercent ?? null
  const dividendYield = quote?.dividendYield ?? null
  const liveError = quote?.error ?? false
  const liveLoading = !quote

  const alertEnabled = entry.alertEnabled ?? true
  const AlertIcon = !alertEnabled ? BellOff : isTriggered ? BellRing : Bell
  const alertColor = !alertEnabled
    ? 'var(--color-text-muted)'
    : isTriggered
      ? 'var(--color-green)'
      : 'var(--color-text-sec)'

  if (variant === 'card') {
    return (
      <ExpandableRow
        ariaLabel={ticker}
        highlighted={isTriggered}
        summary={
          <>
            <TickerLogo ticker={ticker} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-[13px] text-cyan truncate">{ticker}</span>
                {entry.notes && (
                  <span
                    title={entry.notes.slice(0, 80)}
                    style={{ color: 'var(--color-amber)' }}
                    className="shrink-0 flex items-center"
                  >
                    <StickyNote size={11} />
                  </span>
                )}
              </div>
              <div className="text-[11px] text-text-sec truncate">{entry.name || '—'}</div>
            </div>

            <div className="text-right shrink-0">
              {liveLoading || isLoading ? (
                <Skeleton width="60px" height="12px" className="inline-block" />
              ) : liveError || currentPrice == null ? (
                <div className="font-mono text-[13px] text-text-muted">—</div>
              ) : (
                <div className="font-mono text-[13px] text-text-base">{fBRL.format(currentPrice)}</div>
              )}
              {!liveLoading && !isLoading && !liveError && changePercent != null && (
                <div
                  className="font-mono text-[11px] font-semibold"
                  style={{ color: changePercent >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
                >
                  {changePercent >= 0 ? '+' : ''}
                  {changePercent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </div>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onToggleAlert(ticker) }}
              onKeyDown={(e) => { e.stopPropagation() }}
              aria-label={alertEnabled ? `Desativar alerta de preço para ${ticker}` : `Ativar alerta de preço para ${ticker}`}
              title={alertEnabled ? 'Desativar alerta de preço' : 'Ativar alerta de preço'}
              className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              style={{ color: alertColor, background: 'none', border: 'none' }}
            >
              <AlertIcon size={16} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onOpenMenu(e, ticker) }}
              onKeyDown={(e) => { e.stopPropagation() }}
              aria-label={`Mais ações para ${ticker}`}
              className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted cursor-pointer"
              style={{ background: 'none', border: 'none' }}
            >
              <MoreHorizontal size={18} />
            </button>
          </>
        }
      >
        <div className="flex items-baseline justify-between py-1">
          <span className="text-[12px] text-text-sec">Preço Teto salvo</span>
          <span className="font-mono text-[14px] font-bold text-cyan">{fBRL.format(entry.fairPrice)}</span>
        </div>

        <div className="flex items-baseline justify-between py-1">
          <span className="text-[12px] text-text-sec">Upside</span>
          {liveError || upside === null ? (
            <span className="text-text-muted text-[13px]">—</span>
          ) : (
            <span
              className="font-mono text-[13px] font-bold"
              style={{ color: upside >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
            >
              {fPctSigned(upside)}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between py-1">
          <span className="text-[12px] text-text-sec">Dividend Yield</span>
          {liveError || dividendYield == null || dividendYield <= 0 ? (
            <span className="text-text-muted text-[13px]">—</span>
          ) : (
            <span className="font-mono text-[13px] text-green">{fPct(dividendYield)}</span>
          )}
        </div>

        <div className="flex items-baseline justify-between py-1">
          <span className="text-[12px] text-text-sec">Salvo em</span>
          <span className="font-mono text-[12px] text-text-muted">{fDate(entry.savedAt)}</span>
        </div>

        {entry.notes && (
          <p className="italic text-[12px] text-text-muted mt-2">{entry.notes}</p>
        )}
      </ExpandableRow>
    )
  }

  return (
    <tr
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
      onClick={() => onNavigate(ticker)}
      onContextMenu={(e) => onOpenMenu(e, ticker)}
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

      {/* Alert toggle */}
      <td
        className="py-[14px] px-4 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onToggleAlert(ticker)}
          title={alertEnabled ? 'Desativar alerta de preço' : 'Ativar alerta de preço'}
          style={{ color: alertColor, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <AlertIcon size={14} />
        </button>
      </td>

      {/* Delete */}
      <td
        className="py-[14px] px-4 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="border border-transparent rounded-[6px] text-text-muted text-[13px] px-2 py-1 leading-none cursor-pointer"
          title="Remover"
          onClick={(e) => onDelete(ticker, e)}
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
}
