# Story 7.1: Modelagem de Dados de Assinatura, Faturas & Triggers de Pedidos

Status: ready-for-dev

## Story Description

- **Como** Desenvolvedor / Arquiteto de Dados,
- **Quero** estender a tabela `restaurantes` com campos de controle de assinatura, criar a tabela `faturas` e implementar a trigger de contagem automática de pedidos no Supabase,
- **Para que** o sistema armazene de forma segura, isolada e consistente o ciclo de faturamento, o período de trial de 14 dias e o consumo de volume do restaurante.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Extensão da Tabela `restaurantes` (`supabase/schema.sql` ou migration)
- [ ] Adicionar colunas de controle de assinatura e trial na tabela `restaurantes`:
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
- [ ] Criar a tabela `faturas` com os campos:
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
- [ ] Configurar índices em `restaurante_id`, `asaas_payment_id` e `status`.
- [ ] Ativar Row Level Security (RLS) garantindo que gestores autenticados acessem exclusivamente as faturas do seu `restaurante_id`.

### AC3: Função e Trigger de Contagem de Pedidos (`incrementar_pedidos_restaurante`)
- [ ] Criar função PL/pgSQL `incrementar_pedidos_restaurante()` que incrementa `pedidos_consumidos_mes = pedidos_consumidos_mes + 1` no restaurante correspondente ao `NEW.restaurante_id`.
- [ ] Criar trigger `trigger_incrementa_pedido` disparada `AFTER INSERT ON pedidos FOR EACH ROW EXECUTE FUNCTION incrementar_pedidos_restaurante()`.

### AC4: Camada de Mock e Fallback Local
- [ ] Atualizar o mock storage local / dados de teste para incluir os novos campos de assinatura nos restaurantes padrão (ex: `res-demo-001` com `status_assinatura: 'trialing'`, `data_fim_trial` em D+10, `limite_pedidos_mes: 300`, `pedidos_consumidos_mes: 42`).
- [ ] Criar mock de faturas para homologação visual no painel.

---

## Tasks / Subtasks de Implementação

- [ ] **Task 1: Atualizar Script SQL do Supabase (`supabase/schema.sql` e migration)** (AC: #1, #2, #3)
  - [ ] Adicionar `ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS...`.
  - [ ] Adicionar `CREATE TABLE IF NOT EXISTS faturas...`.
  - [ ] Adicionar políticas RLS para `faturas`.
  - [ ] Criar a trigger `trigger_incrementa_pedido` e a função `incrementar_pedidos_restaurante()`.

- [ ] **Task 2: Atualizar Modelos e Serviços de Restaurante (`src/services/restaurantService.js` ou similar)** (AC: #1, #4)
  - [ ] Atualizar getters e setters de restaurante para carregar dados de assinatura (`plano`, `status_assinatura`, `limite_pedidos_mes`, `pedidos_consumidos_mes`, `data_fim_trial`, `cartao_ultimos_digitos`, `cartao_bandeira`).
  - [ ] Criar `src/services/subscriptionService.js` com métodos para buscar faturas e status de faturamento.

- [ ] **Task 3: Atualizar Mock Storage Local (`localStorage`)** (AC: #4)
  - [ ] Garantir que o restaurante inicial possua dados de trial ativos e contadores simulados.
  - [ ] Simular faturas pagas e pendentes para teste da interface.

- [ ] **Task 4: Testes de Validação** (AC: #1, #2, #3, #4)
  - [ ] Testar inserção de um pedido e verificar se o contador `pedidos_consumidos_mes` é incrementado atomicamente.
  - [ ] Validar compatibilidade com tabelas existentes sem quebrar dados legados.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Arquitetura (AD-1 & AD-8)
- A tabela `faturas` deve obrigatoriamente possuir `restaurante_id` com política RLS.
- O incremento de pedidos é acionado via trigger no banco de dados para evitar condições de corrida em múltiplos pedidos simultâneos no salão.

### Arquivos Envolvidos
- `supabase/schema.sql`: Definição de tabelas, triggers e RLS.
- `src/services/subscriptionService.js`: Novo serviço para consumo de dados de faturamento.
- `src/services/restaurantService.js`: Leitura dos novos campos de assinatura.
