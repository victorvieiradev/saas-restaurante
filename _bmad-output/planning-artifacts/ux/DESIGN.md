---
title: "DESIGN.md - Sistema de Cardápio Digital & Comandas QR Code"
status: "draft"
created: "2026-08-03"
updated: "2026-08-03"
colors:
  primary: "#F97316"
  primary_hover: "#EA580C"
  secondary: "#10B981"
  background_light: "#FAFAFA"
  background_dark: "#0F172A"
  surface_light: "#FFFFFF"
  surface_dark: "#1E293B"
  text_primary: "#0F172A"
  text_muted: "#64748B"
  status_pending: "#F59E0B"
  status_preparing: "#3B82F6"
  status_completed: "#10B981"
  status_cancelled: "#EF4444"
typography:
  font_family: "'Outfit', 'Inter', system-ui, sans-serif"
  h1: "2rem (32px), bold, tracking-tight"
  h2: "1.5rem (24px), semibold"
  h3: "1.25rem (20px), medium"
  body: "1rem (16px), regular"
  caption: "0.875rem (14px), regular, muted"
rounded:
  card: "1rem (16px)"
  button: "0.75rem (12px)"
  badge: "9999px"
spacing:
  container_padding: "1rem (16px)"
  gap_sm: "0.5rem (8px)"
  gap_md: "1rem (16px)"
  gap_lg: "1.5rem (24px)"
---

# DESIGN.md - Sistema Visual e Identidade da Marca

## 1. Brand & Style (Identidade e Conceito)
O design do **Cardápio Digital & Comandas QR Code** adota um estilo **Gastronômico Moderno, Vibrante e Ágil**. 
- Para o **Cliente**: Cores quentes e apetitosas (âmbar/laranja), fotos de pratos destacadas em cards limpos, sombras suaves e ausência de ruídos visuais para facilitar a decisão de compra.
- Para a **Cozinha (KDS)**: Modo escuro (*Dark Mode*) de alto contraste, com badges coloridas de grande visibilidade para status e temporizadores de espera, reduzindo a fadiga visual dos cozinheiros.
- Para o **Caixa e Admin**: Interface corporativa limpa (*Clean Dashboard*), focada em produtividade e busca rápida.

---

## 2. Paleta de Cores (Colors)

| Token | Hex | Uso Principal |
| :--- | :--- | :--- |
| `colors.primary` | `#F97316` | Botões de ação principal (Adicionar ao Carrinho, Concluir Pedido), destaque de preço |
| `colors.primary_hover` | `#EA580C` | Estado de hover e press nos botões primários |
| `colors.secondary` | `#10B981` | Botões de sucesso, indicação de prato disponível ou pedido concluído |
| `colors.background_light` | `#FAFAFA` | Fundo principal da aplicação do Cliente e Painel Admin |
| `colors.background_dark` | `#0F172A` | Fundo do sistema KDS (Cozinha) |
| `colors.surface_light` | `#FFFFFF` | Background dos cards de produtos e modais no modo claro |
| `colors.surface_dark` | `#1E293B` | Background dos cards de pedidos no KDS |
| `colors.status_pending` | `#F59E0B` | Badge de pedido **Pendente** na cozinha (Amarelo/Âmbar) |
| `colors.status_preparing` | `#3B82F6` | Badge de pedido **Em Preparo** na cozinha (Azul) |
| `colors.status_completed` | `#10B981` | Badge de pedido **Concluído** na cozinha (Verde) |

---

## 3. Tipografia (Typography)
- **Fonte Padrão:** Google Fonts `Outfit` (Headings) e `Inter` (Corpo e tabelas).
- **Hierarquia:**
  - `H1` (32px / Bold): Título do Restaurante, Título das Telas Principais.
  - `H2` (24px / SemiBold): Nomes de Categorias, Número da Comanda em destaque.
  - `H3` (20px / Medium): Nomes de Produtos, Título de Pedido no KDS.
  - `Body` (16px / Regular): Descrições de pratos, itens do carrinho, extrato do caixa.
  - `Caption` (14px / Muted): Observações dos clientes, timestamps, avisos secundários.

---

## 4. Layout, Elevação & Formas (Shapes & Depth)

- **Cards de Pratos (Cliente):** Arredondamento suave (`rounded.card` = 16px), sombra sutil `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05)`, foto no topo com proporção 4:3.
- **Botões:** Arredondados (`rounded.button` = 12px), altura mínima de toque no mobile = 48px para facilitar o toque com o polegar.
- **Barra de Navegação Fictícia do Carrinho (Floating Bottom Bar):** Barra fixa no rodapé do celular do cliente exibindo: `[2 itens] Ver Carrinho — Total: R$ 56,00`.

---

## 5. Componentes Principais (Components Specification)

### 5.1 Card de Produto (Menu Item Card)
- Imagem do prato (100% largura no mobile ou thumbnail 96x96px).
- Nome em negrito + Descrição reduzida (máx 2 linhas).
- Preço em destaque em laranja `colors.primary`.
- Botão redondo `+ Adicionar` no canto inferior direito do card.

### 5.2 Card de Pedido KDS (Kitchen Card)
- Cabeçalho com o **Número da Comanda** em destaque extra grande (ex: **Comanda #015**).
- Cronômetro de tempo decorrido no canto superior direito (ex: `⏱️ 04:12 min`).
- Lista de itens em fonte grande com marcadores de quantidade (ex: `2x Hambúrguer Tradicional`).
- Destaque em caixa vermelha/amarela para **Observações do Cliente** (ex: *Sem cebola*).
- Botão de ação largo na parte inferior: `[ Iniciar Preparo ]` ou `[ Concluir Prato ]`.

### 5.3 Barra de Busca & Extrato da Comanda (Caixa/POS)
- Campo de input grande com auto-foco para digitar o número da comanda.
- Tabela limpa de consumo com colunas: Hora, Item, Quantidade, Valor Unitário, Subtotal.
- Totalizador com valor final destacado e botão verde `[ Concluir & Liberar Comanda ]`.

---

## 6. Do's and Don'ts (Boas Práticas de UI)

- ✅ **Fazer:** Manter o número da comanda visível no topo da tela do cliente o tempo todo (`Mesa/Comanda #015`).
- ✅ **Fazer:** Usar alertas sonoros distintos na cozinha para novos pedidos.
- ❌ **Não Fazer:** Exigir cadastro, formulário de e-mail ou dados de cartão de crédito para visualizar o cardápio.
- ❌ **Não Fazer:** Usar textos pequenos na tela da cozinha (a tela KDS é lida à distância pelos cozinheiros).
