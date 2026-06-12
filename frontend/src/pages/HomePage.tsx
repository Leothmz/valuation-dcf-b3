import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Calculator,
  Trophy,
  Building2,
  Activity,
  Bookmark,
  BarChart2,
  Database,
  ShieldCheck,
  Briefcase,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Calculator,
    title: 'Calculadora DCF',
    desc: 'Valuation por Fluxo de Caixa Descontado. Dados preenchidos via yfinance — ajuste ROE, Payout e taxa de desconto e veja o preço teto por ação calculado em tempo real.',
    to: '/dcf',
  },
  {
    icon: Trophy,
    title: 'Ranking de Ações',
    desc: 'Screening fundamentalista com 5 métodos: Thomaz/GD, Bazin, Graham, Lynch e Joel (Magic Formula). Filter chips configuráveis para DY, P/L, ROE, margem e liquidez.',
    to: '/ranking',
  },
  {
    icon: Activity,
    title: 'Análise Individual',
    desc: 'Hero com KPIs, indicadores fundamentais com tooltips, 4 valuations teóricos (Bazin, Graham, Lynch, Joel), histórico de lucros e gráfico TradingView interativo.',
    to: '/analise',
  },
  {
    icon: Bookmark,
    title: 'Watchlist Ao Vivo',
    desc: 'Salve o preço teto calculado e acompanhe upside/downside em tempo real com atualização automática a cada 3 minutos.',
    to: '/watchlist',
  },
  {
    icon: Database,
    title: 'Dados Automáticos',
    desc: 'Preço, ROE, payout e lucros via yfinance. Net income de 2021+ vem de scraping silencioso do investidor10.com.br, com fallback automático para yfinance.',
    to: '/dcf',
  },
  {
    icon: Building2,
    title: 'Ranking de FIIs',
    desc: 'Screening de ~40 FIIs pelo Método 2em1 (rank DY + rank P/VP). Filtros por segmento, vacância, liquidez e FFO Yield. Badges de perfil por P/VP.',
    to: '/fiis',
  },
  {
    icon: BarChart2,
    title: 'Análise Individual FII',
    desc: 'Hero com KPIs (DY, P/VP, Vacância, Segmento), indicadores com tooltips, histórico de proventos TTM e gráfico TradingView interativo.',
    to: '/analise-fii',
  },
  {
    icon: Briefcase,
    title: 'Carteira',
    desc: 'Registre operações de compra e venda, acompanhe P&L por ativo, gerencie renda fixa e importe extratos da B3.',
    to: '/carteira',
  },
  {
    icon: ShieldCheck,
    title: '100% Local',
    desc: 'Nenhum dado sai do computador. Sem cadastro, sem API key. Um servidor Python leve e um browser moderno é tudo que você precisa.',
    to: '/dcf',
  },
]

const STEPS = [
  {
    num: '1',
    title: 'Inicie o servidor local',
    desc: 'Execute start.bat (Windows) ou python server.py. O servidor sobe na porta 8000 e serve dados via yfinance e investidor10.com.br.',
  },
  {
    num: '2',
    title: 'Escolha uma ferramenta',
    desc: 'Calculadora DCF para valuation individual, Ranking para screening de ações com 5 métodos, FIIs para screening de fundos imobiliários, ou Análise para indicadores aprofundados de um ticker.',
  },
  {
    num: '3',
    title: 'Busque um ticker',
    desc: 'Digite o código da ação — o sistema preenche preço, ROE, payout, lucros históricos e número de ações automaticamente.',
  },
  {
    num: '4',
    title: 'Analise e ajuste',
    desc: 'Na Calculadora, edite as premissas e veja o preço teto. No Ranking, use os filter chips para afinar o screening. Na Análise, explore indicadores e o gráfico TradingView.',
  },
  {
    num: '5',
    title: 'Salve na Watchlist',
    desc: 'Clique "Salvar Preço Teto" para adicionar à Watchlist e acompanhar upside/downside com preços atualizados automaticamente a cada 3 minutos.',
  },
]

const TECH_TAGS = [
  'Python 3', 'yfinance', 'http.server', 'investidor10.com.br',
  'TradingView', 'React 19', 'TypeScript', 'TanStack Query',
  'Zustand', 'Lucide Icons', 'Tailwind CSS', 'Vitest', 'pytest',
]

export function HomePage() {
  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{
        background:
          'radial-gradient(ellipse at 30% -20%, rgba(6,182,212,.08) 0%, transparent 60%), #0b0f17',
      }}
    >
      <div className="max-w-[860px] mx-auto px-10 py-14">
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
            className="text-[48px] font-extrabold leading-[1.15] tracking-[-0.03em] mb-5"
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

          <p className="text-[17px] text-text-sec leading-[1.75] max-w-[580px] mb-8">
            8 ferramentas integradas para análise fundamentalista de ações e FIIs listados na B3.
            Roda 100% local, sem API key, sem cadastro — do DCF ao ranking por múltiplos métodos.
          </p>

          <div className="flex gap-3 flex-wrap">
            <Link
              to="/dcf"
              className="inline-flex items-center gap-1.5 px-[22px] py-2.5 rounded-[14px]
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
              className="inline-flex items-center gap-1.5 px-[22px] py-2.5 rounded-[14px]
                         text-sm font-semibold text-text-base no-underline
                         border border-border hover:border-cyan"
              style={{ background: '#1a2233' }}
            >
              <Trophy size={15} strokeWidth={2} />
              Ranking de Ações
            </Link>
            <Link
              to="/fiis"
              className="inline-flex items-center gap-1.5 px-[22px] py-2.5 rounded-[14px]
                         text-sm font-semibold text-text-base no-underline
                         border border-border hover:border-cyan"
              style={{ background: '#1a2233' }}
            >
              <Building2 size={15} strokeWidth={2} />
              Ranking FIIs
            </Link>
            <Link
              to="/analise"
              className="inline-flex items-center gap-1.5 px-[22px] py-2.5 rounded-[14px]
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
                className="flex items-baseline gap-3 py-2.5"
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid #151e2d' : 'none',
                  fontFamily: 'JetBrains Mono, Cascadia Code, Fira Code, monospace',
                  fontSize: '13px',
                }}
              >
                <span className="text-text-sec min-w-[200px]" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' }}>
                  {lbl}
                </span>
                <span className="text-cyan font-bold">{eq}</span>
                <span className="text-text-base">{val}</span>
              </div>
            ))}
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
            {FEATURES.map(({ icon: Icon, title, desc, to }) => (
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
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#06b6d4'
                  ;(e.currentTarget as HTMLElement).style.boxShadow =
                    '0 4px 16px rgba(0,0,0,.5)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#1e2d42'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                <div className="mb-3 text-cyan">
                  <Icon size={26} strokeWidth={1.5} />
                </div>
                <div className="text-[15px] font-semibold mb-1.5 text-text-base">{title}</div>
                <div className="text-sm text-text-sec leading-[1.65]">{desc}</div>
              </Link>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1e2d42', margin: '52px 0' }} />

        {/* Steps */}
        <section className="mb-14">
          <h2 className="text-[20px] font-bold mb-1.5">Como usar</h2>
          <p className="text-sm text-text-sec leading-[1.7] mb-6">
            Em poucos minutos você tem valuation, ranking e análise de qualquer ação da B3.
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

        {/* Tech stack */}
        <section className="mb-14">
          <h2 className="text-[20px] font-bold mb-1.5">Tecnologias</h2>
          <p className="text-sm text-text-sec leading-[1.7] mb-4">
            Stack moderno com React 19, TypeScript e Python — sem dependências desnecessárias.
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
      </div>
    </div>
  )
}
