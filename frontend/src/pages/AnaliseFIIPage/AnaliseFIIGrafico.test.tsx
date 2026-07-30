import { render } from '@testing-library/react'
import { AnaliseFIIGrafico } from './AnaliseFIIGrafico'

// Mesma limitação da análise de ações: o widget renderiza dentro de um iframe
// próprio, então o que dá para travar é a config que passamos para ele.
function mockTradingView() {
  const widget = vi.fn()
  window.TradingView = { widget: widget as never }
  return widget
}

describe('AnaliseFIIGrafico', () => {
  afterEach(() => {
    delete window.TradingView
  })

  it('abre em linha, não em velas (style "2" = linha, "1" = velas)', () => {
    const widget = mockTradingView()
    render(<AnaliseFIIGrafico ticker="HGLG11" />)
    expect(widget).toHaveBeenCalled()
    expect(widget.mock.calls[0][0]).toMatchObject({ style: '2' })
  })

  it('pede o símbolo do FII na B3', () => {
    const widget = mockTradingView()
    render(<AnaliseFIIGrafico ticker="MXRF11" />)
    expect(widget.mock.calls[0][0]).toMatchObject({ symbol: 'BMFBOVESPA:MXRF11' })
  })

  it('não monta o widget sem ticker', () => {
    const widget = mockTradingView()
    render(<AnaliseFIIGrafico ticker="" />)
    expect(widget).not.toHaveBeenCalled()
  })
})
