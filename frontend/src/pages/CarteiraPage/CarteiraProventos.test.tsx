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

// Mesmo padrão de CarteiraAtivos.test.tsx (Task 21) — sobrescreve o polyfill global de
// matchMedia (test-setup.ts, default matches:false = desktop) para provar montagem
// condicional via useIsMobile(), não CSS. getByText SEM escopo de container é o detector
// de duplicata.
function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const ONE_PROVENTO = [
  { id: 'p1', date: '2024-06-01', ticker: 'WEGE3', type: 'dividendo' as const, qty: 100, valuePerShare: 0.5 },
]

describe('CarteiraProventos — montagem condicional mobile/desktop da lista principal (useIsMobile, não CSS)', () => {
  afterEach(() => {
    mockMatchMedia(false)
  })

  it('no mobile, a lista de cards está no DOM e a tabela não', () => {
    mockMatchMedia(true)
    render(
      <CarteiraProventos
        proventos={ONE_PROVENTO}
        onAdd={() => {}}
        onDelete={() => {}}
        onImport={() => {}}
        {...DEFAULT_PROPS}
      />
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('WEGE3')).toBeInTheDocument()
    expect(screen.getByText('Remover')).toBeInTheDocument()
  })

  it('no desktop, a tabela está no DOM e a lista de cards não', () => {
    mockMatchMedia(false)
    render(
      <CarteiraProventos
        proventos={ONE_PROVENTO}
        onAdd={() => {}}
        onDelete={() => {}}
        onImport={() => {}}
        {...DEFAULT_PROPS}
      />
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('WEGE3')).toBeInTheDocument()
    expect(screen.queryByText('Remover')).not.toBeInTheDocument()
  })
})

describe('CarteiraProventos — montagem condicional mobile/desktop do preview de importação CSV (useIsMobile, não CSS)', () => {
  afterEach(() => {
    mockMatchMedia(false)
  })

  it('no mobile, o preview de importação mostra cards e não a tabela', async () => {
    mockMatchMedia(true)
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

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('XPLG11')).toBeInTheDocument()
    expect(screen.getByText('Selecionar todos')).toBeInTheDocument()
  })

  it('no desktop, o preview de importação mostra a tabela e não cards', async () => {
    mockMatchMedia(false)
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

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('XPLG11')).toBeInTheDocument()
    expect(screen.queryByText('Selecionar todos')).not.toBeInTheDocument()
  })
})
