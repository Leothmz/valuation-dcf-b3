import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'

function renderLayout(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Layout>
        <div>content</div>
      </Layout>
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('onboarding_done', '1') // skip welcome modal unless a test opts in
})

describe('Layout keyboard shortcuts', () => {
  it('does not show the shortcuts panel by default', () => {
    renderLayout()
    expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument()
  })

  it('opens the shortcuts panel on "?"', () => {
    renderLayout()
    fireEvent.keyDown(document, { key: '?' })
    expect(screen.getByText('Atalhos de Teclado')).toBeInTheDocument()
  })

  it('closes the shortcuts panel on a second "?"', () => {
    renderLayout()
    fireEvent.keyDown(document, { key: '?' })
    fireEvent.keyDown(document, { key: '?' })
    expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument()
  })

  it('ignores "?" while typing inside an input', () => {
    renderLayout()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: '?' })
    expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument()
    document.body.removeChild(input)
  })
})

describe('Layout welcome modal', () => {
  it('shows the welcome modal on first visit', () => {
    localStorage.clear()
    renderLayout()
    expect(screen.getByText('Bem-vindo!')).toBeInTheDocument()
  })

  it('does not show the welcome modal once onboarding_done is set', () => {
    renderLayout()
    expect(screen.queryByText('Bem-vindo!')).not.toBeInTheDocument()
  })

  it('dismisses and persists onboarding_done on "Pular"', () => {
    localStorage.clear()
    renderLayout()
    fireEvent.click(screen.getByText('Pular'))
    expect(screen.queryByText('Bem-vindo!')).not.toBeInTheDocument()
    expect(localStorage.getItem('onboarding_done')).toBe('1')
  })

  it('closes on Escape and persists onboarding_done', () => {
    localStorage.clear()
    renderLayout()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Bem-vindo!')).not.toBeInTheDocument()
    expect(localStorage.getItem('onboarding_done')).toBe('1')
  })
})

describe('Layout mobile drawer', () => {
  it('abre a gaveta pelo botão de menu', () => {
    renderLayout()
    expect(screen.queryByTestId('sidebar-scrim')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByTestId('sidebar-scrim')).toBeInTheDocument()
  })

  it('fecha a gaveta ao clicar no scrim', () => {
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    fireEvent.click(screen.getByTestId('sidebar-scrim'))
    expect(screen.queryByTestId('sidebar-scrim')).not.toBeInTheDocument()
  })
})

describe('Layout route title', () => {
  it('mostra o título correto para /carteira', () => {
    renderLayout(['/carteira'])
    expect(screen.getByRole('heading', { name: 'Carteira' })).toBeInTheDocument()
  })

  it('mostra o título correto para /fiis', () => {
    renderLayout(['/fiis'])
    expect(screen.getByRole('heading', { name: 'Ranking de FIIs' })).toBeInTheDocument()
  })
})
