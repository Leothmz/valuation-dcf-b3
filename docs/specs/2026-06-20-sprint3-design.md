# Sprint 3 — Design Spec
**Data:** 2026-06-20  
**Branch base:** release/v1.2  
**Stack:** React + Zustand + TypeScript (frontend), FastAPI + yfinance (backend)

---

## Cards

1. Notas por ticker
2. Histórico do preço teto
3. Cenários bull/base/bear
4. Export watchlist CSV
5. Export análise HTML

---

## Arquitetura

**Abordagem escolhida:** Estender stores existentes. Nenhum store novo, nenhum endpoint novo.

---

## 1. Notas por ticker

### Schema

`WatchlistEntry` (`watchlistStore.ts`) ganha:

```ts
notes?: string
```

### UX

- Context menu (clique direito na linha da `WatchlistPage`) ganha item **"Editar nota"**
- Abre modal com `<textarea>` (máx. 500 chars) + botões Salvar / Cancelar
- Ticker cell: ponto discreto `●` em amber (`var(--color-amber)`) quando `notes` não-vazio
  - Tooltip no hover mostra preview da nota (primeiros 80 chars)

### Arquivos afetados

- `frontend/src/stores/watchlistStore.ts` — adicionar campo `notes?`
- `frontend/src/pages/WatchlistPage.tsx` — context menu item + modal + badge

---

## 2. Histórico do preço teto

### Schema

`WatchlistEntry` ganha:

```ts
priceHistory?: Array<{
  fairPrice: number
  savedAt: string      // ISO string
  annotation?: string  // nota manual por entrada do histórico
}>
```

### Comportamento automático

`watchlistStore.save()`: se ticker já existe em `entries`, antes de sobrescrever, move `{fairPrice, savedAt}` da entrada atual para o topo de `priceHistory`. Máximo de 50 entradas (FIFO — descarta as mais antigas).

### UX

- Context menu ganha item **"Histórico de preço teto"**
- Abre modal com tabela:
  - Colunas: **Data** / **Preço Teto** / **Variação** / **Anotação**
  - Variação = diff % vs entrada anterior (verde se subiu, vermelho se caiu, `—` na primeira)
  - Campo Anotação é editável inline por linha; salva ao blur/Enter
- Modal vazio: exibe "Nenhum histórico ainda — salve o preço teto mais de uma vez para registrar a evolução."

### Arquivos afetados

- `frontend/src/stores/watchlistStore.ts` — campo `priceHistory?`, lógica de append em `save()`
- `frontend/src/pages/WatchlistPage.tsx` — context menu item + modal

---

## 3. Cenários bull/base/bear

### Schema

`dcfStore.ts` ganha:

```ts
scenarios: {
  enabled: boolean
  bear: number | null   // g override decimal (ex: 0.05)
  base: number | null   // pré-preenchido com g atual das premissas
  bull: number | null   // g override decimal (ex: 0.15)
}
setScenario: (key: 'bear' | 'base' | 'bull', value: number | null) => void
toggleScenarios: () => void
```

**Persistência:** efêmera — cenários NÃO são persistidos no localStorage.

Dois mecanismos garantem isso:
1. `scenarios` adicionado ao `INITIAL_STATE` com `enabled: false`, `bear/base/bull: null`
2. `partialize` em `dcfStore` já exclui campos runtime (`results`, etc.) — adicionar `scenarios` à desestruturação de exclusão
3. `setTicker()` recebe `scenarios: { enabled: false, bear: null, base: null, bull: null }` no `set({})` para resetar em-sessão ao trocar de ticker

**Valores iniciais ao ativar:**
- `base` = `store.assumptions.g` atual
- `bear` = `base * 0.7` (arredondado a 1 decimal em %)
- `bull` = `base * 1.3` (arredondado a 1 decimal em %)

### UX — DCFResultPanel

Abaixo dos resultados atuais (clássico/Buffett):

- Toggle **"Cenários"** (switch ou botão) — off por padrão
- Quando ativo, exibe 3 inputs `%` lado a lado:
  - 🔴 **Bear** / ⚫ **Base** / 🟢 **Bull**
  - Cada input dispara recálculo de `runDCF` com `g` do cenário, demais premissas iguais ao store atual
- 3 chips coloridos com preço teto:
  - Bear: fundo `var(--color-red-dim)`, texto `var(--color-red)`
  - Base: fundo `var(--color-bg-3)`, texto `var(--color-text-sec)`
  - Bull: fundo `var(--color-green-dim)`, texto `var(--color-green)`
- Salvar na watchlist usa apenas `fairPrice` base (behavior existente, sem alteração)

### Arquivos afetados

- `frontend/src/stores/dcfStore.ts` — campos `scenarios`, actions `setScenario`, `toggleScenarios`
- `frontend/src/pages/DCFPage/DCFResultPanel.tsx` — seção de cenários

---

## 4. Export watchlist CSV

### UX

Botão **"Exportar CSV"** no toolbar da `WatchlistPage` (ao lado do input de filtro, alinhado à direita).

### Colunas

```
Ticker; Empresa; Preço Teto; Preço Atual; Upside (%); DY (%); Salvo Em;
g (%); Disc (%); Perp (%); Payout (%); ROE (%); LL Base; Shares
```

### Implementação

- Separador `;` (padrão pt-BR para Excel)
- Encoding UTF-8 com BOM (`﻿`) para Excel não quebrar acentos
- Preço atual e DY vêm de `liveMap` (já carregado — sem request extra)
- Upside calculado: `(fairPrice - currentPrice) / fairPrice`
- Percentuais exportados como `10,5` (vírgula decimal, sem símbolo `%`)
- Download via `URL.createObjectURL(blob)` + `<a download>`
- Função `exportCSV()` inline no componente (< 30 linhas)

### Arquivos afetados

- `frontend/src/pages/WatchlistPage.tsx` — função + botão

---

## 5. Export análise HTML

### UX

Botão **"Exportar Relatório"** em `DCFResultPanel`, visível apenas quando `results` não-nulo.

### Conteúdo do HTML exportado

1. **Header:** ticker, empresa, data do relatório
2. **Bloco DCF:** premissas (g, disc, perp, payout, ROE, LL base, shares), tabela de projeção (anos históricos + projetados + TV), preço teto clássico + Buffett
3. **Bloco Indicadores:** P/L, P/VP, ROE, Margem Líquida, DY, DL/EBITDA, LPA, VPA — via fetch `/api/fundamentals/<ticker>`
4. **Bloco Cenários** (incluído apenas se `scenarios.enabled === true`): tabela bear/base/bull com g% e preço teto

### Implementação

- Botão clicado → fetch `/api/fundamentals/<ticker>` (loading indicator no botão durante fetch)
- Dados do store + resposta da API → `buildExportHTML()` em `exportHTML.ts`
- HTML resultante: CSS dark theme inline, sem dependências externas, abre offline
- Nome do arquivo: `<TICKER>-valuation-<YYYY-MM-DD>.html`
- Download via blob

### Arquivos afetados

- `frontend/src/utils/exportHTML.ts` — novo arquivo com `buildExportHTML()`
- `frontend/src/pages/DCFPage/DCFResultPanel.tsx` — botão + fetch + download

---

## Ordem de implementação sugerida

1. **Notas por ticker** — menor escopo, só UI + store field
2. **Histórico do preço teto** — store logic + modal
3. **Export CSV** — sem dependências, função pura
4. **Cenários bull/base/bear** — store + DCFResultPanel
5. **Export HTML** — novo utilitário, depende de entender estrutura do DCF table

---

## Testes esperados

- `watchlistStore`: `save()` com ticker existente → `priceHistory` cresce; máx 50 entradas; `notes` persiste
- `dcfStore`: `toggleScenarios()` → `enabled` alterna; `setScenario()` → valor atualiza; reset ao trocar ticker
- `exportCSV`: string gerada contém BOM + cabeçalho + linha por ticker
- `buildExportHTML`: retorna string HTML válida com seções esperadas
- Componentes: WatchlistPage renderiza botão CSV; DCFResultPanel renderiza toggle cenários + botão exportar
