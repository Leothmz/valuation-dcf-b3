import type { FIIData } from '../../api/fiis'

interface Props {
  data: FIIData | undefined
  isLoading: boolean
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

function Skel({ w = 80, h = 20 }: { w?: number; h?: number }) {
  return <span className="skeleton inline-block rounded" style={{ width: w, height: h, display: 'inline-block' }} />
}

export function AnaliseFIIHero({ data, isLoading }: Props) {
  const price = data?.price
  const chg = data?.changePercent ?? 0
  const lo = data?.fiftyTwoWeekLow
  const hi = data?.fiftyTwoWeekHigh
  const rangePct = lo && hi && hi > lo
    ? Math.min(100, Math.max(0, (((price ?? 0) - lo) / (hi - lo)) * 100))
    : 50

  const vacColor = data?.vacancia == null ? '' :
    data.vacancia <= 0.05 ? 'text-green' :
    data.vacancia >= 0.15 ? 'text-red' : ''

  return (
    <div
      className="rounded-[14px] px-6 py-5 border border-border"
      style={{ background: 'linear-gradient(135deg, var(--color-bg-2), rgba(6,182,212,.04))' }}
    >
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-[13px] font-bold text-cyan rounded-[20px] px-3 py-0.5 inline-block"
            style={{ background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.2)' }}
          >
            {isLoading ? <Skel w={70} h={18} /> : (data?.ticker ?? '—')}
          </span>
          <div className="text-[22px] font-bold text-text-base mt-1">
            {isLoading ? <Skel w={260} h={28} /> : (data?.name ?? '—')}
          </div>
          {/* Segmento vira subtítulo do ticker/nome em vez de chip — texto informativo, não KPI */}
          {isLoading ? (
            <Skel w={100} h={13} />
          ) : (
            <div className="text-[11px] text-text-muted">
              {data?.segmento == null || data.segmento === ''
                ? <span className="italic">indisponível</span>
                : data.segmento}
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="font-mono text-[32px] font-bold block">
            {isLoading ? <Skel w={120} h={36} /> : fBRL(price)}
          </span>
          {isLoading ? (
            <Skel w={80} h={18} />
          ) : (
            <span className={`text-[15px] font-semibold block mt-0.5 ${chg >= 0 ? 'text-green' : 'text-red'}`}>
              {chg >= 0 ? '▲ +' : '▼ '}{fPct(chg / 100)}
            </span>
          )}
        </div>
      </div>

      {/* KPI chips. Vacância vem do scraper statusinvest (pode falhar) — ganha estado
          "indisponível" explícito; DY/P-VP vêm do yfinance (sempre confiável), mantêm '—'. */}
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2.5 mb-4">
        {[
          { label: 'DY TTM', value: fPct(data?.dy), color: 'text-green', scraper: false, raw: data?.dy },
          { label: 'P/VP', value: fNum2(data?.pvp), color: 'text-cyan', scraper: false, raw: data?.pvp },
          { label: 'Vacância', value: fPct(data?.vacancia), color: vacColor, scraper: true, raw: data?.vacancia },
        ].map(({ label, value, color, scraper, raw }) => (
          <div
            key={label}
            className="bg-bg-3 border border-border rounded-[10px] px-3.5 py-2 flex flex-col gap-0.5 md:min-w-[110px]"
          >
            <span className="text-[10px] uppercase tracking-[0.06em] text-text-muted">{label}</span>
            <span className={`font-mono text-[15px] font-semibold ${color}`}>
              {isLoading
                ? <Skel w={55} h={18} />
                : scraper && raw == null
                  ? <span className="italic text-text-muted">indisponível</span>
                  : value}
            </span>
          </div>
        ))}
      </div>

      {/* 52-week bar */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px] text-text-sec min-w-[70px]">
          {fBRL(lo)}
        </span>
        <div className="flex-1 h-1.5 bg-bg-3 rounded-full relative">
          {/* Mesmas classes da barra da análise de ações. Antes era um gradiente
              inline com var(--red)/var(--amber)/var(--green) — variáveis que não
              existem: os tokens do tema são --color-red/-amber/-green. Sem elas o
              gradiente não pintava nada e sobrava só o trilho cinza. */}
          <div
            className="h-full bg-gradient-to-r from-red via-amber to-green rounded-full"
            style={{ width: '100%' }}
          />
          <div
            className="w-3 h-3 bg-text-base border-2 border-bg-1 rounded-full absolute top-[-3px]"
            style={{ left: `${rangePct}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <span className="font-mono text-[12px] text-text-sec min-w-[70px] text-right">
          {fBRL(hi)}
        </span>
      </div>
    </div>
  )
}
