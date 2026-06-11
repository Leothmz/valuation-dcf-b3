# Refactor Cards Design — Backend (FastAPI) + Frontend (React)

**Date:** 2026-06-11  
**Issues:** #4 (frontend), #5 (backend)  
**Strategy:** Parallel development in `frontend/` and `api/` alongside vanilla code. Deploy coordinated.

---

## Architecture

### Directory structure after migration

```
Valuation/
├── frontend/          ← React 19 + TypeScript + Vite (new)
│   ├── src/
│   │   ├── engines/   ← migrated from src/ (typed TS)
│   │   ├── stores/    ← Zustand stores
│   │   ├── pages/     ← one component per page
│   │   ├── components/← shared: Layout, Sidebar, Skeleton, etc.
│   │   └── api/       ← TanStack Query hooks
│   └── dist/          ← Netlify points here after swap
├── api/               ← FastAPI + Pydantic (new)
│   ├── routers/       ← stocks, fiis, market, portfolio
│   ├── services/      ← stock_service, fii_service
│   ├── adapters/      ← yfinance, investidor10, statusinvest, fundamentus
│   ├── models.py      ← Pydantic response models
│   ├── cache.py       ← diskcache SQLite wrapper
│   └── main.py        ← FastAPI app entry point
├── index.html         ← vanilla still works during migration
├── server.py          ← vanilla still works during migration
└── src/               ← vanilla JS engines (kept until swap)
```

### Deploy swap (final coordinated card)

- Netlify: build command points to `frontend/`, publish dir → `frontend/dist`
- Fly.io: Dockerfile entrypoint changes from `server.py` → `api/main.py`
- Both changes land in a single PR; old code deleted after green CI

---

## Backend Cards (sub-issues of #5)

Dependencies flow: A → B,C,D → E,F → G,H,I → J

| Card | Title | Branch slug | Blocks |
|------|-------|-------------|--------|
| A | Scaffold FastAPI + lifespan + CORS + folder structure | `scaffold-fastapi` | B,C,D |
| B | Pydantic models: StockQuote, FIIData, Fundamentals, Portfolio | `pydantic-models` | E,F |
| C | diskcache SQLite wrapper + TTL helpers (quotes 5m, fundamentals 6h, CDI/FX 1h) | `diskcache-wrapper` | G,H,I |
| D | Rate limiter as FastAPI middleware (port current deque logic) | `rate-limiter` | G,H,I |
| E | Adapter: yfinance (primary source, returns Pydantic models) | `adapter-yfinance` | G,H,I |
| F | Adapters: investidor10 + statusinvest + fundamentus (scrapers) | `adapters-scrapers` | G,H |
| G | Router stocks: `/api/quote`, `/api/fundamentals`, `/api/batch/*` | `router-stocks` | J |
| H | Router FIIs: `/api/fii` | `router-fiis` | J |
| I | Routers market + portfolio: `/api/cdi`, `/api/exchange`, `/api/portfolio/history` | `router-market-portfolio` | J |
| J | pytest update: FastAPI TestClient + update Dockerfile entrypoint | `pytest-fastapi` | deploy |

---

## Frontend Cards (sub-issues of #4)

Dependencies flow: 1 → 2,3 → 4,5 → 6–11 → 12

| Card | Title | Branch slug | Blocks |
|------|-------|-------------|--------|
| 1 | Scaffold Vite + React 19 + TypeScript + React Router v7 + TanStack Query | `scaffold-vite-react` | 2,3,5 |
| 2 | Design tokens → Tailwind v4 config (port CSS custom properties) | `design-tokens-tailwind` | 4 |
| 3 | Migrate `src/` engines to TypeScript (formatters, parsers, dcf-engine, ranking-scores, fii-scores) | `engines-typescript` | 5,6 |
| 4 | Shared components: Layout, Sidebar, Skeleton shimmer, Notification, Lucide icons | `shared-components` | 6–11 |
| 5 | Zustand stores: DCF, Ranking, FII, Carteira | `zustand-stores` | 6–11 |
| 6 | Page: DCF Calculator (port `index.html`) | `page-dcf` | 12 |
| 7 | Page: Watchlist (port `watchlist.html`) | `page-watchlist` | 12 |
| 8 | Page: Ranking (port `ranking.html`) | `page-ranking` | 12 |
| 9 | Page: Análise Ativo (port `analise.html`) | `page-analise` | 12 |
| 10 | Page: FII Ranking + Análise FII (port `fii.html` + `analise-fii.html`) | `page-fii` | 12 |
| 11 | Page: Carteira + Home (port `carteira.html` + `home.html`) | `page-carteira-home` | 12 |
| 12 | Vitest + RTL: component tests for migrated pages | `vitest-rtl` | deploy |

---

## Coordinated Deploy Card

**Title:** `refactor: swap deploy — Netlify → frontend/dist, Fly.io → api/`  
**Branch slug:** `deploy-swap`  
**Depends on:** all 22 cards above merged and CI green  
**Actions:**
1. Update `netlify.toml` build command + publish dir
2. Update `Dockerfile` entrypoint to `api/main.py`
3. Delete `server.py`, `src/`, vanilla HTML files
4. Update `CLAUDE.md` for new structure

---

## Constraints

- **During migration:** `npm test` (Vitest on `src/`) + `pytest tests/python/` must remain green on every PR
- **Branch naming:** `refactor/<issue-number>-<slug>` (e.g. `refactor/28-scaffold-fastapi`)
- **Merge order:** each card merges to `master` independently; old vanilla code untouched until deploy swap
- **No feature work** in refactor cards — pure migration, no new functionality

---

## Out of Scope

- New features (issues #6–#27) — not part of these cards
- brapi adapter (mentioned in #5 AC but no current brapi integration exists — yfinance is the sole primary source today)
