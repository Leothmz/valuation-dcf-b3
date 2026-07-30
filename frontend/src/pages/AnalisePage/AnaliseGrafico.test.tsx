import { render } from '@testing-library/react'
import { AnaliseGrafico } from './AnaliseGrafico'

// O widget do TradingView renderiza dentro de um iframe próprio — não dá para
// afirmar "é linha" olhando o DOM. O que dá para travar é a config que passamos,
// que é justamente o que controla isso.
function mockTradingView() {
  const widget = vi.fn()
  window.TradingView = { widget: widget as never }
  return widget
}

describe('AnaliseGrafico', () => {
  afterEach(() => {
    delete window.TradingView
  })

  it('abre em linha, não em velas (style "2" = linha, "1" = velas)', () => {
    const widget = mockTradingView()
    render(<AnaliseGrafico ticker="PETR4" />)
    expect(widget).toHaveBeenCalled()
    expect(widget.mock.calls[0][0]).toMatchObject({ style: '2' })
  })

  it('pede o símbolo do ticker na B3', () => {
    const widget = mockTradingView()
    render(<AnaliseGrafico ticker="WEGE3" />)
    expect(widget.mock.calls[0][0]).toMatchObject({ symbol: 'BMFBOVESPA:WEGE3' })
  })

  it('não monta o widget sem ticker', () => {
    const widget = mockTradingView()
    render(<AnaliseGrafico ticker="" />)
    expect(widget).not.toHaveBeenCalled()
  })
})
