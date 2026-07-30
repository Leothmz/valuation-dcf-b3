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
    // O rótulo aparece duas vezes no DOM por design (Task 16): um <span md:hidden>
    // com a versão curta e um <span hidden md:inline> com a versão longa, pra
    // trocar via CSS conforme o breakpoint — não é duplicação acidental.
    expect(screen.getAllByText('DY').length).toBe(2)
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

  it('renders shortLabel hidden on desktop and label hidden on mobile', () => {
    const rows: CompareRow[] = [
      { label: 'Bazin · Preço Teto', shortLabel: 'Bazin', cells: [{ value: 'R$ 10,00', highlight: null }, { value: 'R$ 12,00', highlight: null }] },
    ]
    render(<CompareTable tickers={['PETR4', 'VALE3']} rows={rows} isLoading={false} />)
    const short = screen.getByText('Bazin')
    const long = screen.getByText('Bazin · Preço Teto')
    expect(short.className).toContain('md:hidden')
    expect(long.className).toContain('hidden md:inline')
  })
})
