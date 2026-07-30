import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { fInputLL, fInputPct } from '../../engines/formatters'
import { parseLL, parsePct } from '../../engines/parsers'
import { growthRate } from '../../engines/dcf-engine'
import type { NullableDCFAssumptions } from '../../stores/dcfStore'

interface DCFInputPanelProps {
  assumptions: NullableDCFAssumptions
  overrides: string[]
  apiVals: Record<string, number>
  llHint: string
  onAssumptionChange: (
    field: keyof NullableDCFAssumptions,
    value: number | null,
    isOverride: boolean
  ) => void
  onRestore: (field: string) => void
}

interface InputRowProps {
  label: string
  hint: string
  id: string
  field: keyof NullableDCFAssumptions
  value: number | null
  unit?: string
  isOverride?: boolean
  showRestore?: boolean
  /** Borda vermelha — hoje só disc/perp, quando a condição de Gordon quebra. */
  invalid?: boolean
  placeholder?: string
  formatFn: (v: number | null | undefined) => string
  parseFn: (s: string) => number | null
  onCommit: (field: keyof NullableDCFAssumptions, raw: string) => void
  onRestore?: () => void
  disabled?: boolean
}

function InputRow({
  label, hint, field, value, unit,
  isOverride = false, showRestore = false, invalid = false,
  placeholder = '—',
  formatFn, parseFn,
  onCommit, onRestore, disabled,
}: InputRowProps) {
  // Rascunho: enquanto o usuário digita, o input mostra exatamente o que ele
  // escreveu; o valor formatado do prop só volta a mandar no blur.
  //
  // Antes o input era não-controlado com `key={field}-{value}`: cada tecla
  // gravava no store, o `value` mudava, a key mudava e o React DESMONTAVA e
  // remontava o input. Voltava um DOM novo com o texto já formatado e o cursor
  // no fim — digitar "12,13" num ROE virava "1,00", depois "12,00", tecla a
  // tecla. O recálculo ao vivo continua: `onCommit` roda a cada tecla como
  // antes, só o texto do campo é que deixou de ser reescrito por baixo.
  const [draft, setDraft] = useState<string | null>(null)

  function handleBlur(raw: string) {
    setDraft(null)
    const parsed = parseFn(raw)
    if (parsed != null) onCommit(field, formatFn(parsed))
  }

  return (
    <div className="flex items-center gap-2 py-[9px] border-b border-border-muted last:border-b-0">
      <div className="flex-1">
        <div className="text-[13px] font-medium text-text-base">{label}</div>
        <div className="text-[11px] text-text-muted mt-0.5">{hint}</div>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="decimal"
          value={draft ?? (formatFn(value) || '')}
          disabled={disabled}
          placeholder={placeholder}
          onBlur={(e) => handleBlur(e.target.value)}
          onChange={(e) => {
            setDraft(e.target.value)
            onCommit(field, e.target.value)
          }}
          className={`bg-bg-3 border rounded-[6px] text-text-base font-mono text-[16px] md:text-[13px]
                      px-2 py-1.5 text-right min-w-[56px] outline-none
                      focus:border-cyan focus:shadow-[0_0_0_2px_rgba(6,182,212,0.08)]
                      transition-colors
                      ${isOverride
                        ? 'border-amber bg-[rgba(245,158,11,0.05)]'
                        : invalid
                          ? 'border-red'
                          : 'border-transparent'
                      }
                      disabled:opacity-50 disabled:cursor-default`}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        {unit && (
          <span className="text-[12px] text-text-muted w-4">{unit}</span>
        )}
        {showRestore && isOverride && onRestore && (
          <button
            onClick={onRestore}
            title="Restaurar valor da API"
            className="text-amber opacity-75 hover:opacity-100 transition-opacity p-0 bg-none border-none cursor-pointer"
          >
            <RotateCcw size={13} />
          </button>
        )}
        {showRestore && !isOverride && (
          <span className="w-[17px]" />
        )}
      </div>
    </div>
  )
}

export function DCFInputPanel({
  assumptions,
  overrides,
  apiVals,
  llHint,
  onAssumptionChange,
  onRestore,
}: DCFInputPanelProps) {
  const overrideSet = new Set(overrides)

  function handleCommit(field: keyof NullableDCFAssumptions, raw: string) {
    let parsed: number | null = null
    if (field === 'll' || field === 'shares') {
      parsed = parseLL(raw)
      if (parsed == null || parsed <= 0) return
    } else {
      parsed = parsePct(raw)
      if (parsed == null) return
    }

    const isOverrideField = ['ll', 'payout', 'roe', 'g', 'shares'].includes(field)
    onAssumptionChange(field, parsed, isOverrideField)
  }

  // Derive g from payout + roe for display if not overridden
  const derivedG = (!overrideSet.has('g') && assumptions.payout != null && assumptions.roe != null)
    ? growthRate(assumptions.payout, assumptions.roe)
    : assumptions.g

  // Gordon condition: perp must be < disc
  const gordonInvalid = assumptions.perp != null && assumptions.disc != null
    && assumptions.perp >= assumptions.disc

  const apiLLHint = apiVals.ll
    ? `Fonte API: ${fInputLL(apiVals.ll)}`
    : llHint

  return (
    <div>
      <InputRow
        label="Lucro Líquido Base"
        hint={apiLLHint}
        id="inp-ll" field="ll"
        value={assumptions.ll}
        isOverride={overrideSet.has('ll')}
        showRestore={'ll' in apiVals}
        formatFn={fInputLL} parseFn={parseLL}
        onCommit={handleCommit}
        onRestore={() => onRestore('ll')}
      />
      <InputRow
        label="Payout Médio"
        hint="Dividendos ÷ Lucro Líquido"
        id="inp-payout" field="payout"
        value={assumptions.payout}
        unit="%"
        isOverride={overrideSet.has('payout')}
        showRestore={'payout' in apiVals}
        formatFn={fInputPct} parseFn={parsePct}
        onCommit={handleCommit}
        onRestore={() => onRestore('payout')}
      />
      <InputRow
        label="ROE"
        hint="Retorno sobre Patrimônio Líquido"
        id="inp-roe" field="roe"
        value={assumptions.roe}
        unit="%"
        isOverride={overrideSet.has('roe')}
        showRestore={'roe' in apiVals}
        formatFn={fInputPct} parseFn={parsePct}
        onCommit={handleCommit}
        onRestore={() => onRestore('roe')}
      />
      <InputRow
        label="Taxa Esperada de Crescimento"
        hint="(1 − Payout) × ROE"
        id="inp-g" field="g"
        value={derivedG}
        unit="%"
        isOverride={overrideSet.has('g')}
        showRestore={overrideSet.has('g')}
        formatFn={fInputPct} parseFn={parsePct}
        onCommit={handleCommit}
        onRestore={() => onRestore('g')}
      />
      <InputRow
        label="Nº de Ações"
        hint="Em circulação (ex-tesouraria)"
        id="inp-shares" field="shares"
        value={assumptions.shares}
        isOverride={overrideSet.has('shares')}
        showRestore={'shares' in apiVals}
        formatFn={fInputLL} parseFn={parseLL}
        onCommit={handleCommit}
        onRestore={() => onRestore('shares')}
      />
      {/* disc/perp usavam markup próprio, duplicado do InputRow — e por isso
          carregavam o mesmo bug de remontagem. Reusam o componente agora. */}
      <InputRow
        label="Taxa de Desconto (WACC)"
        hint="Selic hist. ~11,5% · IR15 ~9,8%"
        id="inp-disc" field="disc"
        value={assumptions.disc}
        unit="%"
        placeholder="15"
        invalid={gordonInvalid}
        formatFn={fInputPct} parseFn={parsePct}
        onCommit={handleCommit}
      />
      <InputRow
        label="Crescimento na Perpetuidade"
        hint="≤ crescimento do PIB (~2–3%)"
        id="inp-perp" field="perp"
        value={assumptions.perp}
        unit="%"
        placeholder="3"
        invalid={gordonInvalid}
        formatFn={fInputPct} parseFn={parsePct}
        onCommit={handleCommit}
      />
    </div>
  )
}
