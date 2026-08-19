import { render, screen } from '@testing-library/react'
import { RankDetail } from './RankDetail'
import type { RankedRow } from './index'

const row = {
  ticker: 'VULC3',
  price: 13.47,
  bazinFairPrice: 75,
  grahamFairPrice: 23,
  lynchFairPrice: 40,
  savedFairPrice: null,
  lynchVal: 0.45,
  joelVal: 0.2257,
  dy: 0.3339,
  roe: 0.3713,
  pl: 4.4,
  margemLiquida: 0.2489,
  dpa: 4.5,
} as unknown as RankedRow

describe('RankDetail', () => {
  it('mostra a faixa com mínimo, mediana e máximo', () => {
    render(<RankDetail row={row} method="thomaz" />)
    expect(screen.getByText(/R\$\s*23/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*40/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*75/)).toBeInTheDocument()
  })

  it('declara de quantos métodos a faixa veio', () => {
    render(<RankDetail row={row} method="thomaz" />)
    expect(screen.getByText(/3 de 4 métodos/i)).toBeInTheDocument()
  })

  it('diz que a cotação está abaixo da faixa inteira', () => {
    render(<RankDetail row={row} method="thomaz" />)
    expect(screen.getByText(/abaixo de toda a faixa/i)).toBeInTheDocument()
  })

  it('mostra os fatores que explicam a posição no método ativo', () => {
    render(<RankDetail row={row} method="lynch" />)
    expect(screen.getByText('PEG')).toBeInTheDocument()
    expect(screen.getByText('Crescimento')).toBeInTheDocument()
  })

  it('sem nenhum preço teto, explica em vez de mostrar faixa vazia', () => {
    const semPreco = { ...row, bazinFairPrice: null, grahamFairPrice: null, lynchFairPrice: null } as RankedRow
    render(<RankDetail row={semPreco} method="joel" />)
    expect(screen.getByText(/nenhum método calculou preço/i)).toBeInTheDocument()
    expect(screen.queryByText(/de 4 métodos/i)).not.toBeInTheDocument()
  })
})

describe('RankDetail — por que faltou', () => {
  it('explica, por método, o preço que não saiu', () => {
    const semLynch = {
      ...row,
      lynchFairPrice: null,
      crescimentoLucros: null,
    } as unknown as RankedRow
    render(<RankDetail row={semLynch} method="thomaz" />)
    // "Lynch" também aparece na lista de métodos que compõem a faixa — aqui o
    // alvo é o motivo, que só existe na seção "Por que faltou".
    expect(screen.getByText(/sem crescimento de lucros positivo/i)).toBeInTheDocument()
    expect(screen.getByText('Lynch:')).toBeInTheDocument()
  })

  it('não explica nada quando os quatro preços existem', () => {
    const completo = { ...row, savedFairPrice: 60 } as unknown as RankedRow
    render(<RankDetail row={completo} method="thomaz" />)
    expect(screen.queryByText(/por que faltou/i)).not.toBeInTheDocument()
  })

  it('diz que o teto salvo depende da calculadora', () => {
    render(<RankDetail row={row} method="thomaz" />)
    expect(screen.getByText(/ainda não salvou um preço teto/i)).toBeInTheDocument()
  })
})
