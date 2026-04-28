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
- **Persistência local** — sessão e watchlist salvas no `localStorage`; nada vai para nenhum servidor
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

1. **Home** — clique em "Calculadora DCF" ou "Meus Valuations"
2. **Calculadora** — digite o ticker (ex: `WEGE3`, `PETR4`, `ITUB4`) e pressione Enter
3. Os dados são preenchidos automaticamente; ajuste as premissas se necessário
4. O preço teto é calculado em tempo real conforme você edita
5. Clique em **"Salvar Preço Teto"** para adicionar à watchlist
6. **Watchlist** — acompanhe todos os valuations com preços atualizados a cada 3 minutos

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
├── home.html       — Página inicial
├── server.py       — Servidor HTTP local + API de dados via yfinance
├── start.bat       — Atalho Windows para iniciar o servidor
└── README.md
```

---

## API Local

O servidor expõe um endpoint de dados:

```
GET /api/quote/<TICKER>
```

**Exemplo:**
```bash
curl http://localhost:8000/api/quote/WEGE3
```

**Resposta:**
```json
{
  "ticker": "WEGE3",
  "name": "WEG S.A.",
  "price": 35.50,
  "changePercent": 0.012,
  "roe": 0.28,
  "payout": 0.35,
  "sharesOutstanding": 4000000000,
  "netIncomeHistory": [
    { "year": 2023, "netIncome": 4200000000 }
  ],
  "marketCap": 142000000000,
  "dividendYield": 0.018,
  "fiftyTwoWeekHigh": 42.10,
  "fiftyTwoWeekLow": 28.30
}
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
