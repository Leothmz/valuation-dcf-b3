import { test, expect } from '@playwright/test'

// navigator.clipboard só existe em contexto seguro (HTTPS ou localhost). No
// celular o app é aberto pelo IP da rede local (http://192.168.x.x), onde ele é
// undefined — a chave Pix não copiava e nem erro aparecia. Este teste apaga a
// API de propósito para exercitar o caminho de fallback (execCommand).
//
// Prova o Chromium, não o Safari do iPhone. Por isso o componente ainda tem uma
// terceira camada: se os dois caminhos falharem, ele seleciona a chave e explica
// o toque longo, em vez de não fazer nada.
test('chave Pix copia mesmo sem Clipboard API (contexto http)', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    localStorage.setItem('onboarding_done', '1')
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
  })
  await page.goto('/apoiar')

  const chave = page.getByText('67572db5-ac2a-4a56-9659-7733b1fcfcc7')
  await chave.waitFor()
  await chave.click()
  await expect(page.getByText('Copiado!')).toBeVisible()

  // Aba nova do mesmo contexto: aqui navigator.clipboard existe e lê o que a
  // outra aba colocou na área de transferência do navegador.
  const leitor = await context.newPage()
  await leitor.goto('/')
  const lido = await leitor.evaluate(() => navigator.clipboard.readText())
  console.log('CLIPBOARD:', JSON.stringify(lido))
  expect(lido).toBe('67572db5-ac2a-4a56-9659-7733b1fcfcc7')
})
