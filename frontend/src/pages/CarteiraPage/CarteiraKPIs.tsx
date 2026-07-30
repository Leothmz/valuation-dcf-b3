import { Skeleton } from '../../components/Skeleton'
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

  const retornoColor =
    retorno == null ? 'text-text-muted' : retorno >= 0 ? 'text-green' : 'text-red'

  return (
    <div className="grid grid-cols-2 gap-2.5 mt-5 md:flex md:gap-3 md:flex-wrap">
      <KPICard label="Total Investido" loading={loading}>
        {totalInvested != null ? fBRL(totalInvested) : '—'}
      </KPICard>
      <KPICard label="Valor Atual" loading={loading}>
        {totalValue != null ? fBRL(totalValue) : '—'}
      </KPICard>
      <KPICard
        label="Retorno Total"
        loading={loading}
        valueClass={retornoColor}
      >
        {retorno != null ? (retorno >= 0 ? '+' : '') + fPct(retorno) : '—'}
      </KPICard>
      {/* loading={false}: a contagem vem das operações no localStorage, não das
          cotações — está disponível na hora, sem esperar a rede. */}
      <KPICard label="Posições" loading={false}>
        {positions}
      </KPICard>
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
