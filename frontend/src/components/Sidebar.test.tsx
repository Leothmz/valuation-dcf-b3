import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'

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

function renderSidebar(isDrawerOpen: boolean) {
  return render(
    <MemoryRouter>
      <Sidebar isDrawerOpen={isDrawerOpen} />
    </MemoryRouter>
  )
}

describe('Sidebar — aria-hidden da nav fora de tela (mobile)', () => {
  it('no mobile, com a gaveta fechada, a nav fica aria-hidden', () => {
    mockMatchMedia(true)
    renderSidebar(false)
    const nav = screen.getByRole('navigation', { hidden: true })
    expect(nav).toHaveAttribute('aria-hidden', 'true')
  })

  it('no mobile, com a gaveta aberta, a nav não fica aria-hidden', () => {
    mockMatchMedia(true)
    renderSidebar(true)
    const nav = screen.getByRole('navigation', { hidden: true })
    expect(nav).not.toHaveAttribute('aria-hidden')
  })

  it('no desktop, com a gaveta fechada, a nav nunca fica aria-hidden', () => {
    mockMatchMedia(false)
    renderSidebar(false)
    const nav = screen.getByRole('navigation', { hidden: true })
    expect(nav).not.toHaveAttribute('aria-hidden')
  })

  it('no desktop, com a gaveta aberta, a nav nunca fica aria-hidden', () => {
    mockMatchMedia(false)
    renderSidebar(true)
    const nav = screen.getByRole('navigation', { hidden: true })
    expect(nav).not.toHaveAttribute('aria-hidden')
  })
})
