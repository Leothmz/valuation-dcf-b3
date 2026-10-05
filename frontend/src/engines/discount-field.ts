/**
 * A malha de desconto do fundo da Home.
 *
 * Cada coluna é um ano no futuro e o brilho de cada ponto é o **valor presente**
 * daquele ano — a mesma conta que o app faz na DCF (`CF / (1 + r)^t`). O hero já
 * diz em texto que "um real hoje vale mais do que um real no futuro"; aqui a
 * frase vira a textura da página, e não uma decoração qualquer que serviria para
 * qualquer produto.
 *
 * Geometria pura, testável sem DOM. O componente só desenha o que sai daqui.
 */

export interface DiscountDot {
  x: number
  y: number
  /** Raio em px — acompanha o valor presente, com piso legível. */
  r: number
  opacity: number
  /** Índice da coluna. */
  col: number
  /** Ano que a coluna representa (t na fórmula). Igual ao col; nomeado para deixar a intenção explícita. */
  year: number
}

export interface DiscountFieldOptions {
  cols: number
  rows: number
  /** Taxa de desconto (0–1). Na Home ela respira entre dois valores. */
  rate: number
  width: number
  height: number
}

/** Piso de brilho: o futuro distante fica fraco, nunca invisível — some é diferente de valer pouco. */
const MIN_OPACITY = 0.10
const MAX_OPACITY = 1
const MIN_RADIUS = 0.6
const MAX_RADIUS = 3.2

/** Fator de valor presente: 1 / (1 + r)^t. */
export function presentValueFactor(year: number, rate: number): number {
  return 1 / Math.pow(1 + rate, year)
}

export function buildDiscountField({
  cols, rows, rate, width, height,
}: DiscountFieldOptions): DiscountDot[] {
  const dots: DiscountDot[] = []
  const stepX = width / cols
  const stepY = height / rows

  for (let col = 0; col < cols; col++) {
    const pv = presentValueFactor(col, rate)
    const opacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * pv
    const r = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * pv

    for (let row = 0; row < rows; row++) {
      dots.push({
        x: stepX * (col + 0.5),
        y: stepY * (row + 0.5),
        r,
        opacity,
        col,
        year: col,
      })
    }
  }

  return dots
}
