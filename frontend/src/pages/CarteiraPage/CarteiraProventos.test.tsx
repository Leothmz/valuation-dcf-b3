import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CarteiraProventos } from './CarteiraProventos'

const SAMPLE_CSV = `Entrada/Saída;Data;Movimentação;Produto;Instituição;Quantidade;Preço unitário;Valor da Operação
Credito;15/01/2024;Dividendo;WEGE3 - WEG SA;XP;100;0,50;50,00
Credito;10/03/2024;Rendimento;XPLG11 - XP LOG;XP;30;0,75;22,50`

function makeCsvFile(text: string, name = 'extrato.csv') {
  return new File([text], name, { type: 'text/csv' })
}

const DEFAULT_PROPS = {
  holdings: [],
  operations: [],
  dividendHistoryByTicker: {},
  dpaMap: {},
  dividendDataLoading: false,
}

describe('CarteiraProventos — CSV import', () => {
  it('shows a preview modal with parsed rows after selecting a CSV file', async () => {
    render(
      <CarteiraProventos
        proventos={[]}
        onAdd={() => {}}
        onDelete={() => {}}
        onImport={() => {}}
        {...DEFAULT_PROPS}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeCsvFile(SAMPLE_CSV)] } })
    await waitFor(() => expect(screen.getByText('WEGE3')).toBeInTheDocument())
    expect(screen.getByText('XPLG11')).toBeInTheDocument()
  })

  it('confirm import calls onImport only with checked rows', async () => {
    const onImport = vi.fn()
    render(
      <CarteiraProventos
        proventos={[]}
        onAdd={() => {}}
        onDelete={() => {}}
        onImport={onImport}
        {...DEFAULT_PROPS}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeCsvFile(SAMPLE_CSV)] } })
    await waitFor(() => expect(screen.getByText('WEGE3')).toBeInTheDocument())

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((cb) => cb.hasAttribute('data-prov-idx')) as HTMLInputElement[]
    fireEvent.click(checkboxes[1]) // uncheck the XPLG11 row

    fireEvent.click(screen.getByRole('button', { name: /Importar selecionados/i }))
    expect(onImport).toHaveBeenCalledTimes(1)
    const imported = onImport.mock.calls[0][0]
    expect(imported).toHaveLength(1)
    expect(imported[0].ticker).toBe('WEGE3')
  })

  it('pre-unchecks rows that duplicate an existing provento', async () => {
    const existing = [
      { id: '1', date: '2024-01-15', ticker: 'WEGE3', type: 'dividendo' as const, qty: 100, valuePerShare: 0.5 },
    ]
    render(
      <CarteiraProventos
        proventos={existing}
        onAdd={() => {}}
        onDelete={() => {}}
        onImport={() => {}}
        {...DEFAULT_PROPS}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeCsvFile(SAMPLE_CSV)] } })
    // proventos already contains a WEGE3 row rendered in the main table, so waiting on
    // getByText('WEGE3') alone can resolve before the import modal opens — wait for the
    // modal's own heading instead, which only exists once the parse completes.
    await waitFor(() =>
      expect(screen.getByText('Confirmar importação de proventos')).toBeInTheDocument()
    )

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((cb) => cb.hasAttribute('data-prov-idx')) as HTMLInputElement[]
    expect(checkboxes[0].checked).toBe(false) // WEGE3 row duplicates the existing provento
    expect(checkboxes[1].checked).toBe(true) // XPLG11 row is new
  })
})
