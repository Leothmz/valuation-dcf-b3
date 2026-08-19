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
 * Um valor distinto por feixe e propositalmente não múltiplos entre si: durações
 * iguais (ou proporcionais) fazem os feixes andarem em bloco e o fundo vira
 * esteira. A faixa é lenta — 27s a 39s para atravessar a tela — porque o
 * movimento é atmosfera, não um evento que pede atenção.
 */
export function travelDuration(index: number): number {
  const durations = [29, 34, 39, 31, 36, 27]
  return durations[index % durations.length]
}
