import { chromium, type FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Seeds localStorage so the first-visit welcome modal never blocks e2e specs from
// interacting with the page right after navigation.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173'
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(baseURL)
  await page.evaluate(() => localStorage.setItem('onboarding_done', '1'))

  const authDir = path.join(process.cwd(), 'e2e', '.auth')
  fs.mkdirSync(authDir, { recursive: true })
  await page.context().storageState({ path: path.join(authDir, 'state.json') })

  await browser.close()
}
