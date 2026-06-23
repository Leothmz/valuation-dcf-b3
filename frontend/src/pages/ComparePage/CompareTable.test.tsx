import { render, screen } from '@testing-library/react'
import { CompareTable } from './CompareTable'
import type { CompareRow } from './CompareTable'

function makeRows(): CompareRow[] {
  return [
    {
      label: 'DY',
      cells: [
        { value: '8,00%', highlight: 'best' },
        { value: '4,00%', highlight: 'worst' },
      ],
    },
    {
      label: 'Cotação',
      cells: [
        { value: 'R$ 35,50', highlight: null },
        { value: 'R$ 60,00', highlight: null },
      ],
    },
  ]
}

describe('CompareTable', () => {
  it('shows loading message', () => {
    render(<CompareTable tickers={['PETR4', 'VALE3']} rows={[]} isLoading={true} />)
    expect(screen.getByText(/Carregando dados/i)).toBeInTheDocument()
  })

  it('renders ticker columns', () => {
    render(<CompareTable tickers={['PETR4', 'VALE3']} rows={makeRows()} isLoading={false} />)
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByText('VALE3')).toBeInTheDocument()
  })

  it('renders metric rows with values', () => {
    render(<CompareTable tickers={['PETR4', 'VALE3']} rows={makeRows()} isLoading={false} />)
    expect(screen.getByText('DY')).toBeInTheDocument()
    expect(screen.getByText('8,00%')).toBeInTheDocument()
    expect(screen.getByText('4,00%')).toBeInTheDocument()
  })

  it('highlights best cell green and worst cell red', () => {
    render(<CompareTable tickers={['PETR4', 'VALE3']} rows={makeRows()} isLoading={false} />)
    const best = screen.getByText('8,00%')
    const worst = screen.getByText('4,00%')
    expect(best).toHaveStyle({ color: 'var(--color-green)' })
    expect(worst).toHaveStyle({ color: 'var(--color-red)' })
  })
})
