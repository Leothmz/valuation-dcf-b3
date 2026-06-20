import { Settings2 } from 'lucide-react'
import { fBRL, fShort, fPct, fShares } from '../../engines/formatters'
import type { DCFResult } from '../../engines/dcf-engine'
import type { NullableDCFAssumptions, ScenarioState } from '../../stores/dcfStore'

interface DCFResultPanelProps {
  results: DCFResult | null
  resultsClassico: DCFResult | null
  resultsBuffett: DCFResult | null
  dcfMethod: 'buffett' | 'classico'
  assumptions: NullableDCFAssumptions
  ticker: string | null
  onSave: () => void
  isSaved: boolean
  onOpenMethodModal: () => void
  scenarios: ScenarioState
  scenarioResults: { bear: number | null; base: number | null; bull: number | null } | null
  onToggleScenarios: (currentG: number | null) => void
  onSetScenario: (key: 'bear' | 'base' | 'bull', value: number | null) => void
}

export function DCFResultPanel({
  results,
  resultsClassico,
  resultsBuffett,
  dcfMethod,
  assumptions,
  ticker,
  onSave,
  isSaved,
  onOpenMethodModal,
  scenarios,
  scenarioResults,
  onToggleScenarios,
  onSetScenario,
}: DCFResultPanelProps) {
  const r = results
  const gordonError = r && 'error' in r && r.error === 'gordon'

  const otherR = dcfMethod === 'buffett' ? resultsClassico : resultsBuffett
  const otherLbl = dcfMethod === 'buffett' ? 'Clássico FCD' : 'Buffett (10%)'

  const showSave = ticker && r && !('error' in r)

  return (
    <div>
      <hr className="border-none border-t border-border my-5" />

      <div className="flex items-center justify-between mb-[14px]">
        <div className="text-[11px] font-semibold text-text-muted tracking-[0.12em] uppercase">
          Realidade Projetada
        </div>
        <button
          onClick={onOpenMethodModal}
          title="Configurações do método DCF"
          className="bg-none border border-border rounded-[6px] text-text-sec text-[13px]
                     px-[7px] py-[2px] cursor-pointer hover:text-text-base
                     hover:border-cyan hover:bg-cyan-dim transition-all flex items-center gap-1"
        >
          <Settings2 size={14} />
        </button>
      </div>

      {gordonError && (
        <div className="text-[13px] text-red bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]
                        rounded-[10px] px-4 py-3 mb-3">
          Taxa de crescimento na perpetuidade deve ser menor que a taxa de desconto.
        </div>
      )}

      {/* Primary fair price card */}
      <div className="bg-gradient-to-br from-[rgba(6,182,212,0.06)] to-[rgba(6,182,212,0.02)]
                      border border-[rgba(6,182,212,0.2)] rounded-[14px] p-[18px] mb-3
                      shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <div className="text-[11px] text-text-muted uppercase tracking-[0.12em] font-semibold mb-1.5">
          Preço Teto · Valor Intrínseco
        </div>
        <div className="text-[40px] font-bold font-mono my-1.5 text-cyan">
          {r && !('error' in r) ? fBRL.format(r.fairPrice) : '—'}
        </div>
        {otherR && !('error' in otherR) && (
          <div className="text-[12px] text-text-muted mb-1">
            {otherLbl}: {fBRL.format(otherR.fairPrice)}
          </div>
        )}
        {r && !('error' in r) && r.upside != null && (
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block text-[15px] font-bold font-mono px-[14px] py-1 rounded-full
                              ${r.upside >= 0
                                ? 'bg-green-dim text-green border border-[rgba(16,185,129,0.25)]'
                                : 'bg-red-dim text-red border border-[rgba(239,68,68,0.25)]'
                              }`}>
              {r.upside >= 0 ? '+' : ''}{fPct(r.upside)}
            </span>
            <span className="text-[11px] text-text-muted">vs. preço atual</span>
          </div>
        )}
      </div>

      {/* Save button */}
      {showSave && (
        <button
          onClick={onSave}
          className={`w-full mb-3 h-[42px] font-semibold text-sm rounded-[10px] cursor-pointer
                      transition-all font-ui
                      ${isSaved
                        ? 'bg-green text-bg-0 shadow-[0_2px_8px_rgba(16,185,129,0.2)]'
                        : 'bg-gradient-to-br from-cyan to-[#0891b2] text-bg-0 shadow-[0_2px_8px_rgba(6,182,212,0.2)]'
                      }
                      hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(6,182,212,0.35)]`}
        >
          {isSaved ? '✓ Atualizar Preço Teto Salvo' : '＋ Salvar Preço Teto'}
        </button>
      )}

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-3 border border-border rounded-[10px] px-3 py-2.5">
          <div className="text-[11px] text-text-muted uppercase tracking-[0.06em] font-medium mb-1.5">
            Preço Atual
          </div>
          <div className="text-[14px] font-semibold font-mono">
            {assumptions.price ? fBRL.format(assumptions.price) : '—'}
          </div>
        </div>
        <div className="bg-bg-3 border border-border rounded-[10px] px-3 py-2.5">
          <div className="text-[11px] text-text-muted uppercase tracking-[0.06em] font-medium mb-1.5">
            Market Cap Projetado
          </div>
          <div className="text-[14px] font-semibold font-mono">
            {r && !('error' in r) && assumptions.shares
              ? fShort(r.fairPrice * assumptions.shares)
              : '—'}
          </div>
        </div>
        <div className="bg-bg-3 border border-border rounded-[10px] px-3 py-2.5">
          <div className="text-[11px] text-text-muted uppercase tracking-[0.06em] font-medium mb-1.5">
            Nº de Ações
          </div>
          <div className="text-[14px] font-semibold font-mono">
            {assumptions.shares ? fShares(assumptions.shares) : '—'}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">em circulação</div>
        </div>
        <div className="bg-bg-3 border border-border rounded-[10px] px-3 py-2.5">
          <div className="text-[11px] text-text-muted uppercase tracking-[0.06em] font-medium mb-1.5">
            Valor da Empresa (EV)
          </div>
          <div className="text-[14px] font-semibold font-mono">
            {r && !('error' in r) ? fShort(r.ev) : '—'}
          </div>
        </div>
      </div>

      {/* Scenarios section */}
      {r && !('error' in r) && (
        <div className="mt-4">
          <button
            onClick={() => onToggleScenarios(assumptions.g)}
            className="w-full flex items-center justify-between border border-border rounded-[10px]
                       text-[12px] font-semibold text-text-sec px-3 h-[34px] cursor-pointer
                       hover:bg-bg-3 hover:text-text-base transition-colors"
            style={{ background: 'none' }}
          >
            <span>Cenários bull / base / bear</span>
            <span style={{ color: scenarios.enabled ? 'var(--color-cyan)' : 'var(--color-text-muted)' }}>
              {scenarios.enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {scenarios.enabled && (
            <div className="mt-3 space-y-2">
              {(
                [
                  { key: 'bear', label: 'Bear', color: 'var(--color-red)', dim: 'var(--color-red-dim)' },
                  { key: 'base', label: 'Base', color: 'var(--color-text-sec)', dim: 'var(--color-bg-3)' },
                  { key: 'bull', label: 'Bull', color: 'var(--color-green)', dim: 'var(--color-green-dim)' },
                ] as const
              ).map(({ key, label, color, dim }) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-[10px] px-3 py-2 border border-border"
                  style={{ background: dim }}
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-[.08em] w-[34px]"
                    style={{ color }}
                  >
                    {label}
                  </span>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="bg-bg-3 border border-border rounded-[6px] text-[13px] font-mono
                                 text-text-base px-2 py-1 outline-none w-[70px]
                                 focus:border-cyan"
                      value={scenarios[key] != null ? (scenarios[key]! * 100).toFixed(1) : ''}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value)
                        onSetScenario(key, isNaN(n) ? null : n / 100)
                      }}
                    />
                    <span className="text-[11px] text-text-muted">%</span>
                  </div>
                  <span
                    className="font-mono text-[14px] font-semibold ml-auto"
                    style={{ color }}
                  >
                    {scenarioResults?.[key] != null ? fBRL.format(scenarioResults[key]!) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
