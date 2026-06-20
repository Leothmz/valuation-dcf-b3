import { test, expect, type Page } from '@playwright/test'
import { MOCK_QUOTE_PETR4 } from './mocks'

const isApiRequest = (url: URL) => url.pathname.startsWith('/api/')

// Register catch-all FIRST (lower priority in Playwright LIFO), specific routes AFTER
async function mockApiWithOverride(
  page: Page,
  overrides: Record<string, unknown> = {}
) {
  // Catch-all goes first (will be lower priority)
  await page.route(isApiRequest, async (route) => {
    await route.fulfill({ json: [], status: 200 })
  })
  // Specific overrides go last (will be higher priority, matched first)
  for (const [path, json] of Object.entries(overrides)) {
    const p = path
    await page.route((url) => url.pathname === p, async (route) => {
      await route.fulfill({ json, status: 200 })
    })
  }
}

test.describe('Flow 1: search ticker → DCF loads with data', () => {
  test('DCF page renders search input and submit button', async ({ page }) => {
    await mockApiWithOverride(page)
    await page.goto('/dcf', { waitUntil: 'networkidle' })

    await expect(page.locator('input[placeholder*="WEGE3"]')).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeVisible()
  })

  test('searching PETR4 loads company name and fair price section', async ({ page }) => {
    await mockApiWithOverride(page, { '/api/quote/PETR4': MOCK_QUOTE_PETR4 })
    await page.goto('/dcf', { waitUntil: 'networkidle' })

    await page.locator('input[placeholder*="WEGE3"]').fill('PETR4')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()

    await expect(page.getByText(/Petróleo Brasileiro/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/Preço Teto/i).first()).toBeVisible()
  })

  test('save button appears after successful search', async ({ page }) => {
    await mockApiWithOverride(page, { '/api/quote/PETR4': MOCK_QUOTE_PETR4 })
    await page.goto('/dcf', { waitUntil: 'networkidle' })

    await page.locator('input[placeholder*="WEGE3"]').fill('PETR4')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()

    await expect(page.getByText(/Petróleo Brasileiro/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/Salvar Preço Teto/i)).toBeVisible()
  })
})

test.describe('Flow 2: adjust premises → save to watchlist', () => {
  test('saving DCF result persists ticker in watchlist', async ({ page }) => {
    await mockApiWithOverride(page, { '/api/quote/PETR4': MOCK_QUOTE_PETR4 })

    await page.goto('/dcf', { waitUntil: 'networkidle' })
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })

    await page.locator('input[placeholder*="WEGE3"]').fill('PETR4')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await expect(page.getByText(/Petróleo Brasileiro/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/Salvar Preço Teto/i)).toBeVisible()

    await page.getByText(/Salvar Preço Teto/i).click()

    await page.goto('/watchlist', { waitUntil: 'networkidle' })
    await expect(page.getByText('PETR4')).toBeVisible({ timeout: 5000 })
  })
})
