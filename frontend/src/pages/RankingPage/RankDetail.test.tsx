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
