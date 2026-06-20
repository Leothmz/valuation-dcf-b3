import { render, screen } from '@testing-library/react'
import { CarteiraKPIs } from './CarteiraKPIs'

describe('CarteiraKPIs', () => {
  it('renders "Total Investido" label', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} loading={false} />)
    expect(screen.getByText('Total Investido')).toBeInTheDocument()
  })

  it('renders "Valor Atual" label', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} loading={false} />)
    expect(screen.getByText('Valor Atual')).toBeInTheDocument()
  })

  it('formats totalInvested in pt-BR BRL', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} loading={false} />)
    expect(screen.getByText(/R\$\s*10\.000/)).toBeInTheDocument()
  })

  it('formats totalValue in pt-BR BRL', () => {
    render(<CarteiraKPIs totalInvested={10000} totalValue={12000} loading={false} />)
    expect(screen.getByText(/R\$\s*12\.000/)).toBeInTheDocument()
  })

  it('shows positive return as green with + prefix', () => {
    const { container } = render(
      <CarteiraKPIs totalInvested={10000} totalValue={12000} loading={false} />
    )
    const retornoValue = container.querySelector('.text-green')
    expect(retornoValue).toBeInTheDocument()
    expect(retornoValue?.textContent).toMatch(/^\+/)
  })

  it('shows negative return as red', () => {
    const { container } = render(
      <CarteiraKPIs totalInvested={10000} totalValue={8000} loading={false} />
    )
    const retornoValue = container.querySelector('.text-red')
    expect(retornoValue).toBeInTheDocument()
  })

  it('shows skeleton elements when loading=true', () => {
    const { container } = render(
      <CarteiraKPIs totalInvested={10000} totalValue={12000} loading={true} />
    )
    const skeletons = container.querySelectorAll('.skeleton, [class*="animate"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows dashes when values are null', () => {
    render(<CarteiraKPIs totalInvested={null} totalValue={null} loading={false} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('shows dash for return when totalInvested is 0', () => {
    render(<CarteiraKPIs totalInvested={0} totalValue={5000} loading={false} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})
