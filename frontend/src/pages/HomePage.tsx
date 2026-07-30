import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Calculator,
  Trophy,
  Building2,
  Activity,
  Bookmark,
  BarChart2,
  Briefcase,
  Heart,
  GitCompare,
  BarChart3,
  BookOpenCheck,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Calculator,
    title: 'Calculadora DCF',
    desc: 'Valuation por Fluxo de Caixa Descontado, métodos Clássico e Buffett lado a lado, cenários bull/base/bear e exportação em HTML.',
    to: '/dcf',
    accent: 'cyan',
  },
  {
    icon: Trophy,
    title: 'Ranking de Ações',
    desc: 'Screening fundamentalista com 5 métodos: Thomaz, Bazin, Graham, Lynch e Joel (Magic Formula). Filtros configuráveis de DY, P/L, ROE, margem, DL/EBITDA e liquidez.',
    to: '/ranking',
    accent: 'cyan',
  },
  {
    icon: GitCompare,
    title: 'Comparar Ações',
    desc: 'Coloque até 3 tickers lado a lado com os 4 métodos de preço teto e destaque automático do melhor indicador em cada linha.',
    to: '/compare',
    accent: 'cyan',
  },
  {
    icon: Activity,
    title: 'Análise de Ações',
    desc: 'Indicadores fundamentais com tooltip explicativo, os 4 valuations teóricos, histórico de lucros e gráfico de cotação interativo.',
    to: '/analise',
    accent: 'cyan',
  },
  {
    icon: Bookmark,
    title: 'Meus Valuations',
    desc: 'Salve o preço teto calculado, acompanhe upside em tempo real e receba aviso quando o preço entrar na faixa de compra.',
    to: '/watchlist',
    accent: 'cyan',
  },
  {
    icon: Building2,
    title: 'Ranking de FIIs',
    desc: 'Screening pelo Rank Thomaz FII (rank DY + rank P/VP), segmentado por Logística, Papel/CRI, Híbrido, Fiagro e mais.',
    to: '/fiis',
    accent: 'purple',
  },
  {
    icon: BarChart2,
    title: 'Análise de FIIs',
    desc: 'KPIs de DY, P/VP, vacância e segmento, histórico de proventos (yield on cost) e gráfico de cotação.',
    to: '/analise-fii',
    accent: 'purple',
  },
  {
    icon: Briefcase,
    title: 'Carteira',
    desc: 'Operações, performance por ativo (TWRR), metas de alocação com rebalanceamento, IR/DARF, proventos e criptoativos — tudo num lugar.',
    to: '/carteira',
    accent: 'green',
  },
]

const STEPS = [
  {
    num: '1',
    title: 'Busque um ticker',
    desc: 'Digite o código de uma ação ou FII — preço, histórico de lucros, ROE, payout e proventos são carregados automaticamente.',
  },
  {
    num: '2',
    title: 'Calcule o preço teto',
    desc: 'Na Calculadora, ajuste as premissas (ROE, payout, taxa de desconto) e acompanhe o valor intrínseco recalcular em tempo real.',
  },
  {
    num: '3',
    title: 'Use o ranking pra triagem',
    desc: 'Filtre por DY, P/L, ROE, margem e liquidez nos rankings de Ações e FIIs pra reduzir um universo grande a poucos candidatos.',
  },
  {
    num: '4',
    title: 'Leia antes de decidir',
    desc: 'Releases, fatos relevantes e relatórios trimestrais contam a parte que os números isolados não mostram. Essa etapa não é opcional.',
  },
  {
    num: '5',
    title: 'Acompanhe na Watchlist',
    desc: 'Salve o preço teto calculado em Meus Valuations e seja avisado quando o preço entrar na faixa de compra.',
  },
]

const TECH_TAGS = [
  'Python', 'FastAPI', 'yfinance', 'diskcache',
  'investidor10.com.br', 'statusinvest.com.br', 'fundamentus.com.br',
  'React 19', 'TypeScript', 'Vite', 'TanStack Query',
  'Zustand', 'Tailwind CSS', 'Playwright', 'Vitest', 'pytest',
]

const ACCENT_STYLES: Record<string, { icon: string; hoverBorder: string }> = {
  cyan:   { icon: 'text-cyan',   hoverBorder: '#06b6d4' },
  purple: { icon: 'text-purple', hoverBorder: '#8b5cf6' },
  green:  { icon: 'text-green',  hoverBorder: '#10b981' },
}

export function HomePage() {
  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{
        background:
          'radial-gradient(ellipse at 30% -20%, rgba(6,182,212,.08) 0%, transparent 60%), ' +
          'radial-gradient(ellipse at 90% 10%, rgba(168,85,247,.06) 0%, transparent 50%), #0b0f17',
      }}
    >
      <div className="max-w-[860px] mx-auto px-4 py-8 md:px-10 md:py-14">
        {/* Hero */}
        <section className="mb-16">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                        text-cyan text-[13px] font-medium mb-6"
            style={{
              background: 'rgba(6,182,212,.08)',
              border: '1px solid rgba(6,182,212,.3)',
              boxShadow: '0 0 20px rgba(6,182,212,.15)',
            }}
          >
            <TrendingUp size={14} />
            Análise Fundamentalista · B3
          </div>

          <h1
            className="text-[28px] md:text-[48px] font-extrabold leading-[1.15] tracking-[-0.03em] mb-5"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Encontre o valor<br />intrínseco de uma ação{' '}
            <em
              className="not-italic"
              style={{
                background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              B3
            </em>
          </h1>

          <p className="text-[15px] md:text-[17px] text-text-sec leading-[1.75] max-w-[580px] mb-8">
            8 ferramentas integradas para análise fundamentalista de ações e FIIs — sem cadastro,
            sem custo. Do cálculo do preço teto ao ranking por múltiplos métodos, sempre como
            apoio à sua análise, nunca como substituto dela.
          </p>

          <div className="grid grid-cols-2 gap-2.5 md:flex md:gap-3 md:flex-wrap">
            <Link
              to="/dcf"
              className="inline-flex items-center justify-center gap-1.5 px-3 md:px-[22px] py-3 md:py-2.5 min-h-[44px] md:min-h-0 text-center rounded-[14px]
                         text-sm font-semibold text-[#060910] no-underline"
              style={{
                background: 'linear-gradient(135deg,#06b6d4 0%,#0891b2 100%)',
                boxShadow: '0 4px 12px rgba(6,182,212,.3)',
              }}
            >
              <Calculator size={15} strokeWidth={2} />
              Calculadora DCF
            </Link>
            <Link
              to="/ranking"
              className="inline-flex items-center justify-center gap-1.5 px-3 md:px-[22px] py-3 md:py-2.5 min-h-[44px] md:min-h-0 text-center rounded-[14px]
                         text-sm font-semibold text-text-base no-underline
                         border border-border hover:border-cyan"
              style={{ background: '#1a2233' }}
            >
              <Trophy size={15} strokeWidth={2} />
              Ranking de Ações
            </Link>
            <Link
              to="/fiis"
              className="inline-flex items-center justify-center gap-1.5 px-3 md:px-[22px] py-3 md:py-2.5 min-h-[44px] md:min-h-0 text-center rounded-[14px]
                         text-sm font-semibold text-text-base no-underline
                         border border-border hover:border-cyan"
              style={{ background: '#1a2233' }}
            >
              <Building2 size={15} strokeWidth={2} />
              Ranking FIIs
            </Link>
            <Link
              to="/analise"
              className="inline-flex items-center justify-center gap-1.5 px-3 md:px-[22px] py-3 md:py-2.5 min-h-[44px] md:min-h-0 text-center rounded-[14px]
                         text-sm font-semibold text-text-base no-underline
                         border border-border hover:border-cyan"
              style={{ background: '#1a2233' }}
            >
              <Activity size={15} strokeWidth={2} />
              Análise Individual
            </Link>
          </div>
        </section>

        {/* DCF Formula */}
        <section className="mb-14">
          <h2 className="text-[20px] font-bold mb-1.5">O que é o método DCF?</h2>
          <p className="text-sm text-text-sec leading-[1.7] mb-6">
            O Fluxo de Caixa Descontado (DCF) é um método de valuation que estima o valor
            justo de uma empresa projetando seus lucros futuros e trazendo-os a valor presente
            por uma taxa de desconto. A ideia central é que{' '}
            <strong>um real hoje vale mais do que um real no futuro</strong>.
          </p>

          <div
            className="rounded-[14px] p-6"
            style={{ background: '#111827', border: '1px solid #1e2d42' }}
          >
            {[
              ['Taxa de crescimento', '=', '(1 − Payout) × ROE'],
              ['VPL de cada fluxo', '=', 'CF_ano / (1 + desconto)^ano'],
              ['Valor Terminal (Gordon)', '=', 'CF_último × (1 + perpetuidade) / (desconto − perpetuidade)'],
              ['Preço Teto', '=', '(Σ VPL + VPL do Valor Terminal) / Nº de ações'],
            ].map(([lbl, eq, val], i, arr) => (
              <div
                key={lbl}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5"
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid #151e2d' : 'none',
                  fontFamily: 'JetBrains Mono, Cascadia Code, Fira Code, monospace',
                  fontSize: '13px',
                }}
              >
                {/* Rótulo e "=" ocupam a linha inteira no mobile, forçando a
                    fórmula para a linha de baixo em TODAS as linhas do bloco.
                    Antes o rótulo tinha só min-width, então fórmula curta
                    (crescimento) cabia ao lado e as longas quebravam — cada
                    linha do bloco saía com um formato. No desktop segue lado a
                    lado, com a mesma coluna de 200px de antes. */}
                <span className="flex items-baseline gap-3 w-full md:w-auto">
                  <span className="text-text-sec md:min-w-[200px]" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' }}>
                    {lbl}
                  </span>
                  <span className="text-cyan font-bold">{eq}</span>
                </span>
                <span className="text-text-base">{val}</span>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1e2d42', margin: '52px 0' }} />

        {/* Quantitative x Qualitative */}
        <section className="mb-14">
          <h2 className="text-[20px] font-bold mb-1.5">Quantitativo + qualitativo</h2>
          <p className="text-sm text-text-sec leading-[1.7] mb-6">
            A Calculadora e os Rankings fazem a parte <strong>quantitativa</strong> da análise —
            números, fórmulas, comparação entre ativos. Eles filtram um universo grande até um
            punhado de candidatos. O que vem depois não é opcional.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
            <div
              className="rounded-[14px] p-5"
              style={{ background: '#111827', border: '1px solid #1e2d42' }}
            >
              <div className="flex items-center gap-2 mb-2.5 text-cyan">
                <BarChart3 size={20} strokeWidth={1.75} />
                <span className="text-[14px] font-semibold text-text-base">Quantitativo</span>
              </div>
              <p className="text-[13px] text-text-sec leading-[1.65]">
                Preço teto, múltiplos, DY, ROE, P/L, screening por filtros. Diz <em>o quanto</em>{' '}
                — preço caro, barato ou justo frente aos números reportados.
              </p>
            </div>

            <div className="flex md:flex-col items-center justify-center text-text-muted py-2 md:py-0">
              <Plus size={18} strokeWidth={2.5} />
            </div>

            <div
              className="rounded-[14px] p-5"
              style={{ background: '#111827', border: '1px solid #1e2d42' }}
            >
              <div className="flex items-center gap-2 mb-2.5 text-purple">
                <BookOpenCheck size={20} strokeWidth={1.75} />
                <span className="text-[14px] font-semibold text-text-base">Qualitativo</span>
              </div>
              <p className="text-[13px] text-text-sec leading-[1.65]">
                Relatórios trimestrais, fatos relevantes, comunicados, governança, tese do
                negócio. Diz <em>o porquê</em> — se os números vão se sustentar.
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-3 rounded-[14px] p-4 mt-4"
            style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)' }}
          >
            <CheckCircle2 size={18} className="text-green shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-[13px] text-text-sec leading-[1.6]">
              Use o ranking pra reduzir centenas de ativos a uma lista curta — e então leia o
              relatório, o release de resultados e qualquer comunicação relevante de cada um
              antes de decidir. Pular essa etapa transforma uma ferramenta de análise em aposta.
            </p>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1e2d42', margin: '52px 0' }} />

        {/* Features grid */}
        <section className="mb-14">
          <h2 className="text-[20px] font-bold mb-1.5">Ferramentas</h2>
          <p className="text-sm text-text-sec leading-[1.7] mb-6">
            Oito páginas integradas para uma análise fundamentalista completa de ações e FIIs.
          </p>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))' }}>
            {FEATURES.map(({ icon: Icon, title, desc, to, accent }) => {
              const a = ACCENT_STYLES[accent]
              return (
                <Link
                  key={title}
                  to={to}
                  className="block rounded-[14px] p-[22px] no-underline
                             transition-transform hover:-translate-y-0.5"
                  style={{
                    background: '#111827',
                    border: '1px solid #1e2d42',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor = a.hoverBorder
                    ;(e.currentTarget as HTMLElement).style.boxShadow =
                      '0 4px 16px rgba(0,0,0,.5)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#1e2d42'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                  }}
                >
                  <div className={`mb-3 ${a.icon}`}>
                    <Icon size={26} strokeWidth={1.5} />
                  </div>
                  <div className="text-[15px] font-semibold mb-1.5 text-text-base">{title}</div>
                  <div className="text-sm text-text-sec leading-[1.65]">{desc}</div>
                </Link>
              )
            })}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1e2d42', margin: '52px 0' }} />

        {/* Steps */}
        <section className="mb-14">
          <h2 className="text-[20px] font-bold mb-1.5">Como usar</h2>
          <p className="text-sm text-text-sec leading-[1.7] mb-6">
            Em poucos minutos você tem valuation, ranking e análise de qualquer ação ou FII da B3.
          </p>

          <div className="flex flex-col gap-3">
            {STEPS.map(({ num, title, desc }) => (
              <div
                key={num}
                className="flex gap-4 items-start rounded-[14px] p-[18px_22px]"
                style={{ background: '#111827', border: '1px solid #1e2d42' }}
              >
                <div
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center
                             shrink-0 mt-0.5 text-cyan text-[13px] font-bold"
                  style={{
                    background: 'rgba(6,182,212,.1)',
                    border: '1px solid rgba(6,182,212,.2)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {num}
                </div>
                <div>
                  <div className="text-[15px] font-semibold mb-0.5">{title}</div>
                  <div className="text-sm text-text-sec leading-[1.65]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1e2d42', margin: '52px 0' }} />

        {/* Data reliability disclaimer */}
        <section className="mb-14">
          <div
            className="rounded-[14px] p-6"
            style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)' }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <AlertTriangle size={20} className="text-amber" strokeWidth={1.75} />
              <h2 className="text-[16px] font-bold text-text-base m-0">Sobre os dados</h2>
            </div>
            <p className="text-[13px] text-text-sec leading-[1.7] mb-2.5">
              Pra continuar gratuito, este site depende de dados de terceiros (yfinance e
              scrapers de fontes públicas como investidor10, statusinvest e fundamentus) — não há
              um provedor pago e auditado por trás. O valor base usado na Calculadora (lucro
              líquido histórico) costuma vir correto, mas campos derivados como{' '}
              <strong>payout, ROE e número de ações</strong> ocasionalmente apresentam diferenças
              entre fontes.
            </p>
            <p className="text-[13px] text-text-sec leading-[1.7] m-0">
              <strong>Valide os números antes de usar</strong> — compare com o RI da própria
              empresa ou outro terminal antes de decidir com base neles. Isto não é recomendação
              de investimento.
            </p>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1e2d42', margin: '52px 0' }} />

        {/* Tech stack */}
        <section className="mb-14">
          <h2 className="text-[20px] font-bold mb-1.5">Tecnologias</h2>
          <p className="text-sm text-text-sec leading-[1.7] mb-4">
            Stack moderno com React 19, TypeScript e FastAPI — sem dependências desnecessárias.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            {TECH_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3.5 py-1 text-xs text-text-sec
                           hover:border-cyan hover:text-cyan cursor-default"
                style={{
                  background: '#111827',
                  border: '1px solid #1e2d42',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1e2d42', margin: '52px 0' }} />

        {/* Support CTA */}
        <section
          className="rounded-[14px] p-6 flex items-center justify-between gap-4 flex-wrap pb-8 md:pb-6"
          style={{ background: '#111827', border: '1px solid #1e2d42' }}
        >
          <div>
            <div className="text-[15px] font-semibold mb-1 text-text-base">Gostou do projeto?</div>
            <div className="text-sm text-text-sec">
              É 100% gratuito e sempre será. Se quiser apoiar o desenvolvimento, é totalmente opcional.
            </div>
          </div>
          <Link
            to="/apoiar"
            className="inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-[12px]
                       min-h-[44px] md:min-h-0
                       text-sm font-semibold text-[#060910] no-underline shrink-0"
            style={{
              background: 'linear-gradient(135deg,#06b6d4 0%,#0891b2 100%)',
              boxShadow: '0 4px 12px rgba(6,182,212,.3)',
            }}
          >
            <Heart size={15} strokeWidth={2} />
            Apoiar o Projeto
          </Link>
        </section>
      </div>
    </div>
  )
}
