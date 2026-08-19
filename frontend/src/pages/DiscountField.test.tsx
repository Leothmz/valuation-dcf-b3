import { render, screen } from '@testing-library/react'
import { DiscountField } from './DiscountField'

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduce : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('DiscountField', () => {
  it('é decorativo para a acessibilidade — não entra na leitura da página', () => {
    mockReducedMotion(false)
    const { container } = render(<DiscountField />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('não intercepta cliques do conteúdo', () => {
    mockReducedMotion(false)
    const { container } = render(<DiscountField />)
    expect(container.firstElementChild?.className).toContain('pointer-events-none')
  })

  it('desenha duas camadas: a taxa respira entre elas', () => {
    mockReducedMotion(false)
    const { container } = render(<DiscountField />)
    expect(container.querySelectorAll('g[data-layer]')).toHaveLength(2)
  })

  it('com movimento reduzido, congela numa camada só', () => {
    mockReducedMotion(true)
    const { container } = render(<DiscountField />)
    expect(container.querySelectorAll('g[data-layer]')).toHaveLength(1)
  })

  it('o brilho cai da esquerda para a direita — é uma linha do tempo descontada', () => {
    mockReducedMotion(true)
    const { container } = render(<DiscountField />)
    const circles = [...container.querySelectorAll('circle')]
    const primeiro = Number(circles[0].getAttribute('opacity'))
    const ultimo = Number(circles[circles.length - 1].getAttribute('opacity'))
    expect(primeiro).toBeGreaterThan(ultimo)
  })
})
