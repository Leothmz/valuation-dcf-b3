# Valuation DCF · B3

Calculadora de Valuation por **Fluxo de Caixa Descontado (DCF)** para ações da B3. Roda 100% local, sem API key, sem cadastro.

Informe um ticker, ajuste as premissas e obtenha o **preço teto (valor intrínseco)** da ação.

---

## Demonstração

![home](https://i.imgur.com/placeholder-home.png)

> Telas: Home → Calculadora DCF → Watchlist de valuations salvos.

---

## Funcionalidades

- **Busca automática de dados** — preço, ROE, Payout, Lucro Líquido histórico e número de ações via [yfinance](https://github.com/ranaroussi/yfinance)
- **Engine DCF completa** — projeta fluxos de caixa por 3 ou 5 anos + Valor Terminal pelo modelo de Gordon Growth
- **Tabela DCF editável** — edite o Lucro Líquido ou o Crescimento de cada ano diretamente na tabela
- **Premissas personalizáveis** — taxa de desconto (WACC), crescimento na perpetuidade, payout, ROE, taxa de crescimento
- **Botão restaurar** — reverte qualquer campo ao valor original da API com um clique
- **Watchlist** — salva múltiplos valuations e exibe cotações ao vivo com upside calculado em tempo real
- **Ranking fundamentalista** — screening de ~130 ações da B3 com 5 métodos: Thomaz/GD, Bazin, Graham, Peter Lynch e Joel Greenblatt (Magic Formula)
- **Filtros avançados** — filtre por P/L, DY mínimo, Dívida/EBITDA, Margem Líquida, ROE e liquidez; salve e reutilize conjuntos de filtros
- **Favoritos** — marque ações com ★ para acompanhá-las separadamente no ranking
- **Persistência local** — sessão, watchlist e cache do ranking salvos no `localStorage`; nada vai para nenhum servidor
- **Zero dependências de frontend** — HTML + CSS + JS vanilla, sem npm, sem build

---

## Pré-requisitos

- Python 3.8+
- pip

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/Leothmz/valuation-dcf-b3.git
cd valuation-dcf-b3

# 2. Instale a única dependência Python
pip install yfinance
```

---

## Como Usar

### Windows

Dê um duplo-clique em `start.bat` **ou** execute no terminal:

```bat
start.bat
```

### Linux / macOS

```bash
python server.py
```

Acesse no browser: **http://localhost:8000**

---

## Fluxo de Uso

1. **Home** — ponto de entrada com links para todas as ferramentas
2. **Calculadora DCF** — digite o ticker (ex: `WEGE3`, `PETR4`, `ITUB4`) e pressione Enter; ajuste as premissas; salve o preço teto
3. **Watchlist** — acompanhe todos os valuations salvos com preços atualizados a cada 3 minutos
4. **Ranking de Ações** — carregue os dados fundamentalistas de ~130 tickers da B3, aplique filtros e escolha o método de ranking

---

## A Matemática

### Taxa de crescimento esperada (modelo de Gordon)
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
TV = CF_n × (1 + perp) / (disc − perp)
VPL_TV = TV / (1 + disc)^n
```

### Valor intrínseco por ação
```
EV = Σ VPL_i + VPL_TV
Preço Teto = EV / Número de Ações
```

**Parâmetros padrão:**
| Parâmetro | Valor |
|-----------|-------|
| Taxa de desconto (WACC) | 15% |
| Crescimento na perpetuidade | 3% |
| Horizonte de projeção | 5 anos |

---

## Estrutura de Arquivos

```
valuation-dcf-b3/
├── index.html      — Calculadora DCF (HTML + CSS + JS em arquivo único)
├── watchlist.html  — Lista de valuations salvos com preços ao vivo
├── ranking.html    — Ranking e screening fundamentalista (5 métodos)
├── home.html       — Página inicial com navegação
├── server.py       — Servidor HTTP local + API de dados via yfinance
├── start.bat       — Atalho Windows para iniciar o servidor
└── README.md
```

---

## API Local

O servidor expõe três endpoints:

| Endpoint | Uso |
|----------|-----|
| `GET /api/quote/<TICKER>` | Dados para a calculadora DCF (preço, ROE, Payout, histórico de LL) |
| `GET /api/fundamentals/<TICKER>` | Dados estendidos para o ranking (P/L, P/VP, margens, DY, DPA, LPA, VPA…) |
| `GET /api/b3-tickers` | Lista de tickers da B3 usada pelo ranking |

**Exemplo:**
```bash
curl http://localhost:8000/api/quote/WEGE3
curl http://localhost:8000/api/fundamentals/WEGE3
```

O servidor adiciona `.SA` automaticamente aos tickers brasileiros.

---

## Privacidade

Todos os dados ficam **100% locais**:
- Nenhuma informação é enviada para servidores externos
- Valuations salvos ficam no `localStorage` do seu browser
- A única comunicação de rede é com a API do Yahoo Finance (via yfinance), feita pelo servidor local

---

## Limitações

- Dados via [yfinance](https://github.com/ranaroussi/yfinance) (Yahoo Finance) — podem ocorrer atrasos ou inconsistências pontuais
- Funciona exclusivamente para tickers da B3 (Bolsa brasileira)
- ROE e Payout podem não estar disponíveis para todos os tickers — nesses casos, insira manualmente

---

## Contribuindo

Pull requests são bem-vindos. Para mudanças maiores, abra uma issue primeiro para discutir o que você gostaria de alterar.

---

## Licença

[MIT](LICENSE)
