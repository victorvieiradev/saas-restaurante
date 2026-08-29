---
baseline_commit: 30dff192f44eac6388d1b7677030bc7f2c2eccf2
---

# Story 7.5: Gestão e Alerta de Limites de Pedidos do Plano (Fair Use Policy)

Status: done

## Story Description

- **Como** Gestor e Operador do Restaurante,
- **Quero** acompanhar o volume de pedidos consumidos no mês através de uma barra de progresso visual e receber alertas inteligentes ao atingir 80% e 100% do limite,
- **Para que** meu restaurante continue vendendo sem interrupções operacionais e eu possa realizar o upgrade de plano de forma transparente e rápida.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Widget de Consumo de Pedidos no Painel Gestor
- [x] Widget em destaque no topo do `AdminDashboard.jsx` e na tela de `AdminAssinatura.jsx`:
  - Barra de progresso visual com cálculo: `(pedidos_consumidos_mes / limite_pedidos_mes) * 100`.
  - Texto claro: `X de Y pedidos consumidos neste ciclo (Z%)`.
  - Data de renovação do ciclo (ex: *"Ciclo renova em 01/09/2026"*).

### AC2: Alerta Amigável de Consumo em 80% (Warning)
- [x] Quando o restaurante atingir 80% do limite mensal:
  - Banner amarelo elegante no topo do painel:
    > ⚠️ **Atenção ao Limite de Pedidos:**  
    > *"Você utilizou [80%] do volume de pedidos do seu plano [Starter/Pro]. Faça o upgrade para garantir atendimento contínuo quando seu movimento aumentar."*
  - Botão no banner: `[ Fazer Upgrade de Plano ]`.

### AC3: Alerta de Limite Atingido em 100% & Garantia de Não-Interrupção (Fair Use Policy)
- [x] Quando o restaurante atingir 100% do volume:
  - Banner laranja/vermelho no painel administrativo:
    > 🚀 **Limite de Pedidos Atingido:**  
    > *"Seu restaurante atingiu o limite de [300] pedidos deste mês! Para continuar com relatórios e recursos avançados, realize o upgrade para o próximo nível."*
  - **Garantia de Não-Interrupção (Zero Downtime):** Pedidos em andamento no salão (QR Code / Comandas) e visualização no KDS da cozinha **não** são bloqueados bruscamente no meio de um serviço de almoço/jantar.

### AC4: Modal de Upgrade de Plano com 1 Clique
- [x] Modal interativo com opções de upgrade imediato:
  - De **Starter** (300 pedidos) $\rightarrow$ Para **Pro** (1.200 pedidos - R$ 229/mês).
  - De **Pro** (1.200 pedidos) $\rightarrow$ Para **Scale** (3.500 pedidos - R$ 399/mês).
  - Exibição da diferença de valor e novo limite imediato.
  - Botão de confirmação: `[ Confirmar Upgrade Agora ]`.
  - Ao confirmar, atualiza o plano no Supabase e ajusta a assinatura no Asaas/mock.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Componente de Barra de Consumo de Pedidos (`src/components/admin/OrderUsageBar.jsx`)** (AC: #1)
  - [x] Implementar barra de progresso com cores dinâmicas (verde < 70%, amarelo 70-89%, vermelho $\ge$ 90%).
  - [x] Exibir contadores numéricos e percentual.

- [x] **Task 2: Implementar Banners de Notificação no `AdminDashboard.jsx`** (AC: #2, #3)
  - [x] Criar lógica de exibição condicional para 80% e 100% de consumo.
  - [x] Adicionar botão de atalho para o modal de upgrade.

- [x] **Task 3: Implementar Modal de Upgrade de Plano (`src/components/admin/UpgradePlanModal.jsx`)** (AC: #4)
  - [x] Layout com comparação de planos, novos limites e botão de ação.
  - [x] Integração com serviço para atualizar `plano` e `limite_pedidos_mes`.

- [x] **Task 4: Testes de Validação** (AC: #1, #2, #3, #4)
  - [x] Simular restaurante com 240 pedidos (80%) e 300 pedidos (100%) e verificar se os alertas são disparados corretamente.
  - [x] Testar fluxo de upgrade e atualização dos contadores.

### Review Findings
- [x] [Review][Patch] Guard plano_info nullability in OrderUsageBar [`src/components/admin/OrderUsageBar.jsx:125`]
- [x] [Review][Patch] Sync selected plan when modal opens or subStatus updates [`src/components/admin/UpgradePlanModal.jsx:43-45`]
- [x] [Review][Patch] Guard positive bonus in UpgradePlanModal pedidos bonus [`src/components/admin/UpgradePlanModal.jsx:154-156`]
- [x] [Review][Patch] Sanitize Enterprise text in UpgradePlanModal summary [`src/components/admin/UpgradePlanModal.jsx:175-177`]
- [x] [Review][Patch] Robust date math for monthly cycle renewal avoiding month day overflow [`src/services/subscriptionService.js:188-191`]
- [x] [Review][Patch] Handle explicit error response from Edge Function in upgradeSubscription [`src/services/subscriptionService.js:553-556`]
- [x] [Review][Patch] Non-numeric/finite sanitizer for pedidos_consumidos_mes in fetchSubscriptionStatus [`src/services/subscriptionService.js:148-152`]

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Negócio (Fair Use Policy)
- Um restaurante nunca deve ter seus clientes bloqueados de pedir ou cozinhar se o limite estourar durante o pico de movimento. A cobrança/upgrade é administrativa.

### Arquivos Envolvidos
- `src/components/admin/OrderUsageBar.jsx`: Componente visual reutilizável de progresso.
- `src/components/admin/UpgradePlanModal.jsx`: Modal de upgrade de plano.
- `src/pages/AdminDashboard.jsx`: Exibição de alertas e integração.
- `src/pages/AdminAssinatura.jsx`: Exibição de uso detalhado.
- `src/components/admin/AdminAssinaturaTab.jsx`: Exibição de uso e botão de upgrade.
- `src/services/subscriptionService.js`: Função de upgrade e cálculos de alertas/ciclos.
- `test/orderUsageAndUpgrade.test.js`: Suíte de testes unitários.

---

## Dev Agent Record

### Implementation Plan
1. Estender `subscriptionService.js` com cálculo da data de renovação de ciclo (`data_renovacao_ciclo`), flags de alerta (`alerta_80`, `alerta_100`) e nova função de upgrade de plano com 1 clique `upgradeSubscription(restauranteId, newPlan)`.
2. Criar componente `src/components/admin/OrderUsageBar.jsx` com faixas de cores dinâmicas (verde < 70%, âmbar 70-89%, vermelho >= 90%), contadores claros, renovação de ciclo e botão de atalho.
3. Criar componente `src/components/admin/UpgradePlanModal.jsx` com comparação inteligente entre o plano atual e planos superiores, cálculo de diferença de valor mensal e novos limites imediatos.
4. Integrar banners de alerta amigável (80%) e alerta de limite atingido (100%) com Fair Use Policy (Zero Downtime operacional) no `AdminDashboard.jsx`, e adicionar `OrderUsageBar` e `UpgradePlanModal` no `AdminDashboard.jsx` e `AdminAssinaturaTab.jsx`.
5. Criar suíte de testes unitários em `test/orderUsageAndUpgrade.test.js` cobrindo todos os ACs, limites, thresholds e chamadas de serviço, validando 166 testes passando com 100% de sucesso e build Vite completo.

### Completion Notes
- ✅ **AC1:** Criado componente `OrderUsageBar.jsx` integrado ao `AdminDashboard.jsx` (Visão Geral) e `AdminAssinaturaTab.jsx` com barra de progresso visual, cálculo de percentual, cores dinâmicas por faixa de consumo e data de renovação de ciclo mensal formatada.
- ✅ **AC2:** Implementado banner de aviso em 80% (Warning) com estilo âmbar elegante no topo do painel gestor e botão de atalho para o modal de upgrade.
- ✅ **AC3:** Implementado banner de limite atingido em 100% com estilo gradiente rose/laranja, mensagem clara e garantia expressa de Fair Use Policy (Zero Downtime no salão e KDS).
- ✅ **AC4:** Criado modal `UpgradePlanModal.jsx` com suporte a upgrade com 1 clique, comparativo de preços e novos limites imediatos (Starter $\rightarrow$ Pro: 1.200 pedidos/mês, Pro $\rightarrow$ Scale: 3.500 pedidos/mês) integrado à função `upgradeSubscription` no `subscriptionService.js`.
- ✅ Todos os 166 testes unitários passando (`npm.cmd test`) e build de produção Vite realizado com sucesso.

---

## File List

- `src/components/admin/OrderUsageBar.jsx` (Novo)
- `src/components/admin/UpgradePlanModal.jsx` (Novo)
- `src/services/subscriptionService.js` (Modificado)
- `src/pages/AdminDashboard.jsx` (Modificado)
- `src/components/admin/AdminAssinaturaTab.jsx` (Modificado)
- `test/orderUsageAndUpgrade.test.js` (Novo)
- `_bmad-output/implementation-artifacts/7-5-gestao-e-alerta-de-limites-de-pedidos-do-plano.md` (Modificado)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Modificado)

---

## Change Log

- **2026-08-28**: Implementada Story 7.5 completa com Barra de Consumo de Pedidos (`OrderUsageBar.jsx`), Modal de Upgrade de Plano (`UpgradePlanModal.jsx`), Banners de Notificação (80% e 100% Fair Use Policy), método `upgradeSubscription` em `subscriptionService.js` e suíte de testes unitários.

