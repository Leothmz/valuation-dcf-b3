# Conciliador de Carteira — Design Spec

**Data:** 2025-05-22  
**Status:** Aprovado pelo usuário

---

## Visão Geral

Nova página `carteira.html` integrada ao projeto Valuation DCF · B3. Hub de carteira completo com suporte a todos os tipos de ativos (ações BR, FIIs, ETFs, stocks internacionais e renda fixa), cálculo automático de rentabilidade (retorno simples por ativo + TWRR para visão geral) e comparação com benchmarks (CDI, IBOV, IFIX).

Dados persistidos em `localStorage`. Entrada híbrida: manual via formulários + importação de CSV exportado do Portal do Investidor B3.

---

## Arquitetura

### Arquivo principal

`carteira.html` — vanilla JS com `<script type="module">`, segue padrão dos demais HTMLs do projeto.

### Módulos novos em `src/`

| Arquivo | Responsabilidade |
|---|---|
| `src/portfolio-engine.js` | Cálculo de preço médio, retorno simples, TWRR, projeção de renda fixa por taxa |
| `src/portfolio-store.js` | CRUD sobre `localStorage` para operações e títulos RF |
| `src/b3-csv-parser.js` | Parser do CSV de movimentações do Portal do Investidor B3 |

### Backend — novos endpoints em `server.py`

| Rota | Método | Descrição |
|---|---|---|
| `/api/cdi` | GET | Taxa CDI acumulada por período. Scraping do Bacen (SGS série 12) ou fallback para valor fixo configurável |
| `/api/exchange/USDBRL` | GET | Cotação USD/BRL via yfinance (`USDBRL=X`). Usado para converter stocks internacionais para BRL |
| `/api/portfolio/history` | POST | Recebe `{tickers: [...], dates: [...]}`, retorna preços de fechamento ajustados por ticker/data. Cache 24h. Usado exclusivamente pelo cálculo de TWRR |
| `/api/portfolio/parse-csv` | POST | Recebe arquivo CSV da B3, retorna array de operações parseadas. Sem persistência — apenas parsing |

---

## Estrutura da Página

### Hero

- Título "Minha Carteira" + subtítulo com nº de ativos e timestamp de atualização
- 4 KPIs: **Total Investido** | **Valor Atual** | **Retorno Total** | **TWRR 12m** (com benchmark inline: `vs CDI +X% · IBOV +Y%`)

### Abas

| Aba | Conteúdo |
|---|---|
| Visão Geral | Alocação por classe (barras) + Benchmarks (gráfico de barras com seletor de período) + Destaques (top/piores performers) |
| Ativos | Tabela consolidada por ticker com preço médio, cotação atual, retorno, preço teto do DCF e situação (caro/barato/sem DCF) |
| Operações | Histórico de compras e vendas + importação CSV B3 + modal de nova operação |
| Renda Fixa | Tabela de títulos com aportes acumulados expansíveis + modal de novo título |

---

## Modelo de Dados

### `portfolio_operations` (localStorage)

Array de operações de renda variável (ações, FIIs, ETFs, stocks internacionais):

```javascript
[
  {
    id: string,           // uuid gerado no cliente
    date: "YYYY-MM-DD",
    ticker: string,       // "WEGE3", "AAPL", "BOVA11"
    assetClass: "acao_br" | "fii" | "etf" | "stock_intl",
    type: "buy" | "sell",
    qty: number,
    price: number,        // BRL para ativos BR; moeda original para internacionais
    currency: "BRL" | "USD" | "EUR",
    fees: number          // corretagem em BRL
  }
]
```

### `portfolio_fixed_income` (localStorage)

Array de títulos de renda fixa, cada um com sub-array de aportes:

```javascript
[
  {
    id: string,
    name: string,          // "CDB Nubank"
    type: "cdb" | "lci" | "lca" | "cri" | "cra" | "debenture" | "tesouro" | "outro",
    rateType: "cdi_pct" | "ipca_plus" | "prefixado" | "manual",
    baseRate: number,      // 110 para CDI 110%; 6.2 para IPCA+6.2%; 12.5 para prefixado 12.5%
    maturityDate: "YYYY-MM-DD" | null,
    deposits: [
      {
        id: string,
        date: "YYYY-MM-DD",
        amount: number,    // BRL
        rateOverride: number | null  // sobrescreve baseRate se informado
      }
    ]
  }
]
```

---

## Lógica de Cálculo

### Preço médio (renda variável)

Calculado a partir das operações de compra, ponderado por quantidade. Vendas reduzem a posição mas não alteram o preço médio.

```
precoMedio = Σ(qty_compra_i × price_i) / Σ(qty_compra_i)
```

### Retorno simples (por ativo)

```
retorno = (cotacaoAtual - precoMedio) / precoMedio
```

Para stocks internacionais, `cotacaoAtual` é convertido para BRL via `/api/exchange/USDBRL` antes do cálculo.

### TWRR (carteira total)

Time-Weighted Rate of Return — elimina o efeito do timing dos aportes. Calculado sobre sub-períodos delimitados por cada aporte/retirada:

```
TWRR = Π(1 + r_i) - 1
onde r_i = (V_fim_i - V_inicio_i) / V_inicio_i  para cada sub-período i
```

O TWRR é recalculado apenas para os períodos selecionados (1M, 3M, 6M, 12M, YTD).

**Dependência de preços históricos:** Para calcular `V_inicio_i` e `V_fim_i` em cada sub-período, o backend precisa dos preços históricos de cada ticker nas datas dos aportes. Isso é feito via `yfinance.download(ticker, start=data_aporte)` — novo endpoint `/api/portfolio/history` que recebe lista de tickers + datas e retorna os preços de fechamento ajustados. Cache local de 24h por ticker para evitar requests repetidos. Renda fixa entra no valor da carteira via projeção por taxa (sem preço histórico necessário).

### Benchmarks no mesmo período

- **CDI**: `/api/cdi?from=YYYY-MM-DD&to=YYYY-MM-DD` retorna retorno acumulado no período
- **IBOV**: yfinance ticker `^BVSP`, retorno de preço no período
- **IFIX**: yfinance ticker `IFIX.SA`, retorno de preço no período

### Projeção de renda fixa

Para `rateType = "cdi_pct"`:
```
valorAtual = valorInvestido × (1 + CDI_acumulado × (baseRate / 100))
```

Para `rateType = "ipca_plus"` e `"prefixado"`: cálculo de juros compostos diários pela taxa contratada.

Para `rateType = "manual"`: sem cálculo automático — usuário informa o valor atual quando quiser.

Cada depósito tem rentabilidade calculada individualmente a partir da sua data. A linha pai agrega ponderado pelo valor investido.

---

## Aba Ativos — Detalhes

### Coluna "Preço Teto (DCF)"

Lê `localStorage['dcf_watchlist']` diretamente no frontend — sem request ao servidor. Se o ticker estiver salvo, exibe o preço teto. Senão, exibe "sem DCF" com link `→ index.html?ticker=XXXX`.

### Coluna "Situação"

- **Caro** (vermelho): cotação atual > preço teto DCF
- **Barato** (verde): cotação atual < preço teto DCF × 0.9
- **Justo** (âmbar): cotação atual entre 90% e 100% do preço teto
- **sem DCF** (cinza): ticker não tem DCF calculado

### Filter chips

Todos | Ações BR | FIIs | ETFs | Stocks Intl

---

## Aba Operações — Detalhes

### Importação CSV da B3

Fluxo:
1. Usuário clica "Importar CSV" → input `<file type="file">` aceita `.csv` e `.xlsx`
2. Frontend envia o arquivo para `POST /api/portfolio/parse-csv`
3. Backend detecta formato B3 (colunas: `Data Negócio`, `Tipo Movimentação`, `Código Negociação`, `Quantidade`, `Preço`) e retorna array de operações no formato `portfolio_operations`
4. Frontend mostra preview das operações parseadas com checkbox por linha
5. Usuário confirma → operações são mescladas com as existentes (sem duplicar: chave de deduplicação = `date + ticker + type + qty + price`)

### Modal Nova Operação

Campos: Tipo (compra/venda) | Ticker | Classe | Data | Quantidade | Preço Unitário | Corretagem (opcional)

---

## Aba Renda Fixa — Detalhes

### Aportes acumulados (accordion)

- Linha principal exibe agregado: total investido, valor atual projetado, retorno médio ponderado, barra de progresso de vencimento
- Clicar na linha expande sub-linhas: um item por depósito com data, valor, taxa e retorno individual
- Formulário inline no rodapé dos aportes: data + valor + taxa opcional (herda `baseRate` do título se vazio)
- Link "Criar novo título" disponível no estado expandido — abre modal completo pré-preenchido com mesmo tipo/taxa, criando linha independente

### Alerta de vencimento

Barra de progresso do prazo fica âmbar + ícone ⚠ quando faltam ≤ 90 dias para o vencimento.

### Modal Novo Título

Campos: Nome | Tipo | Data de aporte | Tipo de taxa (pills: % CDI / IPCA+ / Prefixado / Manual) | Taxa | Valor investido | Vencimento (opcional)

---

## Sidebar

Novo item "Carteira" adicionado à sidebar de todos os HTMLs existentes (`home.html`, `index.html`, `watchlist.html`, `ranking.html`, `analise.html`, `fii.html`, `analise-fii.html`). Ícone Lucide `briefcase`.

---

## Persistência

| Chave localStorage | Conteúdo |
|---|---|
| `portfolio_operations` | Array de operações de renda variável |
| `portfolio_fixed_income` | Array de títulos RF com depósitos aninhados |

Sem persistência em arquivo — dados ficam no browser, coerente com o restante do projeto. Exportação manual via botão "Exportar JSON" (backup) está fora do escopo do MVP.

---

## Fora do Escopo (MVP)

- Exportação / importação de backup JSON
- Notificações de vencimento de renda fixa
- Histórico de TWRR em gráfico de linha (apenas valor pontual por período)
- Dividendos recebidos (rastrear proventos por ativo)
- Imposto de renda / come-cotas
- Sincronização automática e contínua com B3 (requer auth de instituição financeira)

---

## Testes

### Novos arquivos de teste

| Arquivo | Cobre |
|---|---|
| `tests/js/portfolio-engine.test.js` | precoMedio, retornoSimples, TWRR, projecaoRF (CDI%, IPCA+, prefixado) |
| `tests/js/b3-csv-parser.test.js` | Parse de CSV B3 real, deduplicação, campos ausentes |
| `tests/python/test_cdi.py` | Endpoint `/api/cdi` — mock do Bacen, fallback, formato de resposta |
| `tests/python/test_exchange.py` | Endpoint `/api/exchange/USDBRL` — mock yfinance |
| `tests/python/test_csv_parser.py` | Endpoint `/api/portfolio/parse-csv` — formatos B3 conhecidos |
