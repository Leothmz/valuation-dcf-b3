// src/b3-csv-parser.js
// Suporta dois formatos de extrato B3:
//   1. CSV de Negociações (col "Código de Negociação") — exportado via Portal do Investidor
//   2. XLS/CSV de Movimentações (col "Produto", col "Entrada/Saída") — exportado via Portal do Investidor
const KNOWN_ETFS = new Set([
  'BOVA11','SMAL11','IVVB11','HASH11','DIVO11','FIND11','MATB11','ECOO11',
  'BBSD11','BBVO11','SPXI11','FIXA11','GOLD11','XFIX11',
])

export function inferAssetClass(ticker) {
  if (KNOWN_ETFS.has(ticker)) return 'etf'
  if (/11$/.test(ticker)) return 'fii'
  return 'acao_br'
}

function parseBRNumber(raw) {
  if (!raw) return 0
  const s = String(raw).trim()
  if (s.includes(',')) {
    // Brazilian format: dots = thousands separators, comma = decimal
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  }
  // No comma: single dot with 1–2 fractional digits → US/XLSX decimal ("21.59")
  // Three fractional digits → BR thousands separator ("1.000" = 1000)
  if (/\.\d{1,2}$/.test(s) && (s.match(/\./g) || []).length === 1) {
    return parseFloat(s) || 0
  }
  return parseFloat(s.replace(/\./g, '')) || 0
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

// Parser para o formato "Movimentações" do Portal do Investidor (XLS/CSV).
// Colunas: Entrada/Saída | Data | Movimentação | Produto | Instituição | Quantidade | Preço unitário | Valor da Operação
// Apenas linhas com Movimentação = "Transferência - Liquidação" são importadas (compras e vendas).
// Credito = venda, Debito = compra.
export function parseB3Movimentacoes(csvText) {
  const text = csvText.replace(/^﻿/, '').trim()
  const lines = text.split(/\r?\n/)
  const headerIdx = lines.findIndex(
    l => l.toLowerCase().includes('entrada') && l.toLowerCase().includes('produto')
  )
  if (headerIdx < 0) throw new Error('Formato B3 Movimentações não reconhecido — cabeçalho não encontrado')

  const sep = lines[headerIdx].includes(';') ? ';' : ','
  const headers = lines[headerIdx].split(sep).map(h => h.trim().replace(/"/g, ''))

  const col = name => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
  const idxDir   = col('entrada')    // Entrada/Saída
  const idxDate  = col('data')
  const idxMov   = col('movimenta')  // Movimentação
  const idxProd  = col('produto')
  const idxQty   = col('quantidade')
  const idxPrice = col('pre')        // Preço unitário

  if (idxDate < 0 || idxProd < 0 || idxQty < 0) {
    throw new Error('Colunas obrigatórias ausentes no formato Movimentações: Data, Produto, Quantidade')
  }

  const ops = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''))
    if (row.length < 4) continue

    const mov = (row[idxMov] || '').toLowerCase()
    // Só importa compras e vendas (liquidação de negociação)
    if (!mov.includes('liquida')) continue

    const dir    = (row[idxDir] || '').toLowerCase()
    // Debito = dinheiro saiu = compra; Credito = dinheiro entrou = venda
    const type   = dir.includes('debito') ? 'buy' : 'sell'

    const prodRaw = row[idxProd] || ''
    const ticker  = prodRaw.split(' - ')[0].trim().toUpperCase()
    if (!ticker) continue

    const qty = parseFloat(row[idxQty]) || 0
    if (qty <= 0) continue

    const priceRaw = idxPrice >= 0 ? row[idxPrice] : ''
    const price = priceRaw === '-' || priceRaw === '' ? 0 : parseBRNumber(priceRaw)

    ops.push({
      id:         null,
      date:       parseBRDate(row[idxDate]),
      ticker,
      assetClass: inferAssetClass(ticker),
      type,
      qty,
      price,
      currency:   'BRL',
      fees:       0,
    })
  }
  return ops
}

const INCOME_KEYWORDS = ['dividendo', 'rendimento', 'juros', 'reembolso', 'leil', 'bonifica']

function normalizeProvType(mov) {
  const m = mov.toLowerCase()
  if (m.includes('dividendo'))  return 'dividendo'
  if (m.includes('rendimento')) return 'rendimento'
  if (m.includes('juros'))      return 'jcp'
  if (m.includes('reembolso'))  return 'reembolso'
  if (m.includes('leil'))       return 'fracao'
  if (m.includes('bonifica'))   return 'bonificacao'
  return 'outro'
}

// Parser para extrair proventos (dividendos, rendimentos, JCP, etc.) do
// formato "Movimentações" do Portal do Investidor (XLS/CSV).
export function parseB3Proventos(csvText) {
  const text = csvText.replace(/^﻿/, '').trim()
  const lines = text.split(/\r?\n/)
  const headerIdx = lines.findIndex(
    l => l.toLowerCase().includes('entrada') && l.toLowerCase().includes('produto')
  )
  if (headerIdx < 0) throw new Error('Formato B3 Movimentações não reconhecido — cabeçalho não encontrado')

  const sep = lines[headerIdx].includes(';') ? ';' : ','
  const headers = lines[headerIdx].split(sep).map(h => h.trim().replace(/"/g, ''))

  const col = name => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
  const idxDir   = col('entrada')
  const idxDate  = col('data')
  const idxMov   = col('movimenta')
  const idxProd  = col('produto')
  const idxQty   = col('quantidade')
  const idxPrice = col('pre')    // Preço unitário
  const idxTotal = col('valor')  // Valor da Operação

  if (idxDate < 0 || idxProd < 0 || idxQty < 0) {
    throw new Error('Colunas obrigatórias ausentes no formato Movimentações: Data, Produto, Quantidade')
  }

  const parseNum = s => (s && s !== '-') ? parseBRNumber(s) : 0

  const proventos = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''))
    if (row.length < 4) continue

    const dir = (row[idxDir] || '').toLowerCase()
    if (!dir.includes('credito')) continue

    const mov = (row[idxMov] || '').toLowerCase()
    if (!INCOME_KEYWORDS.some(k => mov.includes(k))) continue

    const priceRaw = idxPrice >= 0 ? (row[idxPrice] || '') : ''
    if (!priceRaw || priceRaw === '-') continue

    const valuePerShare = parseNum(priceRaw)
    if (valuePerShare <= 0) continue

    const prodRaw = row[idxProd] || ''
    const ticker  = prodRaw.split(' - ')[0].trim().toUpperCase()
    if (!ticker) continue

    const qty   = parseNum(row[idxQty])
    const total = idxTotal >= 0 && row[idxTotal] && row[idxTotal] !== '-'
      ? parseNum(row[idxTotal])
      : qty * valuePerShare

    proventos.push({
      id:           null,
      date:         parseBRDate(row[idxDate]),
      ticker,
      assetClass:   inferAssetClass(ticker),
      type:         normalizeProvType(row[idxMov] || ''),
      qty,
      valuePerShare,
      total,
    })
  }
  return proventos
}

// Auto-detecta o formato e chama o parser correto.
export function parseB3Auto(csvText) {
  const peek = csvText.replace(/^﻿/, '').trimStart().slice(0, 500).toLowerCase()
  if (peek.includes('produto') && peek.includes('entrada')) {
    return parseB3Movimentacoes(csvText)
  }
  return parseB3CSV(csvText)
}
