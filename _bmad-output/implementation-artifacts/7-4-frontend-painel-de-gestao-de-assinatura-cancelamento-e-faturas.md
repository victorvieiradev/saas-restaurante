---
baseline_commit: e94b5a058cd91b0264213858e328ffa4a385d7ae
---

# Story 7.4: Frontend: Painel de Gestão de Assinatura, Cancelamento e Faturas (`AdminAssinatura.jsx`)

Status: done

## Story Description

- **Como** Gestor do Restaurante,
- **Quero** gerenciar minha assinatura em uma aba dedicada no painel administrativo (`/admin/assinatura` ou aba "Plano & Faturamento"),
- **Para que** eu acompanhe os dias restantes de teste, confira meu plano ativo, visualize dados do cartão, cancele a qualquer momento sem cobranças e baixe faturas e recibos.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Estrutura da Página e Navegação no Painel
- [x] Nova aba **"Assinatura / Faturamento"** no menu lateral do `AdminDashboard.jsx` (visível para o perfil `GESTOR`).
- [x] Rota `/admin/assinatura` ou componente `AdminAssinatura.jsx` integrado ao layout existente.

### AC2: Card de Status da Assinatura & Período de Testes
- [x] Exibir o plano atual (Starter, Pro ou Scale) e ciclo (Mensal / Anual).
- [x] **Se em Período de Testes (`trialing`):**
  - Badge destacado em azul/roxo: *"Em Período de Testes (Trial de 14 Dias)"*.
  - Indicador de tempo: *"Você está no dia X do seu teste gratuito (Restam Y dias até [Data D+14])"*.
  - Mensagem de transparência: *"Primeira cobrança automática de R$ [Valor] agendada para [Data D+14]"*.
- [x] **Se Assinatura Ativa (`active`):**
  - Badge verde: *"Assinatura Ativa & Regular"*.
  - Próxima data de renovação e valor da mensalidade.
- [x] **Se Cancelada (`canceled`):**
  - Badge cinza/vermelho: *"Assinatura Cancelada"*.
  - Botão para reativação de plano com 1 clique.

### AC3: Cancelamento de Assinatura com 1 Clique (Zero Cobrança no Trial)
- [x] Botão visível **"Cancelar Assinatura"** com estilo discreto de segurança.
- [x] Modal de Confirmação explicativo:
  - *"Tem certeza que deseja cancelar sua assinatura?"*
  - Se estiver em trial: *"Como você está dentro dos 14 dias de teste, **absolutamente nenhum valor (R$ 0,00) será cobrado do seu cartão**."*
  - Opções: `[ Manter Minha Assinatura ]` e `[ Confirmar Cancelamento Imediato ]`.
- [x] Ao confirmar, invoca `subscriptionService.cancelSubscription()` e atualiza a interface instantaneamente para o status `canceled`.

### AC4: Gestão do Cartão Cadastrado
- [x] Exibir os dados seguros do cartão:
  - Ícone/Bandeira visual (ex: Mastercard, Visa).
  - Texto: `Cartão de Crédito final •••• 4829`.
- [x] Botão `[ Alterar Cartão de Crédito ]` que abre modal para inserir novos dados de cartão.

### AC5: Tabela de Histórico de Faturas & Comprovantes
- [x] Tabela com as faturas emitidas contendo:
  - **Identificador / Referência** (ex: `FAT-2026-08`)
  - **Data de Vencimento** e **Data de Pagamento**
  - **Valor (R$)**
  - **Status:** Badge estilizado (`Paga`, `Pendente`, `Vencida`)
  - **Ações:** Botão `[ Ver Fatura ]` e `[ Comprovante ]` (links externos para o Asaas ou PDF simulado).
- [x] Estado vazio elegante caso o restaurante ainda esteja nos primeiros dias de trial sem faturas geradas.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Componente `AdminAssinatura.jsx`** (AC: #1, #2, #4, #5)
  - [x] Criar arquivo `src/pages/AdminAssinatura.jsx` ou componente `src/components/admin/AdminAssinaturaTab.jsx`.
  - [x] Adicionar link na barra lateral do painel gestor.

- [x] **Task 2: Implementar Cards de Status e Contagem Regressiva do Trial** (AC: #2)
  - [x] Calcular dias restantes a partir de `data_fim_trial`.
  - [x] Renderizar badges e informações de faturamento condicionalmente.

- [x] **Task 3: Implementar Modal e Ação de Cancelamento** (AC: #3)
  - [x] Criar modal de confirmação com mensagens claras sobre o período de trial de R$ 0,00.
  - [x] Integrar com `subscriptionService.cancelSubscription()`.

- [x] **Task 4: Implementar Histórico de Faturas e Modal de Alteração de Cartão** (AC: #4, #5)
  - [x] Renderizar tabela de faturas do restaurante com downloads/links.
  - [x] Criar modal para substituição de cartão de crédito.

### Review Findings
- [x] [Review][Patch] Check error response in cancelSubscription database update fallback [`src/services/subscriptionService.js:355-368`]
- [x] [Review][Patch] Use detectCardBrand in subscriptionService for accurate BIN identification [`src/services/subscriptionService.js:299`, `392`]
- [x] [Review][Patch] Handle expired trial status (diffMs <= 0) badge in AdminAssinaturaTab [`src/components/admin/AdminAssinaturaTab.jsx:100-104`]
- [x] [Review][Patch] Add Edge Function invocation in reactivateSubscription before local fallback [`src/services/subscriptionService.js:442-473`]
- [x] [Review][Patch] Optimize loadStats in AdminDashboard to avoid redundant calls on tab switch [`src/pages/AdminDashboard.jsx:87-89`]
- [x] [Review][Patch] Clean up toast timeouts and guard unmounted state in AdminAssinaturaTab [`src/components/admin/AdminAssinaturaTab.jsx:67-76`]
- [x] [Review][Patch] Sanitize external links (https/http) and use url_comprovante for receipts [`src/components/admin/AdminAssinaturaTab.jsx:963-974`]
- [x] [Review][Patch] Harden date/currency formatters against timezone shifts and NaN [`src/components/admin/AdminAssinaturaTab.jsx:109-123`]
- [x] [Review][Patch] Expand test suite with direct validation of real service methods [`test/adminAssinatura.test.js`]

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Permissão (AD-6)
- Somente usuários com perfil `role: 'GESTOR'` têm acesso a visualizar e modificar a assinatura e faturas.

### Arquivos Envolvidos
- `src/pages/AdminAssinatura.jsx` ou `src/components/admin/AdminAssinaturaTab.jsx`
- `src/pages/AdminDashboard.jsx`: Integração da aba de navegação.
- `src/services/subscriptionService.js`: Chamadas de cancelamento, busca de faturas e atualização de cartão.

---

## Dev Agent Record

### Implementation Plan
1. Criar e estender métodos no `src/services/subscriptionService.js` (`updateCreditCard` e `reactivateSubscription`) com suporte a Edge Functions e fallback mock idempotente.
2. Criar componente `src/components/admin/AdminAssinaturaTab.jsx` implementando cards de status, cálculo de progresso do trial de 14 dias com transparência de cobrança R$ 0,00, modal de cancelamento imediato, gestão e alteração de cartão com validação em tempo real e tabela de faturas/comprovantes com fallback visual.
3. Integrar nova aba no painel gestor `src/pages/AdminDashboard.jsx`, adicionar card rápido na visão geral e registrar rota protegida `/admin/assinatura` no `src/App.jsx`.
4. Implementar testes unitários em `test/adminAssinatura.test.js` e validar suíte completa com 153 testes passando e build Vite íntegro.

### Completion Notes
- ✅ **AC1:** Nova aba "Assinatura & Faturamento" integrada ao `AdminDashboard.jsx` com ícone `CreditCard`, visível exclusivamente para o perfil `GESTOR`. Rota `/admin/assinatura` criada e protegida no `App.jsx`.
- ✅ **AC2:** Card de status com contagem regressiva precisa do trial (dia X de 14, dias restantes até data formatada D+14), barra de progresso visual, aviso de R$ 0,00 cobrado hoje e badge estilizado para estados `trialing`, `active`, `canceled` e `past_due` com opção de reativação de plano.
- ✅ **AC3:** Modal de cancelamento com mensagem explicativa de R$ 0,00 durante o trial e integração imediata com `subscriptionService.cancelSubscription()`.
- ✅ **AC4:** Visualização segura do cartão cadastrado (bandeira e final •••• XXXX) e modal completo de alteração de cartão com validações em tempo real e detecção de bandeira.
- ✅ **AC5:** Histórico de faturas com badges de status (`Paga`, `Pendente`, `Vencida`), modal/links de visualização de fatura e comprovante e estado vazio amigável para início de trial.
- ✅ Todos os 153 testes unitários passando (`npm test`) e build de produção Vite realizado com sucesso.

---

## File List

- `src/components/admin/AdminAssinaturaTab.jsx` (Novo)
- `src/pages/AdminAssinatura.jsx` (Novo)
- `src/pages/AdminDashboard.jsx` (Modificado)
- `src/App.jsx` (Modificado)
- `src/services/subscriptionService.js` (Modificado)
- `test/adminAssinatura.test.js` (Novo)
- `_bmad-output/implementation-artifacts/7-4-frontend-painel-de-gestao-de-assinatura-cancelamento-e-faturas.md` (Modificado)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Modificado)

---

## Change Log

- **2026-08-23**: Implementada Story 7.4 completa com Painel de Gestão de Assinatura, Cancelamento e Faturas (`AdminAssinaturaTab.jsx`), rota `/admin/assinatura`, novos métodos em `subscriptionService.js` e suíte de testes unitários.
