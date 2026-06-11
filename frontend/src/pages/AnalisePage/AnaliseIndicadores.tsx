import { fBRL, fPct } from '../../engines/formatters'
import type { FundamentalsData } from '../../api/stocks'

interface Props {
  data: FundamentalsData
}

type FmtType = 'num' | 'pct' | 'brl4' | 'liq'

interface IndicatorCfg {
  label: string
  field: keyof FundamentalsData
  fmt: FmtType
  tip: string
}

function fMktCap(n: number | null | undefined): string {
  if (!n) return '—'
  if (n >= 1e12) return 'R$ ' + (n / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'T'
  if (n >= 1e9) return 'R$ ' + (n / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'B'
  if (n >= 1e6) return 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'
  return fBRL.format(n)
}

function fNum(n: number | null | undefined, dec = 2): string {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function formatValue(val: number | string | null | undefined, fmt: FmtType): string {
  const n = typeof val === 'number' ? val : null
  if (n == null) return '—'
  switch (fmt) {
    case 'pct': return fPct(n)
    case 'brl4': return fBRL.format(n)
    case 'liq': return fMktCap(n)
    default: return fNum(n)
  }
}

const GROUPS: { title: string; items: IndicatorCfg[] }[] = [
  {
    title: 'Valuation',
    items: [
      { label: 'P/L', field: 'pl', fmt: 'num', tip: '<strong>Preço / Lucro</strong>Quantos anos de lucro para recuperar o investimento ao preço atual. Quanto menor, mais barata a ação em relação ao lucro.' },
      { label: 'P/VP', field: 'pvp', fmt: 'num', tip: '<strong>Preço / Valor Patrimonial</strong>Compara o preço com o patrimônio líquido por ação. Abaixo de 1 indica desconto ao patrimônio.' },
      { label: 'LPA', field: 'lpa', fmt: 'brl4', tip: '<strong>Lucro por Ação</strong>Lucro líquido dividido pelo número de ações (TTM — últimos 12 meses).' },
      { label: 'VPA', field: 'vpa', fmt: 'brl4', tip: '<strong>Valor Patrimonial por Ação</strong>Patrimônio líquido dividido pelo número de ações.' },
    ],
  },
  {
    title: 'Rentabilidade',
    items: [
      { label: 'ROE', field: 'roe', fmt: 'pct', tip: '<strong>Retorno sobre Patrimônio Líquido</strong>Lucro Líquido / Patrimônio Líquido. Mede a eficiência no uso do capital próprio. Acima de 15% = bom.' },
      { label: 'ROIC', field: 'roic', fmt: 'pct', tip: '<strong>Retorno sobre Capital Investido</strong>Mede o retorno gerado para cada R$ de capital total investido no negócio.' },
      { label: 'Marg. Líquida', field: 'margemLiquida', fmt: 'pct', tip: '<strong>Margem Líquida</strong>Lucro Líquido / Receita Líquida. Percentual de cada R$ de receita que vira lucro.' },
      { label: 'Cresc. Lucros', field: 'crescimentoLucros', fmt: 'pct', tip: '<strong>Crescimento de Lucros (YoY)</strong>Variação do lucro em relação ao ano anterior. Fonte: yfinance earningsGrowth.' },
      { label: 'PEG Ratio', field: 'pegRatio', fmt: 'num', tip: '<strong>PEG Ratio</strong>P/L dividido pelo crescimento de lucros (%). Abaixo de 1 pode indicar ação subavaliada em relação ao crescimento.' },
      { label: 'DPA', field: 'dpa', fmt: 'brl4', tip: '<strong>Dividendo por Ação</strong>Total de dividendos pagos por ação nos últimos 12 meses (TTM).' },
    ],
  },
  {
    title: 'Estrutura de Capital',
    items: [
      { label: 'DL/EBITDA', field: 'dividaLiquidaEbit', fmt: 'num', tip: '<strong>Dívida Líquida / EBITDA</strong>Quantos anos de geração de caixa operacional para pagar a dívida. Abaixo de 2 é saudável. Não se aplica a bancos.' },
      { label: 'DY', field: 'dy', fmt: 'pct', tip: '<strong>Dividend Yield</strong>Dividendos por ação / Preço atual. Rendimento em dividendos dos últimos 12 meses.' },
      { label: 'P/VP', field: 'pvp', fmt: 'num', tip: '<strong>Preço / Valor Patrimonial</strong>Mesmo indicador da seção Valuation.' },
      { label: 'Liq. Média', field: 'liquidezMedia', fmt: 'liq', tip: '<strong>Liquidez Média Diária</strong>Volume médio diário negociado em R$. Indica facilidade de compra/venda no mercado.' },
    ],
  },
]

function IndicatorCard({ cfg, data }: { cfg: IndicatorCfg; data: FundamentalsData }) {
  const rawVal = data[cfg.field]
  const display = formatValue(rawVal as number | null | undefined, cfg.fmt)
  const isMuted = display === '—'

  return (
    <div className="bg-bg-3 border border-border rounded-[10px] p-3.5">
      <div className="text-[11px] text-text-muted uppercase tracking-[0.06em] flex items-center gap-1 mb-1.5">
        {cfg.label}
        <Tooltip html={cfg.tip} />
      </div>
      <div className={`font-mono text-[20px] font-bold ${isMuted ? 'text-text-muted text-[16px]' : 'text-text-base'}`}>
        {display}
      </div>
    </div>
  )
}

function Tooltip({ html }: { html: string }) {
  return (
    <span className="relative inline-flex items-center group/tip">
      <span
        className="w-3.5 h-3.5 rounded-full border border-border text-text-muted cursor-default
                   text-[9px] font-bold inline-flex items-center justify-center"
      >
        ?
      </span>
      <div
        className="invisible group-hover/tip:visible opacity-0 group-hover/tip:opacity-100
                   transition-opacity duration-150
                   absolute bottom-[calc(100%+8px)] left-0
                   bg-bg-2 border border-border rounded-[10px] p-3 w-[230px]
                   text-[12px] leading-relaxed text-text-sec z-50 shadow-lg
                   normal-case tracking-normal font-normal"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </span>
  )
}

export function AnaliseIndicadores({ data }: Props) {
  return (
    <div>
      {GROUPS.map((group) => (
        <div key={group.title}>
          <div
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted
                       mt-5 mb-3 pb-1.5 border-b border-border-muted first:mt-0"
          >
            {group.title}
          </div>
          <div className="grid grid-cols-4 gap-2.5 max-[900px]:grid-cols-2">
            {group.items.map((cfg) => (
              <IndicatorCard key={`${group.title}-${cfg.field}-${cfg.label}`} cfg={cfg} data={data} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
