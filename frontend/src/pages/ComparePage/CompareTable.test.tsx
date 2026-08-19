import { render, screen, within } from '@testing-library/react'
import { CompareTable } from './CompareTable'
import type { CompareRow } from './CompareTable'

const rows: CompareRow[] = [
  {
    label: 'DY',
    cells: [
      { value: '6,99%', highlight: 'worst' },
      { value: '7,85%', highlight: null },
      { value: '9,04%', highlight: 'best' },
    ],
  },
  {
    label: 'P/L',
    cells: [
      { value: '4,1', highlight: 'best' },
      { value: '27,4', highlight: 'worst' },
      { value: '9,1', highlight: null },
    ],
  },
]

function renderTable() {
  return render(
    <CompareTable tickers={['PETR4', 'VALE3', 'ITUB4']} rows={rows} isLoading={false} />
  )
}

describe('CompareTable — realce', () => {
  it('marca a melhor célula de cada linha de forma acessível', () => {
    renderTable()
    expect(screen.getAllByLabelText('Melhor valor da linha')).toHaveLength(2)
  })

  it('não marca a pior célula — o destaque é só do vencedor', () => {
    renderTable()
    expect(screen.queryByLabelText('Pior valor da linha')).not.toBeInTheDocument()
  })

  it('mostra a legenda explicando o que a marca significa', () => {
    renderTable()
    expect(screen.getByText(/melhor valor de cada linha/i)).toBeInTheDocument()
  })

  it('não pinta as células de verde ou vermelho — essas cores significam direção no resto do app', () => {
    const { container } = renderTable()
    const tinted = Array.from(container.querySelectorAll('td')).filter((td) => {
      const bg = td.getAttribute('style') ?? ''
      return bg.includes('green-dim') || bg.includes('red-dim')
    })
    expect(tinted).toHaveLength(0)
  })

  it('mantém todos os valores legíveis na cor base', () => {
    renderTable()
    // O rótulo é renderizado duas vezes (versão curta e longa, alternadas por CSS),
    // então getAllByText — o alvo aqui são os valores, não o rótulo.
    const linhaDY = screen.getAllByText('DY')[0].closest('tr')!
    expect(within(linhaDY).getByText('6,99%')).toBeInTheDocument()
    expect(within(linhaDY).getByText('9,04%')).toBeInTheDocument()
  })
})

describe('CompareTable — o realce não imita linha de grade', () => {
  it('a célula vencedora não usa borda lateral', () => {
    const { container } = render(
      <CompareTable tickers={['PETR4', 'VALE3', 'ITUB4']} rows={rows} isLoading={false} />
    )
    const comBorda = Array.from(container.querySelectorAll('td')).filter((td) =>
      (td.getAttribute('style') ?? '').includes('border-left')
    )
    expect(comBorda).toHaveLength(0)
  })

  it('o realce envolve o próprio valor, não a célula inteira', () => {
    render(<CompareTable tickers={['PETR4', 'VALE3', 'ITUB4']} rows={rows} isLoading={false} />)
    const selo = screen.getAllByLabelText('Melhor valor da linha')[0]
    expect(selo.tagName).toBe('SPAN')
    expect(selo).toHaveTextContent('9,04%')
  })
})
