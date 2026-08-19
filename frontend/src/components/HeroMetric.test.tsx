import { render, screen } from '@testing-library/react'
import { HeroMetric } from './HeroMetric'

describe('HeroMetric', () => {
  it('renderiza eyebrow e valor', () => {
    render(<HeroMetric eyebrow="Patrimônio Total" value="R$ 128.430,55" />)
    expect(screen.getByText('Patrimônio Total')).toBeInTheDocument()
    expect(screen.getByText('R$ 128.430,55')).toBeInTheDocument()
  })

  it('mostra o delta positivo em verde', () => {
    render(
      <HeroMetric eyebrow="Patrimônio Total" value="R$ 100,00" delta={{ text: '+12,40%', positive: true }} />
    )
    const pill = screen.getByText('+12,40%')
    expect(pill).toHaveStyle({ color: 'var(--color-green)' })
  })

  it('mostra o delta negativo em vermelho', () => {
    render(
      <HeroMetric eyebrow="Patrimônio Total" value="R$ 100,00" delta={{ text: '-3,10%', positive: false }} />
    )
    expect(screen.getByText('-3,10%')).toHaveStyle({ color: 'var(--color-red)' })
  })

  it('renderiza a nota ao lado do delta quando fornecida', () => {
    render(
      <HeroMetric
        eyebrow="DY 12 meses"
        value="9,84%"
        delta={{ text: '+0,40%', positive: true }}
        note="vs. mês anterior"
      />
    )
    expect(screen.getByText('vs. mês anterior')).toBeInTheDocument()
  })

  it('funciona sem delta e sem nota', () => {
    render(<HeroMetric eyebrow="Posições" value="12" />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('usa mono no valor — é número auditável, não texto de interface', () => {
    render(<HeroMetric eyebrow="Patrimônio" value="R$ 1,00" />)
    expect(screen.getByText('R$ 1,00').className).toMatch(/font-mono/)
  })
})
