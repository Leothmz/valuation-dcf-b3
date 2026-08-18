import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Briefcase } from 'lucide-react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    render(
      <EmptyState
        icon={Briefcase}
        title="Nenhum ativo na carteira"
        description="Registre sua primeira operação para acompanhar posições e proventos."
      />
    )
    expect(screen.getByText('Nenhum ativo na carteira')).toBeInTheDocument()
    expect(screen.getByText(/Registre sua primeira operação/)).toBeInTheDocument()
  })

  it('dispara a ação do CTA', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={Briefcase}
        title="Nenhum ativo"
        description="…"
        action={{ label: 'Registrar operação', onClick }}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Registrar operação' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('não renderiza botão quando não há ação', () => {
    render(<EmptyState icon={Briefcase} title="Vazio" description="…" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('o CTA respeita o alvo mínimo de toque de 44px', () => {
    render(
      <EmptyState
        icon={Briefcase}
        title="Vazio"
        description="…"
        action={{ label: 'Começar', onClick: vi.fn() }}
      />
    )
    expect(screen.getByRole('button', { name: 'Começar' }).className).toMatch(/min-h-\[44px\]/)
  })
})
