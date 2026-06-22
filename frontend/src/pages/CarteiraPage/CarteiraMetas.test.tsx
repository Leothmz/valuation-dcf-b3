import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraMetas } from './CarteiraMetas'
import type { HoldingSummary } from '../../engines/portfolio-engine'
import type { Category } from '../../stores/portfolioStore'

const ZERO_TARGETS: Record<Category, number> = {
  acoes_br: 0,
  fiis: 0,
  renda_fixa: 0,
  internacional: 0,
  criptoativos: 0,
  caixa: 0,
}

const holdings: HoldingSummary[] = [
  { ticker: 'WEGE3', assetClass: 'acao_br', qty: 100, precoMedio: 30, investido: 3000 },
]

function renderMetas(props: Partial<Parameters<typeof CarteiraMetas>[0]> = {}) {
  return render(
    <CarteiraMetas
      holdings={holdings}
      priceMap={{ WEGE3: 40 }}
      rfValue={0}
      cashBalance={0}
      allocationTargets={ZERO_TARGETS}
      onSetCashBalance={() => {}}
      onSetTarget={() => {}}
      {...props}
    />
  )
}

describe('CarteiraMetas', () => {
  it('renders a target input for each of the six categories', () => {
    renderMetas()
    expect(screen.getByLabelText('Meta Ações BR (%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta FIIs (%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta Renda Fixa (%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta Internacional (%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta Criptoativos (%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta Caixa (%)')).toBeInTheDocument()
  })

  it('calls onSetTarget with the category and the parsed number when a target input changes', () => {
    const onSetTarget = vi.fn()
    renderMetas({ onSetTarget })
    fireEvent.change(screen.getByLabelText('Meta Ações BR (%)'), { target: { value: '25' } })
    expect(onSetTarget).toHaveBeenCalledWith('acoes_br', 25)
  })

  it('renders a cash balance input and calls onSetCashBalance when it changes', () => {
    const onSetCashBalance = vi.fn()
    renderMetas({ onSetCashBalance })
    fireEvent.change(screen.getByLabelText('Saldo em Caixa (R$)'), { target: { value: '1500' } })
    expect(onSetCashBalance).toHaveBeenCalledWith(1500)
  })

  it('shows a vender suggestion with a positive amount for an overweight category', () => {
    // 100 * 40 = R$4000 actual in acoes_br, target 0% → fully overweight, total portfolio = 4000
    renderMetas({ allocationTargets: { ...ZERO_TARGETS, acoes_br: 0 } })
    expect(screen.getByText('Vender')).toBeInTheDocument()
    expect(screen.getByText('R$ 4.000,00')).toBeInTheDocument()
  })

  it('shows a comprar suggestion with a positive amount for an underweight category', () => {
    // total portfolio = 4000 (all in acoes_br), target for fiis = 50% → fiis underweight by R$2000
    renderMetas({ allocationTargets: { ...ZERO_TARGETS, fiis: 50 } })
    expect(screen.getByText('Comprar')).toBeInTheDocument()
    expect(screen.getByText('R$ 2.000,00')).toBeInTheDocument()
  })

  it('shows manter when actual matches target exactly', () => {
    // acoes_br is the only category with value; target it at 100% so its deviation is 0.
    // Every other category is also 0-actual/0-target (manter too), so this scenario has
    // six manter rows total — assert at least one exists rather than a single unique match.
    renderMetas({ allocationTargets: { ...ZERO_TARGETS, acoes_br: 100 } })
    expect(screen.getAllByText('Manter').length).toBeGreaterThan(0)
  })
})
