import { test, expect, type Page } from '@playwright/test'
import { MOCK_FUNDAMENTALS_WEGE3, MOCK_FUNDAMENTALS_PETR4 } from './mocks'

const isApiRequest = (url: URL) => url.pathname.startsWith('/api/')

async function mockRankingApi(page: Page) {
  // Catch-all FIRST (lower priority in Playwright LIFO)
  await page.route(isApiRequest, async (route) => {
    await route.fulfill({ json: [], status: 200 })
  })
  // Specific route LAST (higher priority, matched first)
  await page.route(
    (url) => url.pathname === '/api/batch/fundamentals',
    async (route) => {
      await route.fulfill({
        json: [MOCK_FUNDAMENTALS_WEGE3, MOCK_FUNDAMENTALS_PETR4],
        status: 200,
      })
    }
  )
}

test.describe('Flow 4: open ranking → table loads with scores', () => {
  test.beforeEach(async ({ page }) => {
    await mockRankingApi(page)
    await page.goto('/ranking', { waitUntil: 'networkidle' })
    // Clear ranking cache so batch-fundamentals is always fetched
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ranking_'))
        .forEach((k) => localStorage.removeItem(k))
    })
    await page.reload({ waitUntil: 'networkidle' })
  })

  test('ranking page renders method pills immediately', async ({ page }) => {
    await expect(page.getByText('Rank Thomaz')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Rank Bazin')).toBeVisible()
  })

  test('ranking table shows tickers from mocked batch response', async ({ page }) => {
    await expect(page.getByText('WEGE3')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('PETR4')).toBeVisible()
  })

  test('ranking table renders fair price column headers', async ({ page }) => {
    // Use column header role to avoid matching "Bazin 6%" filter chip
    await expect(
      page.getByRole('columnheader', { name: /Bazin/i })
    ).toBeVisible({ timeout: 8000 })
    await expect(
      page.getByRole('columnheader', { name: /Graham/i })
    ).toBeVisible()
  })

  test('sector tabs are rendered', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible({ timeout: 8000 })
  })
})
