import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DCFInputPanel } from './DCFInputPanel'
import type { NullableDCFAssumptions } from '../../stores/dcfStore'

const BASE: NullableDCFAssumptions = {
  ll: 16_781_938_000, payout: 0.2001, roe: 0.1068, g: 0.0854,
  disc: 0.18, perp: 0.03, shares: 5_730_834_040, price: 21.16,
}

/**
 * O bug só aparece com o ciclo completo: o painel escreve no store, o store
 * volta como prop e o input é re-renderizado. Um render estático com props
 * fixas não reproduz nada — por isso o harness guarda o estado de verdade.
 */
function Harness({ inicial = BASE }: { inicial?: NullableDCFAssumptions }) {
  const [assumptions, setAssumptions] = useState(inicial)
  return (
    <DCFInputPanel
      assumptions={assumptions}
      overrides={[]}
      apiVals={{}}
      llHint=""
      onAssumptionChange={(field, value) =>
        setAssumptions((a) => ({ ...a, [field]: value }))
      }
      onRestore={() => {}}
    />
  )
}

// O campo não tem <label> associado; é identificado pelo valor formatado.
const campo = (valorFormatado: string) => screen.getByDisplayValue(valorFormatado)

describe('DCFInputPanel — digitação não é engolida', () => {
  // Reportado testando em produção: ao selecionar o ROE "10,68" e digitar
  // "12,13", o campo virava "1,00" na primeira tecla e "12,00" na segunda. O
  // input era não-controlado com key={field}-{value}: cada tecla gravava no
  // store, o value mudava, a key mudava e o React remontava o input com o
  // texto reformatado e o cursor no fim.
  it('digitar 12,13 no ROE deixa 12,13 no campo, não 1,00', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const roe = campo('10,68')
    await user.clear(roe)
    await user.type(roe, '12,13')

    expect(roe).toHaveValue('12,13')
  })

  it('cada tecla é preservada ao longo da digitação, não só o resultado final', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const roe = campo('10,68')
    await user.clear(roe)
    // Se o input remontar, o "1" vira "1,00" e o "2" seguinte cai no lugar errado.
    await user.type(roe, '1')
    expect(roe).toHaveValue('1')
    await user.type(roe, '2')
    expect(roe).toHaveValue('12')
  })

  it('número longo (nº de ações) sobrevive à digitação inteira', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const shares = campo('5.730.834.040')
    await user.clear(shares)
    await user.type(shares, '1234567890')

    expect(shares).toHaveValue('1234567890')
  })

  it('o cursor não é jogado para o fim no meio da edição', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const payout = campo('20,01') as HTMLInputElement
    await user.clear(payout)
    await user.type(payout, '2001')
    // Insere um dígito no início. initialSelectionStart é o jeito do userEvent
    // de posicionar o cursor — setSelectionRange sozinho é ignorado pelo type.
    await user.type(payout, '9', { initialSelectionStart: 0, initialSelectionEnd: 0 })

    expect(payout).toHaveValue('92001')
  })

  it('taxa de desconto e perpetuidade também aceitam digitação (usavam markup próprio)', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const disc = campo('18,00')
    await user.clear(disc)
    await user.type(disc, '13,75')
    expect(disc).toHaveValue('13,75')

    const perp = campo('3,00')
    await user.clear(perp)
    await user.type(perp, '2,5')
    expect(perp).toHaveValue('2,5')
  })
})

describe('DCFInputPanel — o valor formatado volta a mandar no blur', () => {
  it('reformata ao sair do campo', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const roe = campo('10,68')
    await user.clear(roe)
    await user.type(roe, '12,1')
    fireEvent.blur(roe)

    expect(roe).toHaveValue('12,10')
  })

  it('recálculo ao vivo continua: g deriva de payout e ROE a cada tecla', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const roe = campo('10,68')
    await user.clear(roe)
    await user.type(roe, '20')

    // g = (1 − payout) × ROE = (1 − 0,2001) × 0,20 = 0,15998 -> 16,00%
    expect(campo('16,00')).toBeInTheDocument()
  })

  it('valor vindo de fora (novo ticker) aparece quando o campo não está em edição', () => {
    const { rerender } = render(
      <DCFInputPanel
        assumptions={BASE} overrides={[]} apiVals={{}} llHint=""
        onAssumptionChange={() => {}} onRestore={() => {}}
      />
    )
    expect(campo('10,68')).toBeInTheDocument()

    rerender(
      <DCFInputPanel
        assumptions={{ ...BASE, roe: 0.3142 }} overrides={[]} apiVals={{}} llHint=""
        onAssumptionChange={() => {}} onRestore={() => {}}
      />
    )
    expect(campo('31,42')).toBeInTheDocument()
  })
})
