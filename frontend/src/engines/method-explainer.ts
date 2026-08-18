import type { RankingMethod } from '../stores/rankingStore'

/**
 * O que cada método de ranking privilegia, como calcula e onde engana.
 *
 * Existe porque a escolha primária de `/ranking` são cinco nomes próprios
 * (Thomaz, Bazin, Graham, Lynch, Joel) e nenhuma frase dizendo o que cada um
 * defende — o iniciante trava justamente na decisão mais importante da tela.
 *
 * Cada texto é fiel a `engines/ranking-scores.ts`. Se a fórmula mudar lá, muda
 * aqui: o ponto do card é o usuário poder auditar o número, não confiar nele.
 */
export interface MethodExplainer {
  title: string
  /** O que o método considera importante numa ação. */
  privileges: string
  /** A conta, em uma linha. */
  formula: string
  /** Onde ele erra — todo método tem um ponto cego. */
  blindSpot: string
}

export const METHOD_EXPLAINERS: Record<RankingMethod, MethodExplainer> = {
  thomaz: {
    title: 'Rank Thomaz',
    privileges:
      'Equilíbrio: em vez de eleger um indicador, ranqueia a ação em DY, P/L, margem líquida, DL/EBITDA, ROE e ROIC, e combina os seis por peso.',
    formula: 'Score 0–100 a partir da média ponderada das posições em cada indicador.',
    blindSpot:
      'É comparativo, não absoluto: o 1º lugar de uma lista ruim continua sendo o 1º. Diz quem está melhor entre os filtrados, não se algum está barato.',
  },
  bazin: {
    title: 'Rank Bazin',
    privileges:
      'Dividendo como âncora: o preço justo é o que faz o provento pago render pelo menos a taxa que você exige.',
    formula: 'Preço teto = DPA ÷ 6% (taxa ajustável nos filtros).',
    blindSpot:
      'Um dividendo extraordinário infla o teto e some no ano seguinte. Ignora crescimento e endividamento — empresa que distribui muito porque não tem onde investir parece barata.',
  },
  graham: {
    title: 'Rank Graham',
    privileges:
      'Barateza contra o patrimônio e o lucro: paga pouco por real de lucro e por real de patrimônio líquido.',
    formula: 'Preço teto = √(22,5 × LPA × VPA), só quando LPA e VPA são positivos.',
    blindSpot:
      'Exige lucro e patrimônio positivos, então some em prejuízo. Penaliza empresa de ativo leve, cujo valor está em marca e software, não no balanço.',
  },
  lynch: {
    title: 'Rank Lynch',
    privileges:
      'Crescimento contra preço: uma ação cara pode ser barata se crescer rápido o bastante para justificar o múltiplo.',
    formula: 'Preço teto = LPA × (crescimento × 100); a coluna mostra o PEG = P/L ÷ crescimento.',
    blindSpot:
      'Sem crescimento positivo não há preço nenhum. E crescimento passado não se repete por decreto — o método assume que sim.',
  },
  joel: {
    title: 'Rank Joel · Magic Formula',
    privileges:
      'Duas perguntas ao mesmo tempo: a ação está barata (Earnings Yield) e a empresa é boa em transformar capital em lucro (ROIC)?',
    formula: 'Combina a posição em Earnings Yield (1 ÷ P/L) com a posição em ROIC.',
    blindSpot:
      'Não calcula preço teto — só ordena, então não diz até quanto pagar. Sem ROIC disponível, o ticker despenca no ranking por falta de dado, não por ser ruim.',
  },
}

export function explainMethod(method: RankingMethod): MethodExplainer {
  return METHOD_EXPLAINERS[method]
}
