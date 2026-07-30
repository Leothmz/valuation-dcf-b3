import { render } from '@testing-library/react'
import { CarteiraVisaoGeral } from './CarteiraVisaoGeral'
import { CarteiraProventos } from './CarteiraProventos'

// Achado central da Task 19: três grids usavam style={{ gridTemplateColumns: ... }} inline,
// que nenhuma classe md: consegue sobrescrever. Este teste prova que os três viraram classes
// Tailwind responsivas — falha se algum `style` inline voltar (ver task-19-report.md).
describe('Carteira — grids responsivos (sem style inline)', () => {
  it('CarteiraVisaoGeral: grid Alocação/Destaques é 1 coluna no mobile, 2 no desktop', () => {
    const { container } = render(
      <CarteiraVisaoGeral holdings={[]} quotes={[]} rfValue={0} loading={false} />
    )
    const outerGrid = container.querySelector('.grid.gap-4') as HTMLElement | null
    expect(outerGrid).not.toBeNull()
    expect(outerGrid!.style.gridTemplateColumns).toBe('')
    expect(outerGrid!.className).toContain('grid-cols-1')
    expect(outerGrid!.className).toContain('md:grid-cols-2')
  })

  it('CarteiraVisaoGeral: grid de Melhores/Piores é 1 coluna no mobile, 2 no desktop', () => {
    const { container } = render(
      <CarteiraVisaoGeral holdings={[]} quotes={[]} rfValue={0} loading={false} />
    )
    const highlightsGrid = container.querySelector('.grid.gap-6') as HTMLElement | null
    expect(highlightsGrid).not.toBeNull()
    expect(highlightsGrid!.style.gridTemplateColumns).toBe('')
    expect(highlightsGrid!.className).toContain('grid-cols-1')
    expect(highlightsGrid!.className).toContain('md:grid-cols-2')
  })

  it('CarteiraProventos: cards de resumo são 2 colunas no mobile, 4 no desktop', () => {
    const { container } = render(
      <CarteiraProventos
        proventos={[]}
        onAdd={() => {}}
        onDelete={() => {}}
        onImport={() => {}}
        holdings={[]}
        operations={[]}
        dividendHistoryByTicker={{}}
        dpaMap={{}}
        dividendDataLoading={false}
      />
    )
    const summaryGrid = container.querySelector('.grid.mb-5') as HTMLElement | null
    expect(summaryGrid).not.toBeNull()
    expect(summaryGrid!.style.gridTemplateColumns).toBe('')
    expect(summaryGrid!.className).toContain('grid-cols-2')
    expect(summaryGrid!.className).toContain('md:grid-cols-4')
  })
})
