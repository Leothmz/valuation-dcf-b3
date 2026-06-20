import { describe, it, expect } from 'vitest'
import { buildExportHTML } from './exportHTML'
import type { ExportHTMLParams } from './exportHTML'

const baseParams: ExportHTMLParams = {
  ticker: 'PETR4',
  name: 'Petróleo Brasileiro S.A.',
  exportDate: '2026-06-20',
  assumptions: {
    ll: 10_000_000,
    payout: 0.4,
    roe: 0.2,
    g: 0.12,
    disc: 0.15,
    perp: 0.03,
    shares: 100_000,
    price: 30,
  },
  results: {
    flows: [],
    pvFlows: [{ year: 2025, cf: 11_200_000, g: 0.12, pv: 9_739_130 }],
    tv: 50_000_000,
    pvTV: 30_000_000,
    sumPV: 9_739_130,
    ev: 39_739_130,
    fairPrice: 39.74,
    upside: 0.245,
    baseYear: 2024,
  },
  resultsClassico: null,
  resultsBuffett: null,
  history: [{ year: 2023, value: 9_000_000 }],
  projYears: 5,
  scenarios: { enabled: false, bear: null, base: null, bull: null },
  scenarioResults: null,
  fundamentals: null,
}

describe('buildExportHTML', () => {
  it('returns a valid HTML string containing the ticker', () => {
    const html = buildExportHTML(baseParams)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('PETR4')
  })

  it('includes the fair price', () => {
    const html = buildExportHTML(baseParams)
    expect(html).toContain('39')
  })

  it('includes the export date', () => {
    const html = buildExportHTML(baseParams)
    expect(html).toContain('2026-06-20')
  })

  it('includes assumptions section', () => {
    const html = buildExportHTML(baseParams)
    expect(html).toContain('Premissas')
    expect(html).toContain('12,0%') // g formatted
  })

  it('includes historical net income row', () => {
    const html = buildExportHTML(baseParams)
    expect(html).toContain('2023')
  })

  it('does not include scenarios section when disabled', () => {
    const html = buildExportHTML(baseParams)
    expect(html).not.toContain('Cenários')
  })

  it('includes scenarios section when enabled', () => {
    const html = buildExportHTML({
      ...baseParams,
      scenarios: { enabled: true, bear: 0.07, base: 0.10, bull: 0.13 },
      scenarioResults: { bear: 32.0, base: 39.74, bull: 48.0 },
    })
    expect(html).toContain('Cenários')
    expect(html).toContain('Bear')
    expect(html).toContain('Bull')
  })

  it('includes fundamentals when provided', () => {
    const html = buildExportHTML({
      ...baseParams,
      fundamentals: { ticker: 'PETR4', pl: 7.5, pvp: 1.2, roe: 0.18, margemLiquida: 0.15, dy: 0.06, lpa: 5.2, vpa: 25.0, dividaLiquidaEbit: 1.5 },
    })
    expect(html).toContain('Indicadores Fundamentalistas')
    expect(html).toContain('P/L')
  })
})
