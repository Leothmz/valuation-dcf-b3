import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FIIMobileList } from './FIIMobileList'

const ROWS = [
  {
    ticker: 'MXRF11', price: 10.32, dy: 0.138, pvp: 0.98,
    segmento: 'Papel / CRI', ffoYield: 0.121, vacancia: 0.032, liquidez: 4200000,
    _rankDY: 2, _rankPVP: 5, _scoreThomazFII: 7,
  },
]

function setup() {
  render(
    <MemoryRouter>
      <FIIMobileList rows={ROWS as never} favorites={[]} onToggleFavorite={() => {}} />
    </MemoryRouter>
  )
}

describe('FIIMobileList', () => {
  it('mostra ticker, cotação e DY na linha compacta', () => {
    setup()
    expect(screen.getByText('MXRF11')).toBeInTheDocument()
    expect(screen.getByText('13,8%')).toBeInTheDocument()
  })

  it('revela segmento, P/VP, FFO Yield e vacância ao expandir', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'MXRF11' }))
    expect(screen.getByText('Papel / CRI')).toBeInTheDocument()
    expect(screen.getByText('P/VP')).toBeInTheDocument()
    expect(screen.getByText('FFO Y')).toBeInTheDocument()
    expect(screen.getByText('Vacância')).toBeInTheDocument()
  })

  it('mostra a decomposição do rank', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'MXRF11' }))
    expect(screen.getByText('DY 2 + PVP 5')).toBeInTheDocument()
  })
})
