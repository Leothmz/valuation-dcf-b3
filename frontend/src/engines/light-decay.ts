import { presentValueFactor } from './discount-field'

/**
 * A luz que viaja de hoje para o futuro, minguando no caminho.
 *
 * O eixo horizontal é o tempo: à esquerda o presente, à direita o futuro
 * distante. A intensidade da luz em cada ponto é o valor presente daquele
 * instante (`1 / (1+r)^t`) — a mesma conta da DCF. Como os feixes se deslocam
 * para a direita atravessando essa máscara, o desconto deixa de ser um degradê
 * parado e passa a ser o próprio movimento: a luz enfraquece porque está indo
 * para o futuro.
 */

export interface DecayStop {
  /** Posição no eixo, em porcentagem da largura. */
  offset: number
  /** Intensidade nesse ponto (0–1). */
  opacity: number
}

/** Horizonte em anos que a largura da tela representa. */
export const HORIZON_YEARS = 14

/**
 * Paradas do degradê de desconto, do presente (cheio) ao futuro (apagado).
 * A última parada é forçada a zero para a luz se apagar em vez de truncar na borda.
 */
export function buildDecayStops(steps: number, rate: number): DecayStop[] {
  const stops: DecayStop[] = []
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    const year = progress * HORIZON_YEARS
    const isLast = i === steps
    stops.push({
      offset: Math.round(progress * 100),
      opacity: isLast ? 0 : presentValueFactor(year, rate),
    })
  }
  return stops
}

/**
 * Duração da travessia de cada feixe, em segundos.
 *
 * Valores distintos e propositalmente não múltiplos entre si: feixes com a mesma
 * duração andam em bloco e o fundo vira uma esteira. Faixa lenta (18–27s) porque
 * o movimento é atmosfera, não um evento que pede atenção.
 */
export function travelDuration(index: number): number {
  const durations = [19, 23, 26, 21]
  return durations[index % durations.length]
}
