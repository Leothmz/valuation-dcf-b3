import { fPct } from '../../engines/formatters'
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

export function AnaliseHistorico({ quote }: Props) {
  const hist = quote?.netIncomeHistory

  if (!hist || hist.length === 0) {
    return (
      <div className="text-text-muted text-[14px] text-center py-6">
        Dados históricos indisponíveis
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
          const prev = hist[i + 1]
          let yoy = '—'
          let yoyClass = 'text-text-muted'

          if (prev && prev.netIncome !== 0) {
            const chg = (h.netIncome - prev.netIncome) / Math.abs(prev.netIncome)
            yoy = (chg >= 0 ? '▲ +' : '▼ ') + fPct(Math.abs(chg))
            yoyClass = chg >= 0 ? 'text-green font-semibold' : 'text-red font-semibold'
          }

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
