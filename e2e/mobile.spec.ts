import { test, expect, type Page } from '@playwright/test'
import { MOCK_FUNDAMENTALS_WEGE3, MOCK_FUNDAMENTALS_PETR4, MOCK_QUOTE_PETR4 } from './mocks'

const isApiRequest = (url: URL) => url.pathname.startsWith('/api/')

async function mockAllApi(page: Page) {
  await page.route(isApiRequest, async (route) => {
    await route.fulfill({ json: [], status: 200 })
  })
}

async function mockRankingApi(page: Page) {
  await mockAllApi(page)
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

const ROUTES = [
  '/', '/dcf', '/watchlist', '/ranking', '/compare',
  '/analise', '/fiis', '/analise-fii', '/carteira', '/apoiar',
]

/**
 * Mede overflow horizontal REAL do documento.
 *
 * NÃO usar `window.innerWidth` como referência — Task 23 descobriu que ele não é
 * confiável aqui: quando `<main>` (Layout.tsx) não conseguia encolher abaixo do
 * min-content de um `ScrollableTabs` sem `min-w-0`, o navegador expandia o próprio
 * layout viewport para acomodar o conteúdo (ex: /fiis chegou a
 * `{scrollWidth:1020, innerWidth:1020}` — os dois iguais, então
 * `scrollWidth > innerWidth` dava `false` numa rota que rolava de lado visivelmente).
 * `window.visualViewport.width` reflete o tamanho REAL da tela do device (sempre 390
 * no projeto `mobile`, iPhone 13) e não infla junto com o conteúdo — é a única
 * referência que continua detectando o bug depois que ele já aconteceu. Se alguém
 * "simplificar" isto de volta para `innerWidth`, a varredura para de detectar overflow.
 */
async function measureOverflow(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    deviceWidth: window.visualViewport?.width ?? window.innerWidth,
  }))
}

test.describe('layout mobile — varredura de overflow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApi(page)
  })

  for (const route of ROUTES) {
    test(`${route} não rola horizontalmente`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' })
      const { scrollWidth, deviceWidth } = await measureOverflow(page)
      expect(
        scrollWidth,
        `${route}: scrollWidth=${scrollWidth} vs largura real do device=${deviceWidth}`
      ).toBeLessThanOrEqual(deviceWidth)
    })
  }

  // Pendência específica da Task 21: a linha de inputs de "Metas por Categoria"
  // (CarteiraMetas.tsx:105-145) tinha ~21px de folga em 375px por análise estática,
  // nunca verificada em navegador real. Este teste mede a 390px (projeto `mobile` =
  // iPhone 13) — a verificação em 375px/360px continua pendente, vai virar um card
  // à parte (segundo projeto do Playwright). Testada aqui separadamente porque não
  // é a aba default.
  test('Carteira · aba Metas não rola horizontalmente', async ({ page }) => {
    await page.goto('/carteira', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: 'Metas' }).click()
    const { scrollWidth, deviceWidth } = await measureOverflow(page)
    expect(
      scrollWidth,
      `Carteira/Metas: scrollWidth=${scrollWidth} vs largura real do device=${deviceWidth}`
    ).toBeLessThanOrEqual(deviceWidth)
  })

  // Regression guard direto da Finding 3 (Task 23): o sweep acima visita /dcf em
  // branco (390px, limpo) — o overflow real só aparece depois de buscar um ticker,
  // quando o "Secondary metrics grid" do DCFResultPanel monta com valores formatados
  // (fShort não abrevia — ver CLAUDE.md). É o único cenário da sprint em que o estado
  // inicial da rota passa e o estado de uso não; por isso ganha um teste próprio em
  // vez de depender do timeout indireto do dcf.spec.ts pra denunciar a regressão.
  test('DCF · não rola horizontalmente depois de buscar um ticker', async ({ page }) => {
    await page.route(
      (url) => url.pathname === '/api/quote/PETR4',
      async (route) => {
        await route.fulfill({ json: MOCK_QUOTE_PETR4, status: 200 })
      }
    )
    await page.goto('/dcf', { waitUntil: 'networkidle' })
    await page.locator('input[placeholder*="WEGE3"]').fill('PETR4')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await expect(page.getByText(/Petróleo Brasileiro/i)).toBeVisible({ timeout: 8000 })

    const { scrollWidth, deviceWidth } = await measureOverflow(page)
    expect(
      scrollWidth,
      `/dcf (pós-busca): scrollWidth=${scrollWidth} vs largura real do device=${deviceWidth}`
    ).toBeLessThanOrEqual(deviceWidth)
  })
})

test.describe('layout mobile — navegação', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApi(page)
  })

  test('BottomNav fica visível com os 5 itens', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    // exact: true é necessário — a Home tem cards promocionais que linkam para as
    // mesmas rotas com textos mais longos (ex: "Calculadora DCF Valuation por Fluxo..."),
    // que casam por substring com "DCF" e disparam strict mode violation sem exact.
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'DCF', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Valuations', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ranking' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Carteira', exact: true })).toBeVisible()
  })

  test('popover do Ranking navega para Ações (/ranking)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Ranking' }).click()
    await page.getByRole('link', { name: 'Ações', exact: true }).click()
    await expect(page).toHaveURL(/\/ranking$/)
  })

  test('popover do Ranking navega para FIIs (/fiis)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Ranking' }).click()
    await page.getByRole('link', { name: 'FIIs', exact: true }).click()
    await expect(page).toHaveURL(/\/fiis$/)
  })

  test('popover do Ranking abre mesmo já estando em /ranking', async ({ page }) => {
    await page.goto('/ranking', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Ranking' }).click()
    await expect(page.getByRole('link', { name: 'FIIs', exact: true })).toBeVisible()
  })

  test('gaveta lateral abre pelo ☰ do header e dá acesso a rota fora da barra', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    // "Comparar Ações" não está na BottomNav nem no popover de Ranking — só na gaveta.
    // exact: true evita colisão com o card promocional da Home ("Comparar Ações Coloque
    // até 3 tickers...").
    await expect(page.getByRole('link', { name: 'Comparar Ações', exact: true })).toBeVisible()
  })
})

test.describe('layout mobile — Padrão C (linha expansível)', () => {
  test('ranking: uma linha expande ao toque e mostra o detalhamento', async ({ page }) => {
    await mockRankingApi(page)
    await page.goto('/ranking', { waitUntil: 'networkidle' })
    // Limpa cache de ranking para garantir que o batch mockado seja usado.
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ranking_'))
        .forEach((k) => localStorage.removeItem(k))
    })
    await page.reload({ waitUntil: 'networkidle' })

    const loaded = await measureOverflow(page)
    expect(loaded.scrollWidth, `/ranking (carregado): scrollWidth=${loaded.scrollWidth} vs deviceWidth=${loaded.deviceWidth}`).toBeLessThanOrEqual(loaded.deviceWidth)

    const firstRow = page.getByRole('button', { name: /^[A-Z]{4}\d{1,2}$/ }).first()
    await firstRow.click()
    await expect(page.getByText('Preço Teto').first()).toBeVisible()

    const expanded = await measureOverflow(page)
    expect(expanded.scrollWidth, `/ranking (expandido): scrollWidth=${expanded.scrollWidth} vs deviceWidth=${expanded.deviceWidth}`).toBeLessThanOrEqual(expanded.deviceWidth)
  })
})

test.describe('layout mobile — Padrão B (cards em vez de tabela larga)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApi(page)
  })

  test('Carteira · aba IR/DARF não mostra nenhuma <table> visível', async ({ page }) => {
    await page.goto('/carteira', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: 'IR/DARF' }).click()
    await expect(page.locator('table:visible')).toHaveCount(0)
  })
})
