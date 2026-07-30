import { ExpandableRow } from '../../components/ExpandableRow'
import { fBRL as fBRLFormatter, fPct, fPctSigned } from '../../engines/formatters'
import type { HoldingSummary, AssetTWRR } from '../../engines/portfolio-engine'

const fBRL = (v: number) => fBRLFormatter.format(v)

interface CarteiraAtivosMobileProps {
  holdings: HoldingSummary[]
  currentPriceMap: Record<string, number>
  twrrMap: Record<string, AssetTWRR>
}

// Visibilidade é decidida pelo pai (CarteiraAtivos) via useIsMobile() — monta só quando
// for o caso, nunca em paralelo com a <table> (evita render dobrado + duplicatas no DOM).
export function CarteiraAtivosMobile({ holdings, currentPriceMap, twrrMap }: CarteiraAtivosMobileProps) {
  const totalValue = holdings.reduce((sum, h) => {
    const price = currentPriceMap[h.ticker]
    return price != null ? sum + h.qty * price : sum
  }, 0)

  return (
    <div>
      {holdings.map((h) => {
        const cotacao = currentPriceMap[h.ticker] ?? null
        const valorCarteira = cotacao != null ? h.qty * cotacao : null
        const retorno = h.precoMedio && cotacao ? (cotacao - h.precoMedio) / h.precoMedio : null
        const alocacao = valorCarteira != null && totalValue > 0 ? valorCarteira / totalValue : null
        const twrrEntry = twrrMap[h.ticker]
        const twrr = twrrEntry?.twrr ?? null
        const subPeriods = twrrEntry?.subPeriods ?? []

        return (
          <ExpandableRow
            key={h.ticker}
            ariaLabel={h.ticker}
            summary={
              <>
                <span className="font-mono font-extrabold text-[13px] text-cyan truncate">
                  {h.ticker}
                </span>
                <span className="ml-auto font-mono text-[11px] text-text-sec shrink-0">
                  {valorCarteira != null ? fBRL(valorCarteira) : '—'}
                </span>
                {retorno != null && (
                  <span
                    className="font-mono text-[12px] font-bold shrink-0"
                    style={{ color: retorno >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
                  >
                    {fPctSigned(retorno)}
                  </span>
                )}
              </>
            }
          >
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { lb: 'Quantidade', vl: h.qty.toLocaleString('pt-BR') },
                { lb: 'Preço Médio', vl: h.precoMedio != null ? fBRL(h.precoMedio) : '—' },
                { lb: 'Valor Investido', vl: h.investido != null ? fBRL(h.investido) : '—' },
                { lb: 'Alocação %', vl: alocacao != null ? fPct(alocacao, 1) : '—' },
              ].map(({ lb, vl }) => (
                <div
                  key={lb}
                  className="flex justify-between rounded-[7px] border border-border px-2 py-1.5"
                  style={{ background: 'var(--color-bg-1)' }}
                >
                  <span className="text-[10px] text-text-muted">{lb}</span>
                  <span className="font-mono text-[11px] font-bold text-text-base">{vl}</span>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between py-2 mt-1.5">
              <span className="text-[12px] text-text-sec">TWRR</span>
              <span
                className="font-mono text-[14px] font-bold"
                style={{
                  color:
                    twrr != null
                      ? twrr >= 0
                        ? 'var(--color-green)'
                        : 'var(--color-red)'
                      : 'var(--color-text-base)',
                }}
              >
                {twrr != null ? fPctSigned(twrr) : '—'}
              </span>
            </div>

            {subPeriods.length > 0 && (
              <ExpandableRow
                ariaLabel={`TWRR de ${h.ticker}`}
                summary={
                  <span className="text-[12px] text-text-sec">
                    Ver sub-períodos ({subPeriods.length})
                  </span>
                }
              >
                <div className="flex flex-col gap-1.5">
                  {subPeriods.map((sp, i) => {
                    const periodReturn =
                      sp.startValue > 0 ? (sp.endValue - sp.startValue) / sp.startValue : null
                    return (
                      <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                        <span className="text-text-muted shrink-0">Período {i + 1}</span>
                        <span className="font-mono text-text-sec truncate min-w-0 flex-1 text-right">
                          {fBRL(sp.startValue)} → {fBRL(sp.endValue)}
                        </span>
                        <span
                          className="font-mono font-bold shrink-0"
                          style={{ color: periodReturn != null && periodReturn >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
                        >
                          {periodReturn != null ? fPctSigned(periodReturn) : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </ExpandableRow>
            )}
          </ExpandableRow>
        )
      })}
    </div>
  )
}
