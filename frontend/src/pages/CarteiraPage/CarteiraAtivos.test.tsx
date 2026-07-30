import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CarteiraAtivos } from './CarteiraAtivos'
import type { HoldingSummary, AssetTWRR } from '../../engines/portfolio-engine'
import type { LiveQuote } from '../../api/stocks'

const holdings: HoldingSummary[] = [
  { ticker: 'PETR4', assetClass: 'acao_br', qty: 100, precoMedio: 30, investido: 3000 },
  { ticker: 'VALE3', assetClass: 'acao_br', qty: 10, precoMedio: 60, investido: 600 },
  { ticker: 'BTC', assetClass: 'cripto', qty: 0.1, precoMedio: 200000, investido: 20000 },
]

// Quote prices are chosen so each ticker's simple "Retorno" differs from its TWRR
// value, avoiding ambiguous duplicate text matches across the two columns.
// PETR4: retorno = (36-30)/30 = +20% vs TWRR +10%.
// VALE3: retorno = (51-60)/60 = -15% vs TWRR -10%.
const quotes: LiveQuote[] = [
  { ticker: 'PETR4', price: 36, changePercent: 1, dividendYield: 0.05 },
  { ticker: 'VALE3', price: 51, changePercent: -1, dividendYield: 0.03 },
]

const twrrMap: Record<string, AssetTWRR> = {
  PETR4: { twrr: 0.1, subPeriods: [{ startValue: 3000, endValue: 3300 }] },
  VALE3: { twrr: -0.1, subPeriods: [{ startValue: 600, endValue: 540 }] },
}

function renderAtivos(props: Partial<Parameters<typeof CarteiraAtivos>[0]> = {}) {
  return render(
    <MemoryRouter>
      <CarteiraAtivos
        holdings={holdings}
        quotes={quotes}
        watchlistEntries={{}}
        quotesLoading={false}
        twrrMap={twrrMap}
        twrrLoading={false}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('CarteiraAtivos — TWRR', () => {
  it('renders TWRR column header', () => {
    renderAtivos()
    expect(screen.getByText('TWRR')).toBeInTheDocument()
  })

  it('shows formatted TWRR value per row', () => {
    renderAtivos()
    expect(screen.getByText('+10,0%')).toBeInTheDocument()
    expect(screen.getByText('-10,0%')).toBeInTheDocument()
  })

  it('expands sub-period breakdown when TWRR value is clicked', () => {
    renderAtivos()
    expect(screen.queryByText('Período 1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('+10,0%'))
    expect(screen.getByText('Período 1')).toBeInTheDocument()
  })

  it('sorts rows by TWRR: descending on first click, ascending on second', () => {
    renderAtivos()
    fireEvent.click(screen.getByText('TWRR'))
    let rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('PETR4')

    fireEvent.click(screen.getByText(/TWRR/))
    rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('VALE3')
  })

  it('shows a skeleton in the TWRR cell while loading and no value yet', () => {
    const { container } = renderAtivos({ twrrMap: {}, twrrLoading: true })
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('shows the Criptoativo badge and label for a cripto holding', () => {
    renderAtivos()
    expect(screen.getByText('Criptoativo')).toBeInTheDocument()
  })

  it('offers a Cripto filter chip that isolates cripto holdings', () => {
    renderAtivos()
    fireEvent.click(screen.getByText('Cripto'))
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.queryByText('PETR4')).not.toBeInTheDocument()
  })
})

// Mesmo padrão de RankingPage/index.test.tsx (Task 12) / AnaliseHistorico.test.tsx (Task 17) /
// AnaliseFIIProventos.test.tsx (Task 18) — sobrescreve o polyfill global de matchMedia
// (test-setup.ts, default matches:false = desktop) para provar montagem condicional via
// useIsMobile(), não CSS. getByText SEM escopo de container é o detector de duplicata: se
// lista mobile e tabela desktop fossem montadas ao mesmo tempo, o texto do ticker apareceria
// duas vezes e o getByText lançaria "found multiple elements".
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

describe('CarteiraAtivos — montagem condicional mobile/desktop (useIsMobile, não CSS)', () => {
  afterEach(() => {
    mockMatchMedia(false)
  })

  it('no mobile, a lista de cards está no DOM e a tabela não', () => {
    mockMatchMedia(true)
    renderAtivos()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    // ExpandableRow expõe role="button" com aria-label = ticker — só existe na lista mobile.
    expect(screen.getByRole('button', { name: 'PETR4' })).toBeInTheDocument()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
  })

  it('no desktop, a tabela está no DOM e a lista de cards não', () => {
    mockMatchMedia(false)
    renderAtivos()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
  })
})
