import { useNavigate } from 'react-router-dom'
import type { RankedFII } from '../../engines/fii-scores'
import { classifyPerfil } from '../../engines/fii-scores'

interface Props {
  rows: RankedFII[]
  favorites: Set<string>
  onToggleFavorite: (ticker: string) => void
}

function fBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}
function fNum2(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fLiq(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e9) return 'R$ ' + (v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'B'
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
  if (v >= 1e3) return 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k'
  return 'R$ ' + v.toLocaleString('pt-BR')
}

const SEG_CLASS: Record<string, string> = {
  'Logística':   'bg-green/10 border-green/25 text-green',
  'Shoppings':   'bg-amber/10 border-amber/25 text-amber',
  'Lajes Corp.': 'bg-cyan/10 border-cyan/25 text-cyan',
  'Papel/CRI':   'bg-purple/10 border-purple/25 text-purple',
  'Residencial': 'bg-red/10 border-red/25 text-red',
  'Híbrido':     'bg-bg-4 border-border text-text-sec',
  'Agro':        'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.25)] text-[#22c55e]',
  'Hotel':       'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.25)] text-[#fbbf24]',
}

function PosBadge({ pos }: { pos: number }) {
  const cls =
    pos === 1 ? 'bg-gradient-to-br from-green/25 to-green/10 border border-green/35 text-green' :
    pos === 2 ? 'bg-gradient-to-br from-cyan/20 to-cyan/8 border border-cyan/30 text-cyan' :
    pos === 3 ? 'bg-gradient-to-br from-amber/20 to-amber/8 border border-amber/30 text-amber' :
                'bg-bg-3 border border-border text-text-muted'
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] h-[22px] rounded-[6px]
                      font-mono text-[11px] font-bold px-1.5 ${cls}`}>
      {pos}
    </span>
  )
}

function PerfilBadge({ pvp }: { pvp: number | null | undefined }) {
  const perfil = classifyPerfil(pvp)
  if (!perfil) return <span className="text-text-muted">—</span>
  const cfg = {
    ancoragem:   { label: 'Ancoragem', cls: 'bg-green/10 border-green/30 text-green' },
    crescimento: { label: 'Crescimento', cls: 'bg-amber/10 border-amber/30 text-amber' },
    risco:       { label: 'Risco', cls: 'bg-red/10 border-red/30 text-red' },
  }[perfil]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[12px] text-[10px] font-bold
                      tracking-[0.03em] whitespace-nowrap border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export function FIITable({ rows, favorites, onToggleFavorite }: Props) {
  const navigate = useNavigate()

  if (rows.length === 0) {
    return (
      <div className="bg-bg-2 border border-border rounded-[14px] overflow-hidden">
        <div className="p-10 text-center text-text-muted text-[13px]">
          Nenhum FII encontrado com os filtros atuais.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-2 border border-border rounded-[14px] overflow-hidden flex-1">
      <div className="overflow-y-auto max-h-none md:max-h-[calc(100vh-420px)]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-bg-3 border-b border-border">
              <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] w-11">
                #
              </th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                Ticker
              </th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                Segmento
              </th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                Perfil
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                Cotação
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                DY
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                P/VP
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                FFO Yield
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                Vacância
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                Liquidez
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const isFav = favorites.has(f.ticker)
              const seg = (f.segmento as string | null | undefined) ?? null
              const name = (f.name as string | null | undefined) ?? ''
              const segClass = seg ? (SEG_CLASS[seg] ?? 'bg-bg-3 border-border text-text-muted') : 'bg-bg-3 border-border text-text-muted'
              const dyColor = f.dy != null ? (f.dy >= 0.06 ? 'text-green' : '') : 'text-text-muted'
              const pvpColor = f.pvp != null ? (f.pvp < 1 ? 'text-green' : f.pvp > 1.1 ? 'text-red' : '') : 'text-text-muted'

              return (
                <tr
                  key={f.ticker}
                  onClick={() => navigate(`/analise-fii?ticker=${encodeURIComponent(f.ticker)}`)}
                  className="border-b border-border-muted hover:bg-white/[0.02] cursor-pointer"
                >
                  <td className="px-3.5 py-2.5">
                    <PosBadge pos={i + 1} />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(f.ticker) }}
                        className={`bg-transparent border-0 cursor-pointer text-[15px] p-0 leading-none
                                    ${isFav ? 'text-amber' : 'text-text-muted'}`}
                      >
                        {isFav ? '★' : '☆'}
                      </button>
                      <div>
                        <div className="font-mono text-[13px] font-semibold text-cyan">{f.ticker}</div>
                        <div className="text-[11px] text-text-muted max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    {seg ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap border ${segClass}`}>
                        {seg}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <PerfilBadge pvp={f.pvp} />
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[12px]">{fBRL(f.price)}</td>
                  <td className={`px-3.5 py-2.5 text-right font-mono text-[12px] ${dyColor}`}>{fPct(f.dy)}</td>
                  <td className={`px-3.5 py-2.5 text-right font-mono text-[12px] ${pvpColor}`}>{fNum2(f.pvp)}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[12px]">{fPct(f.ffoYield as number | null)}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[12px]">{fPct(f.vacancia as number | null)}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[12px]">{fLiq(f.liquidez as number | null)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
