# Story 4.3: Transição de Status de Pedido na Cozinha

Status: done

## Story

- **Como** Cozinheiro,
- **Quero** clicar nos botões de ação do card para mover o pedido entre os estágios (*Pendente* → *Em Preparo* → *Concluído*),
- **Para que** toda a equipe (cozinha, salão e caixa) acompanhe o progresso de cada prato em tempo real.

---

## Acceptance Criteria

### AC1: Transição de Status `PENDENTE` → `EM_PREPARO`
- [x] No card com status `PENDENTE` (Coluna 1), exibe botão de ação proeminente `[ Iniciar Preparo ]` com ícone temático (`Flame` ou `Play`) e destaque visual em amarelo/âmbar (`bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold`).
- [x] Ao clicar em `[ Iniciar Preparo ]`, atualiza o status do pedido para `EM_PREPARO` no Supabase (com fallback no `localStorage`).
- [x] O card é transferido imediatamente da coluna **Pendentes** para a coluna **Em Preparo** (atualização otimista na interface).
- [x] Garante altura mínima de toque de 48px (`min-h-[48px]`) no botão para operação confortável em telas touchscreen e tablets.

### AC2: Transição de Status `EM_PREPARO` → `CONCLUIDO`
- [x] No card com status `EM_PREPARO` (Coluna 2), exibe botão de ação proeminente `[ Concluir ]` (ou `[ Concluir Pedido ]`) com ícone (`CheckCircle2` ou `Check`) e destaque visual em verde/esmeralda (`bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold`).
- [x] Ao clicar em `[ Concluir ]`, atualiza o status do pedido para `CONCLUIDO` no Supabase (com fallback no `localStorage`).
- [x] O card é transferido imediatamente da coluna **Em Preparo** para a coluna **Concluídos** (atualização otimista na interface).

### AC3: Visualização do Card na Coluna `CONCLUIDO`
- [x] No card com status `CONCLUIDO` (Coluna 3), exibe badge ou indicador visual claro de finalização (ex: `✓ Pedido Finalizado / Pronto para Entrega`).
- [x] Opcionalmente, disponibiliza ação secundária discreta para retornar status a `EM_PREPARO` em caso de clique acidental.

### AC4: Prevenção de Duplo Clique & Loading State
- [x] Enquanto a requisição de atualização de status estiver em andamento, o botão exibe estado de loading com spinner (`Loader2` / `RefreshCw animate-spin`) e fica desabilitado (`disabled:opacity-60 disabled:cursor-not-allowed`) para evitar múltiplos cliques ou race conditions.

### AC5: Persistência & Resiliência Offline (Supabase + localStorage)
- [x] Implementar a função `atualizarStatusPedido(pedidoId, novoStatus, restauranteId)` em `src/services/pedidoService.js`.
- [x] No Supabase: executa `.update({ status: novoStatus }).eq('id', pedidoId).eq('restaurante_id', restauranteId)`.
- [x] No `localStorage`: atualiza o campo `status` do pedido na lista armazenada sob a chave `restaurante_pedidos_${restauranteId}`.
- [x] Se a chamada ao Supabase falhar, utiliza o fallback local sem bloquear a interface e reverte a UI otimista apenas em caso de erro crítico.

### AC6: Sincronização em Tempo Real entre Múltiplos Dispositivos (AD-3 / AD-4)
- [x] A alteração de status em um dispositivo dispara o evento `UPDATE` via Supabase Realtime para os outros monitores KDS e telas conectadas.
- [x] O handler de `UPDATE` no `KanbanKDS.jsx` atualiza o estado local preservando dados de itens e comanda sem recarregar a tela ou duplicar cards.
- [x] Os contadores no cabeçalho (*Pendentes*, *Em Preparo*, *Concluídos*) são recalculados dinamicamente refletindo o novo estado.

---

## Tasks / Subtasks

- [x] **Task 1: Implementar Função `atualizarStatusPedido` em `src/services/pedidoService.js`** (AC: #5)
  - [x] Criar e exportar `atualizarStatusPedido(pedidoId, novoStatus, restauranteId)`.
  - [x] Implementar mutação no Supabase na tabela `pedidos` (`.update({ status: novoStatus })`).
  - [x] Implementar atualização equivalente no mock de `localStorage` (`restaurante_pedidos_${restauranteId}`).
  - [x] Validar que o status segue a máquina de estados estrita (AD-4: `PENDENTE`, `EM_PREPARO`, `CONCLUIDO`, `CANCELADO`).

- [x] **Task 2: Atualizar Componente `src/components/cozinha/OrderCardKDS.jsx`** (AC: #1, #2, #3, #4)
  - [x] Adicionar propriedade `onUpdateStatus` e estado de carregamento local `isProcessing` ao componente.
  - [x] Renderizar botão `[ Iniciar Preparo ]` com estilo amarelo/âmbar (`bg-amber-500`) quando `status === 'PENDENTE'`.
  - [x] Renderizar botão `[ Concluir ]` com estilo verde (`bg-emerald-500`) quando `status === 'EM_PREPARO'`.
  - [x] Exibir badge/indicador de concluído quando `status === 'CONCLUIDO'`.
  - [x] Adicionar spinner e estado `disabled` durante a transição.
  - [x] Garantir altura de toque >= 48px conforme especificação UX para KDS touchscreen.

- [x] **Task 3: Atualizar Componente `src/components/cozinha/KanbanKDS.jsx`** (AC: #1, #2, #5, #6)
  - [x] Criar handler `handleStatusChange(pedidoId, novoStatus)` com atualização otimista do estado `pedidos`.
  - [x] Integrar chamada a `atualizarStatusPedido`.
  - [x] Passar `onUpdateStatus` para as instâncias de `<OrderCardKDS />` em todas as 3 colunas.
  - [x] Garantir que o listener `onUpdatePedido` do Supabase Realtime mescle corretamente as mudanças de status recebidas remotamente.

- [x] **Task 4: Validação, Testes End-to-End & Build** (AC: #1, #2, #3, #4, #5, #6)
  - [x] Testar fluxo completo: clicar em `[ Iniciar Preparo ]` (card move de Pendentes para Em Preparo) e depois `[ Concluir ]` (card move de Em Preparo para Concluídos).
  - [x] Testar persistência ao recarregar a página (F5) mantendo os pedidos em suas novas colunas.
  - [x] Executar `cmd /c npm run build` confirmando compilação bem-sucedida com 0 erros (1670 módulos transformados).

---

## Dev Notes

### Regras de Negócio & Invariantes Arquiteturais
- **Invariante AD-4 (Máquina de Estados de Pedidos):** Status aceitos: `PENDENTE`, `EM_PREPARO`, `CONCLUIDO`, `CANCELADO`.
  - Transição 1: `PENDENTE` → `EM_PREPARO` (Ação do Cozinheiro: *Iniciar Preparo*)
  - Transição 2: `EM_PREPARO` → `CONCLUIDO` (Ação do Cozinheiro: *Concluir*)
- **Invariante AD-3 (Sincronização Realtime):** O Supabase Realtime já está configurado para emitir eventos de `UPDATE` na tabela `pedidos`. A função `atualizarStatusPedido` propaga as alterações automaticamente para todos os clientes conectados.
- **Diretrizes de UX/UI (`DESIGN.md` e `EXPERIENCE.md`):**
  - Fundo escuro KDS: `#0F172A` (`bg-slate-950` e `bg-slate-900`).
  - Botão Iniciar Preparo: Amarelo/Âmbar (`bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold`).
  - Botão Concluir: Verde/Esmeralda (`bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold`).
  - Altura mínima de toque: 48px para botões operados por toque na cozinha.

### Mapeamento de Arquivos Alterados
- `src/services/pedidoService.js` (UPDATE: adicionada função `atualizarStatusPedido` com Supabase e fallback local)
- `src/components/cozinha/OrderCardKDS.jsx` (UPDATE: botões de transição de status com altura 48px, loading spinners e visual condicional)
- `src/components/cozinha/KanbanKDS.jsx` (UPDATE: handler de mudança de status com UI otimista e propagação em tempo real)

---

## Project Structure Notes

- `src/services/pedidoService.js`
- `src/components/cozinha/OrderCardKDS.jsx`
- `src/components/cozinha/KanbanKDS.jsx`
- `src/pages/CozinhaKDS.jsx`

---

## Dev Agent Record

### Agent Model Used

Gemini 3.7 Flash (High)

### Completion Notes List

- Implementada a função `atualizarStatusPedido(pedidoId, novoStatus, restauranteId)` em `src/services/pedidoService.js` com validação da máquina de estados (AD-4), atualização no Supabase e sincronização resiliente com o `localStorage`.
- Atualizado o componente `src/components/cozinha/OrderCardKDS.jsx` com botões de transição de status em destaque (`[ Iniciar Preparo ]` em amarelo/âmbar, `[ Concluir Pedido ]` em verde esmeralda), altura mínima de 48px para touch screen, spinner de carregamento e opção de desfazer na coluna de concluídos.
- Atualizado o componente `src/components/cozinha/KanbanKDS.jsx` integrando o fluxo de atualização otimista (mudança imediata de coluna na UI), tratamento de erro com reversão de estado e propagação automática via WebSockets Realtime (`postgres_changes` em `pedidos`).
- Validada compilação do projeto com `cmd /c npm run build`, obtendo 0 erros e 1670 módulos transformados com sucesso em 9.66s.

### File List

- `src/services/pedidoService.js`
- `src/components/cozinha/OrderCardKDS.jsx`
- `src/components/cozinha/KanbanKDS.jsx`
- `_bmad-output/implementation-artifacts/4-3-transicao-de-status-de-pedido-na-cozinha.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
