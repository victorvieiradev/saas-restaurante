---
baseline_commit: 6d6c8c603ddd75d4ea2a9a1d76924bb424af642b
---

# Story 7.2: Supabase Edge Functions de Cobrança (`create-subscription`, `cancel-subscription`, `asaas-webhook`)

Status: done

## Story Description

- **Como** Sistema de Backend Serverless / Gestor de Assinaturas,
- **Quero** implementar as Edge Functions no Supabase para comunicação com a API do Asaas (criação de assinatura D+14, cancelamento e recebimento de webhooks),
- **Para que** as transações financeiras e tokenização de cartões ocorram de forma segura, com chaves de API ocultas do cliente e garantia de R$ 0,00 cobrado durante o trial.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Edge Function `create-subscription` (`supabase/functions/create-subscription/index.ts`)
- [x] Receber payload: `{ cliente, restaurante, cartao, endereco, plano, ciclo }`.
- [x] Criar ou recuperar cliente no Asaas (`POST /v3/customers`):
  - `name`, `email`, `cpfCnpj`, `phone`, `postalCode`, `addressNumber`, `addressComplement`.
- [x] Criar assinatura recorrente no Asaas (`POST /v3/subscriptions`):
  - `customer`: `asaasCustomerId`
  - `billingType`: `'CREDIT_CARD'`
  - `value`: valor do plano (ex: 97.00, 197.00 ou 397.00)
  - `nextDueDate`: calculado para exatamente **D+14** (hoje + 14 dias em formato `YYYY-MM-DD`)
  - `cycle`: `'MONTHLY'` ou `'YEARLY'`
  - `description`: `Assinatura RestauranteApp - Plano ${planoNome} (Trial 14 Dias)`
  - `creditCard`: `{ holderName, number, expiryMonth, expiryYear, ccv }`
  - `creditCardHolderInfo`: dados do titular do cartão
- [x] Gravação no Supabase:
  - Cria conta Auth do usuário e registro em `restaurantes` (se novo cadastro).
  - Atualiza `status_assinatura = 'trialing'`, `data_fim_trial = D+14`, `asaas_customer_id`, `asaas_subscription_id`, `cartao_ultimos_digitos`, `cartao_bandeira`.
- [x] Retornar `{ success: true, restauranteId, status: 'trialing', dataFimTrial }`.

### AC2: Edge Function `cancel-subscription` (`supabase/functions/cancel-subscription/index.ts`)
- [x] Validar o token JWT do usuário gestor autenticado via header `Authorization: Bearer <token>`.
- [x] Recuperar o `asaas_subscription_id` do restaurante.
- [x] Executar chamada de cancelamento no Asaas: `DELETE /v3/subscriptions/{asaas_subscription_id}`.
- [x] Atualizar no Supabase: `status_assinatura = 'canceled'`.
- [x] Retornar confirmação com mensagem clara garantindo R$ 0,00 cobrado.

### AC3: Edge Function `asaas-webhook` (`supabase/functions/asaas-webhook/index.ts`)
- [x] Validar header `asaas-access-token` contra a variável `ASAAS_WEBHOOK_SECRET`.
- [x] Tratar eventos:
  - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`:
    - Atualiza `status_assinatura = 'active'`.
    - Reseta `pedidos_consumidos_mes = 0`.
    - Atualiza `data_inicio_ciclo = NOW()`.
    - Insere fatura na tabela `faturas` com status `CONFIRMED`.
  - `PAYMENT_OVERDUE`:
    - Atualiza `status_assinatura = 'past_due'`.
    - Insere/atualiza fatura como `OVERDUE`.
  - `SUBSCRIPTION_DELETED`:
    - Atualiza `status_assinatura = 'canceled'`.
- [x] Retornar status HTTP 200 OK para o Asaas.

### AC4: Modo de Simulação Local (Mock Serverless / Fallback)
- [x] Fornecer suporte no client frontend (`src/services/subscriptionService.js`) para simular chamadas de Edge Functions caso o ambiente de desenvolvimento esteja sem Supabase CLI / Asaas Sandbox configurado.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Edge Function `create-subscription`** (AC: #1)
  - [x] Criar diretório e arquivo `supabase/functions/create-subscription/index.ts`.
  - [x] Implementar integração com `/v3/customers` e `/v3/subscriptions`.
  - [x] Tratar erros de validação de cartão do Asaas e retornar mensagens amigáveis em português.

- [x] **Task 2: Criar Edge Function `cancel-subscription`** (AC: #2)
  - [x] Criar diretório e arquivo `supabase/functions/cancel-subscription/index.ts`.
  - [x] Implementar verificação de autenticação JWT e chamada `DELETE /v3/subscriptions/{id}`.

- [x] **Task 3: Criar Edge Function `asaas-webhook`** (AC: #3)
  - [x] Criar diretório e arquivo `supabase/functions/asaas-webhook/index.ts`.
  - [x] Validar token de autenticação e processar payloads de webhook.

- [x] **Task 4: Configurar Arquivo `.env.example` e Documentação de Secrets** (AC: #1, #2, #3)
  - [x] Incluir `ASAAS_API_URL`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET` no template de variáveis.

- [x] **Task 5: Implementar Client Service com Fallback Mock (`src/services/subscriptionService.js`)** (AC: #4)
  - [x] Implementar funções `createSubscription()`, `cancelSubscription()` e `fetchSubscriptionStatus()`.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Segurança (AD-7 & NFR-007)
- Chave `ASAAS_API_KEY` **NUNCA** deve estar no código frontend (`src/`).
- O cálculo do `nextDueDate` para `D+14` deve ser garantido no backend/Edge Function para evitar adulteração de prazo pelo cliente.
- URLs Asaas:
  - Sandbox: `https://sandbox.asaas.com/api/v3`
  - Produção: `https://api.asaas.com/v3`

### Arquivos Envolvidos
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/cancel-subscription/index.ts`
- `supabase/functions/asaas-webhook/index.ts`
- `src/services/subscriptionService.js`
- `.env.example`
- `CONFIGURACOES_PENDENTES.md`
- `test/subscriptionService.test.js`
- `test/edgeFunctions.test.js`

---

## Dev Agent Record

### Implementation Plan
1. **Task 1**: Criar Edge Function `create-subscription` com CORS, validação de payload, integração com Asaas API (customer e subscription D+14), tratamento de erros amigável e persistência no Supabase.
2. **Task 2**: Criar Edge Function `cancel-subscription` com validação de JWT/auth, cancelamento no Asaas e atualização de status para `canceled`.
3. **Task 3**: Criar Edge Function `asaas-webhook` com verificação de webhook secret e tratamento de eventos (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_DELETED`).
4. **Task 4**: Configurar secrets e variáveis no `.env.example` e documentação de secrets no `CONFIGURACOES_PENDENTES.md`.
5. **Task 5**: Implementar métodos `createSubscription` e `cancelSubscription` em `src/services/subscriptionService.js` com fallback mock para ambiente local/offline.
6. **Testes**: Criar bateria completa de testes unitários e de integração mockada em `test/edgeFunctions.test.js` e expandir `test/subscriptionService.test.js`.

### Completion Notes
- Implementadas todas as Edge Functions Deno/TypeScript no Supabase (`create-subscription`, `cancel-subscription`, `asaas-webhook`) com CORS compartilhado em `_shared/cors.ts`.
- Garantido cálculo D+14 seguro no serverless com primeira cobrança apenas após 14 dias (`nextDueDate`).
- Adicionada detecção automática de bandeiras de cartão (Visa, Mastercard, Elo, Amex, Hipercard) e extração sanitizada dos últimos 4 dígitos.
- Webhook Asaas implementado com suporte a `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_DELETED` e persistência automática na tabela `faturas`.
- Criado cliente no frontend com fallback resiliente para ambiente de desenvolvimento local/offline.
- Atualizado `.env.example` e `CONFIGURACOES_PENDENTES.md` com instruções detalhadas de deploy e configuração de secrets.
- Todos os 112 testes automatizados passando (100% de sucesso).

---

## File List
- `supabase/functions/_shared/cors.ts` (novo)
- `supabase/functions/create-subscription/index.ts` (novo)
- `supabase/functions/cancel-subscription/index.ts` (novo)
- `supabase/functions/asaas-webhook/index.ts` (novo)
- `src/services/subscriptionService.js` (modificado)
- `.env.example` (modificado)
- `CONFIGURACOES_PENDENTES.md` (modificado)
- `test/edgeFunctions.test.js` (novo)
- `test/subscriptionService.test.js` (modificado)

---

## Change Log
- 2026-08-23: Implementação completa das Edge Functions de cobrança Asaas, cliente no frontend com fallback mock, documentação de secrets e suite de testes.
- 2026-08-23: Code Review realizado com aprovação total (todas as 3 camadas aprovadas sem pendências).

---

## Senior Developer Review (AI)

- **Review Date:** 2026-08-23
- **Review Outcome:** Approve
- **Review Layers:**
  - Blind Hunter: Pass (Segurança e isolamento de secrets no backend validados)
  - Edge Case Hunter: Pass (Tratamento defensivo de anos de cartão 2/4 dígitos, fallbacks de endereço, erros Asaas e fallback offline validados)
  - Acceptance Auditor: Pass (100% de conformidade com AC1, AC2, AC3 e AC4)
- **Action Items:** 0 remaining
- **Summary:** Código limpo, desacoplado, seguro contra vazamento de credenciais e totalmente testado (112 testes passando).


