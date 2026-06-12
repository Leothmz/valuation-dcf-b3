import { useEffect, useRef, useState } from 'react'

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

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown
    }
  }
}

export function AnaliseGrafico({ ticker }: Props) {
  const [activeRange, setActiveRange] = useState('12M')
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (!ticker) return

    // Clear previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '<div id="tradingview_chart"></div>'
    }

    function initWidget() {
      if (!window.TradingView) {
        setTimeout(initWidget, 200)
        return
      }
      new window.TradingView.widget({
        width: '100%',
        height: 520,
        symbol: `BMFBOVESPA:${ticker}`,
        interval: 'D',
        timezone: 'America/Sao_Paulo',
        theme: 'dark',
        style: '1',
        locale: 'br',
        enable_publishing: false,
        save_image: false,
        hide_side_toolbar: true,
        container_id: 'tradingview_chart',
        range: activeRange,
      })
    }

    // Load TradingView script if not already loaded
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
  }, [ticker, activeRange])

  return (
    <div>
      <div className="flex border-b border-border mb-0">
        {PERIODS.map(({ label, range }) => (
          <button
            key={range}
            onClick={() => setActiveRange(range)}
            className={`bg-transparent border-0 border-b-2 px-3.5 py-2 text-[12px] font-semibold
                        tracking-[0.03em] cursor-pointer transition-colors
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
        id="tv-container"
        style={{ height: 520, borderRadius: '0 0 14px 14px', overflow: 'hidden' }}
      >
        <div id="tradingview_chart" />
      </div>
    </div>
  )
}
