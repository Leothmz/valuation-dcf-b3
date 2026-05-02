# Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair lógica pura dos HTMLs para módulos ES6 testáveis e criar suíte completa de testes unitários e de integração.

**Architecture:** Funções puras extraídas para `src/*.js` com exports nomeados; HTMLs convertidos para `<script type="module">` e importam de `src/`; testes JS em Vitest (Node, sem DOM); testes Python em pytest com mocks de yfinance e urllib.

**Tech Stack:** Vitest 2.x (JS), pytest + unittest.mock (Python)

---

## File Map

| Arquivo | Ação | Conteúdo |
|---------|------|---------|
| `package.json` | criar | config Vitest |
| `src/formatters.js` | criar | seção B de `index.html` |
| `src/parsers.js` | criar | seção C de `index.html` |
| `src/dcf-engine.js` | criar | seção E de `index.html`, `runDCF` com assinatura refatorada |
| `src/ranking-scores.js` | criar | seção D de `ranking.html`, `calcThomazScore` com `watchlistMap` como param |
| `tests/js/formatters.test.js` | criar | testes dos formatadores |
| `tests/js/parsers.test.js` | criar | testes dos parsers |
| `tests/js/dcf-engine.test.js` | criar | testes do motor DCF |
| `tests/js/ranking-scores.test.js` | criar | testes dos 5 métodos de ranking |
| `tests/python/test_server.py` | criar | unit tests Python com mocks |
| `tests/python/test_handler.py` | criar | integration tests HTTP |
| `index.html:938` | modificar | `<script>` → `<script type="module">` + imports |
| `ranking.html:764` | modificar | `<script>` → `<script type="module">` + imports |

---

## Task 1: Setup Vitest

**Files:**
- Create: `package.json`

- [ ] **Step 1: Criar package.json**

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

- [ ] **Step 2: Instalar dependências**

```bash
npm install
```

Esperado: `node_modules/` criado, sem erros.

- [ ] **Step 3: Verificar que vitest funciona**

Criar arquivo temporário `tests/js/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest';
describe('smoke', () => {
  it('runs', () => expect(1 + 1).toBe(2));
});
```

```bash
npm test
```

Esperado: `1 passed`.

- [ ] **Step 4: Remover smoke test**

```bash
rm tests/js/smoke.test.js
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vitest for JS unit tests"
```

---

## Task 2: Formatters — teste + extração

**Files:**
- Create: `tests/js/formatters.test.js`
- Create: `src/formatters.js`

- [ ] **Step 1: Criar teste falhando**

`tests/js/formatters.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { fBRL, fShort, fPct, fShares, fInputLL, fInputPctSigned, fInputPct } from '../../src/formatters.js';

describe('fBRL', () => {
  it('formata número com separadores pt-BR', () => {
    expect(fBRL.format(1234567.89)).toContain('1.234.567,89');
  });
  it('formata zero', () => {
    expect(fBRL.format(0)).toContain('0,00');
  });
});

describe('fShort', () => {
  it('é wrapper de fBRL.format', () => {
    expect(fShort(1000)).toBe(fBRL.format(1000));
  });
});

describe('fPct', () => {
  it('converte decimal para porcentagem com 2 casas', () => {
    expect(fPct(0.1234)).toBe('12,34%');
  });
  it('aceita dec personalizado', () => {
    expect(fPct(0.1, 1)).toBe('10,0%');
  });
  it('funciona com zero', () => {
    expect(fPct(0)).toBe('0,00%');
  });
});

describe('fInputLL', () => {
  it('retorna string vazia para null', () => {
    expect(fInputLL(null)).toBe('');
  });
  it('formata sem casas decimais', () => {
    expect(fInputLL(1234567)).toContain('1.234.567');
  });
});

describe('fInputPct', () => {
  it('retorna string vazia para null', () => {
    expect(fInputPct(null)).toBe('');
  });
  it('converte 0.15 para "15,00"', () => {
    expect(fInputPct(0.15)).toBe('15,00');
  });
});

describe('fInputPctSigned', () => {
  it('retorna string vazia para null', () => {
    expect(fInputPctSigned(null)).toBe('');
  });
  it('positivo recebe sinal +', () => {
    expect(fInputPctSigned(0.10)).toBe('+10,00');
  });
  it('negativo recebe sinal -', () => {
    expect(fInputPctSigned(-0.05)).toBe('-5,00');
  });
});

describe('fShares', () => {
  it('formata número sem casas decimais', () => {
    expect(fShares(1000000)).toContain('1.000.000');
  });
});
```

- [ ] **Step 2: Verificar que testa falha**

```bash
npm test
```

Esperado: `Cannot find module '../../src/formatters.js'`

- [ ] **Step 3: Criar src/formatters.js**

```js
export const fBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

export function fShort(n) {
  return fBRL.format(n);
}

export function fPct(n, dec = 2) {
  return (n * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  }) + '%';
}

export function fShares(n) {
  return n.toLocaleString('pt-BR');
}

export function fInputLL(n) {
  if (n == null) return '';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function fInputPctSigned(n) {
  if (n == null) return '';
  const pct = n * 100;
  const sign = pct >= 0 ? '+' : '';
  return sign + pct.toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

export function fInputPct(n) {
  if (n == null) return '';
  return (n * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm test
```

Esperado: `8 passed` em `formatters.test.js`.

- [ ] **Step 5: Commit**

```bash
git add src/formatters.js tests/js/formatters.test.js
git commit -m "feat: extract formatters to src/formatters.js with tests"
```

---

## Task 3: Parsers — teste + extração

**Files:**
- Create: `tests/js/parsers.test.js`
- Create: `src/parsers.js`

- [ ] **Step 1: Criar teste falhando**

`tests/js/parsers.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parsePct, parseLL } from '../../src/parsers.js';

describe('parsePct', () => {
  it('converte "10" para 0.10', () => {
    expect(parsePct('10')).toBeCloseTo(0.10);
  });
  it('aceita vírgula como decimal', () => {
    expect(parsePct('10,5')).toBeCloseTo(0.105);
  });
  it('aceita ponto como decimal', () => {
    expect(parsePct('10.5')).toBeCloseTo(0.105);
  });
  it('retorna null para string vazia', () => {
    expect(parsePct('')).toBeNull();
  });
  it('retorna null para null', () => {
    expect(parsePct(null)).toBeNull();
  });
});

describe('parseLL', () => {
  it('parseia número puro', () => {
    expect(parseLL('367766000')).toBe(367766000);
  });
  it('parseia número com pontos (formato pt-BR)', () => {
    expect(parseLL('367.766.000')).toBe(367766000);
  });
  it('parseia sufixo M', () => {
    expect(parseLL('367M')).toBe(367e6);
  });
  it('parseia sufixo m (minúsculo)', () => {
    expect(parseLL('367m')).toBe(367e6);
  });
  it('parseia sufixo B com vírgula', () => {
    expect(parseLL('0,37B')).toBeCloseTo(370e6);
  });
  it('parseia sufixo K', () => {
    expect(parseLL('500K')).toBe(500e3);
  });
  it('retorna null para string vazia', () => {
    expect(parseLL('')).toBeNull();
  });
  it('retorna null para valor inválido', () => {
    expect(parseLL('abc')).toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que teste falha**

```bash
npm test
```

Esperado: `Cannot find module '../../src/parsers.js'`

- [ ] **Step 3: Criar src/parsers.js**

```js
export function parsePct(s) {
  if (!s || !s.trim()) return null;
  const n = parseFloat(
    s.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')
  );
  return isNaN(n) ? null : n / 100;
}

export function parseLL(s) {
  if (!s || !s.trim()) return null;
  let raw = s.trim();
  let mult = 1;
  if (/B$/i.test(raw))      { mult = 1e9; raw = raw.slice(0, -1); }
  else if (/M$/i.test(raw)) { mult = 1e6; raw = raw.slice(0, -1); }
  else if (/K$/i.test(raw)) { mult = 1e3; raw = raw.slice(0, -1); }
  const n = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? null : n * mult;
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm test
```

Esperado: `9 passed` em `parsers.test.js`.

- [ ] **Step 5: Commit**

```bash
git add src/parsers.js tests/js/parsers.test.js
git commit -m "feat: extract parsers to src/parsers.js with tests"
```

---

## Task 4: DCF Engine — teste + extração

**Files:**
- Create: `tests/js/dcf-engine.test.js`
- Create: `src/dcf-engine.js`

**Nota sobre a interface:** `runDCF` deixa de ler/escrever em `S` global. Nova assinatura:
`runDCF(assumptions, history, projYears, yearOverrides)` — retorna o objeto resultado (ou `null`/`{error}`)

- [ ] **Step 1: Criar teste falhando**

`tests/js/dcf-engine.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { growthRate, runDCF } from '../../src/dcf-engine.js';

const BASE_ASSUMPTIONS = {
  ll: 1_000_000,
  disc: 0.15,
  perp: 0.03,
  g: 0.10,
  shares: 100_000,
  price: 50,
};
const BASE_HISTORY = [{ year: 2023, value: 1_000_000 }];

describe('growthRate', () => {
  it('calcula (1 - payout) * roe', () => {
    expect(growthRate(0.4, 0.20)).toBeCloseTo(0.12);
  });
  it('retorna 0 quando payout é 1', () => {
    expect(growthRate(1, 0.20)).toBe(0);
  });
  it('retorna roe quando payout é 0', () => {
    expect(growthRate(0, 0.20)).toBe(0.20);
  });
});

describe('runDCF — inputs inválidos', () => {
  it('retorna null quando ll é 0', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, ll: 0 }, BASE_HISTORY, 5, {});
    expect(r).toBeNull();
  });
  it('retorna null quando ll é negativo', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, ll: -100 }, BASE_HISTORY, 5, {});
    expect(r).toBeNull();
  });
  it('retorna null quando shares é null', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, shares: null }, BASE_HISTORY, 5, {});
    expect(r).toBeNull();
  });
  it('retorna {error:"gordon"} quando perp >= disc', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, perp: 0.15 }, BASE_HISTORY, 5, {});
    expect(r).toMatchObject({ error: 'gordon' });
  });
});

describe('runDCF — projeção', () => {
  it('gera 3 fluxos quando projYears=3', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.flows).toHaveLength(3);
  });
  it('gera 5 fluxos quando projYears=5', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 5, {});
    expect(r.flows).toHaveLength(5);
  });
  it('primeiro ano de projeção = baseYear + 1', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.flows[0].year).toBe(2024);
  });
  it('CF do ano 1 = ll * (1 + g)', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.flows[0].cf).toBeCloseTo(1_100_000);
  });
  it('fairPrice com valores conhecidos', () => {
    // Premissas: ll=1M, disc=0.15, perp=0.03, g=0.10, shares=100k, projYears=3
    // Resultado calculado manualmente: ~102.58
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.fairPrice).toBeCloseTo(102.58, 1);
  });
  it('yearOverride sobrescreve CF do ano', () => {
    const overrides = { 2024: 2_000_000 };
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, overrides);
    expect(r.flows[0].cf).toBe(2_000_000);
  });
  it('yearOverride propaga para anos seguintes', () => {
    const overrides = { 2024: 2_000_000 };
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, overrides);
    // Ano 2025 = 2_000_000 * 1.10 (sem override)
    expect(r.flows[1].cf).toBeCloseTo(2_200_000);
  });
});

describe('runDCF — fórmulas financeiras', () => {
  it('PV de cada fluxo = cf / (1+disc)^i', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const expectedPV1 = 1_100_000 / Math.pow(1.15, 1);
    expect(r.pvFlows[0].pv).toBeCloseTo(expectedPV1);
  });
  it('TV = lastCF / ((1+disc)/(1+perp) - 1)', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const lastCF = r.flows[2].cf;
    const expectedTV = lastCF / ((1.15 / 1.03) - 1);
    expect(r.tv).toBeCloseTo(expectedTV);
  });
  it('pvTV = TV / (1+disc)^n — usa disc, não g', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const expectedPvTV = r.tv / Math.pow(1.15, 3);
    expect(r.pvTV).toBeCloseTo(expectedPvTV);
  });
  it('ev = sumPV + pvTV', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.ev).toBeCloseTo(r.sumPV + r.pvTV);
  });
  it('upside = (fairPrice - price) / fairPrice', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const expected = (r.fairPrice - 50) / r.fairPrice;
    expect(r.upside).toBeCloseTo(expected);
  });
});
```

- [ ] **Step 2: Verificar que teste falha**

```bash
npm test
```

Esperado: `Cannot find module '../../src/dcf-engine.js'`

- [ ] **Step 3: Criar src/dcf-engine.js**

```js
export function growthRate(payout, roe) {
  return (1 - payout) * roe;
}

export function runDCF(assumptions, history, projYears, yearOverrides) {
  const a = assumptions;
  if (!a.ll || a.ll <= 0 || !a.disc || !a.perp || !a.shares) return null;
  if (a.perp >= a.disc) return { error: 'gordon' };

  const g = a.g ?? 0;
  const n = projYears;
  const currentYear = new Date().getFullYear();
  const baseYear = history.length ? history[0].year : currentYear - 1;

  const flows = [];
  let prevCF = a.ll;
  for (let i = 1; i <= n; i++) {
    const year = baseYear + i;
    let cf, actualG;
    if (yearOverrides[year] != null) {
      cf = yearOverrides[year];
      actualG = prevCF > 0 ? (cf / prevCF - 1) : 0;
    } else {
      cf = prevCF * (1 + g);
      actualG = g;
    }
    flows.push({ year, cf, g: actualG });
    prevCF = cf;
  }

  const pvFlows = flows.map((f, i) => ({
    ...f,
    pv: f.cf / Math.pow(1 + a.disc, i + 1)
  }));

  const lastCF = flows[n - 1].cf;
  const tvDenom = (1 + a.disc) / (1 + a.perp) - 1;
  const tv = lastCF / tvDenom;
  const pvTV = tv / Math.pow(1 + a.disc, n);
  const sumPV = pvFlows.reduce((acc, f) => acc + f.pv, 0);
  const ev = sumPV + pvTV;
  const fairPrice = ev / a.shares;
  const upside = a.price ? (fairPrice - a.price) / fairPrice : null;

  return { flows, pvFlows, tv, pvTV, sumPV, ev, fairPrice, upside, baseYear };
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm test
```

Esperado: todos os testes em `dcf-engine.test.js` passam.

- [ ] **Step 5: Commit**

```bash
git add src/dcf-engine.js tests/js/dcf-engine.test.js
git commit -m "feat: extract DCF engine to src/dcf-engine.js with tests"
```

---

## Task 5: Ranking Scores — teste + extração

**Files:**
- Create: `tests/js/ranking-scores.test.js`
- Create: `src/ranking-scores.js`

**Nota sobre interface:** `calcThomazScore` ganha parâmetro `watchlistMap = {}` (antes lia `getWatchlistMap()` do localStorage). `calcBazinScore` e `calcGrahamScore` usam defaults `0.06` e `22.5` em vez de `S.filterConfig`.

- [ ] **Step 1: Criar teste falhando**

`tests/js/ranking-scores.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  calcThomazScore, calcBazinScore, calcGrahamScore,
  calcLynchScore, calcJoelScore
} from '../../src/ranking-scores.js';

const WEIGHTS = { dy: 2, pl: 2, margemLiquida: 1, dividaLiquidaEbit: 1, roe: 1, roic: 1 };

function stock(overrides) {
  return {
    ticker: 'TEST',
    price: 10,
    dy: 0.06, pl: 10, margemLiquida: 0.15, dividaLiquidaEbit: 2,
    roe: 0.20, roic: 0.15, dpa: 0.60, lpa: 1.0, vpa: 5.0,
    pvp: 2.0, crescimentoLucros: 0.15, pegRatio: null,
    ...overrides
  };
}

describe('calcThomazScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcThomazScore([], WEIGHTS)).toEqual([]);
  });
  it('retorna score e fairPrice em cada item', () => {
    const result = calcThomazScore([stock({ ticker: 'A' }), stock({ ticker: 'B' })], WEIGHTS);
    expect(result[0]).toHaveProperty('score');
    expect(result[0]).toHaveProperty('fairPrice');
  });
  it('score entre 0 e 100', () => {
    const stocks = [stock({ ticker: 'A' }), stock({ ticker: 'B', dy: 0.12 })];
    const result = calcThomazScore(stocks, WEIGHTS);
    result.forEach(s => {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    });
  });
  it('stock com melhor DY recebe score maior', () => {
    const stocks = [
      stock({ ticker: 'BOM', dy: 0.15, pl: 8 }),
      stock({ ticker: 'RUIM', dy: 0.02, pl: 25 }),
    ];
    const result = calcThomazScore(stocks, WEIGHTS);
    const bom  = result.find(s => s.ticker === 'BOM');
    const ruim = result.find(s => s.ticker === 'RUIM');
    expect(bom.score).toBeGreaterThan(ruim.score);
  });
  it('usa watchlistMap para fairPrice', () => {
    const wl = { 'A': { fairPrice: 99.99 } };
    const result = calcThomazScore([stock({ ticker: 'A' })], WEIGHTS, wl);
    expect(result[0].fairPrice).toBe(99.99);
  });
  it('fairPrice null quando não está na watchlist', () => {
    const result = calcThomazScore([stock({ ticker: 'A' })], WEIGHTS, {});
    expect(result[0].fairPrice).toBeNull();
  });
});

describe('calcBazinScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcBazinScore([])).toEqual([]);
  });
  it('preço teto = dpa / taxaBazin', () => {
    const result = calcBazinScore([stock({ ticker: 'A', dpa: 0.60 })], 0.06);
    expect(result[0].fairPrice).toBeCloseTo(10.0);
  });
  it('fairPrice null quando dpa é null', () => {
    const result = calcBazinScore([stock({ ticker: 'A', dpa: null })]);
    expect(result[0].fairPrice).toBeNull();
  });
  it('stock com maior upside recebe score maior', () => {
    const stocks = [
      stock({ ticker: 'BARATO', dpa: 1.20, price: 10 }), // fairPrice=20, upside=50%
      stock({ ticker: 'CARO',   dpa: 0.30, price: 10 }), // fairPrice=5, upside=-100%
    ];
    const result = calcBazinScore(stocks, 0.06);
    const barato = result.find(s => s.ticker === 'BARATO');
    const caro   = result.find(s => s.ticker === 'CARO');
    expect(barato.score).toBeGreaterThan(caro.score);
  });
});

describe('calcGrahamScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcGrahamScore([])).toEqual([]);
  });
  it('preço Graham = sqrt(mult * lpa * vpa)', () => {
    // sqrt(22.5 * 1.0 * 5.0) = sqrt(112.5) ≈ 10.607
    const result = calcGrahamScore([stock({ ticker: 'A', lpa: 1.0, vpa: 5.0 })], 22.5);
    expect(result[0].fairPrice).toBeCloseTo(Math.sqrt(22.5 * 1.0 * 5.0));
  });
  it('fairPrice null quando lpa <= 0', () => {
    const result = calcGrahamScore([stock({ ticker: 'A', lpa: -1, vpa: 5 })]);
    expect(result[0].fairPrice).toBeNull();
  });
  it('fairPrice null quando vpa <= 0', () => {
    const result = calcGrahamScore([stock({ ticker: 'A', lpa: 1, vpa: 0 })]);
    expect(result[0].fairPrice).toBeNull();
  });
  it('retorna score e fairPrice em cada item', () => {
    const result = calcGrahamScore([stock({ ticker: 'A' })]);
    expect(result[0]).toHaveProperty('score');
    expect(result[0]).toHaveProperty('fairPrice');
  });
});

describe('calcLynchScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcLynchScore([])).toEqual([]);
  });
  it('retorna score e fairPrice em cada item', () => {
    const result = calcLynchScore([stock({ ticker: 'A' })]);
    expect(result[0]).toHaveProperty('score');
    expect(result[0]).toHaveProperty('fairPrice');
  });
  it('PEG < 0.5 recebe score maior que PEG > 1.5', () => {
    const stocks = [
      stock({ ticker: 'BOM',  pl: 5,  crescimentoLucros: 0.50, pegRatio: 0.1 }),
      stock({ ticker: 'RUIM', pl: 30, crescimentoLucros: 0.05, pegRatio: 6.0 }),
    ];
    const result = calcLynchScore(stocks);
    const bom  = result.find(s => s.ticker === 'BOM');
    const ruim = result.find(s => s.ticker === 'RUIM');
    expect(bom.score).toBeGreaterThan(ruim.score);
  });
});

describe('calcJoelScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcJoelScore([])).toEqual([]);
  });
  it('fairPrice sempre null (Joel não gera preço teto)', () => {
    const result = calcJoelScore([stock({ ticker: 'A' }), stock({ ticker: 'B' })]);
    result.forEach(s => expect(s.fairPrice).toBeNull());
  });
  it('retorna score em cada item', () => {
    const result = calcJoelScore([stock({ ticker: 'A' })]);
    expect(result[0]).toHaveProperty('score');
  });
  it('stock com menor PL e maior ROIC recebe score maior', () => {
    const stocks = [
      stock({ ticker: 'BOM',  pl: 5,  roic: 0.25 }),
      stock({ ticker: 'RUIM', pl: 30, roic: 0.02 }),
    ];
    const result = calcJoelScore(stocks);
    const bom  = result.find(s => s.ticker === 'BOM');
    const ruim = result.find(s => s.ticker === 'RUIM');
    expect(bom.score).toBeGreaterThan(ruim.score);
  });
});
```

- [ ] **Step 2: Verificar que teste falha**

```bash
npm test
```

Esperado: `Cannot find module '../../src/ranking-scores.js'`

- [ ] **Step 3: Criar src/ranking-scores.js**

```js
function _rankMetric(stocks, key, dir) {
  const valid = stocks.filter(s => s[key] != null && !isNaN(s[key]));
  valid.sort((a, b) => dir === 'desc' ? b[key] - a[key] : a[key] - b[key]);
  const map = {};
  valid.forEach((s, i) => { map[s.ticker] = i + 1; });
  return map;
}

function _scoreFromRank(rank, n) {
  if (n < 2) return 50;
  return Math.round(100 * (1 - (rank - 1) / (n - 1)));
}

export function calcThomazScore(stocks, weights, watchlistMap = {}) {
  if (stocks.length === 0) return [];
  const w = weights;
  const totalW = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const n = stocks.length;

  const plPos     = stocks.filter(s => s.pl != null && s.pl > 0);
  const rankPL_map = _rankMetric(plPos, 'pl', 'asc');
  const rankDY    = _rankMetric(stocks, 'dy',                'desc');
  const rankML    = _rankMetric(stocks, 'margemLiquida',     'desc');
  const rankDE    = _rankMetric(stocks, 'dividaLiquidaEbit', 'asc');
  const rankROE   = _rankMetric(stocks, 'roe',               'desc');
  const rankROIC  = _rankMetric(stocks, 'roic',              'desc');

  return stocks.map(s => {
    const t   = s.ticker;
    const bad = n + 1;
    const rankPL = rankPL_map[t] || bad;

    const wr = (
      (rankDY[t]   || bad) * w.dy +
      rankPL               * w.pl +
      (rankML[t]   || bad) * w.margemLiquida +
      (rankDE[t]   || bad) * w.dividaLiquidaEbit +
      (rankROE[t]  || bad) * w.roe +
      (rankROIC[t] || bad) * w.roic
    ) / totalW;

    const score     = _scoreFromRank(wr, n + 1);
    const fairPrice = watchlistMap[t] ? watchlistMap[t].fairPrice : null;
    return { ...s, score, fairPrice };
  });
}

export function calcBazinScore(stocks, taxaBazin = 0.06) {
  if (stocks.length === 0) return [];
  const scored = stocks.map(s => {
    const fairPrice = s.dpa ? s.dpa / taxaBazin : null;
    const upside    = fairPrice ? (fairPrice - s.price) / fairPrice : null;
    return { ...s, fairPrice, _upside: upside };
  });
  const valid = scored.filter(s => s._upside != null);
  if (valid.length < 2) {
    return scored.map(s => ({ ...s, score: s._upside != null ? 50 : null }));
  }
  const rankMap = {};
  [...valid].sort((a, b) => b._upside - a._upside)
    .forEach((s, i) => { rankMap[s.ticker] = i + 1; });
  const nv = valid.length;
  return scored.map(s => ({
    ...s,
    score: rankMap[s.ticker] ? _scoreFromRank(rankMap[s.ticker], nv) : null,
  }));
}

export function calcGrahamScore(stocks, multiplier = 22.5) {
  if (stocks.length === 0) return [];
  return stocks.map(s => {
    const { lpa, vpa, pl, pvp, dy, margemLiquida, roe } = s;
    let fairPrice = null;
    if (lpa > 0 && vpa > 0) fairPrice = Math.sqrt(multiplier * lpa * vpa);

    let score = 0;
    if (pl  != null && pl  > 0 && pl  < 15)  score += 20;
    else if (pl != null && pl > 0 && pl < 25) score += 10;
    if (pvp != null && pvp > 0 && pvp < 1.5) score += 20;
    else if (pvp != null && pvp > 0 && pvp < 2.5) score += 10;
    if (pl != null && pvp != null && pl > 0 && pvp > 0 && pl * pvp < 22.5) score += 10;
    if (dy  != null && dy  > 0)                    score += 10;
    if (lpa != null && lpa > 0)                    score += 10;
    if (vpa != null && vpa > 0)                    score += 10;
    if (margemLiquida != null && margemLiquida > 0.05) score += 10;
    if (roe != null && roe > 0.15)                 score += 10;
    return { ...s, fairPrice, score };
  });
}

export function calcLynchScore(stocks) {
  if (stocks.length === 0) return [];
  return stocks.map(s => {
    const { lpa, pl, crescimentoLucros, margemLiquida, roe, pegRatio } = s;
    let fairPrice = null;
    if (lpa && crescimentoLucros > 0) {
      fairPrice = lpa * (crescimentoLucros * 100);
    }
    const peg = pegRatio ?? (pl && crescimentoLucros > 0 ? pl / (crescimentoLucros * 100) : null);
    let score = 0;
    if (peg != null) {
      if      (peg < 0.5) score += 50;
      else if (peg < 1.0) score += 35;
      else if (peg < 1.5) score += 20;
      else                score += 5;
    }
    if (crescimentoLucros != null && crescimentoLucros > 0.20) score += 20;
    else if (crescimentoLucros != null && crescimentoLucros > 0.10) score += 10;
    if (margemLiquida != null && margemLiquida > 0.10) score += 15;
    if (roe           != null && roe           > 0.20) score += 15;
    return { ...s, fairPrice, score, _peg: peg };
  });
}

export function calcJoelScore(stocks) {
  if (stocks.length === 0) return [];
  const n = stocks.length;
  const bad = n + 1;
  const plPos      = stocks.filter(s => s.pl != null && s.pl > 0);
  const rankEY_map  = _rankMetric(plPos, 'pl', 'asc');
  const rankROIC_map = _rankMetric(stocks, 'roic', 'desc');

  return stocks.map(s => {
    const rEY    = rankEY_map[s.ticker]   || bad;
    const rROIC  = rankROIC_map[s.ticker] || bad;
    const combined = (rEY + rROIC) / 2;
    const score = _scoreFromRank(combined, n + 1);
    const earningsYield = (s.pl != null && s.pl > 0) ? (1 / s.pl) : null;
    return { ...s, score, fairPrice: null, _earningsYield: earningsYield };
  });
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm test
```

Esperado: todos os testes em `ranking-scores.test.js` passam.

- [ ] **Step 5: Commit**

```bash
git add src/ranking-scores.js tests/js/ranking-scores.test.js
git commit -m "feat: extract ranking scores to src/ranking-scores.js with tests"
```

---

## Task 6: Wiring index.html

**Files:**
- Modify: `index.html:938`

**Objetivo:** Converter o `<script>` inline para `type="module"`, importar de `src/`, remover as funções duplicadas, atualizar 3 call sites de `runDCF()`.

- [ ] **Step 1: Converter tag script e adicionar imports**

Em `index.html`, linha 938, substituir:
```html
<script>
'use strict';
```
por:
```html
<script type="module">
'use strict';
import { fBRL, fShort, fPct, fShares, fInputLL, fInputPctSigned, fInputPct } from './src/formatters.js';
import { parsePct, parseLL } from './src/parsers.js';
import { growthRate, runDCF as _runDCF } from './src/dcf-engine.js';
```

- [ ] **Step 2: Remover seções B e C do inline script**

Remover as linhas 946–998 (seções B e C completas — `fBRL`, `fShort`, `fPct`, `fShares`, `fInputLL`, `fInputPctSigned`, `fInputPct`, `parsePct`, `parseLL`).

- [ ] **Step 3: Remover seção E do inline script e substituir**

Remover as linhas 1024–1082 (seção E completa — `growthRate` e `runDCF` originais).

No lugar, adicionar wrapper que mantém a assinatura original para o restante do código:

```js
// ── E: DCF Engine ─────────────────────────────────────────────
function rerunDCF() {
  S.results = _runDCF(S.assumptions, S.history, S.projYears, S.yearOverrides);
}
```

- [ ] **Step 4: Substituir call sites de runDCF()**

Linha 1315 (dentro de `rerender`):
```js
runDCF();
```
→
```js
rerunDCF();
```

Linha 1437 (dentro do handler de year override — LL):
```js
runDCF();
```
→
```js
rerunDCF();
```

Linha 1460 (dentro do handler de year override — crescimento):
```js
runDCF();
```
→
```js
rerunDCF();
```

- [ ] **Step 5: Testar no browser**

Iniciar servidor (`python server.py`), abrir `http://localhost:8000`, buscar um ticker (ex: `WEGE3`) e verificar:
- Preço teto é calculado e exibido
- Tabela DCF é renderizada
- Inputs de premissas funcionam
- Salvar na watchlist funciona

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "refactor: wire index.html to import from src/*.js"
```

---

## Task 7: Wiring ranking.html

**Files:**
- Modify: `ranking.html:764`

**Objetivo:** Converter o `<script>` para `type="module"`, importar de `src/ranking-scores.js`, remover seção D inline, atualizar call site de `calcThomazScore`.

- [ ] **Step 1: Converter tag script e adicionar import**

Em `ranking.html`, linha 764, substituir:
```html
<script>
```
por:
```html
<script type="module">
import { calcThomazScore as _calcThomazScore, calcBazinScore, calcGrahamScore, calcLynchScore, calcJoelScore } from './src/ranking-scores.js';
```

- [ ] **Step 2: Remover seção D do inline script**

Remover linhas 905–1049 (seção D completa — `_rankMetric`, `_scoreFromRank`, `calcThomazScore`, `calcBazinScore`, `calcGrahamScore`, `calcLynchScore`, `calcJoelScore`).

No lugar, adicionar wrapper para `calcThomazScore` que injeta `getWatchlistMap()`:

```js
// ── D: Engines de ranking ──────────────────────────────────────────
function calcThomazScore(stocks, weights) {
  return _calcThomazScore(stocks, weights, getWatchlistMap());
}
```

- [ ] **Step 3: Verificar call sites**

Os demais call sites (`calcBazinScore`, `calcGrahamScore`, `calcLynchScore`, `calcJoelScore`) nas linhas 1142–1163 já usam os nomes importados diretamente — nenhuma mudança necessária.

- [ ] **Step 4: Testar no browser**

Abrir `http://localhost:8000/ranking.html` e verificar:
- Ranking carrega (pode ser lento — usa cache)
- Dropdown de método funciona (Thomaz, Bazin, Graham, Lynch, Joel)
- Filtros funcionam
- Preços teto são exibidos nas 4 colunas de valuation

- [ ] **Step 5: Commit**

```bash
git add ranking.html
git commit -m "refactor: wire ranking.html to import from src/ranking-scores.js"
```

---

## Task 8: Python Unit Tests

**Files:**
- Create: `tests/python/test_server.py`

- [ ] **Step 1: Criar arquivo de testes**

`tests/python/test_server.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import pytest
import unittest.mock as mock
import pandas as pd

import server


# ── Dados de mock ──────────────────────────────────────────────────

MOCK_PRICE = 35.50
MOCK_SHARES = 10_000_000

MOCK_INFO = {
    "longName": "Petróleo Brasileiro S.A.",
    "regularMarketPrice": MOCK_PRICE,
    "regularMarketChangePercent": 0.02,
    "fiftyTwoWeekHigh": 42.0,
    "fiftyTwoWeekLow": 28.0,
    "sharesOutstanding": MOCK_SHARES,
    "returnOnEquity": 0.20,
    "dividendYield": 0.06,
    "marketCap": 355_000_000,
}

def _make_financials():
    """DataFrame com formato yfinance: index=métricas, colunas=datas"""
    dates = pd.to_datetime(["2023-12-31", "2022-12-31", "2021-12-31"])
    ni = pd.Series([5_000_000, 4_000_000, 3_000_000], index=dates)
    return pd.DataFrame({"Net Income": ni}).T

def _make_dividends():
    """Série com dividendos: índice=datas, valor=dividendo por ação"""
    return pd.Series({
        pd.Timestamp("2023-06-30"): 0.10,
        pd.Timestamp("2023-12-31"): 0.10,
        pd.Timestamp("2022-06-30"): 0.08,
        pd.Timestamp("2022-12-31"): 0.08,
    })

def _make_mock_ticker(info=None, financials=None, dividends=None):
    m = mock.MagicMock()
    m.info = info if info is not None else MOCK_INFO
    m.financials = financials if financials is not None else _make_financials()
    m.dividends = dividends if dividends is not None else _make_dividends()
    return m


# ── Testes: get_b3_tickers ─────────────────────────────────────────

def test_get_b3_tickers_not_empty():
    tickers = server.get_b3_tickers()
    assert isinstance(tickers, list)
    assert len(tickers) > 0


# ── Testes: normalização de ticker ────────────────────────────────

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_ticker_sa_suffix_added(mock_i10, mock_ticker_cls):
    mock_ticker_cls.return_value = _make_mock_ticker()
    server.get_stock_data("petr4")
    mock_ticker_cls.assert_called_once_with("PETR4.SA")

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_ticker_sa_suffix_not_duplicated(mock_i10, mock_ticker_cls):
    mock_ticker_cls.return_value = _make_mock_ticker()
    server.get_stock_data("PETR4.SA")
    mock_ticker_cls.assert_called_once_with("PETR4.SA")


# ── Testes: erros ─────────────────────────────────────────────────

@mock.patch.dict('sys.modules', {'yfinance': None})
def test_no_yfinance_error():
    result = server.get_stock_data("PETR4")
    assert result["code"] == "NO_YFINANCE"

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_not_found_when_no_price(mock_i10, mock_ticker_cls):
    info = {**MOCK_INFO, "regularMarketPrice": None, "currentPrice": None, "previousClose": None}
    mock_ticker_cls.return_value = _make_mock_ticker(info=info)
    result = server.get_stock_data("INEXISTENTE")
    assert result["code"] == "NOT_FOUND"


# ── Testes: cálculo de payout ─────────────────────────────────────

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_payout_calculation(mock_i10, mock_ticker_cls):
    # shares=10M, net_income_2023=5M, divs_2023=0.20/ação
    # payout_2023 = (0.20 * 10M) / 5M = 0.40
    # payout_2022 = (0.16 * 10M) / 4M = 0.40
    # média = 0.40
    mock_ticker_cls.return_value = _make_mock_ticker()
    result = server.get_stock_data("PETR4")
    assert result["payout"] is not None
    assert abs(result["payout"] - 0.40) < 0.01

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_payout_filters_outliers(mock_i10, mock_ticker_cls):
    # Dividendos absurdamente altos → payout > 2 → descartado
    divs = pd.Series({
        pd.Timestamp("2023-12-31"): 5.0,  # 5.0 * 10M / 1M = 50x payout → descartado
    })
    info = {**MOCK_INFO, "sharesOutstanding": 10_000_000}
    fin = _make_financials()  # net_income_2023 = 5M
    mock_ticker_cls.return_value = _make_mock_ticker(info=info, financials=fin, dividends=divs)
    result = server.get_stock_data("PETR4")
    # payout de 50x é descartado → payout deve ser None (nenhum ponto válido)
    assert result["payout"] is None


# ── Testes: histórico ─────────────────────────────────────────────

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[])
def test_history_limited_to_5_years(mock_i10, mock_ticker_cls):
    dates = pd.to_datetime([f"{y}-12-31" for y in [2023, 2022, 2021, 2020, 2019, 2018]])
    ni = pd.Series([6e6, 5e6, 4e6, 3e6, 2e6, 1e6], index=dates)
    fin = pd.DataFrame({"Net Income": ni}).T
    mock_ticker_cls.return_value = _make_mock_ticker(financials=fin)
    result = server.get_stock_data("PETR4")
    assert len(result["netIncomeHistory"]) <= 5

@mock.patch('yfinance.Ticker')
@mock.patch('server._get_investidor10_net_income', return_value=[
    {"year": 2023, "netIncome": 9_000_000},
    {"year": 2022, "netIncome": 8_000_000},
])
def test_history_merges_investidor10_over_yfinance(mock_i10, mock_ticker_cls):
    # yfinance retorna 2023=5M; investidor10 retorna 2023=9M → i10 vence
    mock_ticker_cls.return_value = _make_mock_ticker()
    result = server.get_stock_data("PETR4")
    entry_2023 = next(h for h in result["netIncomeHistory"] if h["year"] == 2023)
    assert entry_2023["netIncome"] == 9_000_000


# ── Testes: investidor10 ──────────────────────────────────────────

@mock.patch('urllib.request.urlopen', side_effect=Exception("network error"))
def test_investidor10_returns_empty_on_network_error(mock_urlopen):
    result = server._get_investidor10_net_income("PETR4")
    assert result == []


# ── Testes: get_fundamentals ──────────────────────────────────────

@mock.patch('yfinance.Ticker')
def test_fundamentals_not_found_when_no_price(mock_ticker_cls):
    info = {**MOCK_INFO, "regularMarketPrice": None, "currentPrice": None, "previousClose": None}
    mock_ticker_cls.return_value = _make_mock_ticker(info=info)
    result = server.get_fundamentals("INEXISTENTE")
    assert result["code"] == "NOT_FOUND"

@mock.patch('yfinance.Ticker')
def test_fundamentals_divida_liquida_ebit(mock_ticker_cls):
    # net_debt = 100M - 20M = 80M; ebitda = 40M; ratio = 2.0
    info = {
        **MOCK_INFO,
        "totalDebt": 100_000_000,
        "totalCash": 20_000_000,
        "ebitda": 40_000_000,
        "trailingPE": 10.0,
        "profitMargins": 0.20,
        "returnOnEquity": 0.20,
        "returnOnAssets": 0.10,
        "dividendYield": 0.06,
        "trailingEps": 3.0,
        "bookValue": 15.0,
        "earningsGrowth": 0.15,
        "averageVolume": 5_000_000,
        "sector": "Energy",
        "industry": "Oil & Gas",
    }
    mock_ticker_cls.return_value = _make_mock_ticker(info=info, dividends=_make_dividends())
    result = server.get_fundamentals("PETR4")
    assert result["dividaLiquidaEbit"] is not None
    assert abs(result["dividaLiquidaEbit"] - 2.0) < 0.01

@mock.patch('yfinance.Ticker')
def test_fundamentals_dy_from_ttm_dividends(mock_ticker_cls):
    # Usa datas relativas ao dia atual para garantir que caem dentro da janela TTM (365 dias)
    # TTM total = 0.20/ação → DY = 0.20/35.50 ≈ 0.00563
    from datetime import date, timedelta
    today = date.today()
    ttm_divs = pd.Series({
        pd.Timestamp(today - timedelta(days=60)):  0.10,
        pd.Timestamp(today - timedelta(days=240)): 0.10,
    })
    info = {**MOCK_INFO, "dividendYield": 0.99}  # valor errado do yfinance deve ser ignorado
    mock_ticker_cls.return_value = _make_mock_ticker(info=info, dividends=ttm_divs)
    result = server.get_fundamentals("PETR4")
    # O DY calculado via TTM deve ser ~ 0.20/35.50, não 0.99
    assert result["dy"] is not None
    assert abs(result["dy"] - 0.20 / MOCK_PRICE) < 0.001
```

- [ ] **Step 2: Rodar testes**

```bash
pip install pytest
pytest tests/python/test_server.py -v
```

Esperado: todos passam. Se algum falhar, investigar o mock — os testes cobrem comportamento existente.

- [ ] **Step 3: Commit**

```bash
git add tests/python/test_server.py
git commit -m "test: add Python unit tests for server business logic"
```

---

## Task 9: Python Handler Tests

**Files:**
- Create: `tests/python/test_handler.py`

- [ ] **Step 1: Criar arquivo de testes**

`tests/python/test_handler.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import http.client
import json
import threading
import pytest
from unittest.mock import patch
from http.server import ThreadingHTTPServer

import server as srv

MOCK_STOCK = {
    "ticker": "PETR4", "name": "Petróleo Brasileiro", "price": 35.5,
    "changePercent": 0.02, "fiftyTwoWeekHigh": 42.0, "fiftyTwoWeekLow": 28.0,
    "sharesOutstanding": 10_000_000, "roe": 0.20, "payout": 0.40,
    "netIncomeHistory": [{"year": 2023, "netIncome": 5_000_000}],
    "marketCap": 355_000_000, "dividendYield": 0.06,
}

MOCK_FUND = {**MOCK_STOCK, "pl": 8.5, "pvp": 1.2, "margemLiquida": 0.15,
             "dividaLiquidaEbit": 2.0, "roic": 0.12, "dy": 0.06,
             "dpa": 2.10, "lpa": 4.2, "vpa": 29.5, "liquidezMedia": 500_000_000,
             "crescimentoLucros": 0.10, "pegRatio": 0.85,
             "setor": "Energy", "subsetor": "Oil & Gas",
             "fiftyTwoWeekHigh": 42.0, "fiftyTwoWeekLow": 28.0}


@pytest.fixture(scope="module")
def server_port():
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), srv.Handler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    yield port
    httpd.shutdown()


def _get(port, path, mock_stock=None, mock_fund=None):
    patches = []
    if mock_stock is not None:
        patches.append(patch('server.get_stock_data', return_value=mock_stock))
    if mock_fund is not None:
        patches.append(patch('server.get_fundamentals', return_value=mock_fund))
    for p in patches:
        p.start()
    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        conn.request("GET", path)
        resp = conn.getresponse()
        body = resp.read()
        return resp, body
    finally:
        for p in patches:
            p.stop()


# ── Testes ────────────────────────────────────────────────────────

def test_root_redirects_to_home(server_port):
    resp, _ = _get(server_port, "/")
    assert resp.status == 302
    assert resp.getheader("Location") == "/home.html"

def test_quote_returns_200_json(server_port):
    resp, body = _get(server_port, "/api/quote/PETR4", mock_stock=MOCK_STOCK)
    assert resp.status == 200
    assert "application/json" in resp.getheader("Content-Type")
    data = json.loads(body)
    assert data["ticker"] == "PETR4"

def test_quote_calls_get_stock_data(server_port):
    with patch('server.get_stock_data', return_value=MOCK_STOCK) as mock_fn:
        conn = http.client.HTTPConnection("127.0.0.1", server_port, timeout=5)
        conn.request("GET", "/api/quote/VALE3")
        conn.getresponse().read()
        mock_fn.assert_called_once_with("VALE3")

def test_fundamentals_returns_200_json(server_port):
    resp, body = _get(server_port, "/api/fundamentals/VALE3", mock_fund=MOCK_FUND)
    assert resp.status == 200
    assert "application/json" in resp.getheader("Content-Type")
    data = json.loads(body)
    assert data["ticker"] == "PETR4"

def test_b3_tickers_returns_json(server_port):
    resp, body = _get(server_port, "/api/b3-tickers")
    assert resp.status == 200
    data = json.loads(body)
    assert "tickers" in data
    assert "count" in data
    assert data["count"] == len(data["tickers"])
    assert data["count"] > 0

def test_quote_missing_ticker_returns_400(server_port):
    resp, _ = _get(server_port, "/api/quote/")
    assert resp.status == 400

def test_cors_header_present(server_port):
    resp, _ = _get(server_port, "/api/quote/PETR4", mock_stock=MOCK_STOCK)
    assert resp.getheader("Access-Control-Allow-Origin") == "*"
```

- [ ] **Step 2: Rodar testes**

```bash
pytest tests/python/test_handler.py -v
```

Esperado: todos passam. Tempo esperado: < 5s (servidor inicia uma vez por módulo).

- [ ] **Step 3: Rodar suite completa**

```bash
pytest tests/python/ -v
npm test
```

Esperado: todos os testes Python e JS passam.

- [ ] **Step 4: Commit final**

```bash
git add tests/python/test_handler.py
git commit -m "test: add HTTP handler integration tests"
```
