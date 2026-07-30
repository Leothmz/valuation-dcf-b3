import { useEffect, useRef, useState } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery'

interface Props {
  ticker: string
}

const PERIODS = [
  { label: '1 DIA', range: '1D' },
  { label: '7 DIAS', range: '5D' },
  { label: '30 DIAS', range: '1M' },
  { label: '6 MESES', range: '6M' },
  { label: 'YTD', range: 'YTD' },
  { label: '1 ANO', range: '12M' },
  { label: '5 ANOS', range: '60M' },
  { label: '10 ANOS', range: 'ALL' },
]

/**
 * Tipo de gráfico do widget do TradingView: '1' são velas (o default deles),
 * '2' é linha. Linha é o padrão aqui — em análise fundamentalista o que importa
 * é a trajetória do preço, não abertura/fechamento/máxima/mínima de cada dia.
 * Mesma escolha da análise de ações (AnalisePage/AnaliseGrafico.tsx).
 */
const CHART_STYLE_LINE = '2'

const CHART_HEIGHT_DESKTOP = 520
const CHART_HEIGHT_MOBILE = 280

// Menos opções de período no mobile — evita estourar a largura da tela com 8 abas.
const MOBILE_RANGES = new Set(['1D', '1M', '6M', '12M', 'ALL'])

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown
    }
  }
}

export function AnaliseFIIGrafico({ ticker }: Props) {
  const [activeRange, setActiveRange] = useState('12M')
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const isMobile = useIsMobile()
  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP
  const periods = isMobile ? PERIODS.filter((p) => MOBILE_RANGES.has(p.range)) : PERIODS

  useEffect(() => {
    if (!ticker) return

    if (containerRef.current) {
      containerRef.current.innerHTML = '<div id="tradingview_fii_chart"></div>'
    }

    const initWidget = () => {
      if (!window.TradingView) {
        setTimeout(initWidget, 200)
        return
      }
      new window.TradingView.widget({
        width: '100%',
        height: chartHeight,
        symbol: `BMFBOVESPA:${ticker}`,
        interval: 'D',
        timezone: 'America/Sao_Paulo',
        theme: 'dark',
        style: CHART_STYLE_LINE,
        locale: 'br',
        enable_publishing: false,
        save_image: false,
        hide_side_toolbar: true,
        container_id: 'tradingview_fii_chart',
        range: activeRange,
      })
    }

    if (!window.TradingView) {
      if (scriptRef.current) {
        scriptRef.current.remove()
      }
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = initWidget
      document.head.appendChild(script)
      scriptRef.current = script
    } else {
      initWidget()
    }
  }, [ticker, activeRange, chartHeight])

  return (
    <div>
      <div
        className="flex border-b border-border mb-0 overflow-x-auto
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {periods.map(({ label, range }) => (
          <button
            key={range}
            onClick={() => setActiveRange(range)}
            className={`bg-transparent border-0 border-b-2 px-3.5 py-2 text-[12px] font-semibold
                        tracking-[0.03em] cursor-pointer transition-colors shrink-0 min-h-[44px]
                        ${activeRange === range
                          ? 'text-cyan border-cyan'
                          : 'text-text-muted border-transparent hover:text-text-sec'
                        }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{ height: chartHeight, borderRadius: '0 0 14px 14px', overflow: 'hidden' }}
      >
        <div id="tradingview_fii_chart" />
      </div>
    </div>
  )
}
