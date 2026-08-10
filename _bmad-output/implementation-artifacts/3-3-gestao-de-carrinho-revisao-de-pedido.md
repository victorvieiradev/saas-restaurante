# Story 3.3: Gestão de Carrinho & Revisão de Pedido

Status: done

## Story Description

- **Como** Cliente do Restaurante,
- **Quero** adicionar itens ao carrinho, ajustar quantidades, incluir observações específicas e revisar a lista de itens,
- **Para que** eu garanta que meu pedido esteja correto e completo antes de enviá-lo para a cozinha.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Modal de Detalhes do Produto e Observações do Item
- [x] Ao clicar em "Adicionar" ou no card de um produto disponível, abre um modal/drawer de detalhes do produto.
- [x] O modal exibe imagem grande (se houver), nome, descrição e preço unitário.
- [x] Seletor de quantidade com botões `-` e `+` (mínimo 1 unidade).
- [x] Campo de texto para observações do item (ex: *"Sem cebola"*, *"Ponto da carne: ao ponto"*, *"Gelo e limão"*).
- [x] Botão de confirmação `[ Adicionar ao Pedido — R$ XX,XX ]` que calcula dinamicamente o valor (Preço x Quantidade).

### AC2: Gerenciamento de Estado do Carrinho (Cart State Management)
- [x] Mantém a lista de itens selecionados com a estrutura: `[{ id, produto_id, nome, preco, quantidade, observacao, imagem_url, subtotal }]`.
- [x] Permite adicionar múltiplos itens e agrupar itens idênticos (mesmo `produto_id` e mesma `observacao`).
- [x] Calcula automaticamente o total de itens (`totalItems`) e a soma dos valores (`totalAmount`).
- [x] Persiste o carrinho no `localStorage` vinculado ao token/ID da comanda ativa para evitar perdas ao recarregar a página.

### AC3: Barra Flutuante Inferior do Carrinho (Floating Cart Bar)
- [x] Sempre que houver 1 ou mais itens no carrinho, exibe uma barra flutuante no rodapé da tela.
- [x] A barra mostra badge com a quantidade total de itens, o valor total formatado em R$ e botão de ação `[ Ver Pedido / Revisar ]`.
- [x] Design responsivo com visual premium (`bg-slate-900/95 backdrop-blur`, bordas destacadas, gradiente no botão de revisão).

### AC4: Modal / Tela de Revisão do Pedido (Order Review)
- [x] Ao clicar no botão da barra flutuante, abre a tela/modal de revisão detalhada do pedido.
- [x] Exibe a lista de itens adicionados com:
  - Nome do produto e observação (se houver, destacada visualmente em tom amarelado/laranja).
  - Controles de incremento/decremento (`-` e `+`) para ajustar a quantidade diretamente na revisão.
  - Botão de lixeira (`Trash2`) para remover o item do carrinho.
  - Subtotal de cada item (Preço unitário x Quantidade).
- [x] Campo de observação geral do pedido (opcional, ex: *"Entregar tudo junto"*).
- [x] Exibição destacada do resumo de valores (Subtotal dos itens, taxa/serviço se houver, Valor Total Final).
- [x] Botão proeminente de ação principal: `[ Enviar Pedido para a Cozinha ]` (preparado para acionar o envio na Story 3.4).

### AC5: Resiliência & Trata de Carrinho Vazio
- [x] Se todos os itens forem removidos durante a revisão, fecha a tela de revisão e oculta a barra flutuante.
- [x] Exibe mensagem amigável no modal de revisão caso esteja vazio, com botão `[ Voltar ao Cardápio ]`.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Gerenciador / Contexto de Carrinho (`src/context/CartContext.jsx`)** (AC: #2, #5)
  - Implementar funções: `addToCart(produto, quantidade, observacao)`, `removeFromCart(itemId)`, `updateQuantity(itemId, newQty)`, `clearCart()`.
  - Adicionar cálculo derivado de `totalItems` e `totalAmount`.
  - Integrar persistência temporária no `localStorage` por `comanda_id`.

- [x] **Task 2: Criar Modal de Detalhes & Adição de Produto (`src/components/ModalDetalhesProduto.jsx`)** (AC: #1)
  - Renderizar modal com foto, título, descrição e preço.
  - Adicionar controles de quantidade (`-` / `+`) e textarea para observação.
  - Botão `[ Adicionar ao Pedido — R$ XX,XX ]` conectando com a função `addToCart`.

- [x] **Task 3: Criar Barra Flutuante Inferior (`src/components/BarraCarrinhoFlutuante.jsx`)** (AC: #3)
  - Criar componente fixo no rodapé (`fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40`).
  - Renderizar contador de itens, valor total formatado (ex: `R$ 74,80`) e botão `[ Ver Pedido ]`.

- [x] **Task 4: Criar Modal / Drawer de Revisão de Pedido (`src/components/ModalRevisaoPedido.jsx`)** (AC: #4, #5)
  - Listagem dos itens com foto mini, nome, observações, preço e ações.
  - Ajuste rápido de quantidades e remoção de itens.
  - Campo de observação geral para o garçom/cozinha.
  - Botão final `[ Enviar Pedido para a Cozinha ]` (com callback/trigger para Story 3.4).

- [x] **Task 5: Integrar tudo em `CardapioCliente.jsx` e `ComandaCliente.jsx`** (AC: #1, #2, #3, #4, #5)
  - Conectar os cliques dos cards do cardápio para abrir o `ModalDetalhesProduto`.
  - Posicionar `BarraCarrinhoFlutuante` e `ModalRevisaoPedido` no fluxo da página do cliente.
  - Testar fluxo completo: Adicionar item -> Inserir observação -> Ver barra flutuante -> Abrir revisão -> Alterar quantidade -> Remover item.

### Review Findings

- [x] [Review][Patch] Recarregar dados do localStorage quando comandaId é resolvido assincronamente [`src/context/CartContext.jsx:15`]
- [x] [Review][Patch] Arredondamento preciso de 2 casas decimais no cálculo de subtotal e totalAmount [`src/context/CartContext.jsx:45`]
- [x] [Review][Patch] Auto-fechamento inteligente do modal de revisão quando o último item é removido do carrinho [`src/components/ModalRevisaoPedido.jsx:18`]

---

## Dev Notes & Guardrails de Arquitetura

### Estrutura de Componentes
- `src/context/CartContext.jsx`: Provedor de estado do carrinho do cliente com suporte a persistência no `localStorage`.
- `src/components/ModalDetalhesProduto.jsx`: Modal responsivo para selecionar quantidade e cadastrar observação específica do item.
- `src/components/BarraCarrinhoFlutuante.jsx`: Barra fixa no rodapé que aparece dinamicamente quando há 1 ou mais itens no carrinho.
- `src/components/ModalRevisaoPedido.jsx`: Modal/drawer de revisão com edição de quantidades, remoção, observação geral e CTA de envio.

### Diretrizes de Design & Cores (`ux/DESIGN.md`)
- **Fundo do Modal/Drawer**: `bg-slate-900` com bordas `border-slate-800` e suporte a backdrop blur (`bg-slate-950/80 backdrop-blur-sm`).
- **Botões e Ações Principais**: Gradiente laranja/âmbar (`bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white`).
- **Observações do Item**: Destaque visual leve com `text-amber-400` e fundo `bg-amber-500/10 border border-amber-500/20` para fácil leitura.
- **Ícones (`lucide-react`)**: `ShoppingBag`, `Plus`, `Minus`, `Trash2`, `MessageSquare`, `Send`, `X`, `ChevronRight`.

---

## Project Structure Notes

- `src/context/CartContext.jsx`
- `src/components/ModalDetalhesProduto.jsx`
- `src/components/BarraCarrinhoFlutuante.jsx`
- `src/components/ModalRevisaoPedido.jsx`
- `src/components/CardapioCliente.jsx`
- `src/pages/ComandaCliente.jsx`

---

## Dev Agent Record

### Agent Model Used
Gemini 3.6 Flash (High)

### Completion Notes List
- Criado `CartContext.jsx` para gerenciamento centralizado do estado do carrinho, totais derivados e sincronização com o `localStorage`.
- Criado `ModalDetalhesProduto.jsx` permitindo escolha de quantidade e inclusão de observações personalizadas por item.
- Criado `BarraCarrinhoFlutuante.jsx` exibindo badge de itens, valor total formatado e acionador da revisão.
- Criado `ModalRevisaoPedido.jsx` com listagem de itens, ajuste de quantidade, lixeira para remoção, observação geral do pedido e botão de confirmação.
- Integrado tudo em `CardapioCliente.jsx` e `ComandaCliente.jsx`.
- Validada compilação do projeto com sucesso via `npm run build` (0 erros).

### File List
- `src/context/CartContext.jsx`
- `src/components/ModalDetalhesProduto.jsx`
- `src/components/BarraCarrinhoFlutuante.jsx`
- `src/components/ModalRevisaoPedido.jsx`
- `src/components/CardapioCliente.jsx`
- `src/pages/ComandaCliente.jsx`
- `_bmad-output/implementation-artifacts/3-3-gestao-de-carrinho-revisao-de-pedido.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
