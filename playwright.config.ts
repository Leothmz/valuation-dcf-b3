import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState: './e2e/.auth/state.json',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // mobile.spec.ts testa UI que só existe em mobile (BottomNav, gaveta via ☰,
      // popover de Ranking são todos `md:hidden`) e overflow por largura real do
      // device — não faz sentido (e falha) no viewport desktop. Fica só no projeto mobile.
      testIgnore: ['**/mobile.spec.ts'],
    },
    {
      // devices['iPhone 13'] traz defaultBrowserType: 'webkit' — só chromium está
      // instalado neste ambiente (e é o motor que os specs foram escritos/validados
      // contra), então força chromium mantendo viewport/UA/touch do device real.
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    cwd: path.join(__dirname, 'frontend'),
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
