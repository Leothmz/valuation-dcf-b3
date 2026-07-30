import { render, screen } from '@testing-library/react'
import { DataCard } from './DataCard'

describe('DataCard', () => {
  it('renderiza título e um par rótulo/valor por campo', () => {
    render(
      <DataCard
        title="Jul / 2026"
        fields={[
          { label: 'Ganho bruto', value: 'R$ 2.752,00' },
          { label: 'Alíquota', value: '15%' },
        ]}
      />
    )
    expect(screen.getByText('Jul / 2026')).toBeInTheDocument()
    expect(screen.getByText('Ganho bruto')).toBeInTheDocument()
    expect(screen.getByText('R$ 2.752,00')).toBeInTheDocument()
    expect(screen.getByText('Alíquota')).toBeInTheDocument()
  })

  it('renderiza o badge quando fornecido', () => {
    render(<DataCard title="Jun / 2026" badge={<span>ISENTO</span>} fields={[]} />)
    expect(screen.getByText('ISENTO')).toBeInTheDocument()
  })

  it('renderiza as ações quando fornecidas', () => {
    render(<DataCard title="X" fields={[]} actions={<button>Remover</button>} />)
    expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument()
  })

  it('não quebra com lista de campos vazia', () => {
    render(<DataCard title="Vazio" fields={[]} />)
    expect(screen.getByText('Vazio')).toBeInTheDocument()
  })

  it('emphasis muda a renderização do valor', () => {
    render(
      <DataCard
        title="Test"
        fields={[
          { label: 'Emphasized', value: 'R$ 1.000', emphasis: true },
          { label: 'Normal', value: 'R$ 500', emphasis: false },
        ]}
      />
    )

    const emphasizedValue = screen.getByText('R$ 1.000')
    const normalValue = screen.getByText('R$ 500')

    // Extract the parent span that contains the classes
    const emphasizedSpan = emphasizedValue.closest('span')
    const normalSpan = normalValue.closest('span')

    // Verify both exist and are different
    expect(emphasizedSpan).toBeInTheDocument()
    expect(normalSpan).toBeInTheDocument()

    // The emphasized span should have 'font-bold text-[16px]'
    // The normal span should have 'text-[13px]'
    expect(emphasizedSpan?.className).toContain('text-[16px]')
    expect(emphasizedSpan?.className).toContain('font-bold')

    expect(normalSpan?.className).toContain('text-[13px]')
    expect(normalSpan?.className).not.toContain('text-[16px]')
    expect(normalSpan?.className).not.toContain('font-bold')
  })
})
