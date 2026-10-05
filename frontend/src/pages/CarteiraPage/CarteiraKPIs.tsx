import { Skeleton } from '../../components/Skeleton'
import { HeroMetric } from '../../components/HeroMetric'
import { fBRL as fBRLFormatter, fPct } from '../../engines/formatters'

const fBRL = (v: number) => fBRLFormatter.format(v)

interface CarteiraKPIsProps {
  totalInvested: number | null
  totalValue: number | null
  /**
   * Posições abertas: ativos de renda variável com quantidade > 0, mais os
   * títulos de renda fixa. Inclui a RF porque os outros três KPIs desta linha
   * (investido, valor atual, retorno) também a incluem — contar só a renda
   * variável descreveria uma carteira diferente da dos vizinhos.
   */
  positions: number
  loading: boolean
}

export function CarteiraKPIs({ totalInvested, totalValue, positions, loading }: CarteiraKPIsProps) {
  const retorno =
    totalInvested != null && totalValue != null && totalInvested > 0
      ? (totalValue - totalInvested) / totalInvested
      : null

  return (
    <div className="mt-5 flex flex-col gap-2.5">
      {/* Número principal da rota: quatro KPIs de peso igual não diziam qual
          importa. O patrimônio atual é a resposta da Carteira; o retorno é o
          delta dele, não um card irmão. Mesmo tratamento do card de preço teto
          da /dcf (ver components/HeroMetric.tsx). */}
      <HeroMetric
        eyebrow="Patrimônio Total"
        value={totalValue != null ? fBRL(totalValue) : '—'}
        delta={
          retorno != null
            ? { text: (retorno >= 0 ? '+' : '') + fPct(retorno), positive: retorno >= 0 }
            : undefined
        }
        note={retorno != null ? 'sobre o total investido' : undefined}
      />

      <div className="grid grid-cols-2 gap-2.5 md:flex md:gap-3 md:flex-wrap">
        <KPICard label="Total Investido" loading={loading}>
          {totalInvested != null ? fBRL(totalInvested) : '—'}
        </KPICard>
        {/* "Valor Atual" e "Retorno Total" saíram daqui: viraram o valor e o delta
            do HeroMetric acima. Mantê-los era exibir o mesmo número duas vezes na
            mesma tela — o mesmo defeito que EV/Market Cap tinha na /dcf. */}
        {/* loading={false}: a contagem vem das operações no localStorage, não das
            cotações — está disponível na hora, sem esperar a rede. */}
        <KPICard label="Posições" loading={false}>
          {positions}
        </KPICard>
      </div>
    </div>
  )
}

interface KPICardProps {
  label: string
  loading: boolean
  valueClass?: string
  children: React.ReactNode
}

function KPICard({ label, loading, valueClass = 'text-text-base', children }: KPICardProps) {
  return (
    <div
      className="rounded-[10px] px-[18px] py-3.5 min-w-[160px]"
      style={{ background: '#111827', border: '1px solid #1e2d42' }}
    >
      <div className="text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1.5">
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <div
          className={`text-[20px] font-semibold ${valueClass}`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
