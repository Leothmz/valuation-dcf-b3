import { render } from '@testing-library/react'
import { LightCurrent } from './LightCurrent'

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

describe('LightCurrent', () => {
  it('é decorativo e não intercepta cliques', () => {
    mockReducedMotion(false)
    const { container } = render(<LightCurrent />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root.className).toContain('pointer-events-none')
  })

  it('a máscara é a curva de desconto: cheia à esquerda, zerada à direita', () => {
    mockReducedMotion(false)
    const { container } = render(<LightCurrent />)
    // jsdom normaliza as cores (rgba(0,0,0,1.000) vira rgb(0, 0, 0)), então a
    // asserção olha o formato normalizado em vez do texto que escrevemos.
    const mask = (container.firstElementChild as HTMLElement).style.maskImage
    expect(mask).toMatch(/^linear-gradient\(to right, rgb\(0, ?0, ?0\) 0%/)
    expect(mask).toMatch(/rgba\(0, ?0, ?0, ?0\) 100%\)$/)
  })

  it('os feixes viajam com durações diferentes — não andam em bloco', () => {
    mockReducedMotion(false)
    const { container } = render(<LightCurrent />)
    const beams = [...container.querySelectorAll<HTMLElement>('[data-beam]')]
    expect(beams.length).toBeGreaterThan(1)
    expect(beams.every((b) => b.className.includes('light-travel'))).toBe(true)
    const duracoes = new Set(beams.map((b) => b.style.animationDuration))
    expect(duracoes.size).toBeGreaterThan(1)
  })

  it('com movimento reduzido os feixes param e se espalham pelo eixo', () => {
    mockReducedMotion(true)
    const { container } = render(<LightCurrent />)
    const beams = [...container.querySelectorAll<HTMLElement>('[data-beam]')]
    expect(beams.every((b) => !b.className.includes('light-travel'))).toBe(true)
    const posicoes = new Set(beams.map((b) => b.style.left))
    expect(posicoes.size).toBe(beams.length)
  })

  it('a intensidade ambiente é mais fraca que a da Home', () => {
    mockReducedMotion(false)
    const hero = render(<LightCurrent intensity="hero" />)
    const heroBg = hero.container.querySelector<HTMLElement>('[data-beam]')!.style.background
    hero.unmount()
    const ambient = render(<LightCurrent intensity="ambient" />)
    const ambientBg = ambient.container.querySelector<HTMLElement>('[data-beam]')!.style.background
    const alpha = (s: string) => Number(s.match(/rgba\(6, ?182, ?212, ?([\d.]+)\)/)![1])
    expect(alpha(ambientBg)).toBeLessThan(alpha(heroBg))
  })
})
