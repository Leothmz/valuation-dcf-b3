import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout>
        <div>content</div>
      </Layout>
    </MemoryRouter>
  )
}

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
