import { render, screen } from '@testing-library/react'
import { AnaliseFIIProventos } from './AnaliseFIIProventos'
import type { FIIData } from '../../api/fiis'

// Mesmo padrão de AnaliseHistorico.test.tsx / WatchlistHistoryModal.test.tsx — sobrescreve o
// polyfill global de matchMedia (test-setup.ts, default matches:false = desktop) para simular mobile.
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

// Datas bem no passado para cair fora da janela TTM (evita que os cards-resumo
// de "DPA TTM" / "Média / mês" repitam o mesmo valor formatado da linha de detalhe).
const DATA = {
  ticker: 'MXRF11',
  price: 10,
  dividends: [
    { date: '2015-06-10', amount: 0.1 },
    { date: '2014-05-10', amount: 0.09 },
  ],
} as FIIData

function setup(isMobile: boolean) {
  mockMatchMedia(isMobile)
  render(<AnaliseFIIProventos data={DATA} />)
}

afterEach(() => {
  // Restaura o comportamento desktop padrão para não vazar entre testes.
  mockMatchMedia(false)
})

describe('AnaliseFIIProventos — montagem condicional (tabela vs. lista)', () => {
  it('em mobile, mostra a lista de cards e NÃO a tabela (detector de duplicata via getByText sem escopo)', () => {
    setup(true)
    // getByText (sem escopo) falharia com "multiple elements" se tabela e lista
    // fossem montadas ao mesmo tempo — é o teste de montagem condicional.
    expect(screen.getByText('R$ 0,10')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('em desktop, mostra a tabela e NÃO a lista de cards (detector de duplicata via getByText sem escopo)', () => {
    setup(false)
    expect(screen.getByText('R$ 0,10')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
