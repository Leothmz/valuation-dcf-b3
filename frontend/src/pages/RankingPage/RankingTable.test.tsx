import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('does not render compare checkbox when onToggleCompare is absent', () => {
    renderTable([makeRow()])
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('renders compare checkbox when onToggleCompare is provided', () => {
    renderTable([makeRow()], { onToggleCompare: noop })
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('checkbox reflects compareSelection state', () => {
    renderTable([makeRow()], { onToggleCompare: noop, compareSelection: ['PETR4'] })
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onToggleCompare with ticker on checkbox click', () => {
    const onToggleCompare = vi.fn()
    renderTable([makeRow()], { onToggleCompare })
    screen.getByRole('checkbox').click()
    expect(onToggleCompare).toHaveBeenCalledWith('PETR4')
  })

  it('a seleção não trava em maxCompare — o limite virou do botão Comparar', () => {
    // Antes o checkbox desabilitava ao atingir 3 selecionados. A seleção passou
    // a servir também "Salvar tetos" e "Exportar CSV", onde 3 não faz sentido.
    const rows = [makeRow({ ticker: 'PETR4' }), makeRow({ ticker: 'VALE3', rank: 2 })]
    renderTable(rows, { onToggleCompare: noop, compareSelection: ['VALE3', 'ITUB4', 'BBAS3'], maxCompare: 3 })
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).toBeEnabled()
    expect(checkboxes[1]).toBeEnabled()
  })

  it('shows all table headers', () => {
    renderTable([makeRow()])
    expect(screen.getByText(/Ticker/i)).toBeInTheDocument()
    expect(screen.getByText(/Cotação/i)).toBeInTheDocument()
    expect(screen.getByText(/DY/i)).toBeInTheDocument()
    expect(screen.getByText(/P\/L/i)).toBeInTheDocument()
  })
})

describe('RankingTable — linha expandida', () => {
  it('cada linha tem um botão de detalhe', () => {
    renderTable([makeRow(), makeRow({ ticker: 'VALE3', rank: 2 })], { method: 'thomaz' })
    expect(screen.getAllByRole('button', { name: /detalhe de/i })).toHaveLength(2)
  })

  it('o detalhe começa fechado', () => {
    renderTable([makeRow()], { method: 'thomaz' })
    expect(screen.queryByText(/por que este rank/i)).not.toBeInTheDocument()
  })

  it('expandir mostra faixa e atribuição sem navegar para a DCF', async () => {
    const user = userEvent.setup()
    renderTable([makeRow()], { method: 'thomaz' })
    await user.click(screen.getByRole('button', { name: /detalhe de PETR4/i }))
    expect(screen.getByText(/por que este rank/i)).toBeInTheDocument()
    expect(screen.getByText(/preço teto · faixa dos métodos/i)).toBeInTheDocument()
  })

  it('o botão anuncia o estado', async () => {
    const user = userEvent.setup()
    renderTable([makeRow()], { method: 'thomaz' })
    const botao = screen.getByRole('button', { name: /detalhe de PETR4/i })
    expect(botao).toHaveAttribute('aria-expanded', 'false')
    await user.click(botao)
    expect(botao).toHaveAttribute('aria-expanded', 'true')
  })

  it('abrir um detalhe fecha o anterior — uma linha por vez', async () => {
    const user = userEvent.setup()
    renderTable([makeRow(), makeRow({ ticker: 'VALE3', rank: 2 })], { method: 'thomaz' })
    await user.click(screen.getByRole('button', { name: /detalhe de PETR4/i }))
    await user.click(screen.getByRole('button', { name: /detalhe de VALE3/i }))
    expect(screen.getAllByText(/por que este rank/i)).toHaveLength(1)
  })
})
