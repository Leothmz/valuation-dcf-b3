// tests/js/b3-csv-parser.test.js
import { describe, it, expect } from 'vitest'
import { parseB3CSV, parseB3Movimentacoes, inferAssetClass } from '../../src/b3-csv-parser.js'

const SAMPLE_CSV = `Produto;Data do Negócio;Tipo de Movimentação;Código de Negociação;Quantidade;Preço unitário;Valor da Operação
Ações;15/01/2024;Compra;WEGE3;100;"34,20";"3.420,00"
Ações;20/02/2024;Venda;MGLU3;50;"8,60";"430,00"
FII;10/03/2024;Compra;XPLG11;30;"98,40";"2.952,00"`

describe('parseB3CSV', () => {
  it('parses correct number of rows', () => {
    const ops = parseB3CSV(SAMPLE_CSV)
    expect(ops).toHaveLength(3)
  })
  it('parses buy operation correctly', () => {
    const ops = parseB3CSV(SAMPLE_CSV)
    const wege = ops.find(o => o.ticker === 'WEGE3')
    expect(wege.type).toBe('buy')
    expect(wege.qty).toBe(100)
    expect(wege.price).toBeCloseTo(34.20)
    expect(wege.date).toBe('2024-01-15')
  })
  it('parses sell operation correctly', () => {
    const ops = parseB3CSV(SAMPLE_CSV)
    const mglu = ops.find(o => o.ticker === 'MGLU3')
    expect(mglu.type).toBe('sell')
  })
  it('converts date to YYYY-MM-DD', () => {
    const ops = parseB3CSV(SAMPLE_CSV)
    expect(ops[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('throws on unrecognised format', () => {
    expect(() => parseB3CSV('Col1,Col2\nval1,val2')).toThrow()
  })
  it('handles BOM-prefixed files', () => {
    const bomCsv = '﻿' + SAMPLE_CSV
    const ops = parseB3CSV(bomCsv)
    expect(ops).toHaveLength(3)
  })
  it('sets currency to BRL', () => {
    const ops = parseB3CSV(SAMPLE_CSV)
    ops.forEach(o => expect(o.currency).toBe('BRL'))
  })
})

// XLSX prices arrive with US decimal format ("21.59") — parseBRNumber must not strip the dot
const SAMPLE_CSV_XLSX_PRICES = `Produto;Data do Negócio;Tipo de Movimentação;Código de Negociação;Quantidade;Preço unitário;Valor da Operação
Ações;15/01/2024;Compra;WEGE3;100;34.20;3420.00
FII;10/03/2024;Compra;XPLG11;30;98.40;2952.00`

describe('parseB3CSV — US-decimal prices (XLSX via SheetJS)', () => {
  it('parses price 34.20 correctly (not 3420)', () => {
    const ops = parseB3CSV(SAMPLE_CSV_XLSX_PRICES)
    expect(ops.find(o => o.ticker === 'WEGE3').price).toBeCloseTo(34.20)
  })
  it('parses price 98.40 correctly (not 9840)', () => {
    const ops = parseB3CSV(SAMPLE_CSV_XLSX_PRICES)
    expect(ops.find(o => o.ticker === 'XPLG11').price).toBeCloseTo(98.40)
  })
})

// B3 exports "Debito"/"Credito" without accent in the Entrada/Saída column
const SAMPLE_MOV_CSV = `Entrada/Saída;Data;Movimentação;Produto;Instituição;Quantidade;Preço unitário;Valor da Operação
Debito;15/01/2024;Transferência - Liquidação;WEGE3 - WEG SA;XP;100;34,20;3.420,00
Debito;10/03/2024;Transferência - Liquidação;XPLG11 - XP LOG;XP;30;98,40;2.952,00`

describe('parseB3Movimentacoes', () => {
  it('parses buy correctly', () => {
    const ops = parseB3Movimentacoes(SAMPLE_MOV_CSV)
    const wege = ops.find(o => o.ticker === 'WEGE3')
    expect(wege.type).toBe('buy')
    expect(wege.qty).toBe(100)
    expect(wege.price).toBeCloseTo(34.20)
  })
  it('handles BR price with thousands separator "2.159,00"', () => {
    const csv = `Entrada/Saída;Data;Movimentação;Produto;Instituição;Quantidade;Preço unitário;Valor da Operação
Debito;11/05/2026;Transferência - Liquidação;BBAS3F - BB SA;XP;3;2.159,00;6.477,00`
    const ops = parseB3Movimentacoes(csv)
    expect(ops[0].price).toBeCloseTo(2159)
  })
})

describe('inferAssetClass', () => {
  it('BOVA11 → etf', () => expect(inferAssetClass('BOVA11')).toBe('etf'))
  it('XPLG11 → fii (not in ETF list)', () => expect(inferAssetClass('XPLG11')).toBe('fii'))
  it('WEGE3 → acao_br', () => expect(inferAssetClass('WEGE3')).toBe('acao_br'))
})
