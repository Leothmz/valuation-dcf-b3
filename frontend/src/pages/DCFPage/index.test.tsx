import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DCFPage } from './index'
import { useDCFStore } from '../../stores'
import type { DCFResult, DCFHistoryEntry } from '../../engines/dcf-engine'

// Padrão copiado de components/Sidebar.test.tsx — o polyfill global de matchMedia
// (test-setup.ts) sempre reporta matches:false (desktop), então qualquer teste que
// exercite o ramo mobile precisa sobrescrever localmente.
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

const baseResult: DCFResult = {
  flows: [],
  pvFlows: [],
  tv: 50_000_000,
  pvTV: 30_000_000,
  sumPV: 10_000_000,
  ev: 40_000_000,
  fairPrice: 40.0,
  upside: 0.25,
  baseYear: 2024,
}

// Popula o store (zustand global) com um ticker + resultado já calculados, sem
// passar por handleSearch/fetch. Usamos ?wl=__none__ na URL (ver renderPage) para
// que o efeito de primeiro mount do DCFPage não chame store.reset() nem dispare
// uma busca de rede — restoreFromWatchlist() dá no-op silencioso quando o ticker
// não existe na watchlist.
function setStoreWithResult() {
  useDCFStore.setState({
    ticker: 'PETR4',
    companyName: 'Petrobras',
    apiData: null,
    projYears: 5,
    dcfMethod: 'buffett',
    history: [] as DCFHistoryEntry[],
    assumptions: {
      ll: 1_000_000,
      payout: 0.4,
      roe: 0.2,
      g: 0.12,
      disc: 0.15,
      perp: 0.03,
      shares: 100_000,
      price: 30,
    },
    overrides: [],
    apiVals: {},
    yearOverrides: {},
    results: baseResult,
    resultsClassico: baseResult,
    resultsBuffett: baseResult,
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dcf?wl=__none__']}>
      <DCFPage />
    </MemoryRouter>
  )
}

describe('DCFPage — resultado antes das premissas (mobile)', () => {
  it('no mobile, o painel de resultado (Preço Teto) aparece antes do painel de premissas na ordem do DOM', () => {
    mockMatchMedia(true)
    setStoreWithResult()
    renderPage()

    // O acordeão começa recolhido (hasResult=true) — reabre para poder comparar
    // a posição dos dois painéis simultaneamente no DOM.
    fireEvent.click(screen.getByRole('button', { name: /premissas/i }))

    const resultEl = screen.getByText(/Preço Teto · Valor Intrínseco/i)
    const inputEl = screen.getByText(/Lucro Líquido Base/i)

    // resultEl deve vir ANTES de inputEl na árvore do DOM
    const position = resultEl.compareDocumentPosition(inputEl)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('no mobile, com resultado, o acordeão de premissas recolhe (mas os chips WACC/Perp./Anos continuam visíveis)', () => {
    mockMatchMedia(true)
    setStoreWithResult()
    renderPage()

    expect(screen.queryByText(/Lucro Líquido Base/i)).not.toBeInTheDocument()
    expect(screen.getByText('WACC')).toBeInTheDocument()
    expect(screen.getByText('Perp.')).toBeInTheDocument()
    expect(screen.getByText('Anos')).toBeInTheDocument()
  })

  it('no desktop, o painel de premissas continua visível mesmo com resultado calculado (acordeão nunca recolhe)', () => {
    mockMatchMedia(false)
    setStoreWithResult()
    renderPage()

    expect(screen.getByText(/Lucro Líquido Base/i)).toBeInTheDocument()
  })

  it('no desktop, a ordem original é preservada: premissas (inputs) antes do resultado', () => {
    mockMatchMedia(false)
    setStoreWithResult()
    renderPage()

    const inputEl = screen.getByText(/Lucro Líquido Base/i)
    const resultEl = screen.getByText(/Preço Teto · Valor Intrínseco/i)

    // inputEl deve vir ANTES de resultEl na árvore do DOM (ordem original preservada)
    const position = inputEl.compareDocumentPosition(resultEl)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
