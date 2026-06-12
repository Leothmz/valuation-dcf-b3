# Create Refactor Cards — GitHub Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 22 sub-issues (10 backend + 12 frontend) + 1 deploy issue on GitHub, all linked to parent issues #4 and #5.

**Architecture:** Each issue is one branch of work in the parallel migration (vanilla code lives alongside `api/` and `frontend/` until the final deploy swap). Backend issues feed #5, frontend issues feed #4.

**Tech Stack:** `gh` CLI, GitHub REST API (`/issues/{n}/sub_issues`)

**Repo:** `Leothmz/valuation-dcf-b3`

---

## Task 0: Create labels

**Files:** none (GitHub labels)

- [ ] Check existing labels
  ```bash
  gh label list
  ```
  Expected: see `feature` label exists; `refactor:backend`, `refactor:frontend`, `refactor:infra` do NOT exist yet.

- [ ] Create labels
  ```bash
  gh label create "refactor:backend"  --color "0075ca" --description "Backend migration to FastAPI"
  gh label create "refactor:frontend" --color "7057ff" --description "Frontend migration to React"
  gh label create "refactor:infra"    --color "e4e669" --description "Infrastructure and deploy changes"
  ```
  Expected: each prints `✓ Created label "refactor:..."`.

- [ ] Commit (no files changed — this task is GitHub-only, no commit needed)

---

## Task 1: Create backend issues A–J (sub-issues of #5)

Run each command, **note the issue number printed** — you need all 10 for Task 3.

- [ ] **A — Scaffold FastAPI**
  ```bash
  gh issue create \
    --title "refactor(api): scaffold FastAPI + lifespan + CORS + folder structure" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
First backend card. Creates \`api/\` directory alongside \`server.py\` (vanilla keeps running). Part of #5.

## Acceptance Criteria
- [ ] \`api/main.py\` — FastAPI app with lifespan handler and CORS middleware (\`origins=["*"]\` in dev, env var for prod)
- [ ] Folder skeleton: \`api/routers/\`, \`api/services/\`, \`api/adapters/\`, \`api/models.py\`, \`api/cache.py\`
- [ ] \`GET /health\` → \`{"status": "ok"}\`
- [ ] \`uvicorn api.main:app --reload\` starts without errors
- [ ] \`requirements-api.txt\` with: fastapi, uvicorn[standard], httpx

## Technical Tasks
- [ ] Create directory tree
- [ ] Write \`api/main.py\` (app, lifespan, CORS, router stubs)
- [ ] Write \`GET /health\` inline or in \`api/routers/health.py\`
- [ ] Write \`requirements-api.txt\`
- [ ] Smoke test: \`uvicorn api.main:app --reload\`, \`curl localhost:8000/health\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` still passes (server.py untouched)
- [ ] \`npm test\` still passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-scaffold-fastapi\`
BODY
  )"
  ```

- [ ] **B — Pydantic models**
  ```bash
  gh issue create \
    --title "refactor(api): Pydantic v2 response models — StockQuote, FIIData, Fundamentals, Portfolio" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Defines all API response contracts as typed Pydantic v2 models in \`api/models.py\`. No business logic — pure data shapes. Part of #5.

## Acceptance Criteria
- [ ] \`api/models.py\` defines:
  - \`NetIncomeEntry(year: int, netIncome: float)\`
  - \`DividendEntry(date: str, amount: float)\`
  - \`StockQuote\` — all fields from current \`get_stock_data()\` return dict
  - \`FIIData\` — all fields from current \`get_fii_data()\` return dict
  - \`FundamentalsData\` — all fields from current \`get_fundamentals()\` return dict
  - \`PortfolioHistoryResponse(tickers: list[str], dates: list[str], prices: dict[str, list[float]])\`
- [ ] All optional fields typed as \`X | None = None\`
- [ ] All models: \`model_config = ConfigDict(populate_by_name=True)\`
- [ ] Unit tests in \`tests/python/test_models.py\`: construct each model with partial data, verify optional fields default to None

## Technical Tasks
- [ ] Install \`pydantic>=2\` in \`requirements-api.txt\`
- [ ] Write \`api/models.py\`
- [ ] Write \`tests/python/test_models.py\`
- [ ] Run \`pytest tests/python/test_models.py -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-pydantic-models\`
Field reference: \`server.py\` return dicts for \`get_stock_data\`, \`get_fii_data\`, \`get_fundamentals\`
BODY
  )"
  ```

- [ ] **C — diskcache wrapper**
  ```bash
  gh issue create \
    --title "refactor(api): diskcache SQLite wrapper + TTL helpers" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Replaces the in-memory \`_api_cache\` dict in \`server.py\` with diskcache SQLite that survives restarts. Part of #5.

## Acceptance Criteria
- [ ] \`api/cache.py\` wraps \`diskcache.Cache\`
- [ ] TTL constants: \`QUOTES_TTL = 300\`, \`FUNDAMENTALS_TTL = 21600\`, \`MARKET_TTL = 3600\`
- [ ] \`cache_get(key: str) -> dict | None\` — returns None on miss or expiry
- [ ] \`cache_set(key: str, data: dict, ttl: int) -> None\`
- [ ] Cache dir: \`~/.cache/valuation/\` (override via \`CACHE_DIR\` env var)
- [ ] \`diskcache\` added to \`requirements-api.txt\`
- [ ] Tests: set/get round-trip passes; mocked expired entry returns None; missing key returns None

## Technical Tasks
- [ ] Add \`diskcache\` to \`requirements-api.txt\`
- [ ] Write \`api/cache.py\`
- [ ] Write \`tests/python/test_cache.py\` (use \`tmp_path\` fixture for cache dir)
- [ ] Run \`pytest tests/python/test_cache.py -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-diskcache-wrapper\`
BODY
  )"
  ```

- [ ] **D — Rate limiter middleware**
  ```bash
  gh issue create \
    --title "refactor(api): rate limiter as FastAPI middleware — port deque logic from server.py" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Ports the per-IP rate limiter from \`server.py\` to FastAPI \`BaseHTTPMiddleware\`. Same rules: 60 req/min per IP, API paths only. Part of #5.

## Acceptance Criteria
- [ ] \`api/middleware.py\` — \`RateLimitMiddleware(BaseHTTPMiddleware)\`
- [ ] Uses \`collections.deque\` per IP (same algo as \`server.py\` \`_check_rate_limit\`)
- [ ] Only enforced on paths starting with \`/api/\`
- [ ] Returns HTTP 429: \`{"error": "rate_limit_exceeded", "retry_after": 60}\`
- [ ] Registered in \`api/main.py\` via \`app.add_middleware(RateLimitMiddleware)\`
- [ ] Tests: 60 requests all pass (status 200); 61st returns 429; path \`/health\` not rate-limited

## Technical Tasks
- [ ] Write \`api/middleware.py\`
- [ ] Register in \`api/main.py\`
- [ ] Write \`tests/python/test_middleware.py\` using \`httpx.AsyncClient\` + \`ASGITransport\`
- [ ] Run \`pytest tests/python/test_middleware.py -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-rate-limiter\`
Source: \`server.py\` lines ~50–68 (\`_check_rate_limit\`, \`_rate_windows\`)
BODY
  )"
  ```

- [ ] **E — Adapter: yfinance**
  ```bash
  gh issue create \
    --title "refactor(api): adapter — yfinance (primary source, returns Pydantic models)" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Extracts all yfinance data-fetching from \`server.py\` into \`api/adapters/yfinance_adapter.py\`. Returns typed Pydantic model instances. Part of #5.

## Acceptance Criteria
- [ ] \`api/adapters/__init__.py\` (empty)
- [ ] \`api/adapters/yfinance_adapter.py\` exports:
  - \`fetch_stock(ticker: str) -> StockQuote\`
  - \`fetch_fii(ticker: str) -> FIIData\`
  - \`fetch_fundamentals(ticker: str) -> FundamentalsData\`
- [ ] Ticker normalisation: appends \`.SA\` if not present
- [ ] \`_normalize_dy\` logic preserved
- [ ] Raises \`ValueError("NOT_FOUND")\` when ticker not found or price is None
- [ ] Raises \`ImportError("NO_YFINANCE")\` when yfinance not installed
- [ ] Unit tests mock \`yfinance.Ticker\` and verify all field mappings

## Technical Tasks
- [ ] Create \`api/adapters/__init__.py\`
- [ ] Write \`api/adapters/yfinance_adapter.py\` (extract from \`server.py\` \`get_stock_data\`, \`get_fii_data\`, \`get_fundamentals\` — yfinance sections only)
- [ ] Write \`tests/python/test_adapter_yfinance.py\`
- [ ] Run \`pytest tests/python/test_adapter_yfinance.py -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-adapter-yfinance\`
Source: \`server.py\` ~lines 167–456 (stock/fii/fundamentals yfinance sections)
BODY
  )"
  ```

- [ ] **F — Adapters: scrapers**
  ```bash
  gh issue create \
    --title "refactor(api): adapters — investidor10 + statusinvest + fundamentus scrapers" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Extracts the three scraping functions from \`server.py\` into separate adapter files. Silent failures (return empty on error). Part of #5.

## Acceptance Criteria
- [ ] \`api/adapters/investidor10.py\` — \`fetch_net_income(ticker: str) -> list[NetIncomeEntry]\`, returns \`[]\` on error
- [ ] \`api/adapters/statusinvest.py\` — \`fetch_fii_extras(ticker: str) -> dict\`, returns \`{}\` on error; includes \`_normalize_segmento(raw: str) -> str | None\`
- [ ] \`api/adapters/fundamentus.py\` — \`fetch_fii_extras(ticker: str) -> dict\`, returns \`{}\` on error
- [ ] All use \`urllib.request\` (no new HTTP dependency)
- [ ] Unit tests use HTML fixtures to test parsing (no real HTTP calls)
- [ ] Fixtures: \`tests/python/fixtures/investidor10_sample.html\`, \`statusinvest_sample.html\`, \`fundamentus_sample.html\`

## Technical Tasks
- [ ] Create fixture HTML files (minimal valid samples matching current scraping selectors)
- [ ] Write \`api/adapters/investidor10.py\` (extract \`_get_investidor10_net_income\` from \`server.py\`)
- [ ] Write \`api/adapters/statusinvest.py\` (extract \`_get_statusinvest_fii_data\`, \`_normalize_fii_segmento\`)
- [ ] Write \`api/adapters/fundamentus.py\` (extract \`_get_fundamentus_fii_data\`, \`_parse_fundamentus_table\`)
- [ ] Write \`tests/python/test_adapters_scrapers.py\`
- [ ] Run \`pytest tests/python/test_adapters_scrapers.py -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-adapters-scrapers\`
BODY
  )"
  ```

- [ ] **G — Router: stocks**
  ```bash
  gh issue create \
    --title "refactor(api): router stocks — /api/quote, /api/fundamentals, /api/batch/*" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Implements stock endpoints using adapters (cards E, F) and diskcache (card C). Ports all stock-related routes from \`server.py\`. Part of #5.

## Acceptance Criteria
- [ ] \`api/routers/stocks.py\` with \`router = APIRouter(prefix="/api")\`
- [ ] \`GET /api/quote/{ticker}\` → \`StockQuote\` (cache key \`quote:{ticker}\`, TTL \`QUOTES_TTL\`)
- [ ] \`GET /api/fundamentals/{ticker}\` → \`FundamentalsData\` (cache key \`fundamentals:{ticker}\`, TTL \`FUNDAMENTALS_TTL\`)
- [ ] \`GET /api/batch/quotes?tickers=PETR4,VALE3\` → \`list[StockQuote]\` (runs concurrently via \`asyncio.gather\`)
- [ ] \`GET /api/batch/fundamentals?tickers=...\` → \`list[FundamentalsData]\`
- [ ] HTTP 404: \`{"code": "NOT_FOUND"}\` when adapter raises \`ValueError\`
- [ ] HTTP 503: \`{"code": "NO_YFINANCE"}\` when \`ImportError\`
- [ ] Router registered in \`api/main.py\`
- [ ] Integration tests: TestClient, mock adapters at import level

## Technical Tasks
- [ ] Write \`api/routers/stocks.py\`
- [ ] Register in \`api/main.py\`
- [ ] Write \`tests/python/test_router_stocks.py\` using \`fastapi.testclient.TestClient\` + \`unittest.mock.patch\`
- [ ] Run \`pytest tests/python/test_router_stocks.py -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-router-stocks\`
BODY
  )"
  ```

- [ ] **H — Router: FIIs**
  ```bash
  gh issue create \
    --title "refactor(api): router FIIs — /api/fii" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Implements the FII endpoint using adapters (E, F) and cache (C). Ports \`/api/fii/<ticker>\` from \`server.py\`. Part of #5.

## Acceptance Criteria
- [ ] \`api/routers/fiis.py\` with \`router = APIRouter(prefix="/api")\`
- [ ] \`GET /api/fii/{ticker}\` → \`FIIData\` (cache key \`fii:{ticker}\`, TTL \`QUOTES_TTL\`)
- [ ] Enriches yfinance data with statusinvest/fundamentus extras (ffoYield, vacancia, numImoveis, segmento)
- [ ] \`dividends\` list: last 24 payments, most recent first
- [ ] Same error responses as stocks router
- [ ] Router registered in \`api/main.py\`
- [ ] Integration tests with TestClient + mocked adapters

## Technical Tasks
- [ ] Write \`api/routers/fiis.py\`
- [ ] Register in \`api/main.py\`
- [ ] Write \`tests/python/test_router_fiis.py\`
- [ ] Run \`pytest tests/python/test_router_fiis.py -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-router-fiis\`
BODY
  )"
  ```

- [ ] **I — Routers: market + portfolio**
  ```bash
  gh issue create \
    --title "refactor(api): routers market + portfolio — /api/cdi, /api/exchange, /api/portfolio/history" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Ports the CDI, FX, and portfolio history endpoints from \`server.py\`. Part of #5.

## Acceptance Criteria
- [ ] \`api/routers/market.py\`:
  - \`GET /api/cdi\` → \`{"rates": list, "latest": float}\` (cache \`MARKET_TTL\`)
  - \`GET /api/exchange?pair=USD-BRL&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD\` → \`{"rates": dict}\`
- [ ] \`api/routers/portfolio.py\`:
  - \`POST /api/portfolio/history\` body \`{"tickers": [...], "dates": [...]}\` → \`PortfolioHistoryResponse\`
- [ ] Both routers registered in \`api/main.py\`
- [ ] Tests mock external HTTP calls with \`unittest.mock.patch("urllib.request.urlopen")\`

## Technical Tasks
- [ ] Write \`api/routers/market.py\` (extract \`get_cdi_data\`, \`get_exchange_rate\` from \`server.py\`)
- [ ] Write \`api/routers/portfolio.py\` (extract \`get_portfolio_history\` from \`server.py\`)
- [ ] Register both in \`api/main.py\`
- [ ] Write \`tests/python/test_router_market.py\` and \`tests/python/test_router_portfolio.py\`
- [ ] Run \`pytest tests/python/ -v\`

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-router-market-portfolio\`
BODY
  )"
  ```

- [ ] **J — pytest + Dockerfile**
  ```bash
  gh issue create \
    --title "refactor(api): pytest update — FastAPI TestClient + Dockerfile entrypoint" \
    --label "refactor:backend" \
    --body "$(cat <<'BODY'
## Context
Final backend card. Migrates remaining pytest tests to TestClient; updates Fly.io Dockerfile to \`api/main.py\`. Part of #5.

## Acceptance Criteria
- [ ] All tests in \`tests/python/\` use \`fastapi.testclient.TestClient\` — no test spins up \`ThreadingHTTPServer\` or imports \`server.py\`
- [ ] \`tests/python/test_handler.py\` migrated or deleted
- [ ] \`Dockerfile\` CMD: \`["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]\`
- [ ] \`Dockerfile\` COPY: includes \`api/\` and \`requirements-api.txt\`; removes old \`server.py\` reference
- [ ] \`pytest tests/python/ -v\` all passing with no \`server.py\` process running
- [ ] \`npm test\` still passing

## Technical Tasks
- [ ] Audit: \`grep -rn "ThreadingHTTPServer\|import server\|start_server" tests/python/\`
- [ ] Migrate remaining tests to TestClient
- [ ] Update \`Dockerfile\`
- [ ] Run \`pytest tests/python/ -v\` locally
- [ ] Push PR, verify CI including deploy job

## Definition of Done
- [ ] \`pytest tests/python/ -v\` all passing
- [ ] \`npm test\` passing
- [ ] CI green (all jobs including deploy)

## Notes
Branch: \`refactor/ISSUE_NUMBER-pytest-fastapi\`
This is the last backend card before the deploy swap.
BODY
  )"
  ```

---

## Task 2: Create frontend issues 1–12 (sub-issues of #4)

Run each command, **note the issue numbers** — needed for Task 3.

- [ ] **1 — Scaffold Vite + React**
  ```bash
  gh issue create \
    --title "refactor(frontend): scaffold Vite + React 19 + TypeScript + React Router v7 + TanStack Query" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
First frontend card. Creates \`frontend/\` alongside vanilla HTML files (which keep working). Part of #4.

## Acceptance Criteria
- [ ] \`frontend/\` scaffold from Vite \`react-ts\` template
- [ ] React Router v7 (\`createBrowserRouter\`) with routes for all 7 pages — placeholder \`<Page />\` components
- [ ] TanStack Query v5 — \`QueryClient\` + \`QueryClientProvider\` wrapping app
- [ ] \`vite.config.ts\`: proxy \`/api\` → \`http://localhost:8000\` in dev
- [ ] \`npm run dev\` in \`frontend/\` starts without errors
- [ ] \`npm run build\` in \`frontend/\` produces \`frontend/dist/\` without errors
- [ ] Root \`npm test\` (Vitest on \`src/\`) still passes

## Technical Tasks
- [ ] \`npm create vite@latest frontend -- --template react-ts\`
- [ ] \`cd frontend && npm install react-router-dom@7 @tanstack/react-query@5\`
- [ ] Configure router + QueryClientProvider in \`frontend/src/main.tsx\`
- [ ] Add dev proxy in \`vite.config.ts\`
- [ ] Run \`npm run build\` in \`frontend/\`
- [ ] Run \`npm test\` in root

## Definition of Done
- [ ] \`npm run build\` in \`frontend/\` passes
- [ ] Root \`npm test\` passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-scaffold-vite-react\`
BODY
  )"
  ```

- [ ] **2 — Design tokens → Tailwind**
  ```bash
  gh issue create \
    --title "refactor(frontend): design tokens → Tailwind v4 config" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Ports the CSS custom properties shared across all 7 HTML files to Tailwind v4 config. Part of #4.

## Acceptance Criteria
- [ ] Tailwind v4 installed in \`frontend/\`
- [ ] \`tailwind.config.ts\` maps all color tokens: \`bg-0\` (#060910) through \`bg-4\` (#1f2a3f), \`cyan\` (#06b6d4), \`green\` (#10b981), \`red\` (#ef4444), \`amber\` (#f59e0b), \`purple\` (#8b5cf6), \`text\` (#f0f4f8), \`text-sec\` (#94a3b8), \`text-muted\` (#4a5568), \`border\` (#1e2d42)
- [ ] Font families: \`font-ui\` (Inter) and \`font-mono\` (JetBrains Mono)
- [ ] \`glow-cyan\` and \`glow-green\` shadow utilities via Tailwind plugin
- [ ] \`shimmer\` animation defined
- [ ] \`frontend/src/index.css\` imports Tailwind only; no custom CSS rules
- [ ] Smoke test: placeholder home bg is #060910 (\`bg-bg-0\` class)

## Technical Tasks
- [ ] \`cd frontend && npm install tailwindcss @tailwindcss/vite\`
- [ ] Configure \`tailwind.config.ts\` (copy token values from any HTML \`:root\` block)
- [ ] Update \`frontend/src/index.css\`
- [ ] Add \`bg-bg-0\` to placeholder home page and visually verify in browser

## Definition of Done
- [ ] \`npm run build\` in \`frontend/\` passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-design-tokens-tailwind\`
Token values: see \`:root\` block in any of the 7 HTML files — all identical
BODY
  )"
  ```

- [ ] **3 — Engines TypeScript**
  ```bash
  gh issue create \
    --title "refactor(frontend): migrate src/ engines to TypeScript" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Copies the 5 JS engines from \`src/\` to \`frontend/src/engines/\` as typed TypeScript. Original \`src/\` files kept intact (vanilla HTML still imports them). Part of #4.

## Acceptance Criteria
- [ ] \`frontend/src/engines/formatters.ts\` — typed: \`fBRL\`, \`fShort\`, \`fPct\`, \`fShares\`, \`fInputLL\`, \`fInputPctSigned\`, \`fInputPct\`
- [ ] \`frontend/src/engines/parsers.ts\` — typed: \`parsePct(s: string): number\`, \`parseLL(s: string): number\`
- [ ] \`frontend/src/engines/dcf-engine.ts\` — typed: \`growthRate\`, \`runDCF\`, input/output interfaces exported
- [ ] \`frontend/src/engines/ranking-scores.ts\` — typed: all 5 score functions with typed input/output
- [ ] \`frontend/src/engines/fii-scores.ts\` — typed: \`calc2em1Score\`, \`classifyPerfil\`
- [ ] Vitest configured in \`frontend/\` (\`vitest.config.ts\`, jsdom env)
- [ ] \`frontend/src/engines/*.test.ts\` — adapted from \`tests/js/\` — all passing
- [ ] Root \`npm test\` still passes

## Technical Tasks
- [ ] Add Vitest to \`frontend/package.json\` devDependencies
- [ ] Write \`frontend/vitest.config.ts\`
- [ ] Type each engine file (copy + add TypeScript types; zero logic changes)
- [ ] Write engine tests in \`frontend/src/engines/\`
- [ ] Run \`npm test\` in \`frontend/\` and in root

## Definition of Done
- [ ] Both \`npm test\` suites pass
- [ ] \`npm run build\` in \`frontend/\` passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-engines-typescript\`
BODY
  )"
  ```

- [ ] **4 — Shared components**
  ```bash
  gh issue create \
    --title "refactor(frontend): shared components — Layout, Sidebar, Skeleton, Notification, Lucide icons" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Builds the reusable shell used by all pages. Prerequisite for all page cards. Part of #4.

## Acceptance Criteria
- [ ] \`lucide-react\` installed
- [ ] \`frontend/src/components/Layout.tsx\` — renders \`<Sidebar />\` + \`<main>{children}</main>\` with correct padding
- [ ] \`frontend/src/components/Sidebar.tsx\`:
  - Width: 58px collapsed → 224px on hover (pure CSS \`group-hover\`, no JS)
  - Glassmorphism: \`rgba(11,15,23,.95)\` + \`backdrop-blur\`
  - Active item: cyan border-left + cyan text + cyan-dim background
  - Nav items: Home, Calculadora, Watchlist, Ranking, Análise, FIIs, Análise FII, Carteira — all linked via React Router \`<Link>\`
  - Logo with cyan gradient text
- [ ] \`frontend/src/components/Skeleton.tsx\` — shimmer div, props: \`width\`, \`height\`, \`className\`
- [ ] \`frontend/src/components/Notification.tsx\` — toast notification, variants: \`success\`, \`error\`, \`warning\`; auto-dismiss after 4 s
- [ ] Manual test: sidebar expands on hover, active route highlighted on each page

## Technical Tasks
- [ ] \`cd frontend && npm install lucide-react\`
- [ ] Write all 4 component files
- [ ] Update all placeholder page components to use \`<Layout>\`
- [ ] Manual test in browser: \`npm run dev\`, navigate all routes

## Definition of Done
- [ ] \`npm run build\` passes
- [ ] Manual hover + active state test passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-shared-components\`
BODY
  )"
  ```

- [ ] **5 — Zustand stores**
  ```bash
  gh issue create \
    --title "refactor(frontend): Zustand stores — DCF, Ranking, FII, Carteira" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Replaces the per-page \`const S = {}\` global objects with typed Zustand v5 stores. Part of #4.

## Acceptance Criteria
- [ ] \`zustand@5\` and \`immer\` installed
- [ ] \`frontend/src/stores/dcf-store.ts\` — mirrors \`S\` from \`index.html\`: \`ticker\`, \`apiData\`, \`companyName\`, \`projYears\`, \`history\`, \`assumptions\`, \`overrides: Set<string>\`, \`apiVals\`, \`yearOverrides\`, \`results\`; actions: \`setTicker\`, \`setApiData\`, \`updateAssumption\`, \`addOverride\`, \`restoreApiVal\`, \`setYearOverride\`, \`setResults\`
- [ ] \`frontend/src/stores/ranking-store.ts\` — mirrors ranking.html \`S\`: stocks list, filterConfig, activeMethod, savedFilters, favorites; actions for each
- [ ] \`frontend/src/stores/fii-store.ts\` — mirrors fii.html state: fiis list, filterConfig, activeSegment, favorites
- [ ] \`frontend/src/stores/carteira-store.ts\` — mirrors carteira.html state
- [ ] All stores use \`create\` + \`immer\` middleware; all fields typed (no \`any\`)
- [ ] Unit tests: each store — set an action, read back the state

## Technical Tasks
- [ ] \`cd frontend && npm install zustand immer\`
- [ ] Write all 4 store files
- [ ] Write \`frontend/src/stores/*.test.ts\`
- [ ] Run \`npm test\` in \`frontend/\`

## Definition of Done
- [ ] Tests pass
- [ ] \`npm run build\` passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-zustand-stores\`
BODY
  )"
  ```

- [ ] **6 — Page: DCF Calculator**
  ```bash
  gh issue create \
    --title "refactor(frontend): page — DCF Calculator (port index.html)" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Ports \`index.html\` (1901 lines, most complex page) to React. Part of #4.

## Acceptance Criteria
- [ ] Route \`/calculadora\` renders DCF Calculator with full feature parity
- [ ] Company search: text input → TanStack Query \`useQuery\` on \`/api/quote/{ticker}\`
- [ ] Company hero: name, ticker badge, price, changePercent
- [ ] Premises panel: all 7 inputs (LL, payout, ROE, g, disc, perp, shares), amber border on override, \`↺\` restore button
- [ ] Projection toggle: "3 anos" / "5 anos"
- [ ] DCF table: historical rows (grey, read-only), base row (blue, read-only), projected rows (editable LL and growth cells), TV row
- [ ] Results: fair price, upside/downside color-coded, EV, TV breakdown
- [ ] Watchlist save/restore: save button visible when results valid; reads/writes \`dcf_watchlist\` localStorage key via dcf-store
- [ ] URL param \`?ticker=XXXX\` triggers auto-search on mount
- [ ] URL param \`?wl=XXXX\` restores saved premises on mount
- [ ] All computation via \`frontend/src/engines/dcf-engine.ts\` (no inline math)

## Technical Tasks
- [ ] Write \`frontend/src/pages/DCFPage.tsx\`
- [ ] Extract: \`PremisesPanel.tsx\`, \`DCFTable.tsx\`, \`ResultsPanel.tsx\`, \`CompanyHero.tsx\`
- [ ] Wire dcf-store: populate on API response, update on input changes, persist via \`zustand/middleware\` \`persist\`
- [ ] Manual golden path: search PETR4 → see results → change payout → see recalc → save → navigate away → restore via \`?wl=PETR4\`

## Definition of Done
- [ ] \`npm run build\` passes
- [ ] Manual golden path test passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-page-dcf\`
Source: \`index.html\` sections A–P (CLAUDE.md section map)
BODY
  )"
  ```

- [ ] **7 — Page: Watchlist**
  ```bash
  gh issue create \
    --title "refactor(frontend): page — Watchlist (port watchlist.html)" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Ports \`watchlist.html\` to React. Live price refresh every 3 min. Part of #4.

## Acceptance Criteria
- [ ] Route \`/watchlist\` renders watchlist table
- [ ] Reads \`dcf_watchlist\` from localStorage (same key/format as vanilla)
- [ ] Columns: ticker, name, fair price, current price, upside, saved date
- [ ] Live refresh: TanStack Query \`refetchInterval: 180_000\`, batch fetch via \`/api/batch/quotes?tickers=...\`
- [ ] Loading: \`<Skeleton />\` in price/upside cells during first fetch
- [ ] Error: "—" in cell on failed fetch (not infinite skeleton)
- [ ] Table sorted by upside descending, re-sorted on each refresh
- [ ] Row click → \`/calculadora?wl=TICKER\`
- [ ] Right-click row → context menu with "Ver Análise Avançada" → \`/analise?ticker=TICKER\`

## Technical Tasks
- [ ] Write \`frontend/src/pages/WatchlistPage.tsx\`
- [ ] Wire TanStack Query with \`refetchInterval\`
- [ ] Context menu: \`onContextMenu\` handler + absolute-positioned menu div
- [ ] Manual test: add ticker via DCF page, open watchlist, wait for refresh, verify upside recalculates

## Definition of Done
- [ ] \`npm run build\` passes
- [ ] Manual test passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-page-watchlist\`
BODY
  )"
  ```

- [ ] **8 — Page: Ranking**
  ```bash
  gh issue create \
    --title "refactor(frontend): page — Ranking (port ranking.html)" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Ports \`ranking.html\` (1845 lines). 5 ranking methods, filter chips, sector tabs, saved filters, favorites. Part of #4.

## Acceptance Criteria
- [ ] Route \`/ranking\` renders ranking dashboard
- [ ] 5 method pills: Thomaz, Bazin, Graham, Lynch, Joel — change pill = re-sort (no re-fetch)
- [ ] Filter chips row: DY, P/L, DL/EBITDA, Bazin, Graham, Lynch, Margem Líq, ROE, Liquidez, Favoritos — each chip opens a popover on click; chip turns cyan when active
- [ ] Sector tabs: Todos / Seguradoras / Bancos
- [ ] Table: position badge (#1 gradient-green, #2 cyan, #3 amber, rest neutral), ticker (+ ★ button), cotação, DY, P/L, Margem Líq, ROE, DL/EBITDA, Valuation Bazin, Graham, Lynch, Joel — last 4 always shown regardless of active method
- [ ] Cache: \`ranking_cache_v2\` in localStorage, 30-min TTL; skip fetch if valid cache
- [ ] Saved filters popup: save current filters with name, load, delete
- [ ] Favorites persisted in \`ranking_favorites\` localStorage key
- [ ] Data via TanStack Query \`/api/batch/fundamentals\`
- [ ] Engines via \`frontend/src/engines/ranking-scores.ts\`

## Technical Tasks
- [ ] Write \`frontend/src/pages/RankingPage.tsx\`
- [ ] Extract: \`FilterChips.tsx\`, \`MethodPills.tsx\`, \`RankingTable.tsx\`, \`SectorTabs.tsx\`, \`FilterPopover.tsx\`
- [ ] Wire ranking-store for all state
- [ ] Manual test: load → change method → apply DY filter → save filter → toggle favorite → reload page (state persists)

## Definition of Done
- [ ] \`npm run build\` passes
- [ ] Manual golden path passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-page-ranking\`
BODY
  )"
  ```

- [ ] **9 — Page: Análise Ativo**
  ```bash
  gh issue create \
    --title "refactor(frontend): page — Análise Ativo (port analise.html)" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Ports \`analise.html\`. Individual stock analysis: hero + 4 tabs. Part of #4.

## Acceptance Criteria
- [ ] Route \`/analise\` reads \`?ticker=\` query param
- [ ] Empty state (search bar only) when no \`?ticker=\`
- [ ] Loading: skeleton hero + skeleton tab content
- [ ] Error state: message in hero for invalid ticker
- [ ] Hero: full company name, ticker badge (cyan mono), large price, change% (green/red), 4 KPI chips (Mkt Cap, 52w Hi, 52w Lo, DY, P/L), 52-week progress bar with current price dot
- [ ] Tab Indicadores: 3 groups × 4-col grid — Valuation (P/L, P/VP, EV/EBITDA, DY), Rentabilidade (ROE, ROIC, Margem Líq, Crescimento), Estrutura (DL/EBITDA, Payout, LPA, VPA) — each cell has CSS-only tooltip via \`?\` icon
- [ ] Tab Valuations: Bazin card (cyan), Graham card (purple), Lynch card (green), Joel card (amber), DCF card — reads \`dcf_watchlist\` localStorage; CTA if not calculated
- [ ] Tab Histórico: net income table from \`/api/quote\`, YoY % change column
- [ ] Tab Gráfico: TradingView widget (\`BMFBOVESPA:TICKER\`, dark theme, 520px height); 8 period buttons (1D, 5D, 1M, 6M, YTD, 12M, 60M, ALL); button click recreates widget

## Technical Tasks
- [ ] Write \`frontend/src/pages/AnalisePage.tsx\`
- [ ] Extract: \`StockHero.tsx\`, \`IndicadoresTab.tsx\`, \`ValuationsTab.tsx\`, \`HistoricoTab.tsx\`, \`TradingViewWidget.tsx\`
- [ ] TradingView: \`useEffect\` injects \`<script>\`, cleanup removes it; \`key={period}\` on container triggers recreate
- [ ] Wire TanStack Query for \`/api/fundamentals\` and \`/api/quote\`
- [ ] Manual test: open \`/analise?ticker=PETR4\`, switch all 4 tabs, change TradingView period

## Definition of Done
- [ ] \`npm run build\` passes
- [ ] Manual 4-tab test passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-page-analise\`
BODY
  )"
  ```

- [ ] **10 — Pages: FII Ranking + Análise FII**
  ```bash
  gh issue create \
    --title "refactor(frontend): pages — FII Ranking + Análise FII (port fii.html + analise-fii.html)" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Ports both FII pages together — shared data shape, smaller scope. Part of #4.

## Acceptance Criteria — FII Ranking (\`/fii\`)
- [ ] Route \`/fii\` renders FII ranking (Método 2em1: rank DY + rank P/VP)
- [ ] Filter chips: DY ≥, Liq ≥, Vac ≤, P/VP ≤, FFO Yield ≥, + Ticker (custom tickers text input)
- [ ] 7 segment tabs: Todos / Logística / Shoppings / Lajes Corp. / Papel/CRI / Residencial / Híbrido
- [ ] Table: position badge, ticker (+ ★), cotação, DY, P/VP, FFO Yield, Vacância, perfil badge (risco/crescimento/ancoragem)
- [ ] Right-click row → context menu → "Ver Análise" → \`/analise-fii?ticker=X\`
- [ ] Cache: \`fii_cache_v1\` localStorage, 30-min TTL
- [ ] Favorites: \`fii_favorites\` localStorage key
- [ ] Engine: \`frontend/src/engines/fii-scores.ts\`

## Acceptance Criteria — Análise FII (\`/analise-fii\`)
- [ ] Route \`/analise-fii\` reads \`?ticker=\`
- [ ] Hero: ticker badge, fund name, price, change%, 4 KPI chips (DY TTM, P/VP, Vacância, Segmento), 52w bar
- [ ] Tab Indicadores: 3 groups — Rentabilidade (DY TTM, DPA/ano, FFO Yield), Imóveis (Vacância, Nº Imóveis, Segmento), Mercado (P/VP, Mkt Cap, Liquidez/dia)
- [ ] Tab Proventos: 3 TTM summary cards (DPA TTM, Média/mês, Consistência X/12) + payments table with TTM badge on rows within last 12 months
- [ ] Tab Gráfico: TradingView widget + 8 period buttons

## Technical Tasks
- [ ] Write \`frontend/src/pages/FIIPage.tsx\`
- [ ] Write \`frontend/src/pages/AnaliseFIIPage.tsx\`
- [ ] Wire fii-store for FII ranking state
- [ ] Wire TanStack Query for \`/api/fii\`
- [ ] Manual test: load ranking, click ticker, open proventos tab

## Definition of Done
- [ ] \`npm run build\` passes
- [ ] Manual golden path passes
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-page-fii\`
BODY
  )"
  ```

- [ ] **11 — Pages: Carteira + Home**
  ```bash
  gh issue create \
    --title "refactor(frontend): pages — Carteira + Home (port carteira.html + home.html)" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Ports the two remaining pages. Part of #4. This card completes all 7 pages.

## Acceptance Criteria — Home (\`/\`)
- [ ] Route \`/\` renders home page
- [ ] Navigation cards for all sections (DCF, Watchlist, Ranking, Análise, FIIs, Carteira)
- [ ] Project description and links
- [ ] All inter-page navigation uses React Router \`<Link>\` (no \`<a href>\`)

## Acceptance Criteria — Carteira (\`/carteira\`)
- [ ] Route \`/carteira\` renders portfolio tracker with full feature parity to \`carteira.html\`
- [ ] Asset categories: Ações, FIIs, Renda Fixa, Cripto
- [ ] Portfolio total, allocation breakdown
- [ ] Live price refresh via TanStack Query
- [ ] All state via carteira-store (Zustand, persisted to localStorage)
- [ ] All navigation between pages uses React Router \`<Link>\`

## Technical Tasks
- [ ] Write \`frontend/src/pages/HomePage.tsx\`
- [ ] Write \`frontend/src/pages/CarteiraPage.tsx\`
- [ ] Wire carteira-store actions
- [ ] Verify all 7 routes reachable via sidebar (no broken \`<a href>\` links)
- [ ] Manual test: navigate all routes from sidebar; add asset in carteira, verify persists on reload

## Definition of Done
- [ ] \`npm run build\` passes
- [ ] All 7 routes navigable
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-page-carteira-home\`
BODY
  )"
  ```

- [ ] **12 — Vitest + RTL**
  ```bash
  gh issue create \
    --title "refactor(frontend): Vitest + React Testing Library — component tests" \
    --label "refactor:frontend" \
    --body "$(cat <<'BODY'
## Context
Final frontend card. Adds RTL component tests for the three most critical pages. Part of #4.

## Acceptance Criteria
- [ ] \`@testing-library/react\`, \`@testing-library/user-event\`, \`jsdom\`, \`@vitest/coverage-v8\` installed in \`frontend/\`
- [ ] \`frontend/vitest.config.ts\` configured with \`jsdom\` environment
- [ ] \`frontend/src/pages/DCFPage.test.tsx\`:
  - Mock TanStack Query \`useQuery\` to return fake StockQuote
  - Type ticker into search input + submit
  - Assert company name and fair price appear in DOM
- [ ] \`frontend/src/pages/RankingPage.test.tsx\`:
  - Provide mock stocks via ranking-store
  - Apply DY filter (set filterConfig.dyMin = 0.08)
  - Assert only rows with DY ≥ 8% are rendered
- [ ] \`frontend/src/pages/WatchlistPage.test.tsx\`:
  - Seed localStorage \`dcf_watchlist\` with two tickers
  - Mock \`useQuery\` — first call returns \`isLoading: true\`, second returns data
  - Assert skeletons render during loading, prices render after
- [ ] \`npm test\` in \`frontend/\` passes
- [ ] Root \`npm test\` still passes

## Technical Tasks
- [ ] Install test dependencies in \`frontend/\`
- [ ] Update \`frontend/vitest.config.ts\` (ensure jsdom env)
- [ ] Write 3 test files above
- [ ] Run both \`npm test\` suites
- [ ] Add \`frontend/\` test job to GitHub Actions CI if not already present

## Definition of Done
- [ ] Both test suites pass
- [ ] CI green

## Notes
Branch: \`refactor/ISSUE_NUMBER-vitest-rtl\`
Last frontend card before deploy swap.
BODY
  )"
  ```

---

## Task 3: Create deploy swap issue

- [ ] **Deploy swap**
  ```bash
  gh issue create \
    --title "refactor: deploy swap — Netlify → frontend/dist, Fly.io → api/main.py, delete vanilla" \
    --label "refactor:infra" \
    --body "$(cat <<'BODY'
## Context
Coordinated cutover. All 22 refactor cards must be merged before this card opens. Swaps deploy targets and deletes vanilla code.

## Prerequisites — ALL must be merged to master
Backend: scaffold-fastapi, pydantic-models, diskcache-wrapper, rate-limiter, adapter-yfinance, adapters-scrapers, router-stocks, router-fiis, router-market-portfolio, pytest-fastapi
Frontend: scaffold-vite-react, design-tokens-tailwind, engines-typescript, shared-components, zustand-stores, page-dcf, page-watchlist, page-ranking, page-analise, page-fii, page-carteira-home, vitest-rtl

## Acceptance Criteria
- [ ] \`netlify.toml\` updated: \`base = "frontend/"\`, \`publish = "dist"\`, \`command = "npm run build"\`
- [ ] \`Dockerfile\` CMD: \`["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]\`; COPY updated to include \`api/\` + \`requirements-api.txt\`
- [ ] Vanilla files deleted: \`index.html\`, \`watchlist.html\`, \`ranking.html\`, \`analise.html\`, \`fii.html\`, \`analise-fii.html\`, \`home.html\`, \`carteira.html\`, \`server.py\`, \`src/\`, \`start.bat\`
- [ ] \`CLAUDE.md\` updated: file structure, run commands, architecture sections rewritten for new stack
- [ ] \`npm test\` in \`frontend/\` + \`pytest tests/python/ -v\` — all passing
- [ ] CI green on PR (all jobs)
- [ ] Manual smoke test post-deploy: all 7 routes work on production URL; \`/health\` returns 200

## Definition of Done
- [ ] Netlify deploy green + production URL shows React app
- [ ] Fly.io deploy green + \`/health\` returns 200
- [ ] All existing features verified on production
- [ ] Issues #4 and #5 closed

## Notes
Branch: \`refactor/ISSUE_NUMBER-deploy-swap\`
BODY
  )"
  ```

---

## Task 4: Link all issues as sub-issues to #4 and #5

- [ ] Collect the 10 backend issue numbers from Task 1 output (printed as URLs — extract the trailing number)

- [ ] Collect the 12 frontend issue numbers from Task 2 output

- [ ] Link backend issues A–J to #5:
  ```bash
  # Replace with actual numbers from Task 1 (in order: A B C D E F G H I J)
  BACKEND_ISSUES=(ISSUE_A ISSUE_B ISSUE_C ISSUE_D ISSUE_E ISSUE_F ISSUE_G ISSUE_H ISSUE_I ISSUE_J)
  for id in "${BACKEND_ISSUES[@]}"; do
    gh api --method POST /repos/Leothmz/valuation-dcf-b3/issues/5/sub_issues \
      -f sub_issue_id="$id"
    echo "Linked #$id → #5"
  done
  ```

- [ ] Link frontend issues 1–12 to #4:
  ```bash
  # Replace with actual numbers from Task 2 (in order: 1 2 3 4 5 6 7 8 9 10 11 12)
  FRONTEND_ISSUES=(ISSUE_1 ISSUE_2 ISSUE_3 ISSUE_4 ISSUE_5 ISSUE_6 ISSUE_7 ISSUE_8 ISSUE_9 ISSUE_10 ISSUE_11 ISSUE_12)
  for id in "${FRONTEND_ISSUES[@]}"; do
    gh api --method POST /repos/Leothmz/valuation-dcf-b3/issues/4/sub_issues \
      -f sub_issue_id="$id"
    echo "Linked #$id → #4"
  done
  ```

- [ ] Verify: open GitHub issues #4 and #5 in browser, confirm sub-issues panel shows all children

---

## Self-Review Notes

- All 22 issue bodies are complete — no TBDs or "implement later"
- Branch slugs use `ISSUE_NUMBER` as placeholder; executor replaces after `gh issue create` returns
- Sub-issues API endpoint: `POST /repos/{owner}/{repo}/issues/{n}/sub_issues` with `-f sub_issue_id=N` — matches GitHub REST API as of 2025
- Deploy swap issue correctly lists all 22 prerequisites by slug name
- Type names (StockQuote, FIIData, FundamentalsData, etc.) consistent across all cards
