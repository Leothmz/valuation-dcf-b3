import { DataCard } from '../../components/DataCard'
import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'
import type { GainCategory, MonthlyIRSummary } from '../../engines/portfolio-engine'

const fBRL = (v: number) => fBRLFormatter.format(v)

const CATEGORY_LABELS: Record<GainCategory, string> = {
  swing_acoes: 'Swing Trade (Ações)',
  day_trade: 'Day Trade',
  swing_fii: 'FIIs',
  cripto: 'Criptoativos',
}

function fMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${mo}/${y}`
}

function fDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Vencimento a menos de 15 dias (e ainda com DARF a pagar) ganha destaque âmbar. */
function isDueSoon(iso: string): boolean {
  const days = (new Date(iso).getTime() - Date.now()) / 86_400_000
  return days >= 0 && days <= 15
}

/**
 * Um mês pode zerar o DARF por três motivos bem diferentes para o IRPF:
 * - `exempt`: vendas do mês abaixo do limite de isenção (renda isenta).
 * - o mês teve GANHO (`grossGain > 0`) mas o prejuízo acumulado (`lossCarriedIn`) abateu
 *   tudo (tributável, só não há imposto a pagar agora). NÃO é renda isenta na declaração.
 * - o mês foi ele próprio prejuízo (`grossGain <= 0`) — não há nada "compensado" aqui, o
 *   prejuízo acumulado só cresceu (ver `buildMonthlyIRSummary`, ramo `grossGain <= 0` em
 *   portfolio-engine.ts). Precisa do guard `grossGain > 0`, senão dois meses seguidos de
 *   prejuízo na mesma categoria rotulam o segundo como "compensado" quando na verdade ele
 *   só empilhou mais prejuízo.
 * A tabela desktop mostra os três como "R$ 0,00" indistintamente — aqui eles ganham
 * badges e cores diferentes (o terceiro caso cai no badge de categoria normal).
 */
function isLossOffset(s: MonthlyIRSummary): boolean {
  return !s.exempt && s.grossGain > 0 && s.darfAmount === 0 && s.lossCarriedIn > 0
}

// Visibilidade é decidida pelo pai (CarteiraIR) via useIsMobile() — monta só quando
// for o caso, nunca em paralelo com a <table> (evita render dobrado + duplicatas no DOM).
export function CarteiraIRMobile({ summaries }: { summaries: MonthlyIRSummary[] }) {
  return (
    <div>
      {summaries.map((s) => {
        const dueSoon = s.darfAmount > 0 && isDueSoon(s.dueDate)
        const lossOffset = isLossOffset(s)

        return (
          <DataCard
            key={`${s.month}-${s.category}`}
            title={fMonth(s.month)}
            accent={s.exempt ? 'green' : dueSoon ? 'amber' : 'none'}
            badge={
              s.exempt ? (
                <span
                  className="text-[10px] font-bold rounded-[5px] px-2 py-0.5"
                  style={{ background: 'var(--color-green-dim)', color: 'var(--color-green)' }}
                >
                  ISENTO
                </span>
              ) : lossOffset ? (
                <span
                  className="text-[10px] font-bold rounded-[5px] px-2 py-0.5"
                  style={{ background: 'var(--color-purple-dim)', color: 'var(--color-purple)' }}
                >
                  PREJUÍZO COMPENSADO
                </span>
              ) : (
                <span
                  className="text-[10px] font-bold rounded-[5px] px-2 py-0.5"
                  style={{ background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)' }}
                >
                  {CATEGORY_LABELS[s.category] ?? s.category}
                </span>
              )
            }
            fields={[
              {
                label: 'Ganho bruto',
                value: (
                  <span style={{ color: s.grossGain >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {fBRL(s.grossGain)}
                  </span>
                ),
              },
              { label: 'Base tributável', value: fBRL(s.taxableAmount) },
              { label: 'Alíquota', value: fPct(s.rate, 0) },
              { label: 'DARF a pagar', value: s.darfAmount > 0 ? fBRL(s.darfAmount) : '—', emphasis: true },
              {
                label: 'Vencimento',
                value: s.darfAmount > 0 ? (
                  <span style={{ color: dueSoon ? 'var(--color-amber)' : undefined }}>
                    {fDate(s.dueDate)}
                  </span>
                ) : (
                  '—'
                ),
              },
            ]}
          />
        )
      })}
    </div>
  )
}
