# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Investidor pessoa física brasileiro, comprando ações da B3 e FIIs com dinheiro próprio, fora do horário de trabalho — celular no sofá, desktop no fim de semana.

O app serve **dois níveis ao mesmo tempo, sem bifurcar em dois produtos**:

- **Experiente** — já lê DY, P/VP, ROE, payout, DL/EBITDA. Quer densidade, screening rápido de ~130 tickers, comparação lado a lado, controle das premissas do DCF. Jargão sem explicação não incomoda; tela com pouca informação incomoda.
- **Iniciante** — está aprendendo fundamentalista. Precisa de tooltip no indicador, caminho guiado (Home → Ranking → Análise → DCF), e de entender *por que* aquele preço teto saiu. Jargão nu trava o uso.

Consequência de design permanente: densidade é o default, e a explicação vem por camada progressiva (tooltip, expandir, sub-linha) — nunca simplificando a tela para o iniciante às custas do experiente, nem escondendo a explicação atrás de um modo separado.

## Product Purpose

Transformar dados fundamentalistas públicos da B3 em **uma decisão**: o preço teto (valor intrínseco) de uma ação ou FII e o upside contra a cotação de hoje.

Cobre o ciclo inteiro: descobrir (Ranking de Ações com 5 métodos, Ranking de FIIs), avaliar (Análise individual, Comparar 2–3 tickers), calcular (DCF com premissas editáveis), acompanhar (Watchlist com alerta de faixa de compra) e administrar (Carteira com P&L, TWRR, proventos, metas de alocação, IR/DARF).

Sucesso = o usuário decide comprar/não comprar com o número do app na tela, e volta na próxima vez que for decidir.

## Positioning

**Grátis, sem cadastro, sem API key, sem coleta de dados.** É a aposta central e o que os concorrentes (Status Invest, Investidor10, Fundamentus) não podem copiar sem quebrar o próprio modelo: eles vivem de conta, plano pago e retenção de usuário logado.

Aqui: abre a URL e usa. Nenhuma tela pede e-mail. Nenhum dado do usuário sai do navegador — carteira, watchlist, valuations salvos e metas ficam em `localStorage`. O backend só busca cotação e fundamento de fontes públicas; não sabe quem perguntou.

Segundo diferencial, derivado do primeiro: a matemática do DCF é exposta e editável (g, WACC, perpetuidade, horizonte, tabela ano a ano) — o usuário audita o cálculo em vez de confiar numa caixa-preta.

## Operating Context

- **Dois viewports reais e igualmente prioritários** — celular (390px, uso frequente e casual: checar cotação, ver carteira) e desktop (screening pesado, DCF, IR).
- Mercado B3: tickers com sufixo `.SA`, FIIs terminando em `11`, proventos como dividendo e JCP, regras de IR da Receita Federal (isenção R$20k/mês swing ações, day trade sempre tributado, R$35k/mês para cripto).
- Importação de extrato B3 (XLS/CSV "Movimentações") é parte do fluxo real da carteira.
- Dados vêm de fontes públicas instáveis (yfinance, scraping de investidor10/statusinvest/fundamentus, brapi como fallback, CoinGecko para cripto). **Campo ausente é estado normal, não erro** — toda tela precisa se comportar bem com indicador faltando.
- Latência real: ranking de ~130 tickers em lote é lento na primeira execução (cache de 6h depois).

## Capabilities and Constraints

**Funcionalidades confirmadas:** DCF (3 ou 5 anos, tabela editável), Watchlist com alertas in-app de faixa de compra, Ranking de Ações (Thomaz/GD, Bazin, Graham, Lynch, Greenblatt) com tickers customizáveis, Ranking de FIIs, Análise individual de ação e de FII, Comparar 2–3 tickers via URL compartilhável, Carteira (posições, P&L, TWRR por ativo, proventos, renda fixa, cripto, metas de alocação e rebalanceamento, IR/DARF com splits), página de apoio (Pix/Ko-fi/GitHub Sponsors).

**Restrições duráveis que o design não pode quebrar:**

1. **Dark-only.** A paleta de `frontend/src/index.css` (`--color-bg-0..4`, cyan/green/red/amber/purple + variantes `-dim`, Inter + JetBrains Mono) é identidade fixa. Não existe tema claro e não deve existir.
2. **Mobile-first obrigatório.** Toda tela nova nasce funcionando em 390px. Os 5 primitivos mobile (`BottomNav`, `MobileHeader`, `Sidebar` como gaveta, `ScrollableTabs`, `BottomSheet`) e os dois padrões de tabela (`ExpandableRow`, `DataCard`) já existem e devem ser reusados. Montagem condicional é via `useIsMobile()`, nunca via CSS escondendo as duas árvores.
3. **Zero backend de usuário.** Sem login, sem conta, sem estado no servidor. Qualquer feature nova precisa caber em `localStorage` (chave `portfolio_v1` e afins).
4. **Sem custo de infra pago.** Netlify free (frontend) + Fly.io (backend) + fontes de dados gratuitas sem API key. Nada que exija plano ou chave paga.

**Stack (existente, não é decisão em aberto):** FastAPI + Pydantic v2 + diskcache no backend; React 19 + TypeScript + Vite + Tailwind v4 + React Router v7 + TanStack Query v5 + Zustand no frontend.

**Terminologia própria:** "Método Thomaz" / "Rank Thomaz FII" são nomes proprietários do projeto — manter o nome, não traduzir nem genericizar.

**Idioma:** toda a UI é em português do Brasil. Formatação monetária e numérica em pt-BR (`R$ 1.778.452.568.851,22`).

## Brand Commitments

- Nome: **Valuation DCF · B3**.
- Sem logo formal definido até agora; a identidade hoje é a paleta escura + acento cyan.
- Voz: direta e técnica, sem tom de venda e sem promessa de retorno. É calculadora, não consultoria — o app não recomenda comprar, entrega o número.
- Página `/apoiar` existe (Pix, Ko-fi, GitHub Sponsors) e o apoio é sempre voluntário: nenhuma funcionalidade fica atrás de doação.

## Evidence on Hand

- **Dados reais e ao vivo** — cotações, fundamentos, proventos e histórico vêm de APIs/scraping reais em produção. Nenhuma tela precisa de dado inventado; usar mock só em teste.
- **Nada de prova social existe.** Sem depoimentos, sem número de usuários, sem logos de parceiro, sem imprensa, sem case. Trabalho futuro **não deve fabricar** nenhum desses.
- Assets de apoio reais: chave Pix e URLs de Ko-fi/GitHub Sponsors hardcoded em `frontend/src/pages/SupportPage.tsx`.
- Documentação técnica completa e mantida em `CLAUDE.md` (raiz) e `README.md`.

## Product Principles

1. **O número é o produto.** Cada tela existe para aproximar o usuário de um preço teto e de um upside. Tudo que não serve a essa decisão é peso.
2. **Sem pedágio.** Nada de conta, e-mail, paywall ou tracking. Se uma feature só funciona com login, ela não entra.
3. **A matemática fica visível.** Premissas editáveis e fórmulas expostas; nunca um número sem origem rastreável.
4. **Densidade com camadas.** O experiente vê tudo de uma vez; o iniciante encontra a explicação a um toque (tooltip, expandir, sub-linha) — sem existirem dois modos de app.
5. **Dado faltando é rotina.** Fontes públicas caem e mudam HTML. A UI degrada com elegância — campo vazio é estado desenhado, não bug exposto.

## Accessibility & Inclusion

- Alvo primário de uso é celular em contexto casual: alvos de toque confortáveis e faixa de abas rolável em vez de menus densos.
- `role="tab"`/`role="tablist"` implica contrato completo de teclado (setas ←/→, Home/End, roving tabindex) — já implementado em `ScrollableTabs`, obrigatório em qualquer tablist novo.
- Modais fecham no Esc; gaveta fechada usa `inert` + `aria-hidden` (fora da ordem de tabulação, não só invisível).
- Valor monetário nunca é truncado: em telas estreitas, reduzir a fonte antes de cortar dígitos — número cortado é risco de leitura errada num app de valuation.
- Nenhum padrão WCAG formal foi contratado pelo usuário; o piso acima é o compromisso vigente do projeto.
