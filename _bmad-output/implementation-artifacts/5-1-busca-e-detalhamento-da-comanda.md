---
baseline_commit: 54a0f733bc5a3953021a66754d3f322b4db79910
---

# Story 5.1: Busca e Detalhamento da Comanda

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

- **Como** Atendente do Caixa,
- **Quero** digitar o número de uma comanda no terminal POS e consultar todo o histórico detalhado de consumo do cliente,
- **Para que** eu possa conferir a conta com clareza, itens por itens, antes de receber o pagamento e encerrar o atendimento.

---

## Acceptance Criteria

### AC1: Interface do Terminal POS & Campo de Busca com Auto-foco
- [x] O terminal do Caixa (`/caixa`) renderiza layout limpo e profissional (*Clean Dashboard*), protegido por autenticação (`ProtectedRoute`).
- [x] Exibe campo de entrada de busca proeminente com ícone de lupa (`Search` / `Receipt`), placeholder explicativo (ex: *"Digite o número da comanda (ex: 015)..."*), auto-foco ao carregar a página e botão de ação `[ Buscar Comanda ]`.
- [x] O atendente pode disparar a busca pressionando a tecla `Enter` no teclado físico ou clicando no botão `[ Buscar Comanda ]`.
- [x] Formata e normaliza o número digitado automaticamente (ex: "15" $\rightarrow$ "015"), suportando busca por número e por token QR code.

### AC2: Atalho Rápido para Comandas Ativas em Aberto
- [x] Exibe uma barra ou grid de atalhos rápidos com badges clicáveis listando as comandas que estão atualmente em status `EM_USO`.
- [x] Cada badge exibe o número da comanda (ex: `Comanda #015`) e quantidade de pedidos ativos.
- [x] Ao clicar em uma comanda da lista rápida, seleciona e carrega instantaneamente os detalhes sem necessidade de digitação.

### AC3: Cabeçalho com Informações Consolidadas da Comanda
- [x] Ao localizar a comanda, exibe card de cabeçalho com:
  - Número da comanda em destaque (`H2`, ex: **Comanda #015**).
  - Badge de status da comanda: `EM_USO` (laranja/âmbar), `DISPONIVEL` (verde) ou `ENCERRADA` (cinza/ardósia).
  - Horário de início da sessão / permanência do cliente (tempo decorrido desde o primeiro pedido ou abertura da comanda).
  - Quantidade total de pedidos realizados e quantidade total de itens consumidos.
  - Identificação do restaurante autenticado (Multi-tenant).

### AC4: Tabela Detalhada de Itens e Pedidos Consumidos
- [x] Exibe tabela ou lista expansível por pedido agrupando todos os pedidos registrados naquela sessão da comanda.
- [x] Para cada pedido na lista, apresenta:
  - Identificador e horário do envio do pedido (ex: `Pedido #104 — 19:42`).
  - Badge de status do pedido na cozinha (`PENDENTE`, `EM_PREPARO`, `CONCLUIDO`, `CANCELADO`).
  - Lista de itens com: Nome do produto, Quantidade (`2x`), Preço unitário (`R$ 38,00`), Subtotal do item (`R$ 76,00`) e Observações do cliente destacadas (ex: *"Sem cebola"*).
  - Subtotal do pedido.
- [x] Formatação monetária padronizada em Real brasileiro (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`).

### AC5: Painel de Totalização & Resumo da Conta
- [x] Painel lateral ou fixo de resumo financeiro calculando em tempo real:
  - Subtotal de todos os itens ativos (excluindo pedidos cancelados).
  - Quantidade total de itens.
  - Valor Total Acumulado em destaque visual de grande legibilidade (`text-3xl font-extrabold text-orange-500` ou `text-emerald-500`).
- [x] Botão de ação preparado para o fechamento da conta `[ Prosseguir para Pagamento ]` (desabilitado se a comanda não possuir consumo ou estiver com status `DISPONIVEL`).

### AC6: Tratamento de Estados de Exceção & Feedback Visual
- [x] **Comanda Não Encontrada:** Exibe alerta visual com ícone de aviso (`AlertCircle`) e mensagem clara: *"Nenhuma comanda encontrada com o número informado. Verifique o número digitado."*.
- [x] **Comanda Sem Consumo / Limpa:** Se a comanda existir mas não possuir pedidos registrados (status `DISPONIVEL`), exibe estado amigável: *"A Comanda #015 está limpa e disponível sem nenhum pedido ativo."*.
- [x] **Estado de Carregamento (Loading):** Durante a consulta no Supabase/localStorage, exibe spinner (`Loader2 animate-spin`) desabilitando o botão de busca para evitar duplo envio.

### AC7: Persistência & Suporte Offline/Mock (Supabase + localStorage)
- [x] O serviço `fetchPedidosComanda` em `src/services/pedidoService.js` consulta o Supabase na tabela `pedidos` com join em `itens_pedido` e `produtos`.
- [x] Se o Supabase estiver offline ou em modo demo, busca e consolida todos os pedidos do `localStorage` sob a chave `restaurante_pedidos_${restauranteId}` garantindo integridade dos dados e funcionamento autônomo.
- [x] Garante isolamento estrito por `restaurante_id` conforme a regra multi-tenant (AD-1).

---

## Tasks / Subtasks

- [x] **Task 1: Atualizar Serviços de Pedidos e Comandas** (AC: #4, #7)
  - [x] Aprimorar `fetchPedidosComanda(comandaId, restauranteId)` em `src/services/pedidoService.js` para retornar pedidos formatados com itens, produtos, observações, timestamps e subtotais.
  - [x] Implementar em `src/services/comandaService.js` a função `buscarComandaPorNumero(numeroOuToken, restauranteId)` para localização ágil por número formatado (ex: '015', '15', 'cmd_xxx').
  - [x] Implementar em `src/services/comandaService.js` a listagem de comandas ativas (`status = 'EM_USO'`) para o componente de atalhos rápidos.

- [x] **Task 2: Criar Componentes do Módulo Caixa POS** (AC: #1, #2, #3, #4, #5, #6)
  - [x] Criar `src/components/caixa/BuscaComandaInput.jsx`: Campo de texto com auto-foco, atalho `Enter`, formatação de zeros à esquerda e botão de busca.
  - [x] Criar `src/components/caixa/ListaComandasAtivas.jsx`: Grid de chips/badges com comandas ativas em uso para seleção rápida com 1 clique.
  - [x] Criar `src/components/caixa/ExtratoConsumoComanda.jsx`: Tabela estruturada com histórico de pedidos, itens, horas, quantidades, observações e status de preparo.
  - [x] Criar `src/components/caixa/ResumoTotalConta.jsx`: Card com totalizador monetário em destaque, contadores de itens e botão de prosseguir.

- [x] **Task 3: Implementar a Página `src/pages/CaixaPOS.jsx` e Integrar no Router** (AC: #1, #6, #7)
  - [x] Substituir o componente provisório em `src/App.jsx` por import da página completa `src/pages/CaixaPOS.jsx`.
  - [x] Proteger a rota `/caixa` com `<ProtectedRoute>` garantindo que apenas operadores/gestores autenticados acessem o POS.
  - [x] Gerenciar estados de busca: `termoBusca`, `comandaSelecionada`, `pedidosComanda`, `isLoading`, `erroBusca`.
  - [x] Implementar visualização responsiva otimizada para terminais desktop e tablets no balcão.

- [x] **Task 4: Testes, Validação e Build** (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Testar busca de comanda digitando número sem zero ("15") e com zero ("015").
  - [x] Testar seleção de comanda com múltiplos pedidos através da lista rápida de atalhos.
  - [x] Testar comanda inexistente e verificar mensagem de erro amigável.
  - [x] Testar comanda limpa/sem pedidos e verificar mensagem de comanda disponível.
  - [x] Executar `cmd /c npm run build` para garantir ausência de erros de sintaxe, tipos ou empacotamento Vite.

### Review Findings

- [x] [Review][Patch] Sanitizar entrada de busca para evitar erros de sintaxe ou injeção de operadores PostgREST no Supabase [`src/services/comandaService.js:303`]
- [x] [Review][Patch] Prevenir exibição de pedidos da comanda anterior durante busca e tratar race conditions [`src/pages/CaixaPOS.jsx:43`]
- [x] [Review][Patch] Garantir isolamento por restaurante_id e validação estrita de comandaId na consulta de pedidos [`src/services/pedidoService.js:200`]
- [x] [Review][Patch] Tratar retorno vazio de pedidos do Supabase sem cair incorretamente no fallback de mock [`src/services/pedidoService.js:231`]
- [x] [Review][Patch] Normalizar status CANCELADO case-insensitive e coerção de pedidos com valor total zero [`src/components/caixa/ResumoTotalConta.jsx:20`]
- [x] [Review][Patch] Adicionar contagem de pedidos ativos nos badges de comandas em uso [`src/components/caixa/ListaComandasAtivas.jsx:63`]
- [x] [Review][Patch] Exibir tempo decorrido / permanência do cliente no extrato de consumo [`src/components/caixa/ExtratoConsumoComanda.jsx:110`]
- [x] [Review][Patch] Adicionar sincronização por evento Realtime / restaurante_pedido_sync no Caixa POS [`src/pages/CaixaPOS.jsx:38`]
- [x] [Review][Patch] Blindagem defensiva contra datas inválidas, subtotais nulos e duplicação de '#' [`src/components/caixa/ExtratoConsumoComanda.jsx:12`]
- [x] [Review][Defer] Alinhamento de DDL observacao_geral e isolamento por sessão encerrada [`supabase/schema.sql`] — deferred, pre-existing / story 5.2 scope

---

## Dev Notes

### Regras de Negócio & Invariantes Arquiteturais
- **Invariante AD-1 (Multi-Tenant & RLS):** Todas as consultas de comanda e pedidos devem filtrar estritamente por `restaurante_id`.
- **Invariante AD-4 (Máquina de Estados de Pedidos):** Pedidos podem ter status `PENDENTE`, `EM_PREPARO`, `CONCLUIDO` ou `CANCELADO`. Pedidos com status `CANCELADO` devem ser sinalizados visualmente na tabela (tachados ou com badge vermelho) e excluídos da soma do valor total.
- **Invariante AD-5 (Ciclo de Vida da Comanda):** A busca de comanda no Caixa deve permitir visualizar tanto comandas `EM_USO` quanto comandas `DISPONIVEL` ou `ENCERRADA` para consulta histórica.
- **Diretrizes de UX/UI (`DESIGN.md` e `EXPERIENCE.md`):**
  - Estilo: *Clean Dashboard*, fundo claro/neutro ou dark de alto contraste alinhado com o restante da aplicação.
  - Headings: Tipografia `Outfit` e corpo em `Inter`.
  - Cores: Primária `#F97316` (Laranja), Secundária/Sucesso `#10B981` (Verde Esmeralda), Superfície `#1E293B` / `#0F172A` no tema escuro.
  - Moeda: Formatação BRL padrão brasileiro (`R$ 0,00`).

### Mapeamento de Arquivos
- `src/services/pedidoService.js` (UPDATE: enriquecer `fetchPedidosComanda` com agregação de produtos e fallback)
- `src/services/comandaService.js` (UPDATE: adicionar helper de busca por número de comanda)
- `src/components/caixa/BuscaComandaInput.jsx` (NEW)
- `src/components/caixa/ListaComandasAtivas.jsx` (NEW)
- `src/components/caixa/ExtratoConsumoComanda.jsx` (NEW)
- `src/components/caixa/ResumoTotalConta.jsx` (NEW)
- `src/pages/CaixaPOS.jsx` (NEW)
- `src/App.jsx` (UPDATE: rota `/caixa` com `ProtectedRoute` e import da página `CaixaPOS`)

---

## Project Structure Notes

- `src/pages/CaixaPOS.jsx`
- `src/components/caixa/`
- `src/services/pedidoService.js`
- `src/services/comandaService.js`
- `src/App.jsx`

---

## References

- [PRD - Seção 3.3 Requisitos Módulo Caixa (FR-301, FR-302)](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/prd/prd.md#L74-L79)
- [PRD - Jornada UJ-3 Atendente do Caixa](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/prd/prd.md#L41-L47)
- [ARCHITECTURE-SPINE - Invariantes AD-1, AD-4 e AD-5](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md#L20-L50)
- [DESIGN.md - Seção 5.3 Barra de Busca & Extrato da Comanda](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/ux/DESIGN.md#L99-L104)
- [EXPERIENCE.md - Seção 4 Flow 3: Atendente Fechando a Comanda](file:///C:/Users/Paty/Desktop/restaurante/_bmad-output/planning-artifacts/ux/EXPERIENCE.md#L89-L94)

---

## Dev Agent Record

### Agent Model Used

Gemini 3.7 Flash (High)

### Completion Notes List

- Implementadas as funções `buscarComandaPorNumero` e `fetchComandasAtivas` em `src/services/comandaService.js` com normalização de zeros à esquerda, busca por número e QR token, e resiliência offline em `localStorage`.
- Aprimorada a função `fetchPedidosComanda` em `src/services/pedidoService.js` para retornar a estrutura normalizada de pedidos com produtos, itens, observações, status e subtotais, no Supabase e no mock local.
- Criados os componentes do módulo Caixa POS:
  - `src/components/caixa/BuscaComandaInput.jsx`: campo de texto com auto-foco, tecla Enter, limpeza rápida e loading state.
  - `src/components/caixa/ListaComandasAtivas.jsx`: atalhos visuais para seleção instantânea de comandas em uso.
  - `src/components/caixa/ExtratoConsumoComanda.jsx`: extrato detalhado agrupado por pedidos e itens com horas, quantidades, observações e status do KDS.
  - `src/components/caixa/ResumoTotalConta.jsx`: painel lateral de totalização acumulada com valores em BRL e botão de prosseguir.
- Criada a página `src/pages/CaixaPOS.jsx` integrando os fluxos de busca, seleção, tratamento de erros amigáveis e feedback.
- Atualizado `src/App.jsx` protegendo a rota `/caixa` com `<ProtectedRoute>`.
- Executado build de produção com Vite (`npm run build`), validando 0 erros e 1675 módulos compilados com sucesso.

### File List

- `src/services/comandaService.js`
- `src/services/pedidoService.js`
- `src/components/caixa/BuscaComandaInput.jsx`
- `src/components/caixa/ListaComandasAtivas.jsx`
- `src/components/caixa/ExtratoConsumoComanda.jsx`
- `src/components/caixa/ResumoTotalConta.jsx`
- `src/pages/CaixaPOS.jsx`
- `src/App.jsx`
- `_bmad-output/implementation-artifacts/5-1-busca-e-detalhamento-da-comanda.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

