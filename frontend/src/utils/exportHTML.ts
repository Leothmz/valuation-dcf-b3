import type { DCFResult, DCFHistoryEntry } from '../engines/dcf-engine'
import type { NullableDCFAssumptions } from '../stores/dcfStore'
import type { ScenarioState } from '../stores/dcfStore'
import type { FundamentalsData } from '../api/stocks'

export interface ExportHTMLParams {
  ticker: string
  name: string
  exportDate: string           // 'YYYY-MM-DD'
  assumptions: NullableDCFAssumptions
  results: DCFResult | null
  resultsClassico: DCFResult | null
  resultsBuffett: DCFResult | null
  history: DCFHistoryEntry[]
  projYears: number
  scenarios: ScenarioState
  scenarioResults: { bear: number | null; base: number | null; bull: number | null } | null
  fundamentals: FundamentalsData | null
}

function fBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function fPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return (v * 100).toFixed(1).replace('.', ',') + '%'
}

function fNum(v: number | null | undefined, dec = 0): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function row(label: string, value: string): string {
  return `<tr><td class="lbl">${label}</td><td class="val">${value}</td></tr>`
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,system-ui,sans-serif;background:#060910;color:#f0f4f8;padding:32px 24px;line-height:1.5}
.container{max-width:860px;margin:0 auto}
h1{font-size:28px;font-weight:700;color:#06b6d4;font-family:monospace}
h2{font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#4a5568;margin:28px 0 10px}
.meta{color:#94a3b8;font-size:13px;margin-top:4px}
.card{background:#111827;border:1px solid #1e2d42;border-radius:12px;padding:20px;margin-bottom:12px}
.price{font-size:36px;font-weight:700;color:#06b6d4;font-family:monospace;margin:6px 0}
.upside{display:inline-block;font-size:13px;font-weight:700;padding:4px 12px;border-radius:999px;font-family:monospace}
.up{background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.25)}
.dn{background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25)}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#111827;color:#4a5568;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:8px 12px;text-align:left;border-bottom:1px solid #1e2d42}
td{padding:8px 12px;border-bottom:1px solid #151e2d;color:#94a3b8;vertical-align:top}
td.val{color:#f0f4f8;font-family:monospace;text-align:right}
td.lbl{color:#94a3b8}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.chip{border-radius:10px;padding:14px 16px;border:1px solid #1e2d42}
.chip-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
.chip-value{font-size:20px;font-weight:700;font-family:monospace}
.bear{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.2)}.bear .chip-label,.bear .chip-value{color:#ef4444}
.base{background:rgba(255,255,255,.02)}.base .chip-label,.base .chip-value{color:#94a3b8}
.bull{background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.2)}.bull .chip-label,.bull .chip-value{color:#10b981}
.footer{margin-top:40px;text-align:center;color:#4a5568;font-size:12px}
`

export function buildExportHTML(p: ExportHTMLParams): string {
  const r = p.results
  const rc = p.resultsClassico
  const rb = p.resultsBuffett

  const upside = r && !('error' in r) && r.upside != null ? r.upside : null
  const upsideClass = upside != null ? (upside >= 0 ? 'up' : 'dn') : ''
  const upsideText = upside != null ? `${upside >= 0 ? '+' : ''}${fPct(upside)}` : ''

  const flowRows = (r && !('error' in r) ? r.pvFlows : [])
    .map((f) => `<tr>
      <td>${f.year}</td>
      <td class="val">${fBRL(f.cf)}</td>
      <td class="val">${fPct(f.g)}</td>
      <td class="val">${fBRL(f.pv)}</td>
    </tr>`)
    .join('')

  const histRows = p.history
    .map((h) => `<tr><td>${h.year}</td><td class="val">${fBRL(h.value)}</td></tr>`)
    .join('')

  const scenariosSection = p.scenarios.enabled && p.scenarioResults
    ? `<h2>Cenários</h2>
       <div class="grid" style="grid-template-columns:1fr 1fr 1fr">
         <div class="chip bear"><div class="chip-label">Bear</div><div class="chip-value">${fBRL(p.scenarioResults.bear)}</div><div style="font-size:11px;color:#ef4444;margin-top:4px">g = ${fPct(p.scenarios.bear)}</div></div>
         <div class="chip base"><div class="chip-label">Base</div><div class="chip-value">${fBRL(p.scenarioResults.base)}</div><div style="font-size:11px;color:#94a3b8;margin-top:4px">g = ${fPct(p.scenarios.base)}</div></div>
         <div class="chip bull"><div class="chip-label">Bull</div><div class="chip-value">${fBRL(p.scenarioResults.bull)}</div><div style="font-size:11px;color:#10b981;margin-top:4px">g = ${fPct(p.scenarios.bull)}</div></div>
       </div>`
    : ''

  const f = p.fundamentals
  const fundamentalsSection = f
    ? `<h2>Indicadores Fundamentalistas</h2>
       <div class="card">
         <table>
           <thead><tr><th>Indicador</th><th style="text-align:right">Valor</th></tr></thead>
           <tbody>
             ${row('P/L', fNum(f.pl, 1))}
             ${row('P/VP', fNum(f.pvp, 2))}
             ${row('ROE', fPct(f.roe))}
             ${row('Margem Líquida', fPct(f.margemLiquida))}
             ${row('Dividend Yield', fPct(f.dy))}
             ${row('DL/EBITDA', fNum(f.dividaLiquidaEbit, 2))}
             ${row('LPA', fBRL(f.lpa))}
             ${row('VPA', fBRL(f.vpa))}
           </tbody>
         </table>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${p.ticker} — Valuation DCF</title>
  <style>${CSS}</style>
</head>
<body>
<div class="container">
  <h1>${p.ticker}</h1>
  <p class="meta">${p.name} · Relatório gerado em ${p.exportDate}</p>

  <h2>Preço Teto DCF</h2>
  <div class="card">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#4a5568">Valor Intrínseco por Ação</div>
    <div class="price">${r && !('error' in r) ? fBRL(r.fairPrice) : '—'}</div>
    ${upside != null ? `<span class="upside ${upsideClass}">${upsideText} vs preço atual</span>` : ''}
    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
      ${rc && !('error' in rc) ? `<div><span style="color:#4a5568">Clássico FCD: </span><span style="font-family:monospace;color:#06b6d4">${fBRL(rc.fairPrice)}</span></div>` : ''}
      ${rb && !('error' in rb) ? `<div><span style="color:#4a5568">Buffett (10%): </span><span style="font-family:monospace;color:#06b6d4">${fBRL(rb.fairPrice)}</span></div>` : ''}
    </div>
  </div>

  <h2>Premissas</h2>
  <div class="card">
    <table>
      <thead><tr><th>Campo</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>
        ${row('Lucro Líquido Base', fBRL(p.assumptions.ll))}
        ${row('Taxa de Crescimento (g)', fPct(p.assumptions.g))}
        ${row('ROE', fPct(p.assumptions.roe))}
        ${row('Payout', fPct(p.assumptions.payout))}
        ${row('Taxa de Desconto (WACC)', fPct(p.assumptions.disc))}
        ${row('Crescimento Perpetuidade', fPct(p.assumptions.perp))}
        ${row('Número de Ações', p.assumptions.shares ? fNum(p.assumptions.shares) : '—')}
        ${row('Anos Projetados', String(p.projYears))}
      </tbody>
    </table>
  </div>

  ${p.history.length ? `
  <h2>Histórico de Lucro Líquido</h2>
  <div class="card">
    <table>
      <thead><tr><th>Ano</th><th style="text-align:right">Lucro Líquido (R$)</th></tr></thead>
      <tbody>${histRows}</tbody>
    </table>
  </div>` : ''}

  ${(r && !('error' in r) && r.pvFlows.length) ? `
  <h2>Projeção de Fluxos</h2>
  <div class="card">
    <table>
      <thead><tr><th>Ano</th><th style="text-align:right">Lucro Líq.</th><th style="text-align:right">Crescimento</th><th style="text-align:right">VPL</th></tr></thead>
      <tbody>${flowRows}</tbody>
    </table>
    <div style="margin-top:12px;font-size:13px;color:#94a3b8">
      Valor Terminal: ${fBRL(r.tv)} · VPL do TV: ${fBRL(r.pvTV)} · EV Total: ${fBRL(r.ev)}
    </div>
  </div>` : ''}

  ${scenariosSection}
  ${fundamentalsSection}

  <div class="footer">Gerado por Valuation DCF · B3 — ${p.exportDate}</div>
</div>
</body>
</html>`
}
