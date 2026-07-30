import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DCFTable } from './DCFTable'
import type { DCFResult, DCFHistoryEntry } from '../../engines/dcf-engine'
import type { NullableDCFAssumptions } from '../../stores/dcfStore'

const HISTORY: DCFHistoryEntry[] = [
  { year: 2025, value: 45_849_000_000 },
  { year: 2024, value: 42_128_000_000 },
  { year: 2023, value: 33_877_000_000 },
]

const ASSUMPTIONS: NullableDCFAssumptions = {
  ll: 45_849_000_000, payout: 0.4, roe: 0.2, g: 0.1547,
  disc: 0.15, perp: 0.03, shares: 9_800_000_000, price: 34.15,
}

const FLOWS = [
  { year: 2026, cf: 52_941_905_486, g: 0.1547 },
  { year: 2027, cf: 61_132_093_535, g: 0.1547 },
]

const RESULT: DCFResult = {
  flows: FLOWS,
  pvFlows: [
    { ...FLOWS[0], pv: 46_036_439_553 },
    { ...FLOWS[1], pv: 46_222_129_100 },
  ],
  tv: 807_856_733_599,
  pvTV: 401_654_000_000,
  sumPV: 92_258_568_653,
  ev: 493_912_568_653,
  fairPrice: 50.4,
  upside: 0.32,
  baseYear: 2025,
}

function renderTable() {
  return render(
    <DCFTable
      results={RESULT}
      history={HISTORY}
      assumptions={ASSUMPTIONS}
      yearOverrides={{}}
      projYears={5}
      onSetProjYears={() => {}}
      onYearLLChange={() => {}}
      onYearGrowthChange={() => {}}
    />
  )
}

describe('DCFTable — largura no mobile', () => {
  // jsdom não faz layout, então não dá para medir que a tabela é mais larga que
  // a tela. O que dá para travar é o mecanismo: o wrapper precisa poder rolar.
  // Antes era só `overflow-hidden` e a última coluna ("VPL") ficava cortada e
  // inalcançável — sem scroll e sem indicação de que havia mais conteúdo.
  // Pior: o documento não rolava, então a varredura de overflow das 10 rotas
  // passava enquanto os dados sumiam. Medido em navegador: 674px de conteúdo
  // em 356px visíveis.
  it('o wrapper da tabela rola na horizontal no mobile', () => {
    const { container } = renderTable()
    const wrapper = container.querySelector('table')?.parentElement
    expect(wrapper?.className).toContain('overflow-x-auto')
  })

  it('no desktop segue clipado, para respeitar o canto arredondado', () => {
    const { container } = renderTable()
    const wrapper = container.querySelector('table')?.parentElement
    expect(wrapper?.className).toContain('md:overflow-hidden')
    expect(wrapper?.className).toContain('rounded-[14px]')
  })
})

describe('DCFTable — digitação nas células editáveis', () => {
  // Mesmo bug do painel de premissas: a célula era não-controlada com
  // key={value}, então o React remontava o input a cada atualização e o texto
  // digitado era substituído pelo formatado. Aqui havia um debounce de 400ms
  // que só adiava o estrago para a primeira pausa — pior nos números longos,
  // que são exatamente os desta tabela (lucro líquido em bilhões).
  it('um número longo digitado inteiro permanece no campo', async () => {
    const user = userEvent.setup()
    const { container } = renderTable()
    const input = container.querySelector('table input') as HTMLInputElement

    await user.clear(input)
    await user.type(input, '52941905486')

    expect(input).toHaveValue('52941905486')
  })

  it('digitação parcial não é reformatada no meio do caminho', async () => {
    const user = userEvent.setup()
    const { container } = renderTable()
    const input = container.querySelector('table input') as HTMLInputElement

    await user.clear(input)
    await user.type(input, '5')
    expect(input).toHaveValue('5')
    await user.type(input, '2')
    expect(input).toHaveValue('52')
  })
})

describe('DCFTable — tamanho de fonte uniforme', () => {
  // Reportado no teste em iPhone: as linhas históricas saíam bem menores que as
  // projetadas. As projetadas são inputs e precisam de 16px para o iOS não dar
  // zoom ao focar; as históricas estavam em 11px. Dois tamanhos na mesma tabela.
  it('as células históricas usam o mesmo 16px dos inputs de projeção no mobile', () => {
    renderTable()
    const celulaAno = screen.getByText('2023')
    expect(celulaAno.className).toContain('text-[16px]')
    expect(celulaAno.className).toContain('md:text-[13px]')
  })

  it('os inputs de projeção continuam em 16px (senão o iOS dá zoom ao focar)', () => {
    const { container } = renderTable()
    const input = container.querySelector('table input')
    expect(input?.className).toContain('text-[16px]')
  })
})
