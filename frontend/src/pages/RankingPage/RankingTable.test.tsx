import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RankingTable } from './RankingTable'
import type { RankedRow } from './index'

const noop = vi.fn()

const baseProps = {
  isLoading: false,
  favorites: [] as string[],
  onToggleFav: noop,
  sortCol: 'rank',
  sortDir: 'asc' as const,
  onSort: noop,
}

function makeRow(partial: Partial<RankedRow> = {}): RankedRow {
  return {
    ticker: 'PETR4',
    rank: 1,
    score: 85,
    price: 35.5,
    pl: 7.2,
    roe: 0.22,
    margemLiquida: 0.18,
    dividaLiquidaEbit: 1.5,
    dy: 0.08,
    bazinFairPrice: 40.0,
    grahamFairPrice: 38.0,
    lynchVal: 1.2,
    joelVal: 0.139,
    setor: 'Energy',
    subsetor: 'Oil & Gas',
    ...partial,
  }
}

function renderTable(rows: RankedRow[], props = {}) {
  return render(
    <MemoryRouter>
      <RankingTable rows={rows} {...baseProps} {...props} />
    </MemoryRouter>
  )
}

describe('RankingTable', () => {
  it('shows loading message when isLoading=true and rows empty', () => {
    renderTable([], { isLoading: true })
    expect(screen.getByText(/Carregando dados/i)).toBeInTheDocument()
  })

  it('shows empty state when not loading and rows empty', () => {
    renderTable([], { isLoading: false })
    expect(screen.getByText(/Nenhuma ação encontrada/i)).toBeInTheDocument()
  })

  it('renders ticker in a row', () => {
    renderTable([makeRow()])
    expect(screen.getByText('PETR4')).toBeInTheDocument()
  })

  it('renders multiple tickers', () => {
    renderTable([makeRow({ ticker: 'PETR4', rank: 1 }), makeRow({ ticker: 'VALE3', rank: 2 })])
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByText('VALE3')).toBeInTheDocument()
  })

  it('renders Bazin fair price', () => {
    renderTable([makeRow({ bazinFairPrice: 40.0 })])
    expect(screen.getByText(/R\$\s*40/)).toBeInTheDocument()
  })

  it('shows dash for null Bazin fair price', () => {
    renderTable([makeRow({ bazinFairPrice: null })])
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders DY as percentage', () => {
    renderTable([makeRow({ dy: 0.08 })])
    expect(screen.getByText('8,00%')).toBeInTheDocument()
  })

  it('shows dash for null DY', () => {
    renderTable([makeRow({ dy: null })])
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders price in BRL', () => {
    renderTable([makeRow({ price: 35.5 })])
    expect(screen.getByText(/R\$\s*35/)).toBeInTheDocument()
  })

  it('renders Graham fair price', () => {
    renderTable([makeRow({ grahamFairPrice: 38.0 })])
    const cells = screen.getAllByText(/R\$\s*38/)
    expect(cells.length).toBeGreaterThan(0)
  })

  it('renders Joel Earnings Yield as percentage', () => {
    renderTable([makeRow({ joelVal: 0.139 })])
    expect(screen.getByText('13,90%')).toBeInTheDocument()
  })

  it('shows Custom badge for custom tickers', () => {
    renderTable([makeRow({ isCustom: true })])
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('does not show Custom badge for default tickers', () => {
    renderTable([makeRow({ isCustom: false })])
    expect(screen.queryByText('Custom')).not.toBeInTheDocument()
  })

  it('calls onRemoveCustom when × clicked on custom badge', () => {
    const onRemoveCustom = vi.fn()
    renderTable([makeRow({ isCustom: true })], { onRemoveCustom })
    screen.getByTitle('Remover PETR4 dos tickers customizados').click()
    expect(onRemoveCustom).toHaveBeenCalledWith('PETR4')
  })

  it('shows all table headers', () => {
    renderTable([makeRow()])
    expect(screen.getByText(/Ticker/i)).toBeInTheDocument()
    expect(screen.getByText(/Cotação/i)).toBeInTheDocument()
    expect(screen.getByText(/DY/i)).toBeInTheDocument()
    expect(screen.getByText(/P\/L/i)).toBeInTheDocument()
  })
})
