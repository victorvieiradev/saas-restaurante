---
title: "ARCHITECTURE-SPINE.md - Arquitetura Técnica & Invariantes"
status: "draft"
created: "2026-08-03"
updated: "2026-08-15"
---

# ARCHITECTURE-SPINE: Sistema de Cardápio Digital & Comandas QR Code

## 1. Paradigma Arquitetural & Stack Escolhida

**Paradigma:** Monolito Modular Orientado a Eventos em Tempo Real (*Modular Monolith with Realtime Event Streams*) + Serverless Edge Functions para Operações Financeiras.

- **Front-end App:** React (Vite) + Tailwind CSS + Lucide Icons. Single Page Application PWA com roteamento dinâmico.
- **Back-end & BaaS:** Supabase (PostgreSQL 15, Supabase Auth para Admin, Supabase Realtime via WebSockets e Storage de Mídia para fotos de pratos).
- **Serverless Backend (Financeiro):** Supabase Edge Functions (Deno / TypeScript) para integração com gateway de pagamento.
- **Gateway de Pagamentos:** Asaas API v3 (Sandbox & Produção) para cobrança recorrente com primeiro vencimento futuro (`nextDueDate`), tokenização de cartão e webhooks.
- **Gerador de QR Code:** Biblioteca `qrcode` (frontend ou função no servidor).

---

## 2. Decisões Arquiteturais Invariantes (Architectural Decisions - ADs)

### AD-1 [ADOPTED]: Multi-Tenant com Isolamento por Row Level Security (RLS)
- **Binds:** Todas as tabelas do banco de dados (`categorias`, `produtos`, `comandas`, `pedidos`, `itens_pedido`, `usuarios_restaurante`, `faturas`) possuem obrigatoriamente a coluna `restaurante_id (uuid)`.
- **Prevents:** Vazamento acidental de dados entre estabelecimentos concorrentes.
- **Rule:** As consultas do Supabase aplicam políticas RLS garantindo que um restaurante autenticado acesse exclusivamente seus próprios registros.

### AD-2 [ADOPTED]: Sessão do Cliente Sem Autenticação via Token de Comanda
- **Binds:** Rota `/comanda/:token`. O token é um hash/UUID gerado no cadastro da comanda.
- **Prevents:** Exigência de cadastro/login que geraria abandono pelo cliente final.
- **Rule:** O cliente lê o QR Code, o frontend valida se a comanda correspondente ao token está no status `DISPONIVEL` ou `EM_USO`. Se `DISPONIVEL`, o sistema transiciona a comanda para `EM_USO` na criação do primeiro pedido.

### AD-3 [ADOPTED]: Sincronização em Tempo Real (Realtime Push)
- **Binds:** Supabase Realtime WebSocket Channels (`postgres_changes` em `pedidos`).
- **Prevents:** Necessidade de recarregar a página (*F5*) ou *polling* constante na tela da cozinha e do caixa.
- **Rule:** A tela KDS da cozinha subscreve ao canal de pedidos filtrado por seu `restaurante_id`. Qualquer `INSERT` ou `UPDATE` na tabela `pedidos` aciona o sinal sonoro e atualiza a coluna correspondente em menos de 1 segundo.

### AD-4 [ADOPTED]: Máquina de Estados Estrita para Pedidos
- **Binds:** O status do pedido só aceita os valores enum: `PENDENTE`, `EM_PREPARO`, `CONCLUIDO`, `CANCELADO`.
- **Prevents:** Pedidos em estados inconsistentes ou transições inválidas (ex: pular de `PENDENTE` direto para `CONCLUIDO` sem passar por `EM_PREPARO`, salvo configuração de produtos expressos).
- **Rule:**
  - `PENDENTE` $\rightarrow$ `EM_PREPARO` (Ação do Cozinheiro: *Iniciar Preparo*)
  - `EM_PREPARO` $\rightarrow$ `CONCLUIDO` (Ação do Cozinheiro: *Concluir*)
  - `PENDENTE` $\rightarrow$ `CANCELADO` (Ação do Caixa ou Admin)

### AD-5 [ADOPTED]: Ciclo de Vida da Comanda & Imutabilidade Histórica
- **Binds:** Status da Comanda (`DISPONIVEL` $\rightarrow$ `EM_USO` $\rightarrow$ `ENCERRADA`).
- **Prevents:** Perda de histórico financeiro ao "limpar" a comanda para o próximo cliente.
- **Rule:** Ao fechar a conta no Caixa, o sistema atualiza a comanda para `DISPONIVEL` e desvincula os pedidos ativos para uma sessão encerrada (gravando `sessao_fechada_em`), preservando todos os registros de `pedidos` e `itens_pedido` para relatórios de vendas.

### AD-6 [ADOPTED]: Role-Based Access Control (RBAC) & Route Guards Multi-Tenant
- **Binds:** `AuthContext.jsx`, `ProtectedRoute.jsx` e tabela `usuarios_restaurante`. Papéis permitidos: `GESTOR`, `COZINHA`, `CAIXA`.
- **Prevents:** Operadores da cozinha ou do caixa acessando áreas administrativas, alterando preços ou visualizando dados de outros restaurantes vizinhos.
- **Rule:**
  - `GESTOR`: Acesso irrestrito a `/admin`, `/caixa`, `/cozinha` e gestão de equipe.
  - `COZINHA`: Acesso restrito a `/cozinha`. Bloqueado de acessar `/admin` ou `/caixa`.
  - `CAIXA`: Acesso restrito a `/caixa`. Bloqueado de acessar `/admin` ou `/cozinha`.
  - O `ProtectedRoute` valida a sessão e se o `role` do usuário consta no array `allowedRoles`. Se não autorizado, redireciona o usuário para seu painel de direito.
  - Todas as chamadas de API injetam obrigatoriamente o `restaurante_id` extraído do perfil autenticado.

### AD-7 [ADOPTED]: Integração Asaas com Edge Functions & Webhook Serverless
- **Binds:** Supabase Edge Functions (`create-subscription`, `cancel-subscription`, `asaas-webhook`) e Gateway Asaas.
- **Prevents:** Exposição de chaves sensíveis (`ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET`) no frontend e manipulação indevida de dados de cartão de crédito.
- **Rule:**
  - O frontend envia os dados do titular e do cartão diretamente para a Edge Function `create-subscription`.
  - A Edge Function cadastra o cliente no Asaas (`POST /v3/customers`), cria a assinatura com primeiro vencimento agendado para D+14 (`nextDueDate = D+14`, R$ 0,00 debitado no dia 0) e salva apenas token/últimos 4 dígitos no banco.
  - Cancelamentos no período de teste invocam `cancel-subscription`, que executa `DELETE /v3/subscriptions/{id}` garantindo R$ 0,00 cobrado.
  - O `asaas-webhook` valida a assinatura do token do webhook antes de atualizar `status_assinatura` e inserir faturas na tabela `faturas`.

### AD-8 [ADOPTED]: Monitoramento Atômico de Limite Mensal de Pedidos
- **Binds:** Trigger `incrementar_pedidos_restaurante` na tabela `pedidos`, colunas `limite_pedidos_mes` e `pedidos_consumidos_mes`.
- **Prevents:** Contagem incorreta de pedidos gerados ou inconsistência de consumo no mês.
- **Rule:** A cada novo pedido inserido na tabela `pedidos`, a trigger incrementa automaticamente `pedidos_consumidos_mes` do restaurante. Ao atingir 80% ou 100%, o painel emite alertas visuais incentivando o upgrade de plano sem travar pedidos em andamento na cozinha.

---

## 3. Diagrama da Arquitetura do Sistema

```mermaid
graph TB
    subgraph Client Layer
        C[📱 Celular Cliente Web/PWA]
        K[👨‍🍳 Monitor Cozinha KDS - Perfil COZINHA]
        X[💰 Terminal Caixa POS - Perfil CAIXA]
        A[⚙️ Painel Admin Gestor - Perfil GESTOR]
        O[💳 Onboarding / Checkout - Novo Gestor]
    end

    subgraph Application & Gateway Layer
        V[⚡ React + Vite SPA]
        R[🔀 Router & RBAC Route Guards]
    end

    subgraph Serverless Edge Functions
        EF_Create[⚡ create-subscription]
        EF_Cancel[⚡ cancel-subscription]
        EF_Hook[⚡ asaas-webhook]
    end

    subgraph External Gateway
        Asaas[🏦 Asaas Payments API v3]
    end

    subgraph BaaS Services (Supabase)
        Auth[🔐 Supabase Auth & RBAC Profile]
        DB[(🗄️ PostgreSQL Database - RLS Multi-Tenant)]
        RT[⚡ Realtime Engine - WebSockets]
        Storage[🖼️ Storage - Fotos dos Pratos]
    end

    C -->|GET /comanda/:token| R
    K -->|Login COZINHA ➔ /cozinha| R
    X -->|Login CAIXA ➔ /caixa| R
    A -->|Login GESTOR ➔ /admin| R
    O -->|POST Checkout / Trial 14 Dias| EF_Create

    R --> V
    V --> Auth
    V --> DB
    RT -->|Push novos pedidos| K

    EF_Create -->|POST /v3/subscriptions D+14| Asaas
    EF_Create -->|Cria Tenant & Auth| DB
    A -->|Cancelar Assinatura| EF_Cancel
    EF_Cancel -->|DELETE /v3/subscriptions/:id| Asaas
    Asaas -->|POST Webhook Eventos| EF_Hook
    EF_Hook -->|Atualiza status & fatura| DB
```

---

## 4. Esquema de Banco de Dados (PostgreSQL DDL / Types)

```sql
-- Enum dos Status, Perfis e Faturamento
CREATE TYPE status_comanda AS ENUM ('DISPONIVEL', 'EM_USO', 'ENCERRADA');
CREATE TYPE status_pedido AS ENUM ('PENDENTE', 'EM_PREPARO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE role_usuario AS ENUM ('GESTOR', 'COZINHA', 'CAIXA');
CREATE TYPE status_assinatura_enum AS ENUM ('trialing', 'active', 'past_due', 'canceled');
CREATE TYPE status_fatura_enum AS ENUM ('PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE');

-- Tabela Restaurante (com campos de assinatura SaaS)
CREATE TABLE restaurantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    plano VARCHAR(50) DEFAULT 'starter',
    status_assinatura VARCHAR(30) DEFAULT 'trialing',
    limite_pedidos_mes INT DEFAULT 300,
    pedidos_consumidos_mes INT DEFAULT 0,
    data_inicio_ciclo TIMESTAMPTZ DEFAULT NOW(),
    data_fim_trial TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    asaas_customer_id VARCHAR(100),
    asaas_subscription_id VARCHAR(100),
    cartao_ultimos_digitos VARCHAR(4),
    cartao_bandeira VARCHAR(30),
    cpf_cnpj VARCHAR(20),
    endereco_completo JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Faturas
CREATE TABLE faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    asaas_payment_id VARCHAR(100) UNIQUE,
    valor NUMERIC(10,2) NOT NULL,
    forma_pagamento VARCHAR(50) DEFAULT 'CREDIT_CARD',
    status VARCHAR(30) NOT NULL,
    url_fatura TEXT,
    url_comprovante TEXT,
    data_vencimento DATE,
    data_pagamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela Usuários / Equipe do Restaurante
CREATE TABLE usuarios_restaurante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role role_usuario NOT NULL DEFAULT 'COZINHA',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Categorias
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela Produtos
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    imagem_url TEXT,
    disponivel BOOLEAN DEFAULT TRUE
);

-- Tabela Comandas
CREATE TABLE comandas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    status status_comanda DEFAULT 'DISPONIVEL',
    sessao_iniciada_em TIMESTAMP WITH TIME ZONE
);

-- Tabela Pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
    status status_pedido DEFAULT 'PENDENTE',
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Itens do Pedido
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL,
    observacao TEXT
);

-- Trigger para incrementar pedidos consumidos no mês
CREATE OR REPLACE FUNCTION incrementar_pedidos_restaurante()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE restaurantes
  SET pedidos_consumidos_mes = pedidos_consumidos_mes + 1
  WHERE id = NEW.restaurante_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_incrementa_pedido ON pedidos;
CREATE TRIGGER trigger_incrementa_pedido
AFTER INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION incrementar_pedidos_restaurante();
```

---

## 5. Próximos Passos no Ciclo BMad

1. **Criação das Histórias de Usuário (`bmad-create-epics-and-stories`)**: Gerar o Épico 7 (Assinaturas SaaS & Asaas) com histórias detalhadas.
2. **Sprint Planning (`bmad-sprint-planning`)**: Atualizar o `sprint-status.yaml`.
3. **Desenvolvimento Story a Story (`bmad-create-story` / `bmad-dev-story`)**: Implementar a Story 7.1.
