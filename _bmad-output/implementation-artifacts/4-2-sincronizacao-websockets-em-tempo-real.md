# Story 4.2: Sincronização WebSockets em Tempo Real

Status: done

## Story

- **Como** Cozinheiro,
- **Quero** que novos pedidos apareçam instantaneamente na coluna de *Pendentes* com um alerta sonoro,
- **Para que** eu não precise atualizar a página manualmente nem corra o risco de perder nenhum pedido enviado pelos clientes.

---

## Acceptance Criteria

### AC1: Inscrição em Canal Supabase Realtime (`postgres_changes`)
- [x] Subscreve dinamicamente ao canal de mudanças do Supabase Realtime escutando eventos de `INSERT` na tabela `pedidos` filtrados por `restaurante_id`.
- [x] Garante limpeza e desacoplamento seguro do listener ao desmontar o componente (`supabase.removeChannel` / `channel.unsubscribe()`).

### AC2: Atualização Instantânea do Quadro KDS (< 1s)
- [x] Ao receber a notificação de um novo pedido (`INSERT`), busca os detalhes dos itens e comanda correspondente e insere o novo card no topo da coluna **Pendentes** em menos de 1 segundo.
- [x] Atualiza os contadores totalizadores no cabeçalho do KDS sem necessidade de recarregar a página.

### AC3: Alerta Sonoro de Novo Pedido (Audio Notification)
- [x] Ao receber um novo pedido via tempo real, toca um alerta sonoro claro e agradável (utilizando Web Audio API synth ou player de áudio resiliente em `public/sounds/` ou áudio sintético base64/Web Audio API).
- [x] Inclui botão/toggle no cabeçalho do KDS para o cozinheiro habilitar ou mutar o som do alerta (`[ 🔔 Som Ativado ]` / `[ 🔕 Som Mutado ]`).

### AC4: Indicador de Conexão WebSocket no Cabeçalho
- [x] Exibe indicador visual do status da conexão no cabeçalho do KDS:
  - 🟢 **Conectado (Realtime)**
  - 🟡 **Reconectando / Sincronizando**
  - 🟠 **Modo Polling (Fallback)**
- [x] Caso a conexão WebSocket caia, alterna transparentemente para polling periódico (a cada 10s) sem travar a interface do usuário.

### AC5: Tratamento de Duplicidade & Sincronização de Estado
- [x] Previne a inserção duplicada do mesmo pedido caso o evento WebSocket seja recebido simultaneamente ao polling periódico.
- [x] Garante que pedidos em progresso na tela do cozinheiro não tenham seus cronômetros ou dados reiniciados indevidamente.

---

## Tasks / Subtasks

- [x] **Task 1: Criar Utilitário de Notificação Sonora em `src/lib/soundNotification.js`** (AC: #3)
  - [x] Implementar sintetizador de som com Web Audio API (duas notas agradáveis `587.33Hz` D5 e `880Hz` A5) que funciona nativamente no navegador sem depender de arquivos externos.
  - [x] Adicionar suporte a preferência de áudio salva no `localStorage` (`kds_sound_enabled: true/false`).

- [x] **Task 2: Integrar Inscrição Supabase Realtime no `pedidoService.js` ou `KanbanKDS.jsx`** (AC: #1, #2, #4)
  - [x] Criar função `subscribeToPedidosKDS(restauranteId, callbacks)` utilizando `supabase.channel()`.
  - [x] Tratar payloads de `INSERT` e `UPDATE` na tabela `pedidos`, buscando os itens vinculados e comanda.
  - [x] Retornar função de unsubscribe para limpeza no `useEffect`.

- [x] **Task 3: Atualizar Estado e Interface do `KanbanKDS.jsx`** (AC: #2, #3, #4, #5)
  - [x] Adicionar estado `isAudioEnabled` e toggle no cabeçalho do KDS para mutar/desmutar alerta sonoro.
  - [x] Exibir o badge de status da conexão em tempo real (🟢 *Ao Vivo - Realtime* / 🟠 *Modo Polling*).
  - [x] Tratar dedup dos pedidos no estado `pedidos` garantindo imutabilidade e inserção no topo de *Pendentes*.
  - [x] Acionar `playNewOrderSound()` sempre que um novo pedido `PENDENTE` for adicionado ao quadro.

- [x] **Task 4: Validação e Testes End-to-End** (AC: #1, #2, #3, #4, #5)
  - [x] Testar ativador/silenciador de áudio via botão toggle.
  - [x] Testar reconexão e fallback de polling.
  - [x] Executar compilação de produção com `cmd /c npm run build` (0 erros, 1670 módulos).

---

## Dev Notes

### Contexto das Histórias Anteriores
- **Story 4.1 (`4-1-kanban-kds-dark-mode.md`):** Criou o layout Kanban de 3 colunas (*Pendentes*, *Em Preparo*, *Concluídos*) no Dark Mode (`bg-slate-950` / `bg-slate-900`) e o card individual `OrderCardKDS.jsx`.
- **Invariante Arquitetural (AD-3):** Supabase Realtime WebSocket Channels (`postgres_changes` em `pedidos`).
- **Estados do Pedido:** `PENDENTE`, `EM_PREPARO`, `CONCLUIDO`, `CANCELADO`.

### Mapeamento de Arquivos Criados / Alterados
- `src/lib/soundNotification.js` (NOVO: sintetizador Web Audio API e gerenciador de preferências de som)
- `src/services/pedidoService.js` (UPDATE: adicionado `subscribeToPedidosKDS`)
- `src/components/cozinha/KanbanKDS.jsx` (UPDATE: integrado listener Realtime, alertas sonoros e badge de estado WebSocket)

---

## Project Structure Notes

- `src/lib/soundNotification.js`
- `src/services/pedidoService.js`
- `src/components/cozinha/KanbanKDS.jsx`

---

## Dev Agent Record

### Agent Model Used

Gemini 3.6 Flash (High)

### Completion Notes List

- Criado o arquivo `src/lib/soundNotification.js` utilizando Web Audio API para tocar chime harmonioso (D5 -> A5) sem dependências externas e com persistência da preferência em `localStorage`.
- Estendido `src/services/pedidoService.js` com a função `subscribeToPedidosKDS` para inscrição no canal `postgres_changes` do Supabase Realtime em `pedidos`.
- Atualizado `src/components/cozinha/KanbanKDS.jsx` adicionando o listener Realtime em `useEffect`, controle de estado da conexão (🟢 *Ao Vivo - Realtime* / 🟠 *Modo Polling*), botão de toggle de áudio (`[ 🔔 Som Ativado ]` / `[ 🔕 Som Mutado ]`) e prevenção contra pedidos duplicados.
- Testada e validada compilação com `cmd /c npm run build` (sucesso em 3.99s, 0 erros).

### File List

- `src/lib/soundNotification.js`
- `src/services/pedidoService.js`
- `src/components/cozinha/KanbanKDS.jsx`
- `_bmad-output/implementation-artifacts/4-2-sincronizacao-websockets-em-tempo-real.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
