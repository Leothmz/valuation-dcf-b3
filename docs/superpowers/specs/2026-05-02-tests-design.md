# Design: Testes Unitários e de Integração

**Data:** 2026-05-02  
**Status:** Aprovado

---

## Contexto

Projeto Valuation DCF B3 — calculadora local sem bundler, sem npm, sem framework.  
Stack atual: `server.py` (Python puro + yfinance) + 4 arquivos HTML com JS vanilla inline.

Problema: todo o JS está inline nos HTMLs, impedindo testes unitários sem browser headless.

---

## Decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| JS extraction strategy | Modular por domínio (`src/*.js`) | Coesão, testes isolados por domínio |
| JS test runner | Vitest | Zero config, ESM nativo, sem bundler |
| Python test runner | pytest + unittest.mock | Padrão, sem deps extras |
| Testes de integração frontend | Não — funções extraídas são puras | Evita overhead de browser headless |
| CI | Não — só scripts locais | Projeto local sem deploy/colaboradores |
| Coverage reporters | Não incluídos agora | Pode ser adicionado depois sem mudança de estrutura |

---

## Estrutura de Arquivos

```
Valuation/
├── src/
│   ├── formatters.js       ← seção B do index.html
│   ├── parsers.js          ← seção C do index.html
│   ├── dcf-engine.js       ← seção E do index.html (growthRate, runDCF)
│   └── ranking-scores.js   ← seção D do ranking.html (5 métodos)
├── tests/
│   ├── python/
│   │   ├── test_server.py      ← unit: lógica de negócio + mocks
│   │   └── test_handler.py     ← integration: HTTP routing
│   └── js/
│       ├── dcf-engine.test.js
│       ├── formatters.test.js
│       ├── parsers.test.js
│       └── ranking-scores.test.js
├── package.json
├── server.py
├── index.html          ← importa src/*.js via <script src="...">
├── ranking.html        ← importa src/ranking-scores.js
└── watchlist.html
```

---

## Extração de JS

### Princípio
Cada `src/*.js` exporta funções puras. Os HTMLs continuam funcionando sem mudança de comportamento — trocam as funções inline por `<script src="src/xxx.js">` antes do script principal.

### `src/formatters.js`
Exporta: `fBRL`, `fPct`, `fShares`, `fNum`, `fLiq`, `trunc`, e demais formatadores da seção B.

### `src/parsers.js`
Exporta: `parsePct`, `parseLL`.

### `src/dcf-engine.js`
Exporta: `growthRate`, `runDCF`.

**Mudança de interface — `runDCF`:**  
A função atualmente lê `S` (estado global). Para torná-la testável sem mock de estado, a assinatura passa a ser:

```js
export function runDCF(assumptions, history, projYears, yearOverrides)
```

O `index.html` chama com:
```js
runDCF(S.assumptions, S.history, S.projYears, S.yearOverrides)
```

Esta é a única mudança de interface no projeto.

### `src/ranking-scores.js`
Exporta: `calcThomazScore`, `calcBazinScore`, `calcGrahamScore`, `calcLynchScore`, `calcJoelScore`.

---

## Testes Python

### Dependências
```bash
pip install pytest
```

### `tests/python/test_server.py` — lógica de negócio

Todos os testes mockam `yfinance.Ticker` com dados fixos. Sem chamada de rede real.

| Teste | O que verifica |
|-------|----------------|
| `test_get_b3_tickers_not_empty` | lista retorna > 0 tickers |
| `test_ticker_sa_suffix_added` | `"petr4"` → símbolo `"PETR4.SA"` |
| `test_ticker_sa_suffix_not_duplicated` | `"PETR4.SA"` não vira `"PETR4.SA.SA"` |
| `test_not_found_when_no_price` | retorna `{"code": "NOT_FOUND"}` quando price é None |
| `test_no_yfinance_error` | retorna `{"code": "NO_YFINANCE"}` quando import falha |
| `test_payout_calculation` | `(divs * shares) / netIncome` com valores conhecidos |
| `test_payout_filters_outliers` | payout > 2 é descartado |
| `test_investidor10_returns_empty_on_network_error` | mock urllib → retorna `[]` |
| `test_history_merges_investidor10_over_yfinance` | anos 2021+ substituídos corretamente |
| `test_history_limited_to_5_years` | `history[:5]` aplicado |
| `test_fundamentals_divida_liquida_ebit` | `(debt - cash) / \|ebitda\|` com valores conhecidos |
| `test_fundamentals_dy_from_ttm_dividends` | DY calculado via dividendos TTM, não `info["dividendYield"]` |
| `test_fundamentals_not_found_when_no_price` | retorna `{"code": "NOT_FOUND"}` |

### `tests/python/test_handler.py` — HTTP routing

Usa `http.client` contra servidor `ThreadingHTTPServer` iniciado em thread separada via `@pytest.fixture(scope="module")`. As funções `get_stock_data` e `get_fundamentals` são mockadas via `unittest.mock.patch` para evitar chamadas de rede.

| Teste | O que verifica |
|-------|----------------|
| `test_quote_endpoint_returns_json` | `GET /api/quote/PETR4` → `Content-Type: application/json` |
| `test_quote_calls_get_stock_data` | handler chama `get_stock_data("PETR4")` |
| `test_fundamentals_endpoint` | `GET /api/fundamentals/VALE3` → chama `get_fundamentals("VALE3")` |
| `test_b3_tickers_endpoint` | `GET /api/b3-tickers` → retorna `{"tickers": [...], "count": N}` |
| `test_quote_missing_ticker_returns_400` | `GET /api/quote/` → 400 |
| `test_root_redirects_to_home` | `GET /` → 302 Location `/home.html` |
| `test_cors_header_present` | resposta inclui `Access-Control-Allow-Origin: *` |

---

## Testes JavaScript

### Configuração

**`package.json`:**
```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

Ambiente: Node (não jsdom) — funções são puras, sem acesso a DOM.

### `tests/js/dcf-engine.test.js`

| Teste | O que verifica |
|-------|----------------|
| `growthRate(0.4, 0.20)` | retorna `0.12` |
| `runDCF` premissas conhecidas | `fairPrice` bate com cálculo manual |
| `runDCF` com `perp >= disc` | `results.error === 'gordon'` |
| `runDCF` com `yearOverrides` | fluxo do ano sobrescrito propaga corretamente para anos seguintes |
| `runDCF` 3 anos | `flows.length === 3` |
| `runDCF` 5 anos | `flows.length === 5` |
| Fórmula TV | `TV = lastCF / ((1+disc)/(1+perp) - 1)` |
| PV do TV | `pvTV = TV / (1+disc)^n` — não usa taxa de crescimento |
| `runDCF` ll inválido | retorna sem popular `results` |

### `tests/js/formatters.test.js`

`fBRL` é instância de `Intl.NumberFormat` — chamado via `fBRL.format(n)`.

| Teste | O que verifica |
|-------|----------------|
| `fBRL.format(1234567.89)` | `"R$ 1.234.567,89"` |
| `fBRL.format(0)` | `"R$ 0,00"` |
| `fPct(0.1234)` | `"12,34%"` (2 casas decimais padrão) |
| `fPct(0.1, 1)` | `"10,0%"` (1 casa decimal) |
| `fInputLL(null)` | retorna `""` sem throw |
| `fInputPct(null)` | retorna `""` sem throw |
| `fShares` com número grande | sem throw, retorna string |

### `tests/js/parsers.test.js`

| Teste | O que verifica |
|-------|----------------|
| `parseLL("367M")` | `367_000_000` |
| `parseLL("0,37B")` | `370_000_000` |
| `parseLL("367.766.000")` | `367_766_000` |
| `parseLL("367766000")` | `367_766_000` |
| `parsePct("10,5")` | `0.105` |
| `parsePct("10.5")` | `0.105` |
| `parsePct("10")` | `0.10` |

### `tests/js/ranking-scores.test.js`

Cada método recebe array de stocks mockados com campos necessários.

| Teste | O que verifica |
|-------|----------------|
| `calcBazinScore` preço teto | `fairPrice = dpa / taxaBazin` |
| `calcBazinScore` ordenação | maior margem de segurança → maior score |
| `calcGrahamScore` preço teto | `fairPrice = √(mult × lpa × vpa)` |
| `calcGrahamScore` pl negativo | tratado sem throw |
| `calcLynchScore` PEG baixo | recebe score maior |
| `calcThomazScore` pesos | stock com melhor DY+ROE recebe score maior que os demais |
| `calcJoelScore` sem fairPrice | `fairPrice === null` para todos |
| `calcJoelScore` ordenação | earnings yield + ROIC combinados determinam rank |
| Todos os métodos | retornam array com `score` e `fairPrice` em cada item |

---

## Como Rodar

```bash
# JavaScript
npm install
npm test

# Python
pip install pytest
pytest tests/python/ -v
```

---

## O que NÃO está no escopo

- Testes E2E de UI (renderização, DOM, eventos)
- Testes de `watchlist.html` e `home.html` (sem lógica extraível)
- Coverage reporters
- CI/CD
