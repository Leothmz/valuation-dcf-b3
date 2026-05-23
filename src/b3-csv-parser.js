// src/b3-csv-parser.js
const KNOWN_ETFS = new Set([
  'BOVA11','SMAL11','IVVB11','HASH11','DIVO11','FIND11','MATB11','ECOO11',
  'BBSD11','BBVO11','SPXI11','FIXA11','GOLD11','XFIX11',
])

export function inferAssetClass(ticker) {
  if (KNOWN_ETFS.has(ticker)) return 'etf'
  if (/11$/.test(ticker)) return 'fii'
  return 'acao_br'
}

function parseBRNumber(s) {
  if (!s) return 0
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function parseBRDate(s) {
  const [d, m, y] = s.trim().split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function parseB3CSV(csvText) {
  const text = csvText.replace(/^﻿/, '').trim()
  const lines = text.split(/\r?\n/)
  const headerIdx = lines.findIndex(
    l => l.includes('Data') && (l.includes('Quantidade') || l.includes('Negóci'))
  )
  if (headerIdx < 0) throw new Error('Formato B3 não reconhecido — cabeçalho não encontrado')

  const sep = lines[headerIdx].includes(';') ? ';' : ','
  const headers = lines[headerIdx].split(sep).map(h => h.trim().replace(/"/g, ''))

  const col = name => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
  const idxDate   = col('Data')
  const idxType   = col('Movimenta')
  const idxTicker = col('Código') >= 0 ? col('Código') : col('Codigo')
  const idxQty    = col('Quantidade')
  const idxPrice  = col('Preço') >= 0  ? col('Preço')  : col('Preco')

  if (idxDate < 0 || idxTicker < 0 || idxQty < 0) {
    throw new Error('Colunas obrigatórias ausentes: Data, Código de Negociação, Quantidade')
  }

  const ops = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''))
    if (row.length < 3) continue
    const ticker = row[idxTicker]?.toUpperCase()
    if (!ticker) continue
    const qty   = parseBRNumber(row[idxQty])
    const price = idxPrice >= 0 ? parseBRNumber(row[idxPrice]) : 0
    if (qty <= 0) continue
    const rawType = idxType >= 0 ? row[idxType] : ''
    ops.push({
      id:         null,
      date:       parseBRDate(row[idxDate]),
      ticker,
      assetClass: inferAssetClass(ticker),
      type:       rawType.toLowerCase().includes('venda') ? 'sell' : 'buy',
      qty,
      price,
      currency:   'BRL',
      fees:       0,
    })
  }
  return ops
}
