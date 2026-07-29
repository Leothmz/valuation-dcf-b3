import { render, screen } from '@testing-library/react'
import { CarteiraIRMobile } from './CarteiraIRMobile'
import type { MonthlyIRSummary } from '../../engines/portfolio-engine'

const TAXABLE: MonthlyIRSummary = {
  month: '2026-07',
  category: 'swing_acoes',
  grossGain: 2752,
  proceeds: 25000,
  exempt: false,
  lossCarriedIn: 0,
  taxableAmount: 2752,
  rate: 0.15,
  darfAmount: 412.8,
  lossCarriedOut: 0,
  dueDate: '2026-08-31',
}

const EXEMPT: MonthlyIRSummary = {
  month: '2026-06',
  category: 'swing_acoes',
  grossGain: 900,
  proceeds: 15000,
  exempt: true,
  lossCarriedIn: 0,
  taxableAmount: 0,
  rate: 0.15,
  darfAmount: 0,
  lossCarriedOut: 0,
  dueDate: '2026-07-31',
}

// Mesmo ganho bruto positivo de EXEMPT, mas tributável — só não gera DARF porque o
// prejuízo acumulado do mês anterior (lossCarriedIn) abate o ganho inteiro. Isso NÃO
// é renda isenta para o IRPF, diferente de EXEMPT — a distinção que esta tela existe
// para não perder (ver CLAUDE.md / brief da Task 22).
const LOSS_OFFSET: MonthlyIRSummary = {
  month: '2026-05',
  category: 'swing_acoes',
  grossGain: 900,
  proceeds: 25000,
  exempt: false,
  lossCarriedIn: 900,
  taxableAmount: 0,
  rate: 0.15,
  darfAmount: 0,
  lossCarriedOut: 0,
  dueDate: '2026-06-30',
}

const SUMMARIES = [TAXABLE, EXEMPT]

describe('CarteiraIRMobile', () => {
  it('mostra um card por mês+categoria', () => {
    render(<CarteiraIRMobile summaries={SUMMARIES} />)
    expect(screen.getByText('07/2026')).toBeInTheDocument()
    expect(screen.getByText('06/2026')).toBeInTheDocument()
  })

  it('destaca o valor do DARF', () => {
    render(<CarteiraIRMobile summaries={SUMMARIES} />)
    expect(screen.getByText('R$ 412,80')).toBeInTheDocument()
  })

  it('marca mês isento com badge próprio', () => {
    render(<CarteiraIRMobile summaries={SUMMARIES} />)
    expect(screen.getByText('ISENTO')).toBeInTheDocument()
  })

  it('não marca como isento o mês tributado', () => {
    render(<CarteiraIRMobile summaries={[TAXABLE]} />)
    expect(screen.queryByText('ISENTO')).not.toBeInTheDocument()
  })

  it('mostra o vencimento de cada DARF', () => {
    render(<CarteiraIRMobile summaries={SUMMARIES} />)
    expect(screen.getByText('31/08/2026')).toBeInTheDocument()
  })

  // O teste central desta task: um mês isento (exempt: true) e um mês com prejuízo
  // compensado (lossCarriedIn abatendo tudo) mostram os DOIS "R$ 0,00" de DARF — mas
  // só o isento é renda isenta na declaração. Se o badge ISENTO aparecesse nos dois
  // (bug: badge condicionado só a darfAmount === 0 em vez de exempt === true), este
  // teste falha porque passaria a haver 2 badges em vez de 1.
  it('distingue mês isento de mês com prejuízo compensado, mesmo com valores iguais a R$ 0,00 nos dois', () => {
    render(<CarteiraIRMobile summaries={[EXEMPT, LOSS_OFFSET]} />)
    // Base tributável E DARF ficam zerados em ambos — nenhuma diferença no valor numérico exibido.
    expect(screen.getAllByText('R$ 0,00').length).toBeGreaterThanOrEqual(2)
    // Só o mês isento leva o badge ISENTO; o mês com prejuízo compensado leva outro badge.
    expect(screen.getAllByText('ISENTO')).toHaveLength(1)
    expect(screen.getByText('PREJUÍZO COMPENSADO')).toBeInTheDocument()
  })
})
