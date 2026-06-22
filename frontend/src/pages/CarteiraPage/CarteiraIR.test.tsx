import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraIR } from './CarteiraIR'
import type { Operation, SplitEvent } from '../../stores/portfolioStore'

function op(partial: Partial<Operation>): Operation {
  return {
    id: Math.random().toString(),
    date: '2024-01-01',
    ticker: 'WEGE3',
    assetClass: 'acao_br',
    type: 'buy',
    qty: 0,
    price: 0,
    currency: 'BRL',
    fees: 0,
    ...partial,
  }
}

function renderIR(props: Partial<Parameters<typeof CarteiraIR>[0]> = {}) {
  return render(
    <CarteiraIR
      operations={[]}
      splitEvents={[]}
      onAddSplitEvent={() => {}}
      onDeleteSplitEvent={() => {}}
      {...props}
    />
  )
}

describe('CarteiraIR — split events', () => {
  it('shows the empty state when there are no split events', () => {
    renderIR()
    expect(screen.getByText('Nenhum evento registrado.')).toBeInTheDocument()
  })

  it('lists existing split events and calls onDeleteSplitEvent with the right id', () => {
    const onDeleteSplitEvent = vi.fn()
    const splitEvents: SplitEvent[] = [{ id: 'sp1', ticker: 'VALE3', date: '2024-06-01', ratio: 2 }]
    renderIR({ splitEvents, onDeleteSplitEvent })
    expect(screen.getByText('VALE3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /deletar|excluir|trash/i }) ?? screen.getAllByRole('button').slice(-1)[0])
    expect(onDeleteSplitEvent).toHaveBeenCalledWith('sp1')
  })

  it('opens the form and calls onAddSplitEvent with a parsed numeric ratio', () => {
    const onAddSplitEvent = vi.fn()
    renderIR({ onAddSplitEvent })
    fireEvent.click(screen.getByText('+ Registrar Split'))
    fireEvent.change(screen.getByPlaceholderText('Ex: VALE3'), { target: { value: 'vale3' } })
    const ratioInput = screen.getByDisplayValue('') // the empty ratio field
    fireEvent.change(ratioInput, { target: { value: '2' } })
    fireEvent.click(screen.getByText('Salvar'))
    expect(onAddSplitEvent).toHaveBeenCalledWith(
      expect.objectContaining({ ticker: 'VALE3', ratio: 2 })
    )
  })
})

describe('CarteiraIR — monthly dashboard', () => {
  it('shows a taxable DARF row with the correct amount and due date for a non-exempt swing-trade month', () => {
    const operations = [
      op({ date: '2024-01-05', type: 'buy', qty: 1000, price: 30 }),
      op({ date: '2024-06-10', type: 'sell', qty: 1000, price: 40 }),
    ]
    renderIR({ operations })
    expect(screen.getByText('2024-06')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument() // darf = (40-30)*1000 * 0.15
    expect(screen.getByText('2024-07-31')).toBeInTheDocument()
  })

  it('shows an Isento badge and no DARF amount for a month under the R$20k proceeds threshold', () => {
    const operations = [
      op({ date: '2024-01-05', type: 'buy', qty: 100, price: 30 }),
      op({ date: '2024-03-10', type: 'sell', qty: 100, price: 35 }),
    ]
    renderIR({ operations })
    expect(screen.getByText('Isento')).toBeInTheDocument()
  })

  it('shows the empty state when there are no sales', () => {
    renderIR({ operations: [op({ type: 'buy', qty: 100, price: 30 })] })
    expect(screen.getByText('Nenhuma venda registrada.')).toBeInTheDocument()
  })
})

describe('CarteiraIR — IRPF annual summary', () => {
  it('shows the year-end position and exempt income for the selected year', () => {
    const operations = [
      op({ ticker: 'WEGE3', date: '2024-01-05', type: 'buy', qty: 100, price: 30 }),
      op({ ticker: 'WEGE3', date: '2024-03-10', type: 'sell', qty: 50, price: 35 }), // small exempt sale
    ]
    renderIR({ operations })
    expect(screen.getByText('WEGE3')).toBeInTheDocument() // remaining 50-share position
    expect(screen.getByText('Posições em 31/12/2024')).toBeInTheDocument()
  })

  it('shows the empty state when there are no open positions', () => {
    renderIR({ operations: [] })
    expect(screen.getByText('Nenhuma posição em aberto.')).toBeInTheDocument()
  })
})
