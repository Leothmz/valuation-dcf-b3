import { test, expect, type Page } from '@playwright/test'

const isApiRequest = (url: URL) => url.pathname.startsWith('/api/')

async function mockAllApi(page: Page) {
  await page.route(isApiRequest, async (route) => {
    await route.fulfill({ json: [], status: 200 })
  })
}

test.describe('Flow 3: register operation → appears in Carteira', () => {
  test('Carteira page renders tabs including Operações', async ({ page }) => {
    await mockAllApi(page)
    await page.goto('/carteira', { waitUntil: 'networkidle' })
    // As abas viraram `ScrollableTabs` (role="tab") na Task 19 — role="button" era o
    // seletor pré-conversão e nunca foi atualizado.
    await expect(page.getByRole('tab', { name: 'Operações' })).toBeVisible({ timeout: 8000 })
  })

  test('registering a manual operation makes it appear in the table', async ({ page }) => {
    await mockAllApi(page)
    await page.goto('/carteira', { waitUntil: 'networkidle' })

    // Clear portfolio localStorage
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.includes('portfolio'))
        .forEach((k) => localStorage.removeItem(k))
    })
    await page.reload({ waitUntil: 'networkidle' })

    // Switch to Operações tab (role="tab" via ScrollableTabs, Task 19)
    await page.getByRole('tab', { name: 'Operações' }).click()

    // Open the registration modal
    await page.getByRole('button', { name: /Registrar Operação/i }).click()

    // Fill ticker (the only text input in the modal)
    await page.locator('input[placeholder*="WEGE3"]').fill('WEGE3')

    // Fill qty (first number input)
    await page.locator('input[type="number"]').first().fill('100')

    // Fill price (second number input)
    await page.locator('input[type="number"]').nth(1).fill('52.00')

    // Save
    await page.getByRole('button', { name: /Salvar Operação/i }).click()

    // Row with WEGE3 should appear
    await expect(page.getByText('WEGE3').first()).toBeVisible({ timeout: 5000 })
  })
})
