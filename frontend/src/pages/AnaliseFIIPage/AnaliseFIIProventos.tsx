import { useIsMobile } from '../../hooks/useMediaQuery'
import type { FIIData } from '../../api/fiis'

interface Props {
  data: FIIData
}

function fBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}

function TTMBadge() {
  return (
    <span
      className="inline-block ml-1.5 px-1.5 py-0 font-bold text-[9px] text-cyan rounded align-middle"
      style={{ background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.25)', fontFamily: 'var(--font-ui)' }}
    >
      TTM
    </span>
  )
}

export function AnaliseFIIProventos({ data }: Props) {
  const isMobile = useIsMobile()
  const divs = data.dividends ?? []
  const price = data.price ?? 0

  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

  const ttmDivs = divs.filter((d) => new Date(d.date + 'T12:00:00') >= oneYearAgo)
  const ttmTotal = ttmDivs.reduce((s, d) => s + d.amount, 0)
  const ttmMonths = new Set(ttmDivs.map((d) => d.date.slice(0, 7))).size
  const avgMonthly = ttmMonths > 0 ? ttmTotal / ttmMonths : 0

  return (
    <div>
      {/* TTM summary cards */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[130px] bg-bg-3 border border-border rounded-[10px] px-4 py-3.5 text-center">
          <div className="font-mono text-[20px] font-bold text-green">
            {ttmTotal > 0 ? fBRL(ttmTotal) : '—'}
          </div>
          <div className="text-[11px] text-text-muted mt-1 uppercase tracking-[0.06em]">DPA TTM</div>
        </div>
        <div className="flex-1 min-w-[130px] bg-bg-3 border border-border rounded-[10px] px-4 py-3.5 text-center">
          <div className="font-mono text-[20px] font-bold text-cyan">
            {avgMonthly > 0 ? fBRL(avgMonthly) : '—'}
          </div>
          <div className="text-[11px] text-text-muted mt-1 uppercase tracking-[0.06em]">Média / mês</div>
        </div>
        <div className="flex-1 min-w-[130px] bg-bg-3 border border-border rounded-[10px] px-4 py-3.5 text-center">
          <div className="font-mono text-[20px] font-bold text-amber">
            {ttmMonths > 0 ? `${ttmMonths} / 12` : '—'}
          </div>
          <div className="text-[11px] text-text-muted mt-1 uppercase tracking-[0.06em]">Consistência</div>
        </div>
      </div>

      {/* Dividend history — montagem condicional (não CSS), mesma regra de AnaliseHistorico.tsx */}
      {divs.length === 0 ? (
        <div className="text-text-muted text-[14px] text-center py-6">
          Sem histórico de proventos disponível
        </div>
      ) : isMobile ? (
        <div className="flex flex-col gap-2">
          {divs.map((div, idx) => {
            const dt = new Date(div.date + 'T12:00:00')
            const isTtm = dt >= oneYearAgo
            const label = dt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
            const dyStr = price > 0 ? fPct(div.amount / price) : '—'

            return (
              <div
                key={idx}
                className="bg-bg-3 border border-border-muted rounded-[10px] p-3 flex items-center justify-between"
              >
                <div className="font-mono text-[14px] font-semibold text-text-sec flex items-center">
                  {label}
                  {isTtm && <TTMBadge />}
                </div>
                <div className="text-right">
                  <div className="font-mono text-[15px] font-bold text-green">{fBRL(div.amount)}</div>
                  <div className="font-mono text-[12px] text-text-muted mt-0.5">{dyStr}</div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-bg-2 border border-border rounded-[14px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[11px] uppercase tracking-[0.06em] text-text-muted px-4 py-2.5 bg-bg-0 border-b border-border">
                  Data
                </th>
                <th className="text-right text-[11px] uppercase tracking-[0.06em] text-text-muted px-4 py-2.5 bg-bg-0 border-b border-border">
                  Provento / cota
                </th>
                <th className="text-right text-[11px] uppercase tracking-[0.06em] text-text-muted px-4 py-2.5 bg-bg-0 border-b border-border">
                  DY mensal
                </th>
              </tr>
            </thead>
            <tbody>
              {divs.map((div, idx) => {
                const dt = new Date(div.date + 'T12:00:00')
                const isTtm = dt >= oneYearAgo
                const label = dt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                const dyStr = price > 0 ? fPct(div.amount / price) : '—'

                return (
                  <tr
                    key={idx}
                    className="border-b border-border-muted last:border-0"
                    style={isTtm ? { background: 'rgba(6,182,212,.03)' } : undefined}
                  >
                    <td className="px-4 py-2.5 text-[13px] text-text-sec">
                      {label}
                      {isTtm && <TTMBadge />}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-[13px] text-green">
                      {fBRL(div.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px] text-text-muted">
                      {dyStr}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
