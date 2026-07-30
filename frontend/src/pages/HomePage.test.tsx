import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './HomePage'

describe('HomePage CTAs', () => {
  it('leva às 4 rotas principais', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)

    // "Calculadora DCF" e "Ranking de Ações" também aparecem como título de card
    // na grade de Ferramentas mais abaixo — o CTA do hero é sempre o primeiro no DOM.
    expect(screen.getAllByRole('link', { name: /calculadora dcf/i })[0]).toHaveAttribute('href', '/dcf')
    expect(screen.getAllByRole('link', { name: /ranking de ações/i })[0]).toHaveAttribute('href', '/ranking')
    expect(screen.getByRole('link', { name: /ranking fiis/i })).toHaveAttribute('href', '/fiis')
    expect(screen.getByRole('link', { name: /análise individual/i })).toHaveAttribute('href', '/analise')
  })
})
