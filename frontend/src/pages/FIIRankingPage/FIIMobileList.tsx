import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { ExpandableRow } from '../../components/ExpandableRow'
import { fBRL, fPct, fNum } from '../../engines/formatters'
import { classifyPerfil } from '../../engines/fii-scores'
import type { RankedFII, FIIPerfil } from '../../engines/fii-scores'

interface FIIMobileListProps {
  rows: RankedFII[]
  favorites: string[]
  onToggleFavorite: (ticker: string) => void
}

const PERFIL_LABEL: Record<FIIPerfil, string> = {
  ancoragem: 'Ancoragem',
  crescimento: 'Crescimento',
  risco: 'Risco',
}
const PERFIL_COLOR: Record<FIIPerfil, string> = {
  ancoragem: 'var(--color-green)',
  crescimento: 'var(--color-amber)',
  risco: 'var(--color-red)',
}

// Mesma abreviação (k/M/B) usada em FIITable.tsx e FIIFilterChips.tsx — não extraída
// para formatters.ts porque essas duas telas já a duplicam localmente hoje.
function fLiq(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e9) return 'R$ ' + (v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'B'
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
  if (v >= 1e3) return 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k'
  return 'R$ ' + v.toLocaleString('pt-BR')
}

export function FIIMobileList({ rows, favorites, onToggleFavorite }: FIIMobileListProps) {
  // Visibilidade é decidida pelo pai (FIIRankingPage) via useIsMobile() — monta só quando
  // for o caso, nunca em paralelo com a FIITable (evita render dobrado + duplicatas no DOM).
  return (
    <div>
      {rows.map((row, i) => {
        const isFav = favorites.includes(row.ticker)
        const dy = row.dy
        const pvp = row.pvp
        const segmento = (row.segmento as string | null | undefined) ?? null
        const ffoYield = row.ffoYield as number | null | undefined
        const vacancia = row.vacancia as number | null | undefined
        const liquidez = row.liquidez as number | null | undefined
        const perfil = classifyPerfil(pvp)

        return (
          <ExpandableRow key={row.ticker} ariaLabel={row.ticker} summary={
            <>
              <span
                className="shrink-0 min-w-[24px] text-center text-[11px] font-extrabold rounded-full px-1.5 py-0.5"
                style={{ background: 'rgba(6,182,212,.15)', color: 'var(--color-cyan)' }}
              >
                {i + 1}
              </span>
              <span className="font-mono font-extrabold text-[13px] text-cyan truncate">
                {row.ticker}
              </span>
              <span className="ml-auto font-mono text-[11px] text-text-sec shrink-0">
                {row.price != null ? fBRL.format(row.price) : '—'}
              </span>
              {dy != null && (
                <span
                  className="font-mono text-[12px] font-bold shrink-0"
                  style={{ color: dy >= 0.08 ? 'var(--color-green)' : 'var(--color-amber)' }}
                >
                  {fPct(dy, 1)}
                </span>
              )}
            </>
          }>
            <div className="flex items-baseline justify-between py-1">
              <span className="text-[12px] text-text-sec">Segmento</span>
              <span className="text-[13px] font-semibold text-text-base">{segmento ?? '—'}</span>
            </div>
            <div className="flex items-baseline justify-between py-1">
              <span className="text-[12px] text-text-sec">Perfil</span>
              <span
                className="text-[13px] font-semibold"
                style={{ color: perfil ? PERFIL_COLOR[perfil] : 'var(--color-text-muted)' }}
              >
                {perfil ? PERFIL_LABEL[perfil] : '—'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {[
                { lb: 'P/VP',     vl: pvp != null ? fNum(pvp, 2) : '—' },
                { lb: 'FFO Y',    vl: ffoYield != null ? fPct(ffoYield, 1) : '—' },
                { lb: 'Vacância', vl: vacancia != null ? fPct(vacancia, 1) : '—' },
              ].map(({ lb, vl }) => (
                <div key={lb} className="rounded-[7px] border border-border p-1.5 text-center"
                     style={{ background: 'var(--color-bg-1)' }}>
                  <div className="text-[9px] uppercase tracking-[.4px] text-text-muted">{lb}</div>
                  <div className="font-mono text-[12px] font-bold text-text-base">{vl}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <div className="flex justify-between rounded-[7px] border border-border px-2 py-1.5"
                   style={{ background: 'var(--color-bg-1)' }}>
                <span className="text-[10px] text-text-muted">Liquidez</span>
                <span className="font-mono text-[11px] font-bold text-text-base">{fLiq(liquidez)}</span>
              </div>
              {/* Decomposição do rank — o diferencial do Rank Thomaz FII, invisível em qualquer outra
                  tela do app hoje. */}
              <div className="flex justify-between rounded-[7px] border border-border px-2 py-1.5"
                   style={{ background: 'var(--color-bg-1)' }}>
                <span className="text-[10px] text-text-muted">Rank</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--color-cyan)' }}>
                  {`DY ${row._rankDY} + PVP ${row._rankPVP}`}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onToggleFavorite(row.ticker)}
                className="flex-1 min-h-[44px] rounded-[8px] border border-border text-[12px] font-semibold
                           cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: 'var(--color-bg-1)', color: isFav ? 'var(--color-amber)' : 'var(--color-text-sec)' }}
              >
                <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? 'Favorito' : 'Favoritar'}
              </button>
              <Link
                to={`/analise-fii?ticker=${row.ticker}`}
                className="flex-1 min-h-[44px] rounded-[8px] border border-border text-[12px] font-semibold
                           flex items-center justify-center"
                style={{ background: 'var(--color-bg-1)', color: 'var(--color-text-sec)' }}
              >
                Analisar ›
              </Link>
            </div>
          </ExpandableRow>
        )
      })}
    </div>
  )
}
