---
name: Valuation DCF · B3
description: Laboratório de valuation escuro e denso onde cada número é auditável e a cor só aparece quando significa algo.
colors:
  bg-0: "#060910"
  bg-1: "#0b0f17"
  bg-2: "#111827"
  bg-3: "#1a2233"
  bg-4: "#1f2a3f"
  border: "#1e2d42"
  border-muted: "#151e2d"
  text-base: "#f0f4f8"
  text-sec: "#94a3b8"
  text-muted: "#4a5568"
  cyan: "#06b6d4"
  cyan-deep: "#0891b2"
  cyan-dim: "rgba(6, 182, 212, 0.12)"
  green: "#10b981"
  green-dim: "rgba(16, 185, 129, 0.12)"
  red: "#ef4444"
  red-dim: "rgba(239, 68, 68, 0.12)"
  amber: "#f59e0b"
  amber-dim: "rgba(245, 158, 11, 0.12)"
  purple: "#8b5cf6"
  purple-dim: "rgba(139, 92, 246, 0.12)"
  rose: "#f43f5e"
typography:
  display:
    fontFamily: "JetBrains Mono, Cascadia Code, Fira Code, monospace"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, -apple-system, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, -apple-system, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  data:
    fontFamily: "JetBrains Mono, Cascadia Code, Fira Code, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, -apple-system, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  modal: "20px"
  sheet: "18px 18px 0 0"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.bg-0}"
    rounded: "{rounded.lg}"
    padding: "0 18px"
    height: "42px"
    typography: "{typography.title}"
  button-primary-saved:
    backgroundColor: "{colors.green}"
    textColor: "{colors.bg-0}"
    rounded: "{rounded.lg}"
    padding: "0 18px"
    height: "42px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-sec}"
    rounded: "{rounded.lg}"
    padding: "0 18px"
    height: "42px"
  button-ghost-hover:
    backgroundColor: "{colors.bg-3}"
    textColor: "{colors.text-base}"
  tab-pill:
    backgroundColor: "{colors.bg-3}"
    textColor: "{colors.text-sec}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  tab-pill-active:
    backgroundColor: "{colors.cyan-dim}"
    textColor: "{colors.cyan}"
    rounded: "{rounded.pill}"
  input-field:
    backgroundColor: "{colors.bg-3}"
    textColor: "{colors.text-base}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
    typography: "{typography.data}"
  input-field-override:
    backgroundColor: "rgba(245, 158, 11, 0.05)"
    textColor: "{colors.text-base}"
    rounded: "{rounded.sm}"
  card-surface:
    backgroundColor: "{colors.bg-2}"
    textColor: "{colors.text-base}"
    rounded: "{rounded.xl}"
    padding: "18px"
  nav-item-active:
    backgroundColor: "{colors.cyan-dim}"
    textColor: "{colors.cyan}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
---

# Design System: Valuation DCF · B3

## Overview

**Creative North Star: "O Laboratório de Valuation"**

Este não é um app que mostra números — é uma bancada onde o usuário gira botões e vê o resultado recalcular. A premissa (ROE, payout, taxa de desconto, perpetuidade) é o instrumento; o preço teto é a leitura. Toda a linguagem visual existe para separar essas duas coisas com clareza absoluta: **ciano é o que a máquina calculou, âmbar é o que a mão humana mexeu, e o resto do sistema fica calado.**

A superfície é escura por decisão permanente, não por moda: cinco níveis de fundo empilhados (`#060910` → `#1f2a3f`) fazem o trabalho que sombras fariam num tema claro, e uma borda de 1px (`#1e2d42`) separa o que a camada tonal não separa sozinha. Densidade é alta e intencional — 13px é o tamanho de corpo dominante, tabelas chegam a 12 colunas, e nenhum espaço em branco existe só para "respirar". O usuário veio decidir uma compra, não contemplar layout.

Componentes têm presença física: o botão primário carrega gradiente ciano e sobe 1px no hover, cards de resultado brilham baixo, o pódio do ranking tem medalha com glow. Mas essa presença é **rara e posicional** — vale para a ação principal e para o número principal da tela. Um botão secundário é uma borda de 1px e nada mais.

**Key Characteristics:**
- Dark-only permanente — não existe tema claro, e a paleta de `frontend/src/index.css` é a fonte única
- Cor é semântica antes de ser estética: ciano = resultado, verde = confirmação/alta, vermelho = alerta/baixa, âmbar = intervenção manual, roxo = território FII
- Duas famílias tipográficas com fronteira rígida: Inter para interface, JetBrains Mono para todo número auditável
- Profundidade por camada tonal; sombra é exceção reservada ao que flutua de verdade
- Mobile-first real (390px), com montagem condicional de árvore em vez de CSS escondendo duas
- Alvo de toque mínimo 44×44px em toda superfície interativa do mobile

## Colors

Paleta escura de base azul-fria, com cinco acentos saturados que só aparecem quando carregam significado — nenhum deles é cor de marca decorativa.

### Primary

- **Cyan de Instrumento** (`#06b6d4`): a leitura da máquina. Preço teto, item de navegação ativo, aba selecionada, foco de input, botão primário (em gradiente com **Cyan Profundo** `#0891b2`), coluna Bazin no ranking, tecla de atalho no painel de shortcuts. É a cor que diz "este é o número que você veio buscar".

### Secondary

- **Verde de Confirmação** (`#10b981`): direção positiva e estado confirmado. Upside positivo, P&L no lucro, ticker dentro da faixa de compra (borda `rgba(16,185,129,.4)` no card), 1º lugar do ranking, valuation já salvo, toast de sucesso.
- **Vermelho de Alerta** (`#ef4444`): direção negativa e restrição violada. Upside negativo, prejuízo, DL/EBITDA acima de 3, borda de input quando a condição de Gordon quebra (perpetuidade ≥ desconto), toast de erro.
- **Âmbar de Intervenção** (`#f59e0b`): **exclusivo de valor tocado pela mão do usuário.** Input com override (borda âmbar + fundo `rgba(245,158,11,0.05)`), botão de restaurar valor da API, badge "Custom" de ticker adicionado manualmente, 3º lugar do ranking, toast de aviso.

### Tertiary

- **Roxo de FII** (`#8b5cf6`): marca o domínio secundário do produto — fundos imobiliários (cards de FII na Home, análise de FII) e a coluna Graham no ranking. Nunca é cor de ação; é etiqueta de território.
- **Rosa de Apoio** (`#f43f5e`): usado em um só lugar, o coração de "Apoiar o Projeto" (sidebar, header mobile, botão flutuante do desktop). Fora dele, não existe.

### Neutral

- **Poço** (`#060910`): fundo mais profundo; texto sobre botão primário/verde sólido; base dos scrims (`rgba(6,9,16,.45–.8)`).
- **Base do App** (`#0b0f17`): fundo do documento e das barras translúcidas (`rgba(11,15,23,0.95)` + `blur(12px)` na sidebar, no header mobile e na bottom nav).
- **Superfície de Card** (`#111827`): todo card, tabela, modal, popover e bottom sheet.
- **Superfície Elevada** (`#1a2233`): input, `kbd`, pill de aba inativa, hover de item de navegação.
- **Realce** (`#1f2a3f`): hover de item de lista, borda de popover, alça do bottom sheet.
- **Borda** (`#1e2d42`) e **Borda Discreta** (`#151e2d`): a separação estrutural, presente em quase todo container. A discreta separa dentro de um mesmo card; a normal separa cards entre si.
- **Texto Base** (`#f0f4f8`), **Texto Secundário** (`#94a3b8`), **Texto Discreto** (`#4a5568`): três níveis, sempre nessa ordem — valor, rótulo, metadado.

### Named Rules

**A Regra do Âmbar.** Âmbar significa uma coisa só: *o usuário sobrescreveu este valor*. Nunca use âmbar como cor de destaque, de gráfico ou de call-to-action. Quando um campo fica âmbar, o botão de restaurar precisa existir ao lado dele.

**A Regra do Sinal.** Verde e vermelho são direção de valor (subiu/desceu, lucro/prejuízo, dentro/fora da faixa) ou estado de sistema (sucesso/erro). Nunca são preenchimento decorativo nem paleta de gráfico categórico.

**A Regra do 12%.** Todo acento tem uma variante `-dim` a 12% de opacidade sobre fundo escuro. Fundo de acento **sempre** usa a `-dim`; o hex sólido é reservado a texto, ícone, borda e à única ação primária da tela.

## Typography

**UI Font:** Inter (com `-apple-system`, `system-ui`, `sans-serif`)
**Data/Mono Font:** JetBrains Mono (com `Cascadia Code`, `Fira Code`, `monospace`)

**Character:** Inter carrega tudo que é linguagem — rótulo, descrição, botão, navegação — em pesos 400/500/600/700 e tamanhos pequenos. JetBrains Mono carrega tudo que é grandeza: preço, percentual, ticker, quantidade, tecla de atalho. A fronteira entre as duas é a fronteira entre *ler* e *comparar*: número em mono alinha coluna a coluna e permite bater um valor contra o outro sem contar dígito.

### Hierarchy

- **Display** (mono, 700, 40px): o preço teto, uma vez por tela, em ciano. É o único número desse tamanho no app inteiro.
- **Headline** (Inter, 700, 20–22px): título de modal e de seção principal de página.
- **Title** (Inter, 600–700, 15–16px): título de card, título de rota no header mobile, valor em destaque de `DataCard` (16px mono bold).
- **Body** (Inter, 400–500, 13px): o tamanho dominante do sistema — descrição, rótulo de campo, texto de tabela, item de navegação.
- **Data** (mono, 400–600, 13px): todo valor numérico em tabela, card e input. No mobile o input sobe para 16px (evita o zoom automático do iOS) e volta a 13px em `md:`.
- **Label** (Inter, 600, 11px, `letter-spacing` 0.08–0.12em, UPPERCASE, texto discreto): cabeçalho de tabela, eyebrow de card ("PREÇO TETO · VALOR INTRÍNSECO"), rótulo de seção. **É o único uso de caixa alta no sistema.**
- **Micro** (Inter, 500, 10px): rótulo da bottom nav e badges minúsculos.

### Named Rules

**A Regra do Mono.** Se o usuário pode comparar, somar ou auditar o valor, ele vem em JetBrains Mono. Se ele só lê, vem em Inter. Nunca aplique mono em frase corrida — o app não é um terminal retrô.

**A Regra do Rótulo Maiúsculo.** Caixa alta existe apenas no papel Label (11px, semibold, tracking ≥0.08em, cor discreta). Título, botão e valor nunca são maiúsculos.

**A Regra do Dígito Inteiro.** Valor monetário nunca é truncado com reticências. Em tela estreita, reduza o tamanho da fonte (`text-[11px] md:text-[14px]`) antes de cortar qualquer dígito — número cortado num app de valuation é risco de leitura errada, e no mobile não existe hover para revelar o resto.

## Layout

Shell fixo de coluna única: `Sidebar` em `position: fixed` (58px retraída, 224px no hover, `md:` apenas) e `<main>` ocupando o resto com `margin-left: 58px` no desktop e `0` no mobile. No mobile, `<main>` ganha `padding-bottom: 56px` para não ficar embaixo da `BottomNav`.

Breakpoint único que importa: **`md` (768px)**. Abaixo dele o app é uma coluna de 390px com header sticky, gaveta lateral e navegação inferior; acima, sidebar hover-expand e painéis lado a lado. Não há tratamento intermediário — a decisão é binária de propósito.

Ritmo de espaçamento em passos de 4px, concentrado em 8/12/16/24. Padding interno típico: 12px em card compacto (`DataCard`, `ExpandableRow`), 16–18px em card de conteúdo, 24px em modal. Gap de 8px entre pills, 12px entre cards de grade.

Grades de conteúdo colapsam para uma coluna no mobile (`grid-cols-1 sm:grid-cols-2`, `grid-cols-2` para métricas secundárias). Tabelas largas vivem dentro de um container `overflow-x-auto` com `min-width` explícito (ex: 900px no ranking) — o scroll horizontal fica **dentro do card**, nunca no documento.

### Named Rules

**A Regra do `min-w-0`.** Todo ancestral em fluxo de uma faixa rolável (`ScrollableTabs`, tabela com `overflow-x-auto`, grade de métricas) precisa de `min-w-0` até a raiz do layout. Item de flex e de grid tem `min-width: auto` por padrão e não encolhe abaixo do min-content dos filhos — sem `min-w-0`, o `overflow-x-auto` nunca engata e a faixa vaza para `document.documentElement.scrollWidth`. Teste de auditoria: em 390px, `document.documentElement.scrollWidth` tem que ser exatamente 390.

**A Regra da Árvore Única.** Quando mobile e desktop renderizam *estruturas diferentes* (tabela vs. cards, painel fixo vs. bottom sheet, sidebar vs. gaveta), quem escolhe é o hook `useIsMobile()` — nunca `hidden md:block` / `md:hidden`. CSS esconde, mas monta as duas árvores no DOM: texto duplicado, role duplicado e queries de teste estourando em "found multiple elements".

**A Regra dos 44px.** Toda superfície interativa do mobile tem no mínimo 44×44px (`min-w-[44px] min-h-[44px]`). Linha expansível usa 52px; item de bottom nav, 56px.

## Elevation & Depth

O sistema é **plano em repouso**. Profundidade vem da escala tonal `bg-0 → bg-4` combinada com borda de 1px, não de sombra — num tema escuro, uma sombra preta sobre fundo quase preto não comunica nada, e uma camada mais clara comunica tudo. Sombra existe apenas quando o elemento **flutua de verdade** sobre o conteúdo, e glow colorido existe apenas para marcar *o resultado* e *o pódio*.

### Shadow Vocabulary

- **Flutuante** (`0 8px 32px rgba(0,0,0,.6)`): modais centrados (boas-vindas, atalhos).
- **Suspenso** (`0 14px 34px -10px rgba(0,0,0,.9)`): popover ancorado (seletor de ranking na bottom nav).
- **Assentado** (`0 4px 16px rgba(0,0,0,.5)`): container de tabela do ranking — a única superfície não-flutuante que recebe sombra, porque ela sustenta uma grade rolável.
- **Halo de Busca** (`0 0 40px rgba(6,182,212,0.1), 0 25px 50px rgba(0,0,0,0.5)`): a paleta de busca global, sombra escura + halo ciano.
- **Halo de Resultado** (`0 0 20px rgba(6,182,212,0.15)`): o card de preço teto, e só ele.
- **Halo de Pódio** (`0 0 12px rgba(<acento>,.3–.4)`): medalhas de 1º/2º/3º no ranking.
- **Realce de Ação** (`0 2px 8px rgba(6,182,212,0.2)` / verde quando salvo): o botão primário.

### Named Rules

**A Regra do Plano em Repouso.** Card, linha, painel e input não têm sombra. Se você quer separar duas superfícies, suba um nível tonal (`bg-2` → `bg-3`) ou coloque uma borda. Sombra é resposta a *flutuar*, não a *existir*.

**A Regra do Glow Escasso.** Glow colorido marca o número principal da tela e o topo do ranking. Se uma tela tiver mais de dois elementos com glow, um deles está errado.

## Shapes

Retângulo de canto suave, sem exceção — nada de corte diagonal, silhueta irregular ou clipping decorativo. O raio **cresce com a área do elemento**, o que dá ao sistema uma hierarquia de forma legível mesmo em preto e branco:

- **6px** — input, `kbd`, botão-ícone pequeno
- **8px** — badge de posição, container de ícone, item de popover
- **10px** — botão, item de navegação, linha expansível, alerta inline (o raio mais frequente do app)
- **12px** — card de feature, popover
- **14px** — card de conteúdo, container de tabela (o raio de "superfície grande")
- **18px** — topo do bottom sheet (só as bordas superiores)
- **20px** — modal
- **`9999px`** — pill de aba, badge de upside, botão de apoio, alça do sheet

Borda é sempre 1px sólida. A borda colorida é semântica e usa 40% de opacidade do acento (`rgba(16,185,129,.4)` para ticker na faixa de compra, `rgba(6,182,212,.4)` para aba ativa) — nunca o hex sólido.

### Named Rules

**A Regra do Raio Crescente.** Quanto maior a superfície, maior o raio. Um input com 14px de raio ou um modal com 6px quebram a leitura de hierarquia mesmo que ninguém saiba dizer por quê.

**A Regra da Borda Semântica.** Quando um card muda de borda para verde/âmbar/vermelho, é porque o *dado* mudou de estado — não porque está em hover ou selecionado. Seleção usa fundo `-dim` + cor de texto.

## Components

### Buttons

- **Shape:** cantos suaves de 10px (`rounded-[10px]`), altura fixa de 42px em ação principal.
- **Primary:** gradiente ciano (`linear-gradient(135deg, #06b6d4, #0891b2)`), texto em Poço (`#060910`), semibold 13px, `box-shadow: 0 2px 8px rgba(6,182,212,0.2)`. Existe **uma vez por tela**.
- **Primary confirmado:** ao salvar, o mesmo botão vira verde sólido com sombra verde e troca o rótulo — o estado é o feedback, sem toast redundante.
- **Hover / Focus:** `hover:-translate-y-px` + `opacity-90`, transição de 150–200ms. Foco visível usa `focus-visible:outline-2 outline-offset-2` na cor do acento.
- **Ghost / Secondary:** fundo transparente, borda 1px `border`, texto secundário; no hover ganha fundo `bg-3` e texto base. Nenhuma sombra, nenhum gradiente.
- **Icon button:** 44×44px no mobile, quadrado de 6–10px de raio, cor `text-sec`, sem fundo até o hover.

### Chips / Tabs

- **Style:** pill (`rounded-full`), 44px de altura mínima, 16px de padding lateral, 13px semibold, `shrink-0`.
- **Inativa:** fundo `bg-3`, texto secundário, borda `border`.
- **Ativa:** fundo `rgba(6,182,212,.15)`, texto ciano, borda `rgba(6,182,212,.4)`.
- **Comportamento:** no mobile a faixa rola horizontalmente com `snap-x snap-mandatory`, scrollbar escondida e um fade de 32px na direita (`linear-gradient(90deg, transparent, var(--color-bg-1))`) sinalizando que há mais abas. No desktop vira `flex-wrap`.
- **Teclado:** `role="tab"` é contrato — roving tabindex (só a ativa com `tabIndex 0`), setas ←/→, `Home`/`End`, ativação automática, sem dar volta nas pontas.

### Cards / Containers

- **Corner Style:** 14px em card de conteúdo e tabela; 10–12px em card compacto de lista.
- **Background:** `bg-2` (`#111827`) por padrão; `bg-3` para card interno dentro de outro card.
- **Shadow Strategy:** nenhuma (ver A Regra do Plano em Repouso). A exceção é o card de preço teto, que usa gradiente ciano a 6%→2% + borda `rgba(6,182,212,0.2)` + halo de resultado.
- **Border:** 1px `border`; troca para acento a 40% quando o dado muda de estado.
- **Internal Padding:** 12px compacto, 16–18px conteúdo.

### Inputs / Fields

- **Style:** fundo `bg-3`, borda transparente em repouso (a superfície já separa), raio 6px, texto mono alinhado à direita, `field-sizing: content` onde o valor tem largura variável.
- **Focus:** borda ciano + `box-shadow: 0 0 0 2px rgba(6,182,212,0.08)`.
- **Override (âmbar):** borda `amber` + fundo `rgba(245,158,11,0.05)` + botão de restaurar ao lado.
- **Invalid:** borda `red` — usado quando a premissa quebra a condição de Gordon (perpetuidade ≥ desconto).
- **Disabled:** `opacity-50`, cursor padrão.
- **Mobile:** 16px de fonte abaixo de `md` para bloquear o zoom automático do iOS.

### Navigation

- **Sidebar (desktop):** 58px retraída → 224px no hover, via Tailwind puro (`group` + `hover:w-56`), sem JS de toggle. Fundo `rgba(11,15,23,0.95)` + `backdrop-blur(12px)`, borda direita. Rótulos fazem fade-in em 220ms. Item ativo: texto ciano, fundo `cyan-dim`, `border-l-2` ciano.
- **Sidebar (mobile):** a mesma nav vira gaveta deslizante (`-translate-x-full` ⇄ `translate-x-0`) com scrim `rgba(6,9,16,.6)`. Fechada, recebe `inert` + `aria-hidden` — fora do tab order, não só invisível.
- **Bottom nav (mobile):** 5 destinos, 56px de altura, ícone 20px + rótulo 10px, ativo em ciano e inativo em `text-muted`. Respeita `env(safe-area-inset-bottom)`.
- **Header mobile:** sticky, ☰ + título truncado + busca + coração de apoio, mesmo vidro escuro da sidebar. Não é montado em rotas que já têm barra de busca própria.

### Bottom Sheet

Painel que sobe do rodapé com topo arredondado em 18px, `max-height: 80vh`, alça de 8×3px em `bg-4`, header com título e ✕ de 44px, corpo rolável e rodapé fixo opcional. Trava o scroll do body, fecha por Esc, scrim ou ✕. É a forma mobile de qualquer painel que no desktop é fixo — o mesmo elemento é montado num lugar **ou** no outro, nunca nos dois.

### Signature: Card de Preço Teto

A assinatura visual do produto. Eyebrow em label maiúsculo ("PREÇO TETO · VALOR INTRÍNSECO"), o número em mono 40px ciano, o método alternativo em 12px discreto logo abaixo, e o upside numa pill mono 15px — verde com borda `rgba(16,185,129,0.25)` quando positivo, vermelho quando negativo, sempre com sinal explícito. Fundo em gradiente ciano quase invisível (6%→2%), borda ciano a 20%, halo de 20px. Nenhum outro elemento do app tem esse tratamento.

### Signature: Badge de Pódio

Quadrado de 32px, raio 8px, número em mono bold, gradiente 135° na cor da posição (verde 1º, ciano 2º, âmbar 3º) e glow de 12px na mesma cor. Do 4º em diante: sem fundo, número em `text-muted`. A queda brusca é o ponto — o pódio precisa ser visível na varredura.

## Do's and Don'ts

### Do:

- **Do** usar `useIsMobile()` para escolher qual árvore montar quando mobile e desktop têm estruturas diferentes; CSS só para diferença de estilo.
- **Do** garantir `min-w-0` em todo ancestral em fluxo de uma faixa rolável, e verificar em 390px que `document.documentElement.scrollWidth === 390`.
- **Do** aplicar mono (JetBrains) em todo valor que o usuário compara, soma ou audita — e só nele.
- **Do** reservar âmbar para valor sobrescrito pelo usuário, sempre acompanhado do botão de restaurar.
- **Do** dar 44×44px mínimos a qualquer alvo de toque no mobile.
- **Do** implementar o contrato completo de teclado (setas, `Home`/`End`, roving tabindex) sempre que usar `role="tab"`.
- **Do** desenhar o estado de dado ausente (`—` em `text-muted`) como estado de primeira classe: as fontes públicas caem e campo vazio é rotina, não bug.
- **Do** usar a variante `-dim` (12%) para qualquer fundo de acento; o hex sólido fica para texto, ícone, borda e a única ação primária da tela.
- **Do** manter uma só ação primária com gradiente por tela.

### Don't:

- **Don't** virar dashboard genérico de admin: card sem hierarquia, KPI tile enfileirado sem prioridade, gráfico decorativo que ninguém lê. Toda tela tem um número principal — deixe claro qual é.
- **Don't** virar planilha crua: tudo em um tamanho de fonte só, linha zebrada, cor sem significado. Densidade alta é bem-vinda; densidade *plana* não.
- **Don't** virar terminal retrô: nada de verde-fósforo, scanline, ASCII decorativo ou mono aplicado a texto corrido. O ciano é frio e limpo, não nostálgico.
- **Don't** introduzir tema claro, nem `prefers-color-scheme` — dark-only é compromisso de produto, e `index.css` é a fonte única da paleta.
- **Don't** truncar valor monetário com reticências; reduza a fonte antes.
- **Don't** colocar sombra em card, linha ou input em repouso — suba um nível tonal ou use borda.
- **Don't** usar verde/vermelho como paleta de gráfico categórico ou preenchimento decorativo; eles significam direção de valor.
- **Don't** esconder árvore mobile e desktop com `hidden md:block` / `md:hidden` quando as duas contêm o mesmo texto ou role.
- **Don't** ter mais de dois elementos com glow colorido na mesma tela.
