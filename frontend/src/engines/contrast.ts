/**
 * Contraste WCAG 2.x — usado para provar em teste que um token de cor do
 * `index.css` cumpre o piso de legibilidade antes de entrar na paleta.
 *
 * Existe porque o `--color-text-muted` original (#4a5568) rendia 2,39:1 sobre
 * `--color-bg-2` e carregava 283 usos de rotulagem (KPIs, cabeçalhos de tabela,
 * eyebrows, valores ausentes). Um número em teste impede que a próxima escolha
 * de cinza volte a ser feita no olho.
 */

/** Luminância relativa WCAG de uma cor hex (`#rgb` ou `#rrggbb`). */
export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const channels = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const [r, g, b] = channels.map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste WCAG entre duas cores hex (1 a 21). Simétrica. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}
