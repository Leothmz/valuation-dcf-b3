import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MethodExplainer } from './MethodExplainer'

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

describe('MethodExplainer', () => {
  beforeEach(() => mockMatchMedia(false))

  it('começa fechado — a explicação não ocupa a tela de quem já sabe', () => {
    render(<MethodExplainer method="bazin" />)
    expect(screen.queryByText(/Dividendo como âncora/)).not.toBeInTheDocument()
  })

  it('abre com os quatro campos do método ativo', async () => {
    render(<MethodExplainer method="bazin" />)
    await userEvent.click(screen.getByRole('button', { name: /sobre o método/i }))
    expect(screen.getByText('Rank Bazin')).toBeInTheDocument()
    expect(screen.getByText(/Dividendo como âncora/)).toBeInTheDocument()
    expect(screen.getByText(/DPA ÷ 6%/)).toBeInTheDocument()
    expect(screen.getByText(/dividendo extraordinário/)).toBeInTheDocument()
  })

  it('explica o método ativo, não um fixo', async () => {
    const { rerender } = render(<MethodExplainer method="bazin" />)
    await userEvent.click(screen.getByRole('button', { name: /sobre o método/i }))
    expect(screen.getByText('Rank Bazin')).toBeInTheDocument()

    rerender(<MethodExplainer method="joel" />)
    expect(screen.getByText('Rank Joel · Magic Formula')).toBeInTheDocument()
    expect(screen.getByText(/não calcula preço teto/i)).toBeInTheDocument()
  })

  it('fecha no Esc', async () => {
    render(<MethodExplainer method="graham" />)
    await userEvent.click(screen.getByRole('button', { name: /sobre o método/i }))
    expect(screen.getByText('Rank Graham')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText('Rank Graham')).not.toBeInTheDocument()
  })

  it('o gatilho respeita o alvo mínimo de toque', () => {
    render(<MethodExplainer method="lynch" />)
    expect(screen.getByRole('button', { name: /sobre o método/i }).className).toMatch(/min-h-\[44px\]/)
  })

  it('anuncia o estado para leitor de tela', async () => {
    render(<MethodExplainer method="lynch" />)
    const trigger = screen.getByRole('button', { name: /sobre o método/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
