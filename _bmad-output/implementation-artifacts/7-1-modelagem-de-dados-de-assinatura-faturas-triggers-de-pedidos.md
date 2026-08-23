---
baseline_commit: be113298e0277262ca24a95d34cd1764c667b034
---

# Story 7.1: Modelagem de Dados de Assinatura, Faturas & Triggers de Pedidos

Status: done

## Story Description

- **Como** Desenvolvedor / Arquiteto de Dados,
- **Quero** estender a tabela `restaurantes` com campos de controle de assinatura, criar a tabela `faturas` e implementar a trigger de contagem automática de pedidos no Supabase,
- **Para que** o sistema armazene de forma segura, isolada e consistente o ciclo de faturamento, o período de trial de 14 dias e o consumo de volume do restaurante.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Extensão da Tabela `restaurantes` (`supabase/schema.sql` ou migration)
- [x] Adicionar colunas de controle de assinatura e trial na tabela `restaurantes`:
  - `plano VARCHAR(50) DEFAULT 'starter'` (starter, pro, scale, enterprise)
  - `status_assinatura VARCHAR(30) DEFAULT 'trialing'` (trialing, active, past_due, canceled)
  - `limite_pedidos_mes INT DEFAULT 300`
  - `pedidos_consumidos_mes INT DEFAULT 0`
  - `data_inicio_ciclo TIMESTAMPTZ DEFAULT NOW()`
  - `data_fim_trial TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days')`
  - `asaas_customer_id VARCHAR(100)`
  - `asaas_subscription_id VARCHAR(100)`
  - `cartao_ultimos_digitos VARCHAR(4)`
  - `cartao_bandeira VARCHAR(30)`
  - `cpf_cnpj VARCHAR(20)`
  - `endereco_completo JSONB`

### AC2: Criação da Tabela `faturas`
- [x] Criar a tabela `faturas` com os campos:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE`
  - `asaas_payment_id VARCHAR(100) UNIQUE`
  - `valor NUMERIC(10,2) NOT NULL`
  - `forma_pagamento VARCHAR(50) DEFAULT 'CREDIT_CARD'`
  - `status VARCHAR(30) NOT NULL` (PENDING, RECEIVED, CONFIRMED, OVERDUE)
  - `url_fatura TEXT`
  - `url_comprovante TEXT`
  - `data_vencimento DATE`
  - `data_pagamento TIMESTAMPTZ`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
- [x] Configurar índices em `restaurante_id`, `asaas_payment_id` e `status`.
- [x] Ativar Row Level Security (RLS) garantindo que gestores autenticados acessem exclusivamente as faturas do seu `restaurante_id`.

### AC3: Função e Trigger de Contagem de Pedidos (`incrementar_pedidos_restaurante`)
- [x] Criar função PL/pgSQL `incrementar_pedidos_restaurante()` que incrementa `pedidos_consumidos_mes = pedidos_consumidos_mes + 1` no restaurante correspondente ao `NEW.restaurante_id`.
- [x] Criar trigger `trigger_incrementa_pedido` disparada `AFTER INSERT ON pedidos FOR EACH ROW EXECUTE FUNCTION incrementar_pedidos_restaurante()`.

### AC4: Camada de Mock e Fallback Local
- [x] Atualizar o mock storage local / dados de teste para incluir os novos campos de assinatura nos restaurantes padrão (ex: `res-demo-001` com `status_assinatura: 'trialing'`, `data_fim_trial` em D+10, `limite_pedidos_mes: 300`, `pedidos_consumidos_mes: 42`).
- [x] Criar mock de faturas para homologação visual no painel.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Atualizar Script SQL do Supabase (`supabase/schema.sql` e migration)** (AC: #1, #2, #3)
  - [x] Adicionar `ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS...`.
  - [x] Adicionar `CREATE TABLE IF NOT EXISTS faturas...`.
  - [x] Adicionar políticas RLS para `faturas`.
  - [x] Criar a trigger `trigger_incrementa_pedido` e a função `incrementar_pedidos_restaurante()`.

- [x] **Task 2: Atualizar Modelos e Serviços de Restaurante (`src/services/restaurantService.js` ou similar)** (AC: #1, #4)
  - [x] Atualizar getters e setters de restaurante para carregar dados de assinatura (`plano`, `status_assinatura`, `limite_pedidos_mes`, `pedidos_consumidos_mes`, `data_fim_trial`, `cartao_ultimos_digitos`, `cartao_bandeira`).
  - [x] Criar `src/services/subscriptionService.js` com métodos para buscar faturas e status de faturamento.

- [x] **Task 3: Atualizar Mock Storage Local (`localStorage`)** (AC: #4)
  - [x] Garantir que o restaurante inicial possua dados de trial ativos e contadores simulados.
  - [x] Simular faturas pagas e pendentes para teste da interface.

- [x] **Task 4: Testes de Validação** (AC: #1, #2, #3, #4)
  - [x] Testar inserção de um pedido e verificar se o contador `pedidos_consumidos_mes` é incrementado atomicamente.
  - [x] Validar compatibilidade com tabelas existentes sem quebrar dados legados.

### Review Findings
- [x] [Review][Patch] Corrigir validação de valor em saveFatura para permitir faturas promocionais/gratuitas com valor zero [src/services/subscriptionService.js:754]
- [x] [Review][Patch] Normalizar chave do plano para minúsculas ao buscar configuração em fetchSubscriptionStatus [src/services/subscriptionService.js:699]
- [x] [Review][Patch] Tratar adequadamente limites ilimitados / nulos (como no plano Enterprise) sem fallback forçado para 300 [src/services/subscriptionService.js:701]
- [x] [Review][Patch] Tratar parsing defensivo de data_fim_trial inválida evitando resultado NaN em diasRestantesTrial [src/services/subscriptionService.js:715]
- [x] [Review][Patch] Adicionar sufixo aleatório ao gerador de asaas_payment_id padrão para faturas locais mock [src/services/subscriptionService.js:764]
- [x] [Review][Patch] Adicionar guarda IF NEW.restaurante_id IS NOT NULL no trigger PL/pgSQL de incremento [supabase/schema.sql:248]
- [x] [Review][Patch] Adicionar restrição NOT NULL na coluna faturas.restaurante_id e coluna updated_at [supabase/schema.sql:218]
- [x] [Review][Patch] Sanitizar e criar lista de campos permitidos em updateRestaurantSubscription [src/services/restaurantService.js:540]
- [x] [Review][Patch] Adicionar hooks afterEach nas suítes de teste restaurando mock do supabase.from [test/restaurantService.test.js:15]
- [x] [Review][Defer] Rotina automatizada de reset mensal de ciclo de pedidos — deferred, previsto para Story 7.5

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Arquitetura (AD-1 & AD-8)
- A tabela `faturas` deve obrigatoriamente possuir `restaurante_id` com política RLS.
- O incremento de pedidos é acionado via trigger no banco de dados para evitar condições de corrida em múltiplos pedidos simultâneos no salão.

### Arquivos Envolvidos
- `supabase/schema.sql`: Definição de tabelas, triggers e RLS.
- `supabase/migrations/20260823000000_subscription_and_invoices_schema.sql`: Migration idempotente para novos ambientes.
- `supabase/seed.sql`: Dados mock com status de trial e faturas de demonstração.
- `src/services/subscriptionService.js`: Novo serviço para consumo de dados de faturamento, faturas e planos.
- `src/services/restaurantService.js`: Leitura e atualização dos novos campos de assinatura.
- `src/utils/uuid.js`: Validação abrangente de UUIDs PostgreSQL.
- `test/subscriptionSchema.test.js`: Validação de DDL, migration, seed e lógica de triggers.
- `test/restaurantService.test.js`: Testes unitários para carregamento de dados e atualização de plano.
- `test/subscriptionService.test.js`: Testes de cálculo de trial, consumo de pedidos e persistência de faturas.

---

## Dev Agent Record

### Implementation Plan
1. Atualização do DDL do Supabase (`supabase/schema.sql`) e criação de migration idempotente (`supabase/migrations/20260823000000_subscription_and_invoices_schema.sql`) contendo colunas de assinatura, tabela `faturas`, índices, Realtime, RLS e trigger `incrementar_pedidos_restaurante`.
2. Criação do serviço `src/services/restaurantService.js` com busca detalhada por ID/slug e atualização de assinatura.
3. Criação do serviço `src/services/subscriptionService.js` contendo `PLANS_CONFIG`, cálculo de ciclo/trial de 14 dias, `fetchFaturas`, `fetchSubscriptionStatus` e `saveFatura`.
4. Atualização de dados de demonstração em `supabase/seed.sql` com trial ativo e faturas mock.
5. Suíte completa de testes automatizados (`test/subscriptionSchema.test.js`, `test/restaurantService.test.js`, `test/subscriptionService.test.js`) com 100% de aprovação.

### Completion Notes
- Implementadas todas as colunas de assinatura na tabela `restaurantes` (`plano`, `status_assinatura`, `limite_pedidos_mes`, `pedidos_consumidos_mes`, `data_inicio_ciclo`, `data_fim_trial`, `asaas_customer_id`, `asaas_subscription_id`, `cartao_ultimos_digitos`, `cartao_bandeira`, `cpf_cnpj`, `endereco_completo`).
- Criada tabela `faturas` com chaves estrangeiras, índices de performance e RLS multi-tenant ativado.
- Criada trigger de banco PL/pgSQL `trigger_incrementa_pedido` e função `incrementar_pedidos_restaurante()` para contagem atômica de pedidos.
- Criados os módulos `src/services/restaurantService.js` e `src/services/subscriptionService.js` com suporte a fallback offline e cálculo automatizado de métricas de trial.
- 94 testes unitários e de integração executados e aprovados com 100% de sucesso.

### Debug Log
- Ajustado validador `isValidUUID` em `src/utils/uuid.js` para garantir conformidade plena com identificadores UUID padrão PostgreSQL / seed data.

---

## File List
- `supabase/schema.sql`
- `supabase/migrations/20260823000000_subscription_and_invoices_schema.sql`
- `supabase/seed.sql`
- `src/services/restaurantService.js`
- `src/services/subscriptionService.js`
- `src/utils/uuid.js`
- `test/subscriptionSchema.test.js`
- `test/restaurantService.test.js`
- `test/subscriptionService.test.js`

---

## Change Log
- 2026-08-23: Implementada a Story 7.1 completa com modelagem de dados de assinatura, faturas, trigger de contagem de pedidos, serviços frontend e suíte de testes.
