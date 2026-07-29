import { render, screen, fireEvent } from '@testing-library/react'
import { CarteiraPage } from './index'

// Mocka as chamadas de dados (mesmo padrão de RankingPage/index.test.tsx) — o resto
// (usePortfolioStore, useWatchlistStore, useTabArrowNav) usa a implementação real.
vi.mock('../../api/stocks', () => ({
  useBatchQuotes: () => ({ data: [], isLoading: false }),
  usePortfolioHistory: () => ({ data: undefined, isLoading: false }),
  useBatchDividendHistory: () => ({ data: {}, isLoading: false }),
  useDpaMap: () => ({ data: {}, isLoading: false }),
}))
vi.mock('../../api/crypto', () => ({
  useBatchCryptoQuotes: () => ({ data: [], isLoading: false }),
  useCryptoList: () => ({ data: [] }),
}))

// CarteiraOperacoes/CarteiraProventos/CarteiraRF são mockados como sondas que só
// exibem o modalOpen recebido — o que importa aqui é a fiação (CarteiraPage eleva o
// estado do modal e o FAB consegue acioná-lo), não o comportamento interno de cada
// formulário (já coberto pelos testes próprios de cada componente).
vi.mock('./CarteiraOperacoes', () => ({
  CarteiraOperacoes: ({ modalOpen }: { modalOpen?: boolean }) => (
    <div data-testid="operacoes-probe">modalOpen={String(modalOpen)}</div>
  ),
}))
vi.mock('./CarteiraProventos', () => ({
  CarteiraProventos: ({ modalOpen }: { modalOpen?: boolean }) => (
    <div data-testid="proventos-probe">modalOpen={String(modalOpen)}</div>
  ),
}))
vi.mock('./CarteiraRF', () => ({
  CarteiraRF: ({ modalOpen }: { modalOpen?: boolean }) => (
    <div data-testid="rf-probe">modalOpen={String(modalOpen)}</div>
  ),
}))

describe('CarteiraPage — FAB aciona o modal certo por aba (estado elevado, Task 21)', () => {
  it('na aba Operações, o FAB abre o modal de operações', () => {
    render(<CarteiraPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Operações' }))
    expect(screen.getByTestId('operacoes-probe')).toHaveTextContent('modalOpen=false')

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar operação' }))
    expect(screen.getByTestId('operacoes-probe')).toHaveTextContent('modalOpen=true')
  })

  it('na aba Proventos, o FAB abre o modal de proventos', () => {
    render(<CarteiraPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Proventos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar provento' }))
    expect(screen.getByTestId('proventos-probe')).toHaveTextContent('modalOpen=true')
  })

  it('na aba Renda Fixa, o FAB abre o modal de renda fixa', () => {
    render(<CarteiraPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Renda Fixa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar título' }))
    expect(screen.getByTestId('rf-probe')).toHaveTextContent('modalOpen=true')
  })

  it('na aba Ativos, o FAB troca para a aba Operações e já abre o modal', () => {
    render(<CarteiraPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Ativos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar operação' }))

    expect(screen.getByRole('tab', { name: 'Operações' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('operacoes-probe')).toHaveTextContent('modalOpen=true')
  })

  it('na aba Visão Geral (sem ação de adicionar), o FAB não é renderizado', () => {
    render(<CarteiraPage />)
    expect(screen.queryByRole('button', { name: /Adicionar/ })).not.toBeInTheDocument()
  })
})
