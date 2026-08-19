import { heroMetric } from './RankingMobileList'

describe('heroMetric — a métrica que justifica a posição na lista', () => {
  it('no método Joel usa o earnings yield', () => {
    expect(heroMetric({ ticker: 'X', joelVal: 0.2433 }, 'joel')).toEqual({
      text: '24,33%',
      tone: 'positive',
    })
  })

  it('nos métodos com preço teto usa o upside com sinal', () => {
    // upside = (fair - price) / fair = (50 - 40) / 50
    expect(heroMetric({ ticker: 'X', fairPrice: 50, price: 40 }, 'bazin')).toEqual({
      text: '+20,00%',
      tone: 'positive',
    })
  })

  it('no Thomaz sem preço teto salvo, cai para o score do próprio ranking', () => {
    // Regressão: o Thomaz é o método default e só tem fairPrice quando o usuário
    // salvou um valuation — a linha ficava só com ticker e cotação, sem dizer
    // por que o 1º é o 1º.
    expect(heroMetric({ ticker: 'X', score: 87 }, 'thomaz')).toEqual({
      text: '87 pts',
      tone: 'neutral',
    })
  })

  it('no Thomaz com preço teto salvo, o upside continua vencendo o score', () => {
    expect(heroMetric({ ticker: 'X', score: 87, fairPrice: 50, price: 40 }, 'thomaz')).toEqual({
      text: '+20,00%',
      tone: 'positive',
    })
  })

  it('sem dado nenhum, não inventa métrica', () => {
    expect(heroMetric({ ticker: 'X' }, 'bazin')).toBeNull()
    expect(heroMetric({ ticker: 'X' }, 'thomaz')).toBeNull()
  })
})
