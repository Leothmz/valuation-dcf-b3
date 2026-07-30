import { test, expect } from '@playwright/test'

// ScrollableTabs anuncia role="tab", e esse papel é um contrato: a WAI-ARIA APG
// exige setas ←/→, Home/End e roving tabindex dentro do tablist.
//
// Os testes unitários cobrem a lógica, mas jsdom não implementa travessia de Tab
// — só um navegador de verdade prova que o roving tabindex faz o Tab pular as
// abas inativas em vez de parar numa por uma.
test('tablist: Tab atravessa de uma vez, setas navegam dentro', async ({ page }) => {
  // As abas são estáticas (METHOD_TABS), não dependem de dado da API; o stub
  // vazio só evita depender de o backend estar de pé.
  await page.route((url) => url.pathname.startsWith('/api/'), (route) =>
    route.fulfill({ json: [], status: 200 })
  )
  await page.goto('/ranking')

  const lista = page.getByRole('tablist', { name: 'Método de ranking' })
  const tabs = lista.getByRole('tab')
  await tabs.first().waitFor()
  const nomes = await tabs.allInnerTexts()
  expect(nomes.length).toBeGreaterThan(2)

  const focado = () => page.evaluate(() => document.activeElement?.textContent)

  await tabs.first().focus()
  expect(await focado()).toBe(nomes[0])

  // Roving tabindex: Tab sai do tablist inteiro em vez de parar na 2ª aba.
  await page.keyboard.press('Tab')
  expect(await focado()).not.toBe(nomes[1])

  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  expect(await focado()).toBe(nomes[1])
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')

  await page.keyboard.press('End')
  expect(await focado()).toBe(nomes[nomes.length - 1])

  await page.keyboard.press('Home')
  expect(await focado()).toBe(nomes[0])

  // A página tem dois tablists; navegar num não mexe no outro.
  await expect(page.getByRole('tablist', { name: 'Setor' }).getByRole('tab').first())
    .toHaveAttribute('aria-selected', 'true')
})
