import { buildFairPriceRange } from '../../engines/fair-price-range'
import { explainRank } from '../../engines/rank-attribution'
import { fBRL } from '../../engines/formatters'
import type { RankingMethod } from '../../stores/rankingStore'
import type { RankedRow } from './index'

interface RankDetailProps {
  row: RankedRow
  method: RankingMethod
}

const POSITION_LABEL: Record<'below' | 'inside' | 'above', string> = {
  below: 'cotação abaixo de toda a faixa',
  inside: 'cotação dentro da faixa',
  above: 'cotação acima de toda a faixa',
}

/**
 * O detalhe da linha: quanto vale (faixa) e por que subiu (fatores).
 *
 * Mesmo componente nos dois viewports — no mobile dentro do ExpandableRow, no
 * desktop dentro da linha expandida da tabela. A faixa é a camada nova; as
 * quatro colunas de método continuam no desktop, por decisão do usuário.
 */
export function RankDetail({ row, method }: RankDetailProps) {
  const range = buildFairPriceRange(
    {
      bazinFairPrice: row.bazinFairPrice,
      grahamFairPrice: row.grahamFairPrice,
      lynchFairPrice: row.lynchFairPrice,
      savedFairPrice: row.savedFairPrice,
    },
    row.price
  )
  const factors = explainRank(row, method)

  return (
    <div className="flex flex-col gap-3">
      <section>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted mb-1.5">
          Preço teto · faixa dos métodos
        </div>

        {range ? (
          <>
            <div className="flex items-baseline justify-between gap-2 font-mono">
              <span className="text-[12px] text-text-sec">{fBRL.format(range.min)}</span>
              <span className="text-[16px] font-bold text-cyan">{fBRL.format(range.median)}</span>
              <span className="text-[12px] text-text-sec">{fBRL.format(range.max)}</span>
            </div>

            {/* Trilho: mínimo à esquerda, máximo à direita, mediana como âncora. */}
            <div className="relative h-[3px] rounded-full my-2" style={{ background: 'var(--color-bg-4)' }}>
              <span
                aria-hidden
                className="absolute top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full"
                style={{ left: `${rangePct(range.median, range.min, range.max)}%`, background: 'var(--color-cyan)' }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-text-sec">
              <span>
                {range.available} de {range.total} métodos ({range.entries.map((e) => e.method).join(', ')})
              </span>
              {range.position && <span>{POSITION_LABEL[range.position]}</span>}
            </div>
          </>
        ) : (
          <div className="text-[12px] text-text-sec">
            Nenhum método calculou preço para este ticker — sem DPA, sem LPA/VPA positivos e sem crescimento,
            os três métodos de preço ficam sem entrada.
          </div>
        )}
      </section>

      <section>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted mb-1.5">
          Por que este rank
        </div>
        <div className="flex flex-wrap gap-1.5">
          {factors.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-baseline gap-1.5 rounded-[7px] border px-2 py-1 text-[11px]"
              style={{
                background: 'var(--color-bg-1)',
                borderColor:
                  f.verdict === 'forte' ? 'rgba(16,185,129,.35)'
                  : f.verdict === 'fraco' ? 'var(--color-border)'
                  : 'var(--color-border-muted)',
              }}
            >
              <span className="text-text-muted">{f.label}</span>
              <span
                className="font-mono font-bold"
                style={{
                  color:
                    f.verdict === 'forte' ? 'var(--color-green)'
                    : f.verdict === 'neutro' ? 'var(--color-text-muted)'
                    : 'var(--color-text-base)',
                }}
              >
                {f.value}
              </span>
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

function rangePct(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}
