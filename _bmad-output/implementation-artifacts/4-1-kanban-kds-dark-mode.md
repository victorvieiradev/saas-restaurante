# Story 4.1: Kanban KDS Dark Mode

Status: done

## Story

- **Como** Cozinheiro,
- **Quero** visualizar uma tela escura (Dark Mode) com 3 colunas (*Pendentes*, *Em Preparo*, *Concluídos*),
- **Para que** eu possa gerenciar a fila de pedidos com facilidade, alta visibilidade e sem cansaço visual.

---

## Acceptance Criteria

### AC1: Layout Responsivo em 3 Colunas no Dark Mode
- [x] Renderiza um layout em 3 colunas responsivas (*Pendentes*, *Em Preparo*, *Concluídos*) com fundo escuro de alto contraste (`#0F172A` / `bg-slate-950` e `bg-slate-900`).
- [x] Coluna 1 (**Pendentes**): Identificada com badge Âmbar/Amarelo (`#F59E0B` / `bg-amber-500/10 text-amber-400 border-amber-500/20`).
- [x] Coluna 2 (**Em Preparo**): Identificada com badge Azul (`#3B82F6` / `bg-blue-500/10 text-blue-400 border-blue-500/20`).
- [x] Coluna 3 (**Concluídos**): Identificada com badge Verde (`#10B981` / `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`).

### AC2: Visualização Destacada do Card de Pedido no KDS
- [x] Cada card de pedido exibe o número da comanda em destaque extra grande (ex: **Comanda #015** ou **#015**).
- [x] Exibe o código/número identificador do pedido e a quantidade de itens.
- [x] Renderiza a lista de todos os itens do pedido com quantidade destacada em negrito (ex: `2x Hambúrguer Tradicional`).
- [x] Exibe as observações dos clientes em caixa destacada com fundo amarelo/âmbar e borda visível para chamar a atenção da equipe da cozinha (ex: ⚠️ *Sem cebola e sem tomate*).

### AC3: Cronômetro de Tempo Decorrido em Tempo Real (Timer)
- [x] No topo de cada card, exibe o tempo decorrido em minutos (ou formato `mm:ss` / `⏱️ 04:12 min`) desde o momento da criação do pedido (`criado_em`).
- [x] O tempo é recalculado dinamicamente via intervalo em tempo real (atualização a cada 1 ou 5 segundos) sem recarregar a página.
- [x] Alerta visual para pedidos atrasados: se o tempo de espera ultrapassar 15 minutos, o indicador de tempo fica vermelho/pulsante (`text-red-400 bg-red-500/10 border-red-500/30`) para alertar prioridade de preparo.

### AC4: Carregamento dos Pedidos & Fallback Resiliente
- [x] Busca os pedidos ativos vinculados ao `restaurante_id` selecionado na sessão ou default.
- [x] Realiza a busca no Supabase unindo dados de `pedidos`, `itens_pedido`, `produtos` e `comandas`.
- [x] Caso o Supabase esteja offline ou sem conexão, carrega resilienciando os dados do `localStorage` (`restaurante_pedidos_${restauranteId}`).
- [x] Agrupa e distribui automaticamente os pedidos nas 3 colunas baseando-se no campo `status` (`PENDENTE`, `EM_PREPARO`, `CONCLUIDO`).

### AC5: Cabeçalho da Cozinha & Contadores
- [x] Exibe no cabeçalho do KDS a contagem total de pedidos por coluna (ex: `Pendentes: 3 | Em Preparo: 2 | Concluídos: 5`).
- [x] Inclui botão de atualizar manual (Refresh) e indicador de status de conexão.
- [x] Permite alternar entre o modo tela cheia ou visualização compacta.

---

## Tasks / Subtasks

- [x] **Task 1: Estender Serviço de Pedidos em `src/services/pedidoService.js`** (AC: #4)
  - [x] Implementar a função `fetchPedidosKDS(restauranteId)` para consultar pedidos ativos com `itens_pedido`, `produtos` e o número da `comanda`.
  - [x] Garantir suporte ao fallback em `localStorage` sob a chave `restaurante_pedidos_${restauranteId}` com sementes de demonstração caso esteja vazio.

- [x] **Task 2: Criar Componente Card de Pedido KDS (`src/components/cozinha/OrderCardKDS.jsx`)** (AC: #2, #3)
  - [x] Estilar o card com fundo `bg-slate-900 border border-slate-800 rounded-2xl`.
  - [x] Implementar hook/intervalo para o cronômetro de tempo decorrido desde `criado_em`.
  - [x] Adicionar destaque visual vermelho quando o tempo for > 15 minutos.
  - [x] Formatar a lista de itens com quantidades em destaque (`2x`, `1x`) e caixa amarela para observações dos itens ou observação geral.

- [x] **Task 3: Criar Componente Principal Kanban KDS (`src/components/cozinha/KanbanKDS.jsx`)** (AC: #1, #4, #5)
  - [x] Montar a estrutura de 3 colunas responsivas (`grid grid-cols-1 md:grid-cols-3 gap-6`).
  - [x] Adicionar badges de status para cada coluna (*Pendentes*, *Em Preparo*, *Concluídos*).
  - [x] Exibir mensagem amigável de "Nenhum pedido nesta coluna" quando vazia.
  - [x] Adicionar barra superior com título "Painel KDS - Cozinha", estatísticas rápidas, badge "Ao Vivo" e botão de atualizar manual.

- [x] **Task 4: Criar Página da Cozinha (`src/pages/CozinhaKDS.jsx`) & Atualizar Rota** (AC: #1, #4)
  - [x] Criar `src/pages/CozinhaKDS.jsx` renderizando a página completa do monitor KDS.
  - [x] Atualizar `src/App.jsx` para importar `CozinhaKDS` de `./pages/CozinhaKDS` na rota `/cozinha`.

- [x] **Task 5: Validação e Testes End-to-End** (AC: #1, #2, #3, #4, #5)
  - [x] Simular exibição de pedidos nas 3 colunas (*Pendentes*, *Em Preparo*, *Concluídos*).
  - [x] Validar precisão e atualização do cronômetro dinâmico com alerta para pedidos com mais de 15 minutos.
  - [x] Executar `cmd /c npm run build` confirmando compilação sem erros (0 erros, 1669 módulos).

---

## Dev Notes

### Resumo das Regras de Negócio & Arquitetura
- **Paleta KDS:** Dark Mode em Slate 950/900 (`bg-slate-950`, `bg-slate-900`, `border-slate-800`).
- **Estados de Pedido:** `PENDENTE`, `EM_PREPARO`, `CONCLUIDO`.
- **Tempo Limite Atrasado:** 15 minutos (`15 * 60 * 1000 ms`).

### Mapeamento de Arquivos Alterados / Criados
- `src/services/pedidoService.js` (UPDATE: adicionado `fetchPedidosKDS`)
- `src/components/cozinha/OrderCardKDS.jsx` (NOVO: card individual de pedido KDS com timer e destaques)
- `src/components/cozinha/KanbanKDS.jsx` (NOVO: grid Kanban de 3 colunas)
- `src/pages/CozinhaKDS.jsx` (NOVO: página do monitor KDS)
- `src/App.jsx` (UPDATE: import e substituição do placeholder pela página `CozinhaKDS` na rota `/cozinha`)

---

## Project Structure Notes

- `src/services/pedidoService.js`
- `src/components/cozinha/OrderCardKDS.jsx`
- `src/components/cozinha/KanbanKDS.jsx`
- `src/pages/CozinhaKDS.jsx`
- `src/App.jsx`

---

## Dev Agent Record

### Agent Model Used

Gemini 3.6 Flash (High)

### Completion Notes List

- Adicionada a função `fetchPedidosKDS` no `pedidoService.js` com suporte ao Supabase e fallback resiliente no `localStorage` (`restaurante_pedidos_${restauranteId}`) contendo sementes para demonstração.
- Criado o componente `OrderCardKDS.jsx` com destaque para o número da comanda (**Comanda #015**), cronômetro em tempo real, badge vermelho de alerta para pedidos atrasados (> 15 min), e caixa amarela/âmbar para observações do cliente.
- Criado o componente `KanbanKDS.jsx` apresentando o layout Kanban responsivo em 3 colunas (*Pendentes*, *Em Preparo*, *Concluídos*) no Dark Mode (`bg-slate-950` / `bg-slate-900`).
- Criada a página `src/pages/CozinhaKDS.jsx` e atualizada a rota `/cozinha` em `src/App.jsx`.
- Executada verificação de compilação com `npm run build` confirmando sucesso em 3.93s sem erros.

### File List

- `src/services/pedidoService.js`
- `src/components/cozinha/OrderCardKDS.jsx`
- `src/components/cozinha/KanbanKDS.jsx`
- `src/pages/CozinhaKDS.jsx`
- `src/App.jsx`
- `_bmad-output/implementation-artifacts/4-1-kanban-kds-dark-mode.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
