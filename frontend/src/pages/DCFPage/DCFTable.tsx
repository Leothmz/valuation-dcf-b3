import { useState, useCallback } from 'react'
import { Calculator } from 'lucide-react'
import { fShort, fPct, fInputLL, fInputPctSigned } from '../../engines/formatters'
import { parseLL, parsePct } from '../../engines/parsers'
import type { DCFResult, DCFHistoryEntry } from '../../engines/dcf-engine'
import type { NullableDCFAssumptions } from '../../stores/dcfStore'

interface DCFTableProps {
  results: DCFResult | null
  history: DCFHistoryEntry[]
  assumptions: NullableDCFAssumptions
  yearOverrides: Record<number, number>
  projYears: 3 | 5
  onSetProjYears: (y: 3 | 5) => void
  onYearLLChange: (year: number, value: number) => void
  onYearGrowthChange: (year: number, g: number) => void
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function DCFTable({
  results,
  history,
  assumptions,
  yearOverrides,
  projYears,
  onSetProjYears,
  onYearLLChange,
  onYearGrowthChange,
}: DCFTableProps) {
  const r = results

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedLLChange = useCallback(
    debounce((year: number, raw: string) => {
      const parsed = parseLL(raw)
      if (parsed != null && parsed > 0) onYearLLChange(year, parsed)
    }, 400),
    [onYearLLChange]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedGChange = useCallback(
    debounce((year: number, raw: string) => {
      const g = parsePct(raw)
      if (g != null) onYearGrowthChange(year, g)
    }, 400),
    [onYearGrowthChange]
  )

  const showTable = r && !('error' in r) && r.flows && r.flows.length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-[18px]">
        <div className="text-[11px] font-semibold text-text-muted tracking-[0.1em] uppercase m-0">
          Fluxo de Caixa Descontado
        </div>
        <div className="flex bg-bg-3 border border-border rounded-[10px] p-[3px]">
          {([3, 5] as const).map(y => (
            <button
              key={y}
              onClick={() => onSetProjYears(y)}
              className={`rounded-[6px] text-[13px] font-medium font-ui px-[18px] py-[5px]
                          transition-all cursor-pointer
                          ${projYears === y
                            ? 'bg-gradient-to-br from-cyan to-[#0891b2] text-bg-0 font-semibold border-none'
                            : 'bg-none border-none text-text-sec'
                          }`}
            >
              {y} anos
            </button>
          ))}
        </div>
      </div>

      {!showTable ? (
        <div className="flex flex-col items-center justify-center h-[320px] gap-2.5
                        text-text-muted text-center">
          <div className="opacity-[0.15] text-cyan flex justify-center">
            <Calculator size={44} strokeWidth={1.2} />
          </div>
          <div className="text-[15px] text-text-sec">Nenhum ativo selecionado</div>
          <div className="text-[13px] max-w-[280px]">
            Digite o código de uma ação da B3 no campo de busca acima
          </div>
        </div>
      ) : (
        <>
          {/* No mobile a tabela é mais larga que a tela (4 colunas com valores
              em bilhões). Antes o wrapper era só `overflow-hidden`: a última
              coluna ficava CORTADA e inalcançável — sem scroll, sem indicação.
              E o documento não rolava, então a varredura de overflow das 10
              rotas passava enquanto os dados sumiam. Agora rola dentro do
              próprio card, como a tabela da /compare. No desktop cabe inteira
              e segue clipada apenas para respeitar o canto arredondado. */}
          <div className="border border-border rounded-[14px] overflow-x-auto md:overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Ano', 'Lucro Líquido', 'Crescimento', 'VPL'].map((h, i) => (
                    <th
                      key={h}
                      className={`bg-bg-2 border-b border-border text-text-muted text-[9px] md:text-[11px]
                                  font-semibold tracking-[0.1em] px-2 py-2 md:px-4 md:py-[11px] uppercase
                                  ${i === 0 ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Historical rows — oldest to second-most-recent */}
                {(() => {
                  const histReversed = [...history].reverse()
                  return histReversed.slice(0, histReversed.length - 1).map((h, i) => {
                    const prev = histReversed[i - 1]
                    const g = prev ? (h.value / prev.value - 1) : null
                    return (
                      <tr key={h.year} className="border-b border-border-muted text-text-sec
                                                   hover:bg-[rgba(6,182,212,0.03)]">
                        <td className="font-ui text-[16px] md:text-[13px] font-medium px-2 py-2 md:px-4 md:py-2.5">{h.year}</td>
                        <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right">{fShort(h.value)}</td>
                        <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right">
                          {g != null
                            ? <span className={g >= 0 ? 'text-green' : 'text-red'}>
                                {g >= 0 ? '+' : ''}{fPct(g)}
                              </span>
                            : <span className="text-text-muted">—</span>
                          }
                        </td>
                        <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right text-text-muted">–</td>
                      </tr>
                    )
                  })
                })()}

                {/* Base year row */}
                {history.length > 0 && (() => {
                  const base = history[0]
                  const baseLL = assumptions.ll ?? base.value
                  const prevYear = history[1]
                  const baseG = prevYear ? (baseLL / prevYear.value - 1) : null
                  return (
                    <tr key={`base-${base.year}`}
                        className="border-b border-border-muted bg-[rgba(6,182,212,0.05)]
                                   border-l-2 border-l-cyan hover:bg-[rgba(6,182,212,0.07)]">
                      <td className="font-ui text-[16px] md:text-[13px] font-medium px-2 py-2 md:px-4 md:py-2.5 text-cyan">
                        {base.year}{' '}
                        <span className="text-[11px] text-text-muted">(base)</span>
                      </td>
                      <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right text-cyan">
                        {fShort(baseLL)}
                      </td>
                      <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right">
                        {baseG != null
                          ? <span className={baseG >= 0 ? 'text-green' : 'text-red'}>
                              {baseG >= 0 ? '+' : ''}{fPct(baseG)}
                            </span>
                          : <span className="text-text-muted">—</span>
                        }
                      </td>
                      <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right text-text-muted">–</td>
                    </tr>
                  )
                })()}

                {/* Spacer row */}
                <tr>
                  <td colSpan={4} className="p-0 h-[3px] bg-[rgba(6,182,212,0.08)]" />
                </tr>

                {/* Projected rows — editable */}
                {r.pvFlows.map((pv) => {
                  const isOverridden = yearOverrides[pv.year] != null
                  return (
                    <tr key={pv.year}
                        className="border-b border-border-muted hover:bg-[rgba(6,182,212,0.03)]">
                      <td className="font-ui text-[16px] md:text-[13px] font-medium px-2 py-2 md:px-4 md:py-2.5">{pv.year}</td>
                      <td className="px-4 py-[5px] text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[12px] text-text-muted">R$</span>
                          <EditableCell
                            value={fInputLL(pv.cf)}
                            isOverridden={isOverridden}
                            onChange={(raw) => debouncedLLChange(pv.year, raw)}
                            onCommit={(raw) => {
                              const parsed = parseLL(raw)
                              if (parsed != null && parsed > 0) onYearLLChange(pv.year, parsed)
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-[5px] text-right">
                        <div className={`flex items-center justify-end gap-1
                                         ${pv.g >= 0 ? 'text-green' : 'text-red'}`}>
                          <EditableCell
                            value={fInputPctSigned(pv.g)}
                            isOverridden={isOverridden}
                            onChange={(raw) => debouncedGChange(pv.year, raw)}
                            onCommit={(raw) => {
                              const g = parsePct(raw)
                              if (g != null) onYearGrowthChange(pv.year, g)
                            }}
                            colorInherit
                          />
                          <span className="text-[12px] text-text-muted">%</span>
                        </div>
                      </td>
                      <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right">
                        {fShort(pv.pv)}
                      </td>
                    </tr>
                  )
                })}

                {/* Terminal value row */}
                <tr className="border-t border-border bg-bg-2">
                  <td className="font-ui text-[16px] md:text-[13px] font-medium px-2 py-2 md:px-4 md:py-2.5">Perpetuidade</td>
                  <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right">{fShort(r.tv)}</td>
                  <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right text-green">
                    {fPct(assumptions.perp, 1)}
                  </td>
                  <td className="font-mono text-[16px] md:text-[13px] px-2 py-2 md:px-4 md:py-2.5 text-right">{fShort(r.pvTV)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
            <SumCard label="VPL dos Fluxos" value={fShort(r.sumPV)} />
            <SumCard label="VPL da Perpetuidade" value={fShort(r.pvTV)} />
            <SumCard label="Valor Total da Empresa" value={fShort(r.ev)} highlight />
          </div>
        </>
      )}
    </div>
  )
}

interface EditableCellProps {
  value: string
  isOverridden: boolean
  onChange: (raw: string) => void
  onCommit: (raw: string) => void
  colorInherit?: boolean
}

function EditableCell({ value, isOverridden, onChange, onCommit, colorInherit }: EditableCellProps) {
  // Rascunho: enquanto o usuário digita, o input mostra exatamente o que ele
  // escreveu; `value` (já formatado pelo engine) só volta a mandar no blur.
  //
  // Antes o input era não-controlado com `key={value}`: cada tecla gravava no
  // store, o `value` mudava, a key mudava e o React DESMONTAVA e remontava o
  // input. Voltava um DOM novo com o texto reformatado e o cursor no fim —
  // digitar "12" virava "1,00" e depois "12,00". O debounce de 400ms só adiava
  // isso para a primeira pausa, o que piorava justamente nos números longos.
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft ?? value}
      onBlur={(e) => {
        setDraft(null)
        onCommit(e.target.value)
      }}
      onChange={(e) => {
        setDraft(e.target.value)
        onChange(e.target.value)
      }}
      className={`bg-transparent border rounded-[6px] font-mono text-[16px] md:text-[13px]
                  px-[6px] py-1 text-right min-w-[4ch] outline-none
                  hover:border-border hover:bg-bg-3
                  focus:border-cyan focus:bg-bg-3
                  transition-colors cursor-text
                  ${isOverridden ? 'border-amber bg-[rgba(245,158,11,0.06)]' : 'border-transparent'}
                  ${colorInherit ? 'text-inherit' : 'text-text-base'}`}
      style={{ fieldSizing: 'content' } as React.CSSProperties}
    />
  )
}

interface SumCardProps {
  label: string
  value: string
  highlight?: boolean
}

function SumCard({ label, value, highlight }: SumCardProps) {
  return (
    <div className="bg-bg-2 border border-border rounded-[10px] p-4 text-center
                    hover:border-[rgba(6,182,212,0.25)] transition-colors">
      <div className="text-[11px] text-text-muted uppercase tracking-[0.08em] font-semibold mb-2">
        {label}
      </div>
      <div className={`text-[18px] font-bold font-mono ${highlight ? 'text-cyan' : ''}`}>
        {value}
      </div>
    </div>
  )
}
