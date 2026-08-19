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

describe('RankingMobileList — pódio', () => {
  // O mobile usava uma pílula ciano igual para toda posição, então 1º/2º/3º ficavam
  // indistinguíveis. Agora usa o mesmo PositionBadge do desktop.
  const PODIO = [
    { ticker: 'VULC3', price: 14.15, fairPrice: 20, pl: 5, dy: 0.1, roe: 0.2 },
    { ticker: 'BBSE3', price: 41.27, fairPrice: 50, pl: 6, dy: 0.09, roe: 0.3 },
    { ticker: 'MDNE3', price: 24.23, fairPrice: 30, pl: 7, dy: 0.08, roe: 0.25 },
    { ticker: 'CURY3', price: 29.85, fairPrice: 35, pl: 8, dy: 0.07, roe: 0.22 },
  ]

  it('destaca o 1º com selo TOP e dá cor própria a 1º, 2º e 3º', () => {
    setup({ rows: PODIO as never })
    expect(screen.getByText('TOP')).toBeInTheDocument()
    const cor = (t: string) => screen.getByText(t).style.background
    expect(cor('1')).toContain('16, 185, 129')  // verde
    expect(cor('2')).toContain('6, 182, 212')   // ciano
    expect(cor('3')).toContain('245, 158, 11')  // âmbar
    expect(cor('4')).toBe('')                   // fora do pódio, sem fundo
  })
})

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
    expect(screen.queryByText(/preço teto · faixa dos métodos/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'PETR4' }))
    expect(screen.getByText(/preço teto · faixa dos métodos/i)).toBeInTheDocument()
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
    expect(screen.queryByText(/preço teto · faixa dos métodos/i)).not.toBeInTheDocument()
  })

  it('em modo comparar, mostra círculo de seleção e chama onToggleCompare', () => {
    const onToggleCompare = vi.fn()
    setup({ compareMode: true, compareSelection: [], onToggleCompare, maxCompare: 3 })
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar PETR4 para comparar' }))
    expect(onToggleCompare).toHaveBeenCalledWith('PETR4')
  })

  it('a seleção não tem teto: ela alimenta comparar, salvar tetos e exportar', () => {
    // O limite de 3 é da tela de comparação e passou a viver no botão Comparar
    // da barra flutuante — travar a seleção impedia exportar 20 linhas por causa
    // de uma restrição que nem se aplica a exportar.
    const onToggleCompare = vi.fn()
    setup({
      compareMode: true,
      compareSelection: ['ITUB4', 'VALE3', 'BBAS3'],
      onToggleCompare,
    })
    const btn = screen.getByRole('button', { name: 'Selecionar PETR4 para comparar' })
    expect(btn).toBeEnabled()
    fireEvent.click(btn)
    expect(onToggleCompare).toHaveBeenCalledWith('PETR4')
  })

  it('sem compareMode, não mostra círculo de seleção', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Selecionar PETR4 para comparar' })).not.toBeInTheDocument()
  })
})
