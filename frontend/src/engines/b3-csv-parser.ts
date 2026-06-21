import type { ProventoType } from '../stores/portfolioStore'

const KNOWN_ETFS = new Set([
  'BOVA11', 'SMAL11', 'IVVB11', 'HASH11', 'DIVO11', 'FIND11', 'MATB11', 'ECOO11',
  'BBSD11', 'BBVO11', 'SPXI11', 'FIXA11', 'GOLD11', 'XFIX11',
])

export function inferAssetClass(ticker: string): 'etf' | 'fii' | 'acao_br' {
  if (KNOWN_ETFS.has(ticker)) return 'etf'
  if (/11$/.test(ticker)) return 'fii'
  return 'acao_br'
}

function parseBRNumber(raw: string | undefined): number {
  if (!raw) return 0
  const s = String(raw).trim()
  if (s.includes(',')) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  }
  if (/\.\d{1,2}$/.test(s) && (s.match(/\./g) || []).length === 1) {
    return parseFloat(s) || 0
  }
  return parseFloat(s.replace(/\./g, '')) || 0
}

function parseBRDate(s: string): string {
  const [d, m, y] = s.trim().split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const INCOME_KEYWORDS = ['dividendo', 'rendimento', 'juros', 'reembolso', 'leil', 'bonifica']

function normalizeProvType(mov: string): ProventoType {
  const m = mov.toLowerCase()
  if (m.includes('dividendo')) return 'dividendo'
  if (m.includes('rendimento')) return 'rendimento'
  if (m.includes('juros')) return 'jcp'
  if (m.includes('reembolso')) return 'reembolso'
  if (m.includes('leil')) return 'fracao'
  if (m.includes('bonifica')) return 'bonificacao'
  return 'outro'
}

export interface ParsedProvento {
  id: null
  date: string
  ticker: string
  assetClass: 'etf' | 'fii' | 'acao_br'
  type: ProventoType
  qty: number
  valuePerShare: number
  total: number
}

export function parseB3Proventos(csvText: string): ParsedProvento[] {
  const text = csvText.replace(/^﻿/, '').trim()
  const lines = text.split(/\r?\n/)
  const headerIdx = lines.findIndex(
    (l) => l.toLowerCase().includes('entrada') && l.toLowerCase().includes('produto')
  )
  if (headerIdx < 0) {
    throw new Error('Formato B3 Movimentações não reconhecido — cabeçalho não encontrado')
  }

  const sep = lines[headerIdx].includes(';') ? ';' : ','
  const headers = lines[headerIdx].split(sep).map((h) => h.trim().replace(/"/g, ''))

  const col = (name: string) => headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))
  const idxDir = col('entrada')
  const idxDate = col('data')
  const idxMov = col('movimenta')
  const idxProd = col('produto')
  const idxQty = col('quantidade')
  const idxPrice = col('pre')
  const idxTotal = col('valor')

  if (idxDate < 0 || idxProd < 0 || idxQty < 0) {
    throw new Error('Colunas obrigatórias ausentes no formato Movimentações: Data, Produto, Quantidade')
  }

  const parseNum = (s: string) => (s && s !== '-' ? parseBRNumber(s) : 0)

  const proventos: ParsedProvento[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = lines[i].split(sep).map((c) => c.trim().replace(/"/g, ''))
    if (row.length < 4) continue

    const dir = (row[idxDir] || '').toLowerCase()
    if (!dir.includes('credito')) continue

    const mov = (row[idxMov] || '').toLowerCase()
    if (!INCOME_KEYWORDS.some((k) => mov.includes(k))) continue

    const priceRaw = idxPrice >= 0 ? row[idxPrice] || '' : ''
    if (!priceRaw || priceRaw === '-') continue

    const valuePerShare = parseNum(priceRaw)
    if (valuePerShare <= 0) continue

    const prodRaw = row[idxProd] || ''
    const ticker = prodRaw.split(' - ')[0].trim().toUpperCase()
    if (!ticker) continue

    const qty = parseNum(row[idxQty])
    const total =
      idxTotal >= 0 && row[idxTotal] && row[idxTotal] !== '-'
        ? parseNum(row[idxTotal])
        : qty * valuePerShare

    proventos.push({
      id: null,
      date: parseBRDate(row[idxDate]),
      ticker,
      assetClass: inferAssetClass(ticker),
      type: normalizeProvType(row[idxMov] || ''),
      qty,
      valuePerShare,
      total,
    })
  }
  return proventos
}
