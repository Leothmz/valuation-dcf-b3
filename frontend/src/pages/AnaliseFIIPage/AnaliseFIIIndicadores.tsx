import type { FIIData } from '../../api/fiis'

interface Props {
  data: FIIData
}

function fBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}
function fNum2(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fLiq(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e12) return 'R$ ' + (v / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'T'
  if (v >= 1e9) return 'R$ ' + (v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'B'
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
  return fBRL(v)
}

interface CardDef {
  label: string
  value: string
  colorClass?: string
  tip?: string
}

function IndCard({ label, value, colorClass = '', tip }: CardDef) {
  return (
    <div className="bg-bg-3 border border-border rounded-[10px] px-4 py-3.5">
      <div className="text-[11px] text-text-muted uppercase tracking-[0.06em] flex items-center gap-1 mb-1.5">
        {label}
        {tip && (
          <span className="relative group inline-flex">
            <span
              className="w-3.5 h-3.5 rounded-full border border-border text-text-muted cursor-default
                         text-[9px] font-bold inline-flex items-center justify-center"
            >
              ?
            </span>
            <div
              className="hidden group-hover:block absolute bottom-[calc(100%+8px)] left-0 z-50
                         rounded-[10px] p-3 text-[12px] leading-6 text-text-sec"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 32px rgba(0,0,0,.6)',
                width: 230,
                fontWeight: 400,
              }}
              dangerouslySetInnerHTML={{ __html: tip }}
            />
          </span>
        )}
      </div>
      <div className={`font-mono text-[20px] font-bold ${colorClass || 'text-text-base'}`}>
        {value || '—'}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted mt-5 mb-3 pb-1.5 border-b border-border-muted first:mt-0">
      {children}
    </div>
  )
}

export function AnaliseFIIIndicadores({ data }: Props) {
  const vacColor = data.vacancia == null ? '' :
    data.vacancia <= 0.05 ? 'text-green' :
    data.vacancia >= 0.15 ? 'text-red' : ''

  const rentabilidade: CardDef[] = [
    {
      label: 'DY (TTM)',
      value: fPct(data.dy),
      colorClass: data.dy ? 'text-green' : '',
      tip: '<strong>Dividend Yield</strong>Total de proventos pagos nos últimos 12 meses dividido pelo preço atual.',
    },
    {
      label: 'DPA / ano',
      value: fBRL(data.dpa),
      tip: '<strong>Dividendo por Cota</strong>Soma dos proventos pagos por cota nos últimos 12 meses (TTM).',
    },
    {
      label: 'FFO Yield',
      value: fPct(data.ffoYield),
      tip: '<strong>Funds From Operations Yield</strong>Resultado operacional do fundo dividido pelo preço. Fonte: Statusinvest.',
    },
  ]

  const imoveis: CardDef[] = [
    {
      label: 'Vacância',
      value: fPct(data.vacancia),
      colorClass: vacColor,
      tip: '<strong>Vacância Física</strong>Percentual da área bruta locável (ABL) desocupada.',
    },
    {
      label: 'Nº Imóveis',
      value: data.numImoveis != null ? data.numImoveis.toLocaleString('pt-BR') : '—',
    },
    {
      label: 'Segmento',
      value: data.segmento ?? '—',
      colorClass: 'text-purple font-ui text-[14px]',
    },
  ]

  const mercado: CardDef[] = [
    {
      label: 'P/VP',
      value: fNum2(data.pvp),
      tip: '<strong>Preço / Valor Patrimonial</strong>Abaixo de 1 indica desconto ao valor patrimonial do fundo.',
    },
    { label: 'Mkt Cap', value: fLiq(data.marketCap) },
    {
      label: 'Liquidez/dia',
      value: fLiq(data.liquidez),
      tip: '<strong>Liquidez Média Diária</strong>Volume médio diário negociado em R$.',
    },
  ]

  return (
    <div>
      <SectionTitle>Rentabilidade</SectionTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {rentabilidade.map((c) => <IndCard key={c.label} {...c} />)}
      </div>

      <SectionTitle>Imóveis</SectionTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {imoveis.map((c) => <IndCard key={c.label} {...c} />)}
      </div>

      <SectionTitle>Mercado</SectionTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {mercado.map((c) => <IndCard key={c.label} {...c} />)}
      </div>
    </div>
  )
}
