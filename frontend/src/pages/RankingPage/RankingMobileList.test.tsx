import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RankingMobileList } from './RankingMobileList'

// Campos usam os mesmos nomes de RankedRow (frontend/src/pages/RankingPage/index.tsx):
// `fairPrice` (preço teto do método ativo) e `joelVal` (earnings yield do método Joel) —
// não `_fairPrice`/`_earningsYield`, que não existem no shape real passado por index.tsx.
const ROWS = [
  { ticker: 'PETR4', price: 38.42, fairPrice: 52.10, pl: 4.1, dy: 0.142, roe: 0.31, isCustom: false },
  { ticker: 'ITUB4', price: 34.15, fairPrice: 32.75, pl: 8.2, dy: 0.064, roe: 0.17, isCustom: false },
]

function setup(props = {}) {
  render(
    <MemoryRouter>
      <RankingMobileList
        rows={ROWS as never}
        method="bazin"
        favorites={[]}
        onToggleFavorite={() => {}}
        onRemoveCustom={() => {}}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('RankingMobileList', () => {
  it('mostra uma linha por ticker com posição e cotação', () => {
    setup()
    expect(screen.getByText('PETR4')).toBeInTheDocument()
    expect(screen.getByText('ITUB4')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('mostra upside positivo com sinal "+"', () => {
    setup()
    // (52.10 - 38.42) / 52.10 = 0.262572... -> +26,26%
    expect(screen.getByText('+26,26%')).toBeInTheDocument()
  })

  it('mostra upside negativo com sinal "-"', () => {
    setup()
    // (32.75 - 34.15) / 32.75 = -0.042748... -> -4,27%
    expect(screen.getByText('-4,27%')).toBeInTheDocument()
  })

  it('no método Joel, a métrica-herói é o Earnings Yield (joelVal), não o upside', () => {
    render(
      <MemoryRouter>
        <RankingMobileList
          rows={[{ ticker: 'PETR4', price: 38.42, fairPrice: 52.10, joelVal: 0.139, isCustom: false }] as never}
          method="joel"
          favorites={[]}
          onToggleFavorite={() => {}}
          onRemoveCustom={() => {}}
        />
      </MemoryRouter>
    )
    // Earnings Yield não leva sinal (é sempre positivo por construção — só calculado quando pl > 0),
    // ao contrário do upside dos demais métodos, que usa fPctSigned.
    expect(screen.getByText('13,90%')).toBeInTheDocument()
    expect(screen.queryByText('+26,26%')).not.toBeInTheDocument()
  })

  it('revela o detalhe ao expandir a linha', () => {
    setup()
    expect(screen.queryByText('Preço Teto')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'PETR4' }))
    expect(screen.getByText('Preço Teto')).toBeInTheDocument()
    expect(screen.getByText('P/L')).toBeInTheDocument()
    expect(screen.getByText('DY')).toBeInTheDocument()
    expect(screen.getByText('ROE')).toBeInTheDocument()
  })

  it('marca ticker custom com badge removível', () => {
    const onRemoveCustom = vi.fn()
    render(
      <MemoryRouter>
        <RankingMobileList
          rows={[{ ...ROWS[0], isCustom: true }] as never}
          method="bazin"
          favorites={[]}
          onToggleFavorite={() => {}}
          onRemoveCustom={onRemoveCustom}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remover PETR4' }))
    expect(onRemoveCustom).toHaveBeenCalledWith('PETR4')
  })

  it('não expande a linha ao clicar (ou apertar Enter) no botão Remover aninhado no summary', () => {
    const onRemoveCustom = vi.fn()
    render(
      <MemoryRouter>
        <RankingMobileList
          rows={[{ ...ROWS[0], isCustom: true }] as never}
          method="bazin"
          favorites={[]}
          onToggleFavorite={() => {}}
          onRemoveCustom={onRemoveCustom}
        />
      </MemoryRouter>
    )
    fireEvent.keyDown(screen.getByRole('button', { name: 'Remover PETR4' }), { key: 'Enter' })
    // Sem stopPropagation no onKeyDown, o Enter borbulharia até a linha e a expandiria.
    expect(screen.queryByText('Preço Teto')).not.toBeInTheDocument()
  })

  it('em modo comparar, mostra círculo de seleção e chama onToggleCompare', () => {
    const onToggleCompare = vi.fn()
    setup({ compareMode: true, compareSelection: [], onToggleCompare, maxCompare: 3 })
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar PETR4 para comparar' }))
    expect(onToggleCompare).toHaveBeenCalledWith('PETR4')
  })

  it('em modo comparar, desabilita seleção de novos tickers ao atingir maxCompare', () => {
    const onToggleCompare = vi.fn()
    setup({
      compareMode: true,
      compareSelection: ['ITUB4', 'VALE3'],
      onToggleCompare,
      maxCompare: 2,
    })
    const btn = screen.getByRole('button', { name: 'Selecionar PETR4 para comparar' })
    expect(btn).toBeDisabled()
  })

  it('sem compareMode, não mostra círculo de seleção', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Selecionar PETR4 para comparar' })).not.toBeInTheDocument()
  })
})
