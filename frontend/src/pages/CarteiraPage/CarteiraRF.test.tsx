import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraRF } from './CarteiraRF'
import type { RFTitle } from '../../stores/portfolioStore'

const TITLES: RFTitle[] = [
  {
    id: 't1',
    name: 'CDB Nubank',
    type: 'cdb',
    rateType: 'cdi_pct',
    baseRate: 110,
    maturityDate: '2027-01-01',
    deposits: [
      { id: 'd1', date: '2024-01-01', amount: 1000, rateOverride: null, manualCurrentValue: null },
    ],
  },
]

function renderRF(props: Partial<Parameters<typeof CarteiraRF>[0]> = {}) {
  return render(
    <CarteiraRF
      titles={TITLES}
      cdiAccumulated={0.1415}
      onAdd={() => {}}
      onDelete={() => {}}
      onDeleteDeposit={() => {}}
      {...props}
    />
  )
}

describe('CarteiraRF', () => {
  it('renders a title row with its issuer name', () => {
    renderRF()
    expect(screen.getByText('CDB Nubank')).toBeInTheDocument()
  })

  it('opens the add-title modal when the button is controlled externally (FAB)', () => {
    const onModalOpenChange = vi.fn()
    renderRF({ modalOpen: true, onModalOpenChange })
    expect(screen.getByText('Adicionar Título de Renda Fixa')).toBeInTheDocument()
  })
})

// Mesmo padrão de CarteiraAtivos.test.tsx (Task 21) — sobrescreve o polyfill global de
// matchMedia (test-setup.ts, default matches:false = desktop) para provar montagem
// condicional via useIsMobile(), não CSS. getByText SEM escopo de container é o detector
// de duplicata: se a lista mobile e a tabela desktop fossem montadas ao mesmo tempo, o
// texto do emissor apareceria duas vezes e getByText lançaria "found multiple elements".
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

describe('CarteiraRF — montagem condicional mobile/desktop (useIsMobile, não CSS)', () => {
  afterEach(() => {
    mockMatchMedia(false)
  })

  it('no mobile, a lista de cards está no DOM e a tabela não', () => {
    mockMatchMedia(true)
    renderRF()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('CDB Nubank')).toBeInTheDocument()
    expect(screen.getByText('Remover')).toBeInTheDocument()
  })

  it('no desktop, a tabela está no DOM e a lista de cards não', () => {
    mockMatchMedia(false)
    renderRF()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('CDB Nubank')).toBeInTheDocument()
    expect(screen.queryByText('Remover')).not.toBeInTheDocument()
  })

  it('no mobile, o clique no botão "+ Adicionar Título" ainda abre o modal (fallback interno)', () => {
    mockMatchMedia(true)
    renderRF()
    fireEvent.click(screen.getByText('+ Adicionar Título'))
    expect(screen.getByText('Adicionar Título de Renda Fixa')).toBeInTheDocument()
  })
})
