# Story 7.5: Gestão e Alerta de Limites de Pedidos do Plano (Fair Use Policy)

Status: ready-for-dev

## Story Description

- **Como** Gestor e Operador do Restaurante,
- **Quero** acompanhar o volume de pedidos consumidos no mês através de uma barra de progresso visual e receber alertas inteligentes ao atingir 80% e 100% do limite,
- **Para que** meu restaurante continue vendendo sem interrupções operacionais e eu possa realizar o upgrade de plano de forma transparente e rápida.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Widget de Consumo de Pedidos no Painel Gestor
- [ ] Widget em destaque no topo do `AdminDashboard.jsx` e na tela de `AdminAssinatura.jsx`:
  - Barra de progresso visual com cálculo: `(pedidos_consumidos_mes / limite_pedidos_mes) * 100`.
  - Texto claro: `X de Y pedidos consumidos neste ciclo (Z%)`.
  - Data de renovação do ciclo (ex: *"Ciclo renova em 01/09/2026"*).

### AC2: Alerta Amigável de Consumo em 80% (Warning)
- [ ] Quando o restaurante atingir 80% do limite mensal:
  - Banner amarelo elegante no topo do painel:
    > ⚠️ **Atenção ao Limite de Pedidos:**  
    > *"Você utilizou [80%] do volume de pedidos do seu plano [Starter/Pro]. Faça o upgrade para garantir atendimento contínuo quando seu movimento aumentar."*
  - Botão no banner: `[ Fazer Upgrade de Plano ]`.

### AC3: Alerta de Limite Atingido em 100% & Garantia de Não-Interrupção (Fair Use Policy)
- [ ] Quando o restaurante atingir 100% do volume:
  - Banner laranja/vermelho no painel administrativo:
    > 🚀 **Limite de Pedidos Atingido:**  
    > *"Seu restaurante atingiu o limite de [300] pedidos deste mês! Para continuar com relatórios e recursos avançados, realize o upgrade para o próximo nível."*
  - **Garantia de Não-Interrupção (Zero Downtime):** Pedidos em andamento no salão (QR Code / Comandas) e visualização no KDS da cozinha **não** são bloqueados bruscamente no meio de um serviço de almoço/jantar.

### AC4: Modal de Upgrade de Plano com 1 Clique
- [ ] Modal interativo com opções de upgrade imediato:
  - De **Starter** (300 pedidos) $\rightarrow$ Para **Pro** (1.200 pedidos - R$ 229/mês).
  - De **Pro** (1.200 pedidos) $\rightarrow$ Para **Scale** (3.500 pedidos - R$ 399/mês).
  - Exibição da diferença de valor e novo limite imediato.
  - Botão de confirmação: `[ Confirmar Upgrade Agora ]`.
  - Ao confirmar, atualiza o plano no Supabase e ajusta a assinatura no Asaas/mock.

---

## Tasks / Subtasks de Implementação

- [ ] **Task 1: Criar Componente de Barra de Consumo de Pedidos (`src/components/admin/OrderUsageBar.jsx`)** (AC: #1)
  - [ ] Implementar barra de progresso com cores dinâmicas (verde < 70%, amarelo 70-89%, vermelho $\ge$ 90%).
  - [ ] Exibir contadores numéricos e percentual.

- [ ] **Task 2: Implementar Banners de Notificação no `AdminDashboard.jsx`** (AC: #2, #3)
  - [ ] Criar lógica de exibição condicional para 80% e 100% de consumo.
  - [ ] Adicionar botão de atalho para o modal de upgrade.

- [ ] **Task 3: Implementar Modal de Upgrade de Plano (`src/components/admin/UpgradePlanModal.jsx`)** (AC: #4)
  - [ ] Layout com comparação de planos, novos limites e botão de ação.
  - [ ] Integração com serviço para atualizar `plano` e `limite_pedidos_mes`.

- [ ] **Task 4: Testes de Validação** (AC: #1, #2, #3, #4)
  - [ ] Simular restaurante com 240 pedidos (80%) e 300 pedidos (100%) e verificar se os alertas são disparados corretamente.
  - [ ] Testar fluxo de upgrade e atualização dos contadores.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Negócio (Fair Use Policy)
- Um restaurante nunca deve ter seus clientes bloqueados de pedir ou cozinhar se o limite estourar durante o pico de movimento. A cobrança/upgrade é administrativa.

### Arquivos Envolvidos
- `src/components/admin/OrderUsageBar.jsx`: Componente visual reutilizável de progresso.
- `src/components/admin/UpgradePlanModal.jsx`: Modal de upgrade de plano.
- `src/pages/AdminDashboard.jsx`: Exibição de alertas e integração.
- `src/pages/AdminAssinatura.jsx`: Exibição de uso detalhado.
