import { fPct } from '../../engines/formatters'
import { useIsMobile } from '../../hooks/useMediaQuery'
import type { StockQuote } from '../../api/stocks'

interface Props {
  quote: StockQuote | undefined
}

function fMktCap(n: number | null | undefined): string {
  if (!n) return '—'
  if (n >= 1e12) return 'R$ ' + (n / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'T'
  if (n >= 1e9) return 'R$ ' + (n / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'B'
  if (n >= 1e6) return 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
  return 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function calcYoy(hist: NonNullable<StockQuote['netIncomeHistory']>, i: number) {
  const h = hist[i]
  const prev = hist[i + 1]
  let yoy = '—'
  let yoyClass = 'text-text-muted'

  if (prev && prev.netIncome !== 0) {
    const chg = (h.netIncome - prev.netIncome) / Math.abs(prev.netIncome)
    yoy = (chg >= 0 ? '▲ +' : '▼ ') + fPct(Math.abs(chg))
    yoyClass = chg >= 0 ? 'text-green font-semibold' : 'text-red font-semibold'
  }
  return { yoy, yoyClass }
}

export function AnaliseHistorico({ quote }: Props) {
  const isMobile = useIsMobile()
  const hist = quote?.netIncomeHistory

  if (!hist || hist.length === 0) {
    return (
      <div className="text-text-muted text-[14px] text-center py-6">
        Dados históricos indisponíveis
      </div>
    )
  }

  if (isMobile) {
    // Montagem condicional (não CSS) — mesma regra de WatchlistPage/index.tsx.
    return (
      <div className="flex flex-col gap-2">
        {hist.map((h, i) => {
          const { yoy, yoyClass } = calcYoy(hist, i)
          return (
            <div
              key={h.year}
              className="bg-bg-3 border border-border-muted rounded-[10px] p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-mono text-[14px] font-semibold text-text-sec">{h.year}</div>
                <div className="font-mono text-[15px] font-bold mt-0.5">{fMktCap(h.netIncome)}</div>
              </div>
              <div className={`text-[13px] ${yoyClass}`}>{yoy}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {['Ano', 'Lucro Líquido', 'Variação YoY'].map((h) => (
            <th
              key={h}
              className="text-left text-[11px] uppercase tracking-[0.06em] text-text-muted
                         px-4 py-2 border-b border-border"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hist.map((h, i) => {
          const { yoy, yoyClass } = calcYoy(hist, i)

          return (
            <tr key={h.year}>
              <td className="px-4 py-3 border-b border-[#151e2d] text-[14px] font-mono font-semibold text-text-sec">
                {h.year}
              </td>
              <td className="px-4 py-3 border-b border-[#151e2d] text-[14px] font-mono font-bold">
                {fMktCap(h.netIncome)}
              </td>
              <td className={`px-4 py-3 border-b border-[#151e2d] text-[14px] ${yoyClass}`}>
                {yoy}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
