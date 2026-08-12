# Story 3.4: Confirmação & Gravação do Pedido

Status: done

## Story Description

- **Como** Cliente do Restaurante,
- **Quero** clicar em "Enviar Pedido para a Cozinha" na revisão e receber uma confirmação imediata na tela com os detalhes do meu pedido,
- **Para que** eu saiba que a cozinha já recebeu minha solicitação e possa acompanhar o status sem dúvidas.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Gravação do Pedido na Base de Dados (Database Insertion & Fallback)
- [x] Ao confirmar a revisão do pedido, envia a solicitação para salvar no Supabase na tabela `pedidos`.
- [x] O registro do pedido inclui: `restaurante_id`, `comanda_id`, `status: 'PENDENTE'`, `valor_total` (soma exata dos itens) e `criado_em: current_timestamp`.
- [x] Suporta fallback resiliente no `localStorage` sob a chave `restaurante_pedidos_${restauranteId}` caso o banco de dados Supabase esteja offline ou inacessível.

### AC2: Gravação dos Itens do Pedido (Order Items Mapping)
- [x] Insere cada item do carrinho na tabela `itens_pedido` vinculando ao `pedido_id` gerado.
- [x] Cada item grava: `pedido_id`, `produto_id`, `quantidade`, `preco_unitario` e `observacao` (se houver, ex: *"Sem cebola"*).
- [x] Suporta gravação da observação geral do pedido na estrutura do pedido/itens.

### AC3: Transição Automática do Status da Comanda (Comanda Status Update)
- [x] Verifica o status atual da comanda vinculada.
- [x] Se a comanda estiver com status `DISPONIVEL`, atualiza automaticamente para `EM_USO` no Supabase e no armazenamento local.
- [x] Registra `sessao_iniciada_em: current_timestamp` se for o primeiro pedido realizado na sessão daquela comanda.

### AC4: Prevenção de Duplicidade & Estado de Carregamento (Submitting Guardrails)
- [x] Durante o processamento do envio, o botão `[ Enviar Pedido para a Cozinha ]` exibe estado de carregamento com ícone `Loader2` animado e permanece desabilitado para impedir cliques múltiplos.
- [x] Bloqueia interações na tela enquanto a transação estiver em andamento.

### AC5: Modal / Overlay de Confirmação de Sucesso (Success Feedback & Summary)
- [x] Ao concluir a gravação com sucesso, abre modal/overlay animado de confirmação.
- [x] Exibe cabeçalho de comemoração com ícone check animado (`CheckCircle2` / `Sparkles`) e mensagem: *"Pedido enviado para a cozinha com sucesso!"*.
- [x] Exibe o código/número identificador do pedido (ex: `Pedido #104` ou ID sequencial).
- [x] Exibe o resumo detalhado do pedido gravado (lista de itens, quantidades, observações por item e valor total formatado em R$).
- [x] Exibe indicador de status *"Recebido pela Cozinha - Status: Pendente"*.
- [x] Botão de ação `[ Entendido / Fazer Novo Pedido ]` que fecha o modal e mantém o cliente no cardápio digital.

### AC6: Limpeza do Carrinho Local (Cart Reset)
- [x] Após o envio confirmado com sucesso, limpa os itens do carrinho (`clearCart()`) e reseta o campo de observação geral.
- [x] Atualiza a interface do cliente para refletir a comanda em atendimento (`EM_USO`).

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Serviço de Pedidos (`src/services/pedidoService.js`)** (AC: #1, #2, #3)
  - Implementar a função `criarPedido({ restauranteId, comandaId, cartItems, valorTotal, observacaoGeral })`.
  - Criar registro na tabela `pedidos` com `status: 'PENDENTE'`.
  - Criar registros na tabela `itens_pedido` para todos os itens do carrinho.
  - Atualizar o status da comanda para `EM_USO` invocando `updateComandaStatus` se a comanda estiver `DISPONIVEL`.
  - Implementar lógica de fallback resiliente no `localStorage` caso o Supabase falhe ou esteja desconectado.

- [x] **Task 2: Criar Componente de Confirmação de Sucesso (`src/components/ModalSucessoPedido.jsx`)** (AC: #5)
  - Renderizar modal com fundo escuro e efeito de desfoque (`bg-slate-950/90 backdrop-blur-md`).
  - Adicionar ícone de sucesso em destaque com brilho/animação em verde/laranja (`emerald-500` / `orange-500`).
  - Exibir número do pedido gerado, data/hora e badge "Status: Recebido pela Cozinha".
  - Exibir resumo dos itens enviados e valor total final em R$.
  - Botão `[ Fazer Novo Pedido ]` que fecha o modal e retorna o usuário ao cardápio com carrinho limpo.

- [x] **Task 3: Conectar Envio e Estados de Loading em `ModalRevisaoPedido.jsx`** (AC: #1, #4, #5, #6)
  - Adicionar estado `isSubmitting` no modal de revisão.
  - Substituir o handler mock `handleSendOrder` pela integração com `criarPedido`.
  - Ao iniciar envio, ativar `isSubmitting = true` e desabilitar botão com spinner `Loader2`.
  - Em caso de sucesso: acionar exibição do `ModalSucessoPedido`, fechar `ModalRevisaoPedido` e executar `clearCart()`.
  - Em caso de erro: exibir toast/alerta amigável com opção de tentar novamente.

- [x] **Task 4: Atualizar Contexto & Estado do Cliente em `ComandaCliente.jsx` e `CartContext.jsx`** (AC: #3, #6)
  - Disponibilizar `lastCreatedOrder` e `isSuccessOpen` no `CartContext`.
  - Sincronizar o status visual da comanda no cabeçalho de `ComandaCliente.jsx` para indicar "Em Atendimento" (`EM_USO`) após o primeiro pedido enviado.

- [x] **Task 5: Validação End-to-End do Fluxo Completo** (AC: #1, #2, #3, #4, #5, #6)
  - Adicionar itens ao carrinho -> Abrir revisão -> Clicar em enviar -> Verificar loading -> Confirmar modal de sucesso -> Verificar limpeza do carrinho -> Verificar status da comanda atualizada.
  - Validar build sem erros (`npm run build`).

---

## Dev Notes & Guardrails de Arquitetura

### Estrutura de Tabelas Supabase (PostgreSQL Schema)
```sql
-- Tabela Pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
    status status_pedido DEFAULT 'PENDENTE',
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Itens do Pedido
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL,
    observacao TEXT
);
```

### Arquivos Existentes a Serem Atualizados/Criados
- `src/services/pedidoService.js`: (NOVO) Serviço responsável pela criação de pedidos e fallback local.
- `src/components/ModalSucessoPedido.jsx`: (NOVO) Modal de feedback de envio e resumo do pedido.
- `src/components/ModalRevisaoPedido.jsx`: (UPDATE) Atualizar `handleSendOrder` para usar o `pedidoService` e gerenciar `isSubmitting`.
- `src/context/CartContext.jsx`: (UPDATE) Integrar estado e acionadores do modal de sucesso de pedido.
- `src/pages/ComandaCliente.jsx`: (UPDATE) Incluir o `ModalSucessoPedido` no fluxo da comanda do cliente.

### Design System & Componentes Visuais
- **Modal de Sucesso**: Fundo `bg-slate-900 border border-slate-800 rounded-3xl`, badge de sucesso `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`.
- **Botões de Ação**: Gradiente laranja/âmbar `bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold`.
- **Ícones Lucide**: `CheckCircle2`, `Sparkles`, `Clock`, `ShoppingBag`, `Loader2`, `ChevronRight`, `UtensilsCrossed`.

---

## Project Structure Notes

- `src/services/pedidoService.js`
- `src/components/ModalSucessoPedido.jsx`
- `src/components/ModalRevisaoPedido.jsx`
- `src/context/CartContext.jsx`
- `src/pages/ComandaCliente.jsx`

---

## Dev Agent Record

### Agent Model Used
Gemini 3.6 Flash (High)

### Completion Notes List
- Criado o serviço `pedidoService.js` com a função `criarPedido` e suporte a fallback em `localStorage` (`restaurante_pedidos_${restauranteId}`).
- Criado o componente `ModalSucessoPedido.jsx` com comemoração animada, status "Recebido pela Cozinha (Pendente)", resumo dos itens e valor total em BRL.
- Atualizado `ModalRevisaoPedido.jsx` com estado `isSubmitting`, spinner `Loader2`, bloqueio contra duplo clique e acionamento do fluxo de gravação.
- Atualizado `CartContext.jsx` para gerenciar `lastCreatedOrder` e `isSuccessOpen`.
- Atualizado `ComandaCliente.jsx` para incluir o modal de sucesso e re-validar o status da comanda para `EM_USO`.
- Validada compilação de produção com `npm run build` (0 erros).

### File List
- `src/services/pedidoService.js`
- `src/components/ModalSucessoPedido.jsx`
- `src/components/ModalRevisaoPedido.jsx`
- `src/context/CartContext.jsx`
- `src/pages/ComandaCliente.jsx`
- `_bmad-output/implementation-artifacts/3-4-confirmacao-gravacao-do-pedido.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
