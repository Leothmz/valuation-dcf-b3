interface HeroMetricProps {
  /** Rótulo curto em caixa alta, o "eyebrow" do card. */
  eyebrow: string
  /** O número. Já formatado (pt-BR) pelo chamador. */
  value: string
  /** Variação com sinal explícito — verde quando positiva, vermelha quando não. */
  delta?: { text: string; positive: boolean }
  /** Contexto curto ao lado do delta ("vs. preço atual", "no ano"). */
  note?: string
}

/**
 * O tratamento do card de preço teto, extraído para virar o padrão de "número
 * principal" de cada rota: eyebrow 11px em caixa alta, valor em mono 40px ciano,
 * delta numa pill com sinal explícito, borda ciano a 20% e halo de 20px.
 *
 * A critique apontou que só a /dcf tinha um número principal declarado — as
 * outras rotas enfileiravam KPIs de peso igual, sem dizer qual importa. Este
 * componente é a resposta, e o preço teto continua sendo o exemplar (o card da
 * DCF não foi trocado por ele: tem o comparativo de método e o gordonError no
 * meio, e reescrevê-lo não fazia parte deste card).
 */
export function HeroMetric({ eyebrow, value, delta, note }: HeroMetricProps) {
  return (
    <div
      className="rounded-[14px] p-[18px]"
      style={{
        background: 'linear-gradient(to bottom right, rgba(6,182,212,0.06), rgba(6,182,212,0.02))',
        border: '1px solid rgba(6,182,212,0.2)',
        boxShadow: '0 0 20px rgba(6,182,212,0.15)',
      }}
    >
      <div className="text-[11px] text-text-muted uppercase tracking-[0.12em] font-semibold mb-1.5">
        {eyebrow}
      </div>
      <div className="text-[28px] md:text-[40px] font-bold font-mono my-1.5 text-cyan break-words">
        {value}
      </div>
      {(delta || note) && (
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {delta && (
            <span
              className="inline-block text-[15px] font-bold font-mono px-[14px] py-1 rounded-full"
              style={{
                color: delta.positive ? 'var(--color-green)' : 'var(--color-red)',
                background: delta.positive ? 'var(--color-green-dim)' : 'var(--color-red-dim)',
                border: `1px solid ${delta.positive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}
            >
              {delta.text}
            </span>
          )}
          {note && <span className="text-[11px] text-text-muted">{note}</span>}
        </div>
      )}
    </div>
  )
}
