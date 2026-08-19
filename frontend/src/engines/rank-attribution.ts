import type { RankingMethod } from '../stores/rankingStore'
import { fPct, fNum, fBRL } from './formatters'

/**
 * Por que este ticker está nesta posição, neste método.
 *
 * O ranking dizia a ordem e escondia o motivo: o iniciante via VULC3 em 1º sem
 * saber o que puxou, e o experiente tinha que cruzar colunas na cabeça. Cada
 * método tem dois ou três motores próprios — são eles que aparecem aqui.
 *
 * Regra de honestidade: dado ausente vira fator `neutro` com `—`, nunca some.
 * Sumir esconderia que a posição foi calculada sem ele.
 */
export interface RankFactor {
  label: string
  value: string
  verdict: 'forte' | 'fraco' | 'neutro'
}

interface AttributionRow {
  dpa?: number | null
  price?: number | null
  bazinFairPrice?: number | null
  lpa?: number | null
  vpa?: number | null
  crescimentoLucros?: number | null
  lynchVal?: number | null
  joelVal?: number | null
  roic?: number | null
  dy?: number | null
  roe?: number | null
  pl?: number | null
  margemLiquida?: number | null
  [key: string]: unknown
}

const MAX_FACTORS = 3

function factor(
  label: string,
  raw: number | null | undefined,
  format: (v: number) => string,
  isStrong: (v: number) => boolean
): RankFactor {
  if (raw == null) return { label, value: '—', verdict: 'neutro' }
  return { label, value: format(raw), verdict: isStrong(raw) ? 'forte' : 'fraco' }
}

export function explainRank(row: AttributionRow, method: RankingMethod): RankFactor[] {
  switch (method) {
    case 'bazin':
      return [
        // O teto do Bazin é DPA / 6%: o dividendo por ação é o único motor.
        factor('DPA', row.dpa, (v) => fBRL.format(v), (v) => v > 0),
        factor('Yield sobre o preço', divide(row.dpa, row.price), (v) => fPct(v, 1), (v) => v >= 0.06),
      ]

    case 'graham':
      return [
        factor('LPA', row.lpa, (v) => fBRL.format(v), (v) => v > 0),
        factor('VPA', row.vpa, (v) => fBRL.format(v), (v) => v > 0),
        factor('P/L', row.pl, (v) => fNum(v, 1), (v) => v > 0 && v < 15),
      ]

    case 'lynch':
      return [
        // PEG < 1 é a régua clássica: preço justo para o crescimento entregue.
        factor('PEG', row.lynchVal, (v) => fNum(v, 2), (v) => v > 0 && v < 1.5),
        factor('Crescimento', row.crescimentoLucros, (v) => fPct(v, 1), (v) => v > 0.1),
      ]

    case 'joel':
      return [
        factor('Earnings Yield', row.joelVal, (v) => fPct(v, 1), (v) => v >= 0.1),
        factor('ROIC', row.roic, (v) => fPct(v, 1), (v) => v >= 0.15),
      ]

    case 'thomaz':
    default: {
      // Thomaz combina seis ranks; aqui mostram-se os que mais destoam do piso
      // dos filtros default (DY 6%, ROE 10%, margem 10%), até três.
      const all: RankFactor[] = [
        factor('DY', row.dy, (v) => fPct(v, 1), (v) => v >= 0.06),
        factor('ROE', row.roe, (v) => fPct(v, 1), (v) => v >= 0.15),
        factor('P/L', row.pl, (v) => fNum(v, 1), (v) => v > 0 && v < 10),
        factor('Margem líq.', row.margemLiquida, (v) => fPct(v, 1), (v) => v >= 0.1),
      ]
      const strong = all.filter((f) => f.verdict === 'forte')
      const rest = all.filter((f) => f.verdict !== 'forte')
      return [...strong, ...rest].slice(0, MAX_FACTORS)
    }
  }
}

function divide(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null
  return a / b
}
