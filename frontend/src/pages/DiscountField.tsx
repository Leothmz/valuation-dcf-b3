import { useMemo } from 'react'
import { buildDiscountField } from '../engines/discount-field'
import { useMediaQuery } from '../hooks/useMediaQuery'

const COLS = 13
const ROWS = 9
const VIEW_W = 1200
const VIEW_H = 620

/** As duas pontas da respiração. O intervalo é largo de propósito: entre 9% e 21%
 * a diferença só aparecia nas colunas que já estavam apagadas, e o movimento
 * ficava invisível. De 5% a 28% a maré atravessa o meio da malha. */
const RATE_LOW = 0.05
const RATE_HIGH = 0.28
/** Taxa parada, usada quando o usuário pede menos movimento. Fica entre as duas pontas. */
const RATE_STILL = 0.15

/**
 * O fundo da Home é a curva de desconto do próprio produto.
 *
 * Cada coluna é um ano no futuro; o brilho de cada ponto é o valor presente
 * daquele ano (`1 / (1 + r)^t`). O hero afirma em texto que "um real hoje vale
 * mais do que um real no futuro" — este é o mesmo enunciado, em geometria.
 *
 * A animação não move nada de lugar: ela faz a **taxa de desconto respirar**
 * entre 9% e 21%, via cross-fade entre duas camadas pré-calculadas. Deslocar
 * pontos seria movimento decorativo; mudar o brilho é a informação mudando.
 * Custo por frame: interpolação de `opacity` em dois `<g>`, sem layout, sem JS.
 */
export function DiscountField() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const layers = useMemo(() => {
    const opts = { cols: COLS, rows: ROWS, width: VIEW_W, height: VIEW_H }
    const specs = reduceMotion
      ? [{ key: 'still', rate: RATE_STILL }]
      : [{ key: 'low', rate: RATE_LOW }, { key: 'high', rate: RATE_HIGH }]
    return specs.map((l) => ({ ...l, dots: buildDiscountField({ ...opts, rate: l.rate }) }))
  }, [reduceMotion])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden">
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMin slice"
        className="w-full h-full"
        style={{
          // Fade só na vertical: a malha é atmosfera do topo da página. Na
          // horizontal quem apaga os pontos é o próprio desconto — mascarar
          // também nesse eixo escondia justamente a informação que ela carrega.
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 52%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 52%, transparent 100%)',
        }}
      >
        {layers.map((layer, i) => (
          <g
            key={layer.key}
            data-layer={layer.key}
            className={layers.length === 2 ? (i === 0 ? 'pv-breathe-a' : 'pv-breathe-b') : undefined}
            fill="var(--color-cyan)"
          >
            {layer.dots.map((d) => (
              <circle
                key={`${d.col}-${d.y}`}
                cx={d.x}
                cy={d.y}
                r={d.r}
                opacity={d.opacity * 0.42}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}
