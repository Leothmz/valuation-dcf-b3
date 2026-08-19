/**
 * Por que aquele campo está vazio.
 *
 * O ranking mostrava `—` e calava: o usuário não sabia se era zero, se a fonte
 * falhou ou se o método não se aplica àquela empresa. Três causas muito
 * diferentes com o mesmo símbolo. As fontes são públicas e instáveis
 * (PRODUCT.md: campo ausente é estado normal), então a explicação é parte do
 * dado, não um extra.
 */

type GapField =
  | 'bazinFairPrice'
  | 'grahamFairPrice'
  | 'lynchFairPrice'
  | 'lynchVal'
  | 'joelFairPrice'
  | 'savedFairPrice'

interface GapRow {
  dpa?: number | null
  lpa?: number | null
  vpa?: number | null
  crescimentoLucros?: number | null
  [key: string]: unknown
}

function isPositive(v: number | null | undefined): boolean {
  return v != null && v > 0
}

export function explainGap(row: GapRow, field: GapField): string | null {
  switch (field) {
    case 'bazinFairPrice':
      return isPositive(row.dpa)
        ? null
        : 'Sem dividendo por ação (DPA) nos dados — o teto do Bazin é DPA ÷ taxa, então não há o que calcular.'

    case 'grahamFairPrice': {
      if (isPositive(row.lpa) && isPositive(row.vpa)) return null
      if (!isPositive(row.lpa) && !isPositive(row.vpa)) {
        return 'Graham exige LPA e VPA positivos; nenhum dos dois está disponível para esta empresa.'
      }
      return isPositive(row.lpa)
        ? 'Graham exige VPA positivo — patrimônio líquido por ação indisponível ou negativo.'
        : 'Graham exige LPA positivo — a empresa não tem lucro por ação positivo no período.'
    }

    case 'lynchFairPrice':
    case 'lynchVal':
      return isPositive(row.crescimentoLucros)
        ? null
        : 'Sem crescimento de lucros positivo, o método de Lynch não produz preço nem PEG.'

    case 'joelFairPrice':
      // Não é dado faltando: a Magic Formula ordena, não avalia preço.
      return 'A Magic Formula não calcula preço teto — ela ordena por Earnings Yield e ROIC.'

    case 'savedFairPrice':
      return 'Você ainda não salvou um preço teto para este ticker na Calculadora DCF.'

    default:
      return null
  }
}
