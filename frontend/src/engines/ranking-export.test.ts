import { buildRankingCSV } from './ranking-export'

const rows = [
  {
    ticker: 'VULC3', name: 'Vulcabras', rank: 1, price: 13.47, dy: 0.3339, pl: 4.4,
    roe: 0.3713, margemLiquida: 0.2489, dividaLiquidaEbit: 0.76,
    bazinFairPrice: 74.95, grahamFairPrice: 23.36, lynchFairPrice: 40, lynchVal: 0.45, joelVal: 0.2257,
  },
  {
    ticker: 'BBSE3', name: 'BB Seguridade', rank: 2, price: 37.2, dy: 0.1234, pl: 7.9,
    roe: 0.8594, margemLiquida: 0.8793, dividaLiquidaEbit: -0.65,
    bazinFairPrice: 76.5, grahamFairPrice: 24.43, lynchFairPrice: null, lynchVal: null, joelVal: 0.1272,
  },
] as never[]

describe('buildRankingCSV', () => {
  it('abre com BOM e usa ponto e vírgula como separador', () => {
    const csv = buildRankingCSV(rows, 'thomaz')
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.split('\n')[0].split(';').length).toBeGreaterThan(8)
  })

  it('traz o método ativo no cabeçalho da coluna de rank', () => {
    expect(buildRankingCSV(rows, 'bazin').split('\n')[0]).toContain('Rank Bazin')
  })

  it('preserva a ordem das linhas exibidas', () => {
    const linhas = buildRankingCSV(rows, 'thomaz').split('\n')
    expect(linhas[1]).toContain('VULC3')
    expect(linhas[2]).toContain('BBSE3')
  })

  it('usa vírgula decimal — é planilha em pt-BR', () => {
    expect(buildRankingCSV(rows, 'thomaz')).toContain('13,47')
  })

  it('percentual sai como número, não como texto com %', () => {
    const linha = buildRankingCSV(rows, 'thomaz').split('\n')[1]
    expect(linha).toContain('33,39')
    expect(linha).not.toContain('%')
  })

  it('campo ausente vira célula vazia, não a palavra null', () => {
    const linha = buildRankingCSV(rows, 'thomaz').split('\n')[2]
    expect(linha).not.toMatch(/null|undefined|—/)
    expect(linha).toContain(';;')
  })

  it('nome com ponto e vírgula não quebra a coluna', () => {
    const csv = buildRankingCSV(
      [{ ticker: 'XPTO3', name: 'Empresa; Teste', rank: 1 }] as never[],
      'thomaz'
    )
    expect(csv).toContain('"Empresa; Teste"')
  })
})
