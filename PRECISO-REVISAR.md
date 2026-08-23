# 📋 Análise de Travas e Limites de Planos (Revisão de Arquitetura)

> **Data de Análise:** 23 de Agosto de 2026  
> **Status:** Para Revisão / Decisão de Implementação  
> **Localização:** Raiz do Projeto (`/PRECISO-REVISAR.md`)

---

## 🎯 Objetivo Deste Documento
Registrar o diagnóstico técnico realizado no código-fonte do SaaS (**RestauranteApp**) referente às **travas sistêmicas, limites operacionais e regras de planos**, contrastando o que já está efetivamente construído versus o que é ofertado comercialmente na Landing Page / Checkout.

---

## 📊 1. Quadro Comparativo: Promessa Comercial vs. Implementação Real

| Recurso / Limite | Starter | Pro *(Mais Escolhido)* | Scale / Redes | Status da Trava no Código Atual |
| :--- | :---: | :---: | :---: | :---: |
| **Preço Mensal / Anual** | R$ 119 / R$ 95 | R$ 229 / R$ 183 | R$ 399 / R$ 319 | ✅ **Implementado** (Calculado no Checkout e gravado no Asaas) |
| **Volume de Pedidos / Mês** | Até 300 pedidos | Até 1.200 pedidos | Até 3.500 pedidos | 🟡 **Parcial** (Trigger SQL conta no banco, mas bloqueio visual está na Story 7.5) |
| **Membros de Equipe (RBAC)** | Gestor apenas *(comercial)* | Cozinha + Caixa ilimitados | Equipe completa + Filiais | ❌ **Sem trava** (Qualquer plano pode cadastrar membros ilimitados no `TeamManager`) |
| **Mesas / Comandas QR Code** | Até 15 mesas ativas | Ilimitadas | Ilimitadas | ❌ **Sem trava** (Plano Starter consegue gerar N comandas sem bloqueio) |
| **Telas de Cozinha KDS** | 1 Tela | Múltiplas | Múltiplas | ❌ **Sem trava** (Sem controle de sessões simultâneas) |
| **Terminais de Caixa POS** | 1 Terminal | Múltiplos | Múltiplos | ❌ **Sem trava** (Sem controle de sessões simultâneas) |
| **Alerta Sonoro KDS** | Básico | WebSockets Realtime | WebSockets Realtime | ✅ **Implementado** (Ativo para todos os operadores autenticados) |
| **Trial de 14 Dias Grátis** | Sim (D+14) | Sim (D+14) | Sim (D+14) | ✅ **Implementado** (Cobrança R$ 0,00 hoje, 1º débito em D+14 via Asaas) |

---

## 🔍 2. Detalhamento do Estado Atual do Código

### ✅ 2.1 O que já está implementado e funcionando:
1. **Contagem Automatizada de Pedidos no PostgreSQL:**
   - Trigger `incrementar_pedidos_restaurante` executada a cada `INSERT` na tabela `pedidos`, incrementando `pedidos_consumidos_mes`.
2. **Cálculo de Consumo e Status no Backend (`src/services/subscriptionService.js`):**
   - Função `fetchSubscriptionStatus()` calcula:
     - `percentual_consumido` = `(pedidos_consumidos_mes / limite_pedidos_mes) * 100`
     - `limite_excedido` = booleano identificando se ultrapassou o teto
     - `dias_restantes_trial` = contagem regressiva D+14
     - `is_bloqueado` = bloqueia se o status for `canceled` ou `past_due` (inadimplente)
3. **Controle de Acesso por Perfil RBAC (`src/utils/rbac.js` & `src/components/ProtectedRoute.jsx`):**
   - Usuário `COZINHA` só acessa `/cozinha`.
   - Usuário `CAIXA` só acessa `/caixa`.
   - Usuário `GESTOR` tem acesso total.
4. **Checkout e Cobrança com Cartão (Asaas):**
   - Tokenização e agendamento da primeira mensalidade em D+14 com R$ 0,00 no ato.

---

### ❌ 2.2 Travas de Negócio que AINDA NÃO estão implementadas no código:

1. **Trava de Quantidade de Membros de Equipe:**
   - **Arquivo:** [`src/components/admin/TeamManager.jsx`](file:///C:/Users/Paty/Desktop/restaurante/src/components/admin/TeamManager.jsx) e [`src/services/userService.js`](file:///C:/Users/Paty/Desktop/restaurante/src/services/userService.js).
   - **Cenário Atual:** Não existe verificação de `restaurante.plano` ao clicar em *"Adicionar Colaborador"*. Um restaurante no plano Starter consegue cadastrar 50 operadores de cozinha e caixa sem impedimento.
   - **Ação Necessária:** Se o plano for `starter`, bloquear o cadastro de novos membros ou limitar a 1 operador (ou exigir upgrade para o plano `pro`).

2. **Trava de Quantidade de Comandas / Mesas Ativas:**
   - **Arquivo:** [`src/components/admin/ComandaManager.jsx`](file:///C:/Users/Paty/Desktop/restaurante/src/components/admin/ComandaManager.jsx) e [`src/services/comandaService.js`](file:///C:/Users/Paty/Desktop/restaurante/src/services/comandaService.js).
   - **Cenário Atual:** A geração em lote permite gerar quantas comandas o gestor quiser.
   - **Ação Necessária:** No plano `starter`, limitar a listagem/geração ativa em no máximo 15 comandas simultâneas.

3. **Trava de Sessões / Telas Simultâneas (KDS e POS):**
   - **Cenário Atual:** Vários navegadores podem abrir `/cozinha` ou `/caixa` com a mesma conta ou contas diferentes.
   - **Ação Necessária:** Avaliar se vale a pena travar via WebSocket/sessão ou se a diferenciação por limite de pedidos mensais já é suficiente para o modelo de negócio.

4. **Visualização Amigável de Limites e Alerta de 80% / 100% de Pedidos:**
   - **Status:** Planejada para ser construída na **Story 7.5: Gestão e Alerta de Limites de Pedidos do Plano (Fair Use Policy)**.

---

## 💡 3. Recomendações para a Próxima Decisão

1. **Abordagem Recomendada (Foco em Volume de Pedidos):**
   - No modelo SaaS moderno, limitar o **volume de pedidos mensais** (ex: 300, 1.200, 3.500) costuma ser mais fácil de monetizar e gera menos atrito operacional do que travar mesas ou garçons na correria do restaurante.
2. **Abordagem Rígida (Enforcement por Recursos):**
   - Se a estratégia for forçar o plano **Pro**, podemos adicionar uma trava no `TeamManager.jsx` exibindo um modal:  
     *"O módulo de Gestão de Equipe com operadores dedicados de Cozinha e Caixa está disponível a partir do Plano Pro. Faça o upgrade para adicionar colaboradores."*

---

*Arquivo gerado para apoio na tomada de decisão do projeto RestauranteApp SaaS.*
