import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraAtivosMobile } from './CarteiraAtivosMobile'
import type { HoldingSummary, AssetTWRR } from '../../engines/portfolio-engine'

// Nomes de campo reais confirmados em engines/portfolio-engine.ts:
// - HoldingSummary usa `precoMedio` (não `avgPrice`, como o brief da task assumia)
// - TWRRSubPeriod usa `startValue`/`endValue` (não `start`/`end`/`label`/`ret`)
const HOLDINGS: HoldingSummary[] = [
  { ticker: 'PETR4', assetClass: 'acao_br', qty: 100, precoMedio: 30.0, investido: 3000 },
]
const PRICES = { PETR4: 38.42 }
const TWRR: Record<string, AssetTWRR> = {
  PETR4: { twrr: 0.281, subPeriods: [{ startValue: 3000, endValue: 3842 }] },
}

function setup() {
  render(
    <CarteiraAtivosMobile holdings={HOLDINGS} currentPriceMap={PRICES} twrrMap={TWRR} />
  )
}

describe('CarteiraAtivosMobile', () => {
  it('mostra ticker e retorno simples com sinal', () => {
    setup()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    // (38.42-30)/30 = 0.280666... -> +28,07%
    expect(screen.getByText('+28,07%')).toBeInTheDocument()
  })

  it('revela qtd, preço médio, valor investido, alocação e TWRR ao expandir', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'PETR4' }))
    expect(screen.getByText('Quantidade')).toBeInTheDocument()
    expect(screen.getByText('Preço Médio')).toBeInTheDocument()
    expect(screen.getByText('Valor Investido')).toBeInTheDocument()
    expect(screen.getByText('Alocação %')).toBeInTheDocument()
    expect(screen.getByText('TWRR')).toBeInTheDocument()
    // TWRR 0.281 -> +28,10%
    expect(screen.getByText('+28,10%')).toBeInTheDocument()
  })

  it('retorno e TWRR negativos mostram sinal "-" (regra do upside — fPctSigned, nunca Math.abs)', () => {
    const holdings: HoldingSummary[] = [
      { ticker: 'VALE3', assetClass: 'acao_br', qty: 10, precoMedio: 60, investido: 600 },
    ]
    const prices = { VALE3: 51 }
    const twrr: Record<string, AssetTWRR> = {
      VALE3: { twrr: -0.1, subPeriods: [{ startValue: 600, endValue: 540 }] },
    }
    render(<CarteiraAtivosMobile holdings={holdings} currentPriceMap={prices} twrrMap={twrr} />)
    // (51-60)/60 = -0.15 -> -15,00%
    expect(screen.getByText('-15,00%')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'VALE3' }))
    expect(screen.getByText('-10,00%')).toBeInTheDocument()
  })

  it('abre um sub-detalhamento do TWRR por sub-período dentro do card expandido', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'PETR4' }))
    const twrrToggle = screen.getByRole('button', { name: 'TWRR de PETR4' })
    expect(screen.queryByText('Período 1')).not.toBeInTheDocument()
    fireEvent.click(twrrToggle)
    expect(screen.getByText('Período 1')).toBeInTheDocument()
  })
})
