import { useNavigate } from 'react-router-dom'
import { fBRL, fPct } from '../../engines/formatters'
import { useWatchlistStore } from '../../stores/watchlistStore'
import type { FundamentalsData } from '../../api/stocks'

interface Props {
  data: FundamentalsData
  ticker: string
}

function calcUpside(fair: number, price: number): number {
  return (fair - price) / fair
}

type ColorClass = 'text-cyan' | 'text-purple' | 'text-green' | 'text-amber'

function ValCard({
  method,
  fair,
  price,
  formula,
  colorClass,
  earningsYield,
}: {
  method: string
  fair: number | null
  price: number
  formula: string
  colorClass: ColorClass
  earningsYield?: number | null
}) {
  if (earningsYield != null) {
    return (
      <div className="bg-bg-3 border border-border rounded-[10px] p-4">
        <div className="text-[11px] uppercase tracking-[0.06em] text-text-muted mb-1.5">{method}</div>
        <div className={`font-mono text-[22px] font-bold mb-1 ${colorClass}`}>{fPct(earningsYield)}</div>
        <div className="text-[13px] text-text-muted mb-1.5">Earnings Yield</div>
        <div className={`font-mono text-[11px] text-text-muted`}>{formula}</div>
      </div>
    )
  }

  if (fair == null) {
    return (
      <div className="bg-bg-3 border border-border rounded-[10px] p-4">
        <div className="text-[11px] uppercase tracking-[0.06em] text-text-muted mb-1.5">{method}</div>
        <div className={`font-mono text-[11px] text-text-muted mb-1`}>{formula}</div>
        <div className="text-[13px] text-text-muted mt-2">Dados insuficientes</div>
      </div>
    )
  }

  const upside = calcUpside(fair, price)
  const uSign = upside >= 0 ? 'text-green' : 'text-red'
  const uArrow = upside >= 0 ? '↑ +' : '↓ '

  return (
    <div className="bg-bg-3 border border-border rounded-[10px] p-4">
      <div className="text-[11px] uppercase tracking-[0.06em] text-text-muted mb-1.5">{method}</div>
      <div className={`font-mono text-[22px] font-bold mb-1 ${colorClass}`}>{fBRL.format(fair)}</div>
      <div className={`text-[13px] font-semibold mb-1.5 ${uSign}`}>
        {uArrow}{fPct(Math.abs(upside))} upside
      </div>
      <div className="font-mono text-[11px] text-text-muted">{formula}</div>
    </div>
  )
}

export function AnaliseValuations({ data, ticker }: Props) {
  const navigate = useNavigate()
  const entries = useWatchlistStore((s) => s.entries)
  const dcfEntry = entries[ticker]

  const price = data.price ?? 0

  const bazin = data.dpa ? data.dpa / 0.06 : null
  const graham = (data.lpa != null && data.lpa > 0 && data.vpa != null && data.vpa > 0)
    ? Math.sqrt(22.5 * data.lpa * data.vpa)
    : null
  const lynch = (data.lpa != null && data.crescimentoLucros != null && data.crescimentoLucros > 0)
    ? data.lpa * (data.crescimentoLucros * 100)
    : null
  const joelEY = (data.pl != null && data.pl > 0) ? 1 / data.pl : null

  // DCF card
  let dcfBlock: React.ReactNode
  if (!dcfEntry) {
    dcfBlock = (
      <div
        className="rounded-[10px] p-5 flex items-center justify-between gap-4 mb-5"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px dashed rgba(245,158,11,0.35)',
        }}
      >
        <div>
          <strong className="block text-amber text-[15px] mb-1">Preço Teto DCF não calculado</strong>
          <span className="text-text-sec text-[13px]">
            Calcule seu preço justo personalizado com premissas ajustáveis
          </span>
        </div>
        <button
          onClick={() => navigate(`/dcf?ticker=${encodeURIComponent(ticker)}`)}
          className="bg-amber text-bg-0 border-none rounded-[10px] px-5 py-2.5 font-bold text-[13px]
                     cursor-pointer whitespace-nowrap shrink-0 hover:bg-[#d97706] transition-colors"
        >
          Calcular DCF
        </button>
      </div>
    )
  } else {
    const fair = dcfEntry.fairPrice
    const upside = calcUpside(fair, price)
    const uSign = upside >= 0 ? 'text-green' : 'text-red'
    const uArrow = upside >= 0 ? '↑ +' : '↓ '
    const savedDate = new Date(dcfEntry.savedAt).toLocaleDateString('pt-BR')

    dcfBlock = (
      <div
        className="rounded-[10px] p-5 flex items-center justify-between gap-4 flex-wrap mb-5"
        style={{
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.25)',
        }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className="text-[11px] font-bold text-cyan px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}
            >
              salvo
            </span>
          </div>
          <div className="font-mono text-[28px] font-bold text-cyan">{fBRL.format(fair)}</div>
          <div className={`text-[13px] font-semibold mt-1 ${uSign}`}>
            {uArrow}{fPct(Math.abs(upside))} em relação ao preço atual
          </div>
          <div className="text-[12px] text-text-muted mt-1">
            Calculado em {savedDate} ·{' '}
            <button
              onClick={() => navigate(`/dcf?wl=${encodeURIComponent(ticker)}`)}
              className="text-cyan underline cursor-pointer bg-transparent border-none p-0 font-inherit text-[12px]"
            >
              Recalcular
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted mb-3">
        Preço Teto Buffett (DCF)
      </div>
      {dcfBlock}

      <div className="flex items-center justify-between bg-bg-2 border border-border rounded-[10px] px-4 py-2.5 mb-5 text-[14px]">
        <span className="text-text-sec">Preço atual</span>
        <span className="font-mono font-bold">{fBRL.format(price)}</span>
      </div>

      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted mb-3 mt-4">
        Outros Métodos de Valuation
      </div>

      <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
        <ValCard method="Bazin" fair={bazin} price={price} formula="DPA ÷ 6%" colorClass="text-cyan" />
        <ValCard method="Graham" fair={graham} price={price} formula="√(22.5 × LPA × VPA)" colorClass="text-purple" />
        <ValCard method="Peter Lynch" fair={lynch} price={price} formula="LPA × CAGR(%)" colorClass="text-green" />
        <ValCard
          method="Joel (Magic Formula)"
          fair={null}
          price={price}
          formula="1 ÷ P/L"
          colorClass="text-amber"
          earningsYield={joelEY}
        />
      </div>
    </div>
  )
}
