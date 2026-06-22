import { fBRL as fBRLFormatter } from '../../engines/formatters'
import {
  buildCategoryAllocation,
  calcAllocationDeviation,
  buildRebalancingSuggestions,
} from '../../engines/portfolio-engine'
import type { HoldingSummary } from '../../engines/portfolio-engine'
import { CATEGORIES } from '../../stores/portfolioStore'
import type { Category } from '../../stores/portfolioStore'

const fBRL = (v: number) => fBRLFormatter.format(v)

const CATEGORY_LABELS: Record<Category, string> = {
  acoes_br: 'Ações BR',
  fiis: 'FIIs',
  renda_fixa: 'Renda Fixa',
  internacional: 'Internacional',
  criptoativos: 'Criptoativos',
  caixa: 'Caixa',
}

const CATEGORY_COLORS: Record<Category, string> = {
  acoes_br: '#06b6d4',
  fiis: '#818cf8',
  renda_fixa: '#10b981',
  internacional: '#f59e0b',
  criptoativos: '#8b5cf6',
  caixa: '#94a3b8',
}

const SUGGESTION_LABELS: Record<'comprar' | 'vender' | 'manter', string> = {
  comprar: 'Comprar',
  vender: 'Vender',
  manter: 'Manter',
}

const SUGGESTION_COLOR: Record<'comprar' | 'vender' | 'manter', string> = {
  comprar: 'text-green',
  vender: 'text-red',
  manter: 'text-text-muted',
}

interface CarteiraMetasProps {
  holdings: HoldingSummary[]
  priceMap: Record<string, number>
  rfValue: number
  cashBalance: number
  allocationTargets: Record<Category, number>
  onSetCashBalance: (amount: number) => void
  onSetTarget: (category: Category, pct: number) => void
}

export function CarteiraMetas({
  holdings,
  priceMap,
  rfValue,
  cashBalance,
  allocationTargets,
  onSetCashBalance,
  onSetTarget,
}: CarteiraMetasProps) {
  const actualValues = buildCategoryAllocation(holdings, priceMap, rfValue, cashBalance)
  const deviations = calcAllocationDeviation(actualValues, allocationTargets)
  const suggestions = buildRebalancingSuggestions(deviations)

  return (
    <div>
      {/* Cash balance input */}
      <div
        className="rounded-[14px] p-4 mb-4"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <label
          htmlFor="metas-cash-balance"
          className="text-[11px] text-text-muted uppercase tracking-[0.4px] block mb-1.5"
        >
          Saldo em Caixa (R$)
        </label>
        <input
          id="metas-cash-balance"
          type="number"
          min="0"
          step="0.01"
          value={cashBalance}
          onChange={(e) => onSetCashBalance(parseFloat(e.target.value) || 0)}
          className="form-input-dark w-[200px]"
        />
      </div>

      {/* Targets + actual vs target bars */}
      <div
        className="rounded-[14px] p-4 mb-4"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <div className="text-[13px] font-semibold text-text-sec uppercase tracking-[0.5px] mb-3">
          Metas por Categoria
        </div>
        {CATEGORIES.map((category) => {
          const dev = deviations[category]
          return (
            <div key={category} className="flex items-center gap-2.5 mb-3">
              <div className="w-[110px] text-xs text-text-sec shrink-0">
                {CATEGORY_LABELS[category]}
              </div>
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden relative"
                style={{ background: '#1f2a3f' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(dev.actualPct, 100).toFixed(1)}%`,
                    background: CATEGORY_COLORS[category],
                  }}
                />
              </div>
              <div
                className="w-12 text-right text-xs"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {dev.actualPct.toFixed(1)}%
              </div>
              <label
                htmlFor={`metas-target-${category}`}
                className="text-xs text-text-muted shrink-0"
              >
                Meta:
              </label>
              <input
                id={`metas-target-${category}`}
                aria-label={`Meta ${CATEGORY_LABELS[category]} (%)`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={allocationTargets[category]}
                onChange={(e) => onSetTarget(category, parseFloat(e.target.value) || 0)}
                className="form-input-dark w-[70px]"
              />
            </div>
          )
        })}
      </div>

      {/* Rebalancing suggestions */}
      <div
        className="rounded-[14px] p-4"
        style={{ background: '#111827', border: '1px solid #1e2d42' }}
      >
        <div className="text-[13px] font-semibold text-text-sec uppercase tracking-[0.5px] mb-3">
          Sugestão de Rebalanceamento
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-text-muted font-normal pb-1.5">Categoria</th>
              <th className="text-right text-text-muted font-normal pb-1.5">Atual</th>
              <th className="text-right text-text-muted font-normal pb-1.5">Meta</th>
              <th className="text-right text-text-muted font-normal pb-1.5">Ação</th>
              <th className="text-right text-text-muted font-normal pb-1.5">Valor</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((category) => {
              const dev = deviations[category]
              const suggestion = suggestions[category]
              return (
                <tr key={category}>
                  <td className="py-1.5">{CATEGORY_LABELS[category]}</td>
                  <td
                    className="text-right py-1.5"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {dev.actualPct.toFixed(1)}%
                  </td>
                  <td
                    className="text-right py-1.5"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {dev.targetPct.toFixed(1)}%
                  </td>
                  <td className={`text-right py-1.5 font-semibold ${SUGGESTION_COLOR[suggestion.action]}`}>
                    {SUGGESTION_LABELS[suggestion.action]}
                  </td>
                  <td
                    className="text-right py-1.5"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {suggestion.amount > 0 ? fBRL(suggestion.amount) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
