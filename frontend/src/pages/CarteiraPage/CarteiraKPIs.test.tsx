import { render, screen } from '@testing-library/react'
import { CarteiraKPIs } from './CarteiraKPIs'

describe('CarteiraKPIs', () => {
  it('renders "Total Investido" label', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} positions={3} loading={false} />)
    expect(screen.getByText('Total Investido')).toBeInTheDocument()
  })

  it('renders "Valor Atual" label', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} positions={3} loading={false} />)
    expect(screen.getByText('Valor Atual')).toBeInTheDocument()
  })

  it('formats totalInvested in pt-BR BRL', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} positions={3} loading={false} />)
    expect(screen.getByText(/R\$\s*10\.000/)).toBeInTheDocument()
  })

  it('formats totalValue in pt-BR BRL', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} positions={3} loading={false} />)
    expect(screen.getByText(/R\$\s*12\.000/)).toBeInTheDocument()
  })

  it('shows positive return as green with + prefix', () => {
    const { container } = render(
      <CarteiraKPIs totalInvested={10000} totalValue={12000} positions={3} loading={false} />
    )
    const retornoValue = container.querySelector('.text-green')
    expect(retornoValue).toBeInTheDocument()
    expect(retornoValue?.textContent).toMatch(/^\+/)
  })

  it('shows negative return as red', () => {
    const { container } = render(
      <CarteiraKPIs totalInvested={10000} totalValue={8000} positions={3} loading={false} />
    )
    const retornoValue = container.querySelector('.text-red')
    expect(retornoValue).toBeInTheDocument()
  })

  it('shows skeleton elements when loading=true', () => {
    const { container } = render(
      <CarteiraKPIs totalInvested={10000} totalValue={12000} positions={3} loading={true} />
    )
    const skeletons = container.querySelectorAll('.skeleton, [class*="animate"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows dashes when values are null', () => {
    render(<CarteiraKPIs totalInvested={null} totalValue={null} positions={0} loading={false} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('shows dash for return when totalInvested is 0', () => {
    render(<CarteiraKPIs totalInvested={0} totalValue={5000} positions={3} loading={false} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})

describe('CarteiraKPIs — Posições (regressão)', () => {
  // O componente renderizava um travessão HARDCODED aqui, com o comentário
  // "count is always available" — placeholder deixado no port de junho/2026.
  // Nem recebia a contagem por prop. Bug herdado, achado no teste manual da v1.8.
  it('mostra a contagem recebida em vez de travessão fixo', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} positions={10} loading={false} />)
    const card = screen.getByText('Posições').parentElement
    expect(card).toHaveTextContent('10')
    expect(card).not.toHaveTextContent('—')
  })

  it('mostra 0 quando a carteira está vazia', () => {
    render(<CarteiraKPIs totalInvested={null} totalValue={null} positions={0} loading={false} />)
    expect(screen.getByText('Posições').parentElement).toHaveTextContent('0')
  })

  it('mostra a contagem na hora, sem esperar as cotações', () => {
    // A contagem vem das operações no localStorage, não da rede — por isso o
    // KPICard de Posições passa loading={false} mesmo quando os outros carregam.
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} positions={7} loading={true} />)
    expect(screen.getByText('Posições').parentElement).toHaveTextContent('7')
  })
})
