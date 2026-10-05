import type { DCFResult } from './dcf-engine'

export interface DCFWarning {
  id: 'payout' | 'growth' | 'terminal'
  text: string
}

interface WarnAssumptions {
  payout?: number | null
  g?: number | null
}

/** Acima disso, o preço teto deixa de ser explicado pelos fluxos projetados. */
const TERMINAL_SHARE_LIMIT = 0.5

/**
 * Avisos que qualificam o preço teto sem bloquear o cálculo — diferente do erro
 * de Gordon (perpetuidade ≥ desconto), que impede o resultado de existir.
 *
 * Caso real que motivou isto: PETR4 com payout de 125,89% (distribuiu mais do
 * que lucrou) faz `g = (1 - payout) × ROE` virar -7,84%, e o app entregava
 * "R$ 126,83 · +66,30%" sobre uma ação a R$ 42,74, com 57% do valor vindo da
 * perpetuidade — tudo sem uma linha de ressalva.
 *
 * Ordem fixa: causa (payout) antes do efeito (crescimento negativo), e a
 * composição do valor (perpetuidade) por último.
 */
export function buildDCFWarnings(a: WarnAssumptions, r: DCFResult | null): DCFWarning[] {
  const out: DCFWarning[] = []

  if (a.payout != null && a.payout > 1) {
    const pct = (a.payout * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
    out.push({
      id: 'payout',
      text: `Payout de ${pct}%: a empresa distribuiu mais do que lucrou no período, então o crescimento estimado sai distorcido.`,
    })
  }

  if (a.g != null && a.g < 0) {
    out.push({
      id: 'growth',
      text: 'Crescimento estimado negativo: os fluxos projetados encolhem ano a ano e o preço teto passa a se apoiar quase todo na perpetuidade.',
    })
  }

  if (r && r.ev > 0) {
    const share = r.pvTV / r.ev
    if (share > TERMINAL_SHARE_LIMIT) {
      const pct = Math.round(share * 100)
      out.push({
        id: 'terminal',
        text: `${pct}% do valor vem do valor terminal, não dos fluxos projetados. Trate o teto como sensível à taxa de perpetuidade.`,
      })
    }
  }

  return out
}
