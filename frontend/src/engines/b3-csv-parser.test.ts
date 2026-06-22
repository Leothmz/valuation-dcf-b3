import { describe, it, expect } from 'vitest'
import { parseB3Proventos, inferAssetClass } from './b3-csv-parser'

const SAMPLE_PROV_CSV = `Entrada/Saída;Data;Movimentação;Produto;Instituição;Quantidade;Preço unitário;Valor da Operação
Credito;15/01/2024;Dividendo;WEGE3 - WEG SA;XP;100;0,50;50,00
Credito;20/02/2024;Juros Sobre Capital Próprio;BBAS3 - BB SA;XP;50;0,80;40,00
Debito;01/03/2024;Transferência - Liquidação;WEGE3 - WEG SA;XP;10;34,20;342,00
Credito;10/03/2024;Rendimento;XPLG11 - XP LOG;XP;30;0,75;22,50`

describe('parseB3Proventos', () => {
  it('parses correct number of income rows (ignores debits and non-income movements)', () => {
    const provs = parseB3Proventos(SAMPLE_PROV_CSV)
    expect(provs).toHaveLength(3)
  })

  it('parses dividendo correctly', () => {
    const provs = parseB3Proventos(SAMPLE_PROV_CSV)
    const wege = provs.find((p) => p.ticker === 'WEGE3')!
    expect(wege.type).toBe('dividendo')
    expect(wege.qty).toBe(100)
    expect(wege.valuePerShare).toBeCloseTo(0.5)
    expect(wege.total).toBeCloseTo(50)
    expect(wege.date).toBe('2024-01-15')
  })

  it('normalizes "Juros Sobre Capital Próprio" to type jcp', () => {
    const provs = parseB3Proventos(SAMPLE_PROV_CSV)
    expect(provs.find((p) => p.ticker === 'BBAS3')!.type).toBe('jcp')
  })

  it('normalizes "Rendimento" to type rendimento', () => {
    const provs = parseB3Proventos(SAMPLE_PROV_CSV)
    expect(provs.find((p) => p.ticker === 'XPLG11')!.type).toBe('rendimento')
  })

  it('ignores Debito rows (not income)', () => {
    const provs = parseB3Proventos(SAMPLE_PROV_CSV)
    expect(provs.find((p) => p.qty === 10)).toBeUndefined()
  })

  it('infers assetClass per ticker', () => {
    const provs = parseB3Proventos(SAMPLE_PROV_CSV)
    expect(provs.find((p) => p.ticker === 'WEGE3')!.assetClass).toBe('acao_br')
    expect(provs.find((p) => p.ticker === 'XPLG11')!.assetClass).toBe('fii')
  })

  it('throws on unrecognised format', () => {
    expect(() => parseB3Proventos('Col1,Col2\nval1,val2')).toThrow()
  })

  it('handles BOM-prefixed files', () => {
    const bom = '﻿' + SAMPLE_PROV_CSV
    expect(parseB3Proventos(bom)).toHaveLength(3)
  })
})

describe('inferAssetClass', () => {
  it('BOVA11 → etf', () => expect(inferAssetClass('BOVA11')).toBe('etf'))
  it('XPLG11 → fii (not in ETF list)', () => expect(inferAssetClass('XPLG11')).toBe('fii'))
  it('WEGE3 → acao_br', () => expect(inferAssetClass('WEGE3')).toBe('acao_br'))
})
