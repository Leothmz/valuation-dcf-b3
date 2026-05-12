# Design — Análise Avançada de Ações

**Data:** 2026-05-12  
**Status:** Aprovado pelo usuário  
**Arquivo alvo:** `analise.html`

---

## 1. Visão Geral

Nova página de análise fundamentalista individual de ações da B3, inspirada no investidor10.com.br. Permite pesquisar qualquer ticker e ver indicadores fundamentalistas com tooltips, gráfico de cotação com seletor de período, valuations teóricos (Bazin, Graham, Lynch, Joel) e o preço teto DCF se já calculado — ou CTA para calculá-lo.

Integra com `watchlist.html` via menu de contexto (botão direito) e com `index.html` via parâmetro `?ticker=`.

---

## 2. Arquivo e Acesso

- **Arquivo:** `analise.html` (vanilla JS, `<script type="module">`, sem bundler)
- **URL padrão:** `analise.html?ticker=ITUB4`
- **Entradas:**
  - Sidebar de todas as páginas: novo item "Análise" (ícone 🔍, label "Análise")
  - Menu de contexto em `watchlist.html`: clique direito → "Ver Análise Avançada"
  - Link direto com `?ticker=XXXX`
- **Sem parâmetro:** exibe barra de busca centralizada (estado vazio)

---

## 3. Layout — Hero + Abas

```
┌─ sidebar (58px / 224px hover) ─┬────────────────────────────────────┐
│  Home / Calculadora / Watchlist │  [search bar: "Buscar ticker..."]  │
│  Ranking / Análise ← novo      ├────────────────────────────────────┤
│                                 │  HERO HEADER                       │
│                                 │  nome · ticker · preço · variação  │
│                                 │  KPI chips: MktCap · 52s · DY · PL │
│                                 │  barra range 52 semanas            │
│                                 ├────────────────────────────────────┤
│                                 │  [Indicadores][Valuations]         │
│                                 │  [Histórico][Gráfico]              │
│                                 ├────────────────────────────────────┤
│                                 │  conteúdo da aba ativa             │
└─────────────────────────────────┴────────────────────────────────────┘
```

O layout segue o design system existente: mesmas variáveis CSS, mesma sidebar, mesmas fontes (Inter + JetBrains Mono).

---

## 4. Hero Header

**Dados fonte:** `/api/fundamentals/<ticker>`

| Campo | Exibição |
|-------|----------|
| `name` | Nome completo da empresa |
| `ticker` | Badge mono cyan |
| `price` | Grande, font-mono, `--text` |
| `changePercent` | Verde se ≥ 0, vermelho se < 0 |
| `marketCap` | KPI chip "Mkt Cap" formatado com fShort |
| `fiftyTwoWeekHigh` / `Low` | KPI chip "52s Mín/Máx" + barra visual |
| `dy` | KPI chip "DY" em verde |
| `pl` | KPI chip "P/L" |

**Barra 52 semanas:** linha horizontal com marcadores mín/máx e bolinha na posição do preço atual.

**Skeleton:** todos os campos mostram `.skel` enquanto carrega.

---

## 5. Aba Indicadores

Grade 4 colunas. Indicadores agrupados em 3 blocos com subtítulo:

### Valuation
| Indicador | Campo API | Tooltip |
|-----------|-----------|---------|
| P/L | `pl` | Preço / Lucro por ação. Quantos anos de lucro para recuperar o investimento. |
| P/VP | `pvp` | Preço / Valor Patrimonial. Abaixo de 1 = desconto ao patrimônio. |
| EV/EBIT | — (não disponível no endpoint atual, omitir) | — |
| LPA | `lpa` | Lucro por Ação (últimos 12 meses). |
| VPA | `vpa` | Valor Patrimonial por Ação. |

### Rentabilidade
| Indicador | Campo API | Tooltip |
|-----------|-----------|---------|
| ROE | `roe` | Retorno sobre Patrimônio Líquido. Eficiência no uso do capital próprio. |
| ROIC | `roic` | Retorno sobre Capital Investido. |
| Margem Líquida | `margemLiquida` | Lucro Líquido / Receita. |
| Crescimento Lucros | `crescimentoLucros` | CAGR de lucros (YoY). |
| PEG Ratio | `pegRatio` | P/L ÷ crescimento(%). < 1 = potencialmente subavaliado. |

### Estrutura de Capital
| Indicador | Campo API | Tooltip |
|-----------|-----------|---------|
| DL/EBITDA | `dividaLiquidaEbit` | Dívida Líquida / EBITDA. < 2 = saudável. Bancos: não se aplica. |
| Liquidez Média | `liquidezMedia` | Volume médio diário em R$. |
| DY | `dy` | Dividend Yield (últimos 12 meses). |
| DPA | `dpa` | Dividendo por Ação (R$/ano). |

**Tooltip:** ícone `?` à direita do label. Hover mostra tooltip com nome completo + definição + fórmula. Implementado em CSS puro (`:hover` + `position: absolute`), sem JS.

**Formatação:** percentuais com `fPct`, valores monetários com `fBRL`, valores grandes com `fShort`. Campos `null` exibem "—".

---

## 6. Aba Valuations

### Bloco 1 — Valuations Teóricos (grid 4 colunas)

Calculados no frontend com os dados do `/api/fundamentals/`:

| Método | Fórmula | Cor |
|--------|---------|-----|
| Bazin | `dpa / 0.06` | cyan |
| Graham | `√(22.5 × lpa × vpa)` | purple |
| Peter Lynch | `lpa × (crescimentoLucros × 100)` | green |
| Joel (EY) | `1 / pl` (em %, não preço teto) | amber |

Cada card exibe: método, preço teto (ou EY%), upside/downside vs preço atual, fórmula resumida.  
Campos ausentes (lpa null, dpa null etc.) exibem "Dados insuficientes" no card.

**Barra de preço atual** abaixo do grid mostrando o preço para referência.

### Bloco 2 — DCF Personalizado (card separado)

**Estado A — Não calculado:**
- Fundo âmbar suave (`rgba(245,158,11,.06)`), borda dashed âmbar
- Texto: "Preço Teto DCF não calculado"
- Sub: "Calcule seu preço justo personalizado com premissas ajustáveis"
- Botão "→ Calcular DCF" → navega para `index.html?ticker=XXXX`

**Estado B — Calculado (entrada existe em `dcf_watchlist`):**
- Fundo cyan suave, badge "salvo"
- Exibe: preço teto, data do cálculo, upside/downside
- Link "Recalcular" → `index.html?wl=XXXX`

Leitura do `localStorage['dcf_watchlist']` feita no frontend, sem request ao servidor.

---

## 7. Aba Histórico

Tabela com histórico de Lucro Líquido:

| Ano | Lucro Líquido | Variação YoY |
|-----|---------------|--------------|
| 2024 | R$ 36,7B | +12,3% |
| ... | ... | ... |

Dados de `/api/quote/<ticker>` → campo `netIncomeHistory` (até 5 anos).  
Variação calculada no frontend entre anos consecutivos.  
Exibe "—" para o ano mais antigo (sem ano anterior para comparar).

---

## 8. Aba Gráfico

**Widget:** TradingView Advanced Real-Time Chart (embed free).  
**Ticker mapeado:** `BMFBOVESPA:XXXX` (ex: `BMFBOVESPA:ITUB4`).  
**Tema:** dark, sem toolbar própria do TradingView.  
**Altura:** 520px.

**Seletor de período customizado** acima do widget (estilo investidor10):

```
1 DIA  7 DIAS  30 DIAS  6 MESES  YTD  [1 ANO]  5 ANOS  10 ANOS
```

Botão ativo sublinhado com `--cyan`. Mapeamento para `range` do TradingView:

| Botão | range |
|-------|-------|
| 1 DIA | `1D` |
| 7 DIAS | `5D` |
| 30 DIAS | `1M` |
| 6 MESES | `6M` |
| YTD | `YTD` |
| 1 ANO | `12M` (padrão) |
| 5 ANOS | `60M` |
| 10 ANOS | `ALL` |

Implementação: cada clique no seletor recria o `<div>` do widget com o novo `range` e reinvoca o script do TradingView.

---

## 9. Menu de Contexto na Watchlist (`watchlist.html`)

**Trigger:** `contextmenu` event em `<tr>` da tabela de valuations.

**Comportamento:**
1. Previne o menu nativo (`e.preventDefault()`)
2. Cria div `.context-menu` posicionado em `e.clientX / e.clientY`
3. Itens:
   - **"📊 Ver Análise Avançada"** → `window.open('analise.html?ticker=XXXX')`
   - **"🗑 Excluir da watchlist"** → comportamento já existente do botão de delete
4. Fecha ao clicar fora (`mousedown` no document) ou `Escape`

Estilizado com o design system existente (bg-2, border, text-sec, hover bg-4).

---

## 10. Sidebar — Novo Item

Adicionar item "Análise" em **todos os 4 HTMLs** (home, index, watchlist, ranking):

```html
<a href="analise.html" class="nav-item" id="nav-analise">
  <span class="sidebar-icon">🔍</span>
  <span class="sidebar-label">Análise</span>
</a>
```

Item ativo quando `window.location.pathname.includes('analise')`.

---

## 11. API — Sem Novos Endpoints

`analise.html` reutiliza endpoints existentes:
- `/api/fundamentals/<ticker>` — todos os indicadores + preço + KPIs do hero
- `/api/quote/<ticker>` — `netIncomeHistory` para aba Histórico

Sem alterações em `server.py`.

---

## 12. Testes

**Não há funções puras novas** (todo JS é UI + fetch). Testes unitários não se aplicam à lógica de renderização sem DOM.

**Casos edge a validar manualmente:**
- Ticker sem DY → Bazin mostra "Dados insuficientes"
- Ticker sem LPA ou VPA → Graham mostra "Dados insuficientes"
- Ticker sem LPA + crescimento → Lynch mostra "Dados insuficientes"
- Ticker com P/L negativo → Joel mostra "—"
- Ticker não na `dcf_watchlist` → card DCF em estado CTA
- Ticker na `dcf_watchlist` → card DCF em estado "salvo"
- Ticker inválido → mensagem de erro no hero, abas desabilitadas
- `analise.html` sem parâmetro → estado vazio com busca centralizada

**Python (pytest):** sem novos endpoints → sem novos testes de servidor.

---

## 13. Atualizações de Documentação

- `CLAUDE.md`: adicionar seção da nova página na estrutura de arquivos e no guia de arquitetura
- Não criar README separado
