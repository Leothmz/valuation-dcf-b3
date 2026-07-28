# Valuation DCF · B3

Calculadora de Valuation por **Fluxo de Caixa Descontado (DCF)** para ações da B3.

Informe um ticker, ajuste as premissas e obtenha o **preço teto (valor intrínseco)** da ação.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | FastAPI + Pydantic v2 + diskcache (SQLite) |
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Roteamento | React Router v7 |
| Data fetching | TanStack Query v5 |
| Estado | Zustand v5 |
| Dados | yfinance + scraping investidor10 / statusinvest / fundamentus |

---

## Funcionalidades

- **Calculadora DCF** — Engine DCF completa com projeção por 3 ou 5 anos + Gordon Growth Model; tabela editável ano a ano
- **Watchlist** — acompanhe valuations salvos com cotações ao vivo e upside calculado
- **Ranking de Ações** — screening de ~130 tickers com 5 métodos: Thomaz/GD, Bazin, Graham, Peter Lynch, Joel Greenblatt
- **Ranking de FIIs** — Rank Thomaz FII (rank DY + rank P/VP), filtros de segmento, vacância, liquidez, FFO Yield
- **Análise Individual** — hero com KPIs, indicadores com tooltips, valuations teóricos, histórico de LL, gráfico TradingView
- **Análise de FII** — indicadores de rentabilidade/imóveis/mercado, histórico de proventos TTM
- **Carteira** — rastreamento de posições com P&L ao vivo, histórico gráfico, log de operações, proventos e renda fixa
- **Rate limiting** — 60 req/60s por IP na API
- **Cache inteligente** — cotações 5 min, fundamentals 6h, dados de mercado 1h (diskcache SQLite)

---

## Pré-requisitos

- Python 3.10+
- Node.js 20+
- pip

---

## Instalação e uso

### Backend (FastAPI)

```bash
# Clone o repositório
git clone https://github.com/Leothmz/valuation-dcf-b3.git
cd valuation-dcf-b3

# Instale as dependências Python
pip install -r requirements-api.txt

# Inicie o servidor
python -m uvicorn api.main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
# Acesse: http://localhost:5173
```

O frontend em dev faz proxy automático para `http://localhost:8000` (configurado em `vite.config.ts`).

---

## A Matemática DCF

### Taxa de crescimento esperada
```
g = (1 − Payout) × ROE
```

### Projeção de fluxos de caixa
```
CF_i = CF_{i-1} × (1 + g)
VPL_i = CF_i / (1 + disc)^i
```

### Valor Terminal (Gordon Growth Model)
```
TV  = CF_n × (1 + perp) / (disc − perp)
VPL_TV = TV / (1 + disc)^n
```

### Preço teto
```
EV = Σ VPL_i + VPL_TV
Preço Teto = EV / Número de Ações
```

**Parâmetros padrão:** WACC 15% · Perpetuidade 3% · Horizonte 5 anos

---

## Estrutura de Arquivos

```
valuation-dcf-b3/
├── api/                     — Backend FastAPI
│   ├── main.py              — App entry point (CORS, rate limiter, routers)
│   ├── models.py            — Pydantic v2 response models
│   ├── cache.py             — diskcache SQLite wrapper + TTL constants
│   ├── middleware.py        — Rate limiter (asyncio.Lock, deque por IP)
│   ├── routers/
│   │   ├── health.py        — GET /health
│   │   ├── stocks.py        — GET /api/quote, /api/fundamentals, /api/batch/*
│   │   ├── fiis.py          — GET /api/fii
│   │   ├── market.py        — GET /api/cdi, /api/exchange
│   │   └── portfolio.py     — POST /api/portfolio/history
│   ├── services/
│   │   ├── stock_service.py — cache-first + investidor10 enrichment
│   │   └── fii_service.py   — cache-first + statusinvest + fundamentus
│   └── adapters/
│       ├── yfinance_adapter.py  — fonte primária (StockQuote, FIIData, FundamentalsData)
│       ├── investidor10.py      — scraping net income history
│       ├── statusinvest.py      — scraping FII extras (ffoYield, vacância, segmento)
│       └── fundamentus.py       — fallback FII extras
├── frontend/                — Frontend React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── engines/         — formatters, parsers, dcf-engine, ranking-scores, fii-scores (TS)
│   │   ├── components/      — Layout, Sidebar, Skeleton, Notification, lucide icons
│   │   ├── stores/          — Zustand: DCF, Ranking, FII, Carteira
│   │   ├── pages/           — DCF, Watchlist, Ranking, Análise, FII, Carteira, Home
│   │   └── api/             — TanStack Query hooks (stocks, FIIs, market, portfolio)
│   └── dist/                — Build de produção (Netlify aponta aqui)
├── e2e/                     — Playwright (testa o frontend via http://localhost:5173)
├── tests/python/            — pytest FastAPI TestClient
├── requirements-api.txt     — fastapi, uvicorn, httpx, diskcache, yfinance
├── Dockerfile               — CMD: uvicorn api.main:app
└── netlify.toml             — base: frontend/, publish: dist
```

---

## API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `GET /health` | — | Health check |
| `GET /api/quote/{ticker}` | — | Dados DCF (preço, ROE, payout, histórico LL) |
| `GET /api/fundamentals/{ticker}` | — | Dados de ranking (P/L, P/VP, margens, DY…) |
| `GET /api/batch/quotes?tickers=` | — | Cotações em lote (comma-separated) |
| `GET /api/batch/fundamentals?tickers=` | — | Fundamentals em lote |
| `GET /api/fii/{ticker}` | — | Dados de FII (DY, P/VP, vacância, segmento, proventos) |
| `GET /api/cdi` | — | Taxa CDI acumulada (BCB) |
| `GET /api/exchange` | — | Câmbio BRL/USD via yfinance |
| `POST /api/portfolio/history` | `{tickers, dates}` | Histórico de preços para carteira |

Todos os endpoints de `/api/*` têm rate limit de 60 req/60s por IP.

---

## Testes

```bash
# Python — FastAPI TestClient (pytest)
python -m pytest tests/python/ -v

# Frontend React — engines + componentes RTL (Vitest + RTL)
cd frontend && npm test

# E2E — fluxos completos no browser (Playwright)
npm install                      # uma vez, na raiz
cd frontend && npm run dev &     # precisa do frontend rodando em localhost:5173
npx playwright test
```

| Suite | Ferramenta |
|-------|-----------|
| `tests/python/` | pytest |
| `frontend/src/` | Vitest + RTL |
| `e2e/` | Playwright |

---

## Deploy

- **Backend:** Fly.io — `docker build` usa `Dockerfile` (uvicorn na porta 8000)
- **Frontend:** Netlify — build em `frontend/`, publish `dist/`, proxy `/api/*` → Fly.io

---

## Privacidade

Todos os dados ficam locais. A única comunicação externa é com Yahoo Finance (via yfinance) e os scrapers de dados públicos (investidor10, statusinvest, fundamentus) — feita pelo backend, nunca pelo browser.

---

## Licença

[MIT](LICENSE)
