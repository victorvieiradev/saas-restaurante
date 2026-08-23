# Story 7.2: Supabase Edge Functions de Cobrança (`create-subscription`, `cancel-subscription`, `asaas-webhook`)

Status: ready-for-dev

## Story Description

- **Como** Sistema de Backend Serverless / Gestor de Assinaturas,
- **Quero** implementar as Edge Functions no Supabase para comunicação com a API do Asaas (criação de assinatura D+14, cancelamento e recebimento de webhooks),
- **Para que** as transações financeiras e tokenização de cartões ocorram de forma segura, com chaves de API ocultas do cliente e garantia de R$ 0,00 cobrado durante o trial.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Edge Function `create-subscription` (`supabase/functions/create-subscription/index.ts`)
- [ ] Receber payload: `{ cliente, restaurante, cartao, endereco, plano, ciclo }`.
- [ ] Criar ou recuperar cliente no Asaas (`POST /v3/customers`):
  - `name`, `email`, `cpfCnpj`, `phone`, `postalCode`, `addressNumber`, `addressComplement`.
- [ ] Criar assinatura recorrente no Asaas (`POST /v3/subscriptions`):
  - `customer`: `asaasCustomerId`
  - `billingType`: `'CREDIT_CARD'`
  - `value`: valor do plano (ex: 119.00, 229.00 ou 399.00)
  - `nextDueDate`: calculado para exatamente **D+14** (hoje + 14 dias em formato `YYYY-MM-DD`)
  - `cycle`: `'MONTHLY'` ou `'YEARLY'`
  - `description`: `Assinatura RestauranteApp - Plano ${planoNome} (Trial 14 Dias)`
  - `creditCard`: `{ holderName, number, expiryMonth, expiryYear, ccv }`
  - `creditCardHolderInfo`: dados do titular do cartão
- [ ] Gravação no Supabase:
  - Cria conta Auth do usuário e registro em `restaurantes` (se novo cadastro).
  - Atualiza `status_assinatura = 'trialing'`, `data_fim_trial = D+14`, `asaas_customer_id`, `asaas_subscription_id`, `cartao_ultimos_digitos`, `cartao_bandeira`.
- [ ] Retornar `{ success: true, restauranteId, status: 'trialing', dataFimTrial }`.

### AC2: Edge Function `cancel-subscription` (`supabase/functions/cancel-subscription/index.ts`)
- [ ] Validar o token JWT do usuário gestor autenticado via header `Authorization: Bearer <token>`.
- [ ] Recuperar o `asaas_subscription_id` do restaurante.
- [ ] Executar chamada de cancelamento no Asaas: `DELETE /v3/subscriptions/{asaas_subscription_id}`.
- [ ] Atualizar no Supabase: `status_assinatura = 'canceled'`.
- [ ] Retornar confirmação com mensagem clara garantindo R$ 0,00 cobrado.

### AC3: Edge Function `asaas-webhook` (`supabase/functions/asaas-webhook/index.ts`)
- [ ] Validar header `asaas-access-token` contra a variável `ASAAS_WEBHOOK_SECRET`.
- [ ] Tratar eventos:
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
- [ ] Retornar status HTTP 200 OK para o Asaas.

### AC4: Modo de Simulação Local (Mock Serverless / Fallback)
- [ ] Fornecer suporte no client frontend (`src/services/subscriptionService.js`) para simular chamadas de Edge Functions caso o ambiente de desenvolvimento esteja sem Supabase CLI / Asaas Sandbox configurado.

---

## Tasks / Subtasks de Implementação

- [ ] **Task 1: Criar Edge Function `create-subscription`** (AC: #1)
  - [ ] Criar diretório e arquivo `supabase/functions/create-subscription/index.ts`.
  - [ ] Implementar integração com `/v3/customers` e `/v3/subscriptions`.
  - [ ] Tratar erros de validação de cartão do Asaas e retornar mensagens amigáveis em português.

- [ ] **Task 2: Criar Edge Function `cancel-subscription`** (AC: #2)
  - [ ] Criar diretório e arquivo `supabase/functions/cancel-subscription/index.ts`.
  - [ ] Implementar verificação de autenticação JWT e chamada `DELETE /v3/subscriptions/{id}`.

- [ ] **Task 3: Criar Edge Function `asaas-webhook`** (AC: #3)
  - [ ] Criar diretório e arquivo `supabase/functions/asaas-webhook/index.ts`.
  - [ ] Validar token de autenticação e processar payloads de webhook.

- [ ] **Task 4: Configurar Arquivo `.env.example` e Documentação de Secrets** (AC: #1, #2, #3)
  - [ ] Incluir `ASAAS_API_URL`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET` no template de variáveis.

- [ ] **Task 5: Implementar Client Service com Fallback Mock (`src/services/subscriptionService.js`)** (AC: #4)
  - [ ] Implementar funções `createSubscription()`, `cancelSubscription()` e `fetchSubscriptionStatus()`.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Segurança (AD-7 & NFR-007)
- Chave `ASAAS_API_KEY` **NUNCA** deve estar no código frontend (`src/`).
- O cálculo do `nextDueDate` para `D+14` deve ser garantido no backend/Edge Function para evitar adulteração de prazo pelo cliente.
- URLs Asaas:
  - Sandbox: `https://sandbox.asaas.com/api/v3`
  - Produção: `https://api.asaas.com/v3`

### Arquivos Envolvidos
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/cancel-subscription/index.ts`
- `supabase/functions/asaas-webhook/index.ts`
- `src/services/subscriptionService.js`
