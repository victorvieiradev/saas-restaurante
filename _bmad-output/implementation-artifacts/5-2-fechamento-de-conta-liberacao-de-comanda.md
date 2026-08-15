---
baseline_commit: 54a0f733bc5a3953021a66754d3f322b4db79910
---

# Story 5.2: Fechamento de Conta & Liberação de Comanda

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

- **Como** Atendente do Caixa,
- **Quero** registrar o pagamento da conta, selecionar a forma de pagamento, emitir o recibo e encerrar a comanda,
- **Para que** a comanda fique limpa e com status disponível para ser entregue ao próximo cliente, preservando todo o histórico financeiro de vendas do restaurante.

---

## Acceptance Criteria

### AC1: Modal de Pagamento & Escolha de Métodos
- [x] Ao clicar em `[ Prosseguir para Pagamento ]` no terminal POS (`CaixaPOS.jsx` / `ResumoTotalConta.jsx`), abre o modal de checkout/pagamento (`ModalPagamentoComanda.jsx`).
- [x] O modal exibe:
  - Cabeçalho com o número da comanda em destaque (ex: **Comanda #015**) e nome do restaurante.
  - Resumo de valores: Subtotal dos itens, Taxa de serviço opcional (toggle de 10% ou valor customizado), Desconto (opcional em R$), e Valor Final a Pagar em destaque (`text-3xl font-extrabold text-emerald-400`).
  - Grid seletor de formas de pagamento com ícones ilustrativos: `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `DINHEIRO`, `VALE_REFEICAO`.
  - Quando a forma selecionada for `DINHEIRO`: exibe campo "Valor Recebido (R$)" e calcula automaticamente o "Troco" em tempo real. Se o valor recebido for menor que o total, desabilita o botão de confirmação e exibe aviso de valor insuficiente.

### AC2: Confirmação do Pagamento & Transição de Status (Invariante AD-5)
- [x] Botão de ação principal: `[ Confirmar Pagamento & Liberar Comanda ]` com estado de loading (`Loader2 animate-spin`) para prevenir múltiplos cliques.
- [x] Ao confirmar o pagamento:
  - A comanda tem seu status atualizado para `DISPONIVEL` e `sessao_iniciada_em` resetado para `null`.
  - A sessão atual é desvinculada para que novas leituras do QR Code da comanda iniciem um novo atendimento sem herdar os pedidos pagos.
  - Grava a transação de fechamento/pagamento contendo: `comanda_id`, `comanda_numero`, `restaurante_id`, `valor_total`, `forma_pagamento`, `valor_recebido`, `troco`, `taxa_servico`, `desconto`, `pedidos_ids`, `fechado_em` (ISO timestamp).

### AC3: Preservação e Imutabilidade do Histórico Financeiro (Invariante AD-1, FR-304)
- [x] Todos os registros de `pedidos` e `itens_pedido` permanecem intactos no banco de dados Supabase e no `localStorage` (com flag ou status de sessão encerrada/paga), garantindo dados consolidados para auditoria, relatórios de vendas e métricas de faturamento do Gestor.
- [x] Assegura isolamento estrito multi-tenant por `restaurante_id` em todas as operações de escrita e consulta de pagamentos e fechamentos.

### AC4: Comprovante de Pagamento & Emissão de Recibo
- [x] Após o fechamento com sucesso, exibe tela/modal de confirmação (`ReciboComandaModal.jsx`) com:
  - Ícone de sucesso animado (`CheckCircle2 text-emerald-400`).
  - Mensagem: *"Pagamento realizado com sucesso! Comanda #015 liberada."*.
  - Detalhamento do recibo: Dados do restaurante, data e hora, itens consumidos com quantidades e preços, forma de pagamento utilizada, valor total pago e troco (se houver).
  - Botão `[ Imprimir Recibo ]` formatado para impressão térmica/padrão A4 via `window.print()`.
  - Botão `[ Atender Próxima Comanda ]` que limpa o estado do POS e retorna o foco para o campo de busca.

### AC5: Atualização em Tempo Real da Lista de Comandas Ativas
- [x] A comanda liberada é removida imediatamente da lista de atalhos de comandas ativas em uso (`ListaComandasAtivas.jsx`) sem necessidade de recarregar a página.
- [x] Caso a tela do cliente esteja aberta com a URL da comanda liberada, seu estado de carrinho e pedidos anteriores são limpos e ela passa a exibir o cardápio disponível para a nova mesa.

### AC6: Tratamento de Exceções & Resiliência Offline
- [x] Se a comanda estiver com status `DISPONIVEL` ou sem consumo válido, o botão de pagamento permanece desabilitado com aviso explicativo.
- [x] Fallback robusto no `localStorage` (`restaurante_comandas_${restauranteId}`, `restaurante_pedidos_${restauranteId}`, `restaurante_fechamentos_${restauranteId}`) caso o Supabase esteja temporariamente indisponível.

---

## Tasks / Subtasks

- [x] **Task 1: Implementar Serviços de Fechamento de Comanda e Pagamentos** (AC: #2, #3, #6)
  - [x] Criar função `fecharComandaPagamento({ restauranteId, comandaId, comandaNumero, pedidos, formaPagamento, valorTotal, valorRecebido, troco, taxaServico, desconto })` em `src/services/comandaService.js` (ou `src/services/caixaService.js`).
  - [x] Atualizar status da comanda para `DISPONIVEL` e `sessao_iniciada_em: null` no Supabase e no localStorage.
  - [x] Marcar os pedidos da comanda como arquivados/pagos na sessão (`sessao_fechada_em`).
  - [x] Salvar registro de transação de pagamento no Supabase (tabela `pagamentos` ou fallback `restaurante_fechamentos_${restauranteId}`).

- [x] **Task 2: Criar Componente `ModalPagamentoComanda.jsx`** (AC: #1, #2)
  - [x] Criar `src/components/caixa/ModalPagamentoComanda.jsx` com suporte a seleção de métodos de pagamento (`PIX`, `Cartão de Crédito`, `Cartão de Débito`, `Dinheiro`, `Vale Refeição`).
  - [x] Implementar cálculo de troco dinâmico para pagamentos em dinheiro.
  - [x] Implementar alternância de taxa de serviço de 10% (opcional) e campo de desconto.
  - [x] Integrar botão de confirmação com loading spinner e validações de valor.

- [x] **Task 3: Criar Componente `ReciboComandaModal.jsx`** (AC: #4)
  - [x] Criar `src/components/caixa/ReciboComandaModal.jsx` com visual de cupom/recibo de fechamento.
  - [x] Implementar estilização para impressão via CSS `@media print` garantindo impressão limpa.
  - [x] Adicionar botões `[ Imprimir Recibo ]` e `[ Atender Próxima Comanda ]`.

- [x] **Task 4: Integrar Fluxo Completo na Página `src/pages/CaixaPOS.jsx`** (AC: #1, #2, #4, #5)
  - [x] Conectar o clique de `[ Prosseguir para Pagamento ]` no `ResumoTotalConta.jsx` para abrir o `ModalPagamentoComanda`.
  - [x] Tratar o callback de sucesso de fechamento atualizando `comandasAtivas`, limpando a seleção e abrindo o `ReciboComandaModal`.
  - [x] Notificar o usuário com toast/banner de sucesso no topo do POS.

- [x] **Task 5: Validação, Testes e Build** (AC: #1, #2, #3, #4, #5, #6)
  - [x] Testar fluxo de pagamento com PIX, Cartão e Dinheiro (com cálculo de troco).
  - [x] Testar fechamento de comanda com 10% de taxa de serviço.
  - [x] Verificar se a comanda passa para `DISPONIVEL` e é removida da barra de comandas em uso.
  - [x] Verificar se os pedidos permanecem salvos no histórico financeiro.
  - [x] Executar `npm run build` e confirmar 0 erros.

### Review Findings
- [x] [Review][Patch] Arredondamento e precisão decimal de moeda BRL para pagamentos e validação de troco [`src/components/caixa/ModalPagamentoComanda.jsx`]
- [x] [Review][Patch] Reset de estado do formulário de pagamento ao abrir nova comanda [`src/components/caixa/ModalPagamentoComanda.jsx`]
- [x] [Review][Patch] Desabilitação do botão de pagamento quando o valor em dinheiro for vazio ou zero [`src/components/caixa/ModalPagamentoComanda.jsx`]
- [x] [Review][Patch] Campo numérico para ajuste customizado da taxa de serviço [`src/components/caixa/ModalPagamentoComanda.jsx`]
- [x] [Review][Patch] Preservação de status CANCELADO de pedidos ao fechar a comanda [`src/services/comandaService.js`]
- [x] [Review][Patch] Limpeza de comanda selecionada no POS ao confirmar pagamento [`src/pages/CaixaPOS.jsx`]
- [x] [Review][Patch] Proteção contra race conditions em sincronização Realtime [`src/pages/CaixaPOS.jsx`]
- [x] [Review][Patch] Contagem precisa de pedidos ativos na barra de comandas do Caixa [`src/services/comandaService.js`]
- [x] [Review][Patch] Sincronização do CartContext do cliente ao ocorrer fechamento no caixa [`src/context/CartContext.jsx`]
- [x] [Review][Patch] Normalização não-destrutiva de número de comanda em matching local [`src/services/comandaService.js`]
- [x] [Review][Patch] Fallback seguro de ID de transação e otimização de CSS de impressão [`src/components/caixa/ReciboComandaModal.jsx`]
- [x] [Review][Patch] Migração DDL SQL no schema para pagamentos e sessao_fechada_em [`supabase/schema.sql`]

---

## Dev Notes

### Regras de Negócio & Invariantes Arquiteturais
- **Invariante AD-1 (Multi-Tenant & RLS):** Todos os registros de pagamentos e atualizações de comandas devem conter obrigatoriamente o `restaurante_id`.
- **Invariante AD-5 (Ciclo de Vida da Comanda & Imutabilidade Histórica):** Ao fechar a conta, a comanda transiciona para `DISPONIVEL` e seu campo `sessao_iniciada_em` torna-se `null`. Os pedidos vinculados a essa sessão não são deletados — recebem marcação de fechamento (`sessao_fechada_em` / `pago: true`) preservando o histórico de vendas para relatórios.
- **Diretrizes Visuais (`DESIGN.md` e `EXPERIENCE.md`):**
  - Tema: *Clean Dashboard* escuro/slate com acentos em Laranja (`#F97316`) e Verde Esmeralda (`#10B981`).
  - Fontes: `Outfit` (títulos) e `Inter` (tabelas e valores).
  - Formatação Monetária: BRL padrão brasileiro (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`).

### Mapeamento de Arquivos
- `src/services/comandaService.js` (UPDATE: adicionar função `fecharComandaPagamento`)
- `src/services/pedidoService.js` (UPDATE: marcar pedidos como pagos/encerrados)
- `src/components/caixa/ModalPagamentoComanda.jsx` (NEW: modal de checkout e formas de pagamento)
- `src/components/caixa/ReciboComandaModal.jsx` (NEW: comprovante e recibo de impressão)
- `src/components/caixa/ResumoTotalConta.jsx` (UPDATE: conectar botão de prosseguir)
- `src/pages/CaixaPOS.jsx` (UPDATE: orquestrar modais de pagamento, recibo e atualização de estado)

---

## Project Structure Notes

- `src/pages/CaixaPOS.jsx`
- `src/components/caixa/ModalPagamentoComanda.jsx`
- `src/components/caixa/ReciboComandaModal.jsx`
- `src/components/caixa/ResumoTotalConta.jsx`
- `src/components/caixa/ExtratoConsumoComanda.jsx`
- `src/services/comandaService.js`
- `src/services/pedidoService.js`

---

## References

- [PRD - Seção 3.3 Requisitos Módulo Caixa (FR-303, FR-304)](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/prd/prd.md#L74-L79)
- [PRD - Jornada UJ-3 Ana Fechando a Conta](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/prd/prd.md#L41-L47)
- [ARCHITECTURE-SPINE - Invariante AD-5 Ciclo de Vida da Comanda](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md#L45-L50)
- [DESIGN.md - Seção 5.3 Barra de Busca & Extrato da Comanda](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/ux/DESIGN.md#L99-L104)
- [EXPERIENCE.md - Seção 4 Flow 3: Atendente Fechando a Comanda](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/ux/EXPERIENCE.md#L89-L94)

---

## Dev Agent Record

### Agent Model Used

Gemini 3.7 Flash (High)

### Debug Log References
- Build do projeto validado com sucesso via `vite build` (0 erros).
- Validação do ciclo de vida da comanda: transição para `DISPONIVEL` com `sessao_iniciada_em: null` mantendo histórico de pedidos pagos e registros de fechamento (`fechamentos_comanda`).
- Impressão de cupom térmico/recibo implementada via `@media print`.

### Completion Notes List
- Implementada a função `fecharComandaPagamento` e `fetchHistoricoFechamentos` no `src/services/comandaService.js`.
- Atualizado `fetchPedidosComanda` em `src/services/pedidoService.js` com suporte a `apenasAbertos: true` garantindo isolamento entre sessões de atendimento.
- Criado o componente `ModalPagamentoComanda.jsx` com suporte a PIX, Cartão de Crédito/Débito, Dinheiro (com cálculo automático de troco em tempo real) e Vale Refeição, além de toggle de taxa de serviço de 10% e desconto em R$.
- Criado o componente `ReciboComandaModal.jsx` com visual de cupom fiscal térmico e suporte a `window.print()` e formatação CSS `@media print`.
- Integrado o fluxo completo na página `src/pages/CaixaPOS.jsx` com atualização em tempo real da lista de comandas ativas e persistência resiliente local/Supabase.

### File List
- `src/services/comandaService.js` (Modificado)
- `src/services/pedidoService.js` (Modificado)
- `src/components/caixa/ModalPagamentoComanda.jsx` (Criado)
- `src/components/caixa/ReciboComandaModal.jsx` (Criado)
- `src/pages/CaixaPOS.jsx` (Modificado)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Modificado)
- `_bmad-output/implementation-artifacts/5-2-fechamento-de-conta-liberacao-de-comanda.md` (Modificado)

