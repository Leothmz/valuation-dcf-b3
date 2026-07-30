import { test, expect } from '@playwright/test'
import { MOCK_QUOTE_PETR4 } from './mocks'

// Reportado testando em produção: mudar qualquer premissa era "sacrificante"
// porque o campo só aceitava um caractere por vez. Os inputs eram
// não-controlados com key derivada do valor: cada tecla gravava no store, o
// valor voltava, a key mudava e o React remontava o input com o texto
// reformatado e o cursor no fim. Digitar "12,13" produzia "1,00" e depois
// "12,00". Os testes unitários cobrem o mecanismo; este cobre o ciclo inteiro
// (input -> store -> engine -> re-render) num navegador de verdade.
test('DCF: digitar nos campos de premissa não é engolido', async ({ page }) => {
  await page.route((url) => url.pathname.startsWith('/api/'), (r) => r.fulfill({ json: [], status: 200 }))
  await page.route((url) => url.pathname === '/api/quote/PETR4', (r) =>
    r.fulfill({ json: MOCK_QUOTE_PETR4, status: 200 }))
  await page.addInitScript(() => localStorage.setItem('onboarding_done', '1'))

  await page.goto('/dcf')
  await page.locator('input[placeholder*="WEGE3"]').fill('PETR4')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()

  // ROE é o 3º campo do painel de premissas.
  const roe = page.locator('input[inputmode="decimal"]').nth(2)
  await roe.waitFor()
  const antes = await roe.inputValue()
  expect(antes).not.toBe('')

  await roe.selectText()
  await page.keyboard.type('12,13', { delay: 60 })
  const depois = await roe.inputValue()
  expect(depois).toBe('12,13')

  // Número longo no campo de nº de ações (5º).
  const shares = page.locator('input[inputmode="decimal"]').nth(4)
  await shares.selectText()
  await page.keyboard.type('1234567890', { delay: 40 })
  const sharesDepois = await shares.inputValue()
  expect(sharesDepois).toBe('1234567890')
})
