# Story 7.4: Frontend: Painel de Gestão de Assinatura, Cancelamento e Faturas (`AdminAssinatura.jsx`)

Status: ready-for-dev

## Story Description

- **Como** Gestor do Restaurante,
- **Quero** gerenciar minha assinatura em uma aba dedicada no painel administrativo (`/admin/assinatura` ou aba "Plano & Faturamento"),
- **Para que** eu acompanhe os dias restantes de teste, confira meu plano ativo, visualize dados do cartão, cancele a qualquer momento sem cobranças e baixe faturas e recibos.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Estrutura da Página e Navegação no Painel
- [ ] Nova aba **"Assinatura / Faturamento"** no menu lateral do `AdminDashboard.jsx` (visível para o perfil `GESTOR`).
- [ ] Rota `/admin/assinatura` ou componente `AdminAssinatura.jsx` integrado ao layout existente.

### AC2: Card de Status da Assinatura & Período de Testes
- [ ] Exibir o plano atual (Starter, Pro ou Scale) e ciclo (Mensal / Anual).
- [ ] **Se em Período de Testes (`trialing`):**
  - Badge destacado em azul/roxo: *"Em Período de Testes (Trial de 14 Dias)"*.
  - Indicador de tempo: *"Você está no dia X do seu teste gratuito (Restam Y dias até [Data D+14])"*.
  - Mensagem de transparência: *"Primeira cobrança automática de R$ [Valor] agendada para [Data D+14]"*.
- [ ] **Se Assinatura Ativa (`active`):**
  - Badge verde: *"Assinatura Ativa & Regular"*.
  - Próxima data de renovação e valor da mensalidade.
- [ ] **Se Cancelada (`canceled`):**
  - Badge cinza/vermelho: *"Assinatura Cancelada"*.
  - Botão para reativação de plano com 1 clique.

### AC3: Cancelamento de Assinatura com 1 Clique (Zero Cobrança no Trial)
- [ ] Botão visível **"Cancelar Assinatura"** com estilo discreto de segurança.
- [ ] Modal de Confirmação explicativo:
  - *"Tem certeza que deseja cancelar sua assinatura?"*
  - Se estiver em trial: *"Como você está dentro dos 14 dias de teste, **absolutamente nenhum valor (R$ 0,00) será cobrado do seu cartão**."*
  - Opções: `[ Manter Minha Assinatura ]` e `[ Confirmar Cancelamento Imediato ]`.
- [ ] Ao confirmar, invoca `subscriptionService.cancelSubscription()` e atualiza a interface instantaneamente para o status `canceled`.

### AC4: Gestão do Cartão Cadastrado
- [ ] Exibir os dados seguros do cartão:
  - Ícone/Bandeira visual (ex: Mastercard, Visa).
  - Texto: `Cartão de Crédito final •••• 4829`.
- [ ] Botão `[ Alterar Cartão de Crédito ]` que abre modal para inserir novos dados de cartão.

### AC5: Tabela de Histórico de Faturas & Comprovantes
- [ ] Tabela com as faturas emitidas contendo:
  - **Identificador / Referência** (ex: `FAT-2026-08`)
  - **Data de Vencimento** e **Data de Pagamento**
  - **Valor (R$)**
  - **Status:** Badge estilizado (`Paga`, `Pendente`, `Vencida`)
  - **Ações:** Botão `[ Ver Fatura ]` e `[ Comprovante ]` (links externos para o Asaas ou PDF simulado).
- [ ] Estado vazio elegante caso o restaurante ainda esteja nos primeiros dias de trial sem faturas geradas.

---

## Tasks / Subtasks de Implementação

- [ ] **Task 1: Criar Componente `AdminAssinatura.jsx`** (AC: #1, #2, #4, #5)
  - [ ] Criar arquivo `src/pages/AdminAssinatura.jsx` ou componente `src/components/admin/AdminAssinaturaTab.jsx`.
  - [ ] Adicionar link na barra lateral do painel gestor.

- [ ] **Task 2: Implementar Cards de Status e Contagem Regressiva do Trial** (AC: #2)
  - [ ] Calcular dias restantes a partir de `data_fim_trial`.
  - [ ] Renderizar badges e informações de faturamento condicionalmente.

- [ ] **Task 3: Implementar Modal e Ação de Cancelamento** (AC: #3)
  - [ ] Criar modal de confirmação com mensagens claras sobre o período de trial de R$ 0,00.
  - [ ] Integrar com `subscriptionService.cancelSubscription()`.

- [ ] **Task 4: Implementar Histórico de Faturas e Modal de Alteração de Cartão** (AC: #4, #5)
  - [ ] Renderizar tabela de faturas do restaurante com downloads/links.
  - [ ] Criar modal para substituição de cartão de crédito.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Permissão (AD-6)
- Somente usuários com perfil `role: 'GESTOR'` têm acesso a visualizar e modificar a assinatura e faturas.

### Arquivos Envolvidos
- `src/pages/AdminAssinatura.jsx` ou `src/components/admin/AdminAssinaturaTab.jsx`
- `src/pages/AdminDashboard.jsx`: Integração da aba de navegação.
- `src/services/subscriptionService.js`: Chamadas de cancelamento, busca de faturas e atualização de cartão.
