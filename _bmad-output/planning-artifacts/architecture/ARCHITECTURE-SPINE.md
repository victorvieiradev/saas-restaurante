---
title: "ARCHITECTURE-SPINE.md - Arquitetura Técnica & Invariantes"
status: "draft"
created: "2026-08-03"
updated: "2026-08-03"
---

# ARCHITECTURE-SPINE: Sistema de Cardápio Digital & Comandas QR Code

## 1. Paradigma Arquitetural & Stack Escolhida

**Paradigma:** Monolito Modular Orientado a Eventos em Tempo Real (*Modular Monolith with Realtime Event Streams*).

- **Front-end App:** React (Vite) + Tailwind CSS + Lucide Icons. Single Page Application PWA com roteamento dinâmico.
- **Back-end & BaaS:** Supabase (PostgreSQL 15, Supabase Auth para Admin, Supabase Realtime via WebSockets e Storage de Mídia para fotos de pratos).
- **Gerador de QR Code:** Biblioteca `qrcode` (frontend ou função no servidor).

---

## 2. Decisões Arquiteturais Invariantes (Architectural Decisions - ADs)

### AD-1 [ADOPTED]: Multi-Tenant com Isolamento por Row Level Security (RLS)
- **Binds:** Todas as tabelas do banco de dados (`categorias`, `produtos`, `comandas`, `pedidos`, `itens_pedido`) possuem obrigatoriamente a coluna `restaurante_id (uuid)`.
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

---

## 3. Diagrama da Arquitetura do Sistema

```mermaid
graph TB
    subgraph Client Layer
        C[📱 Celular Cliente Web/PWA]
        K[👨‍🍳 Monitor Cozinha KDS]
        X[💰 Terminal Caixa POS]
        A[⚙️ Painel Admin Gestor]
    end

    subgraph Application & Gateway Layer
        V[⚡ React + Vite SPA]
        R[🔀 Router /comanda, /cozinha, /caixa, /admin]
    end

    subgraph BaaS Services (Supabase)
        Auth[🔐 Supabase Auth - Gestor]
        DB[(🗄️ PostgreSQL Database)]
        RT[⚡ Realtime Engine - WebSockets]
        Storage[🖼️ Storage - Fotos dos Pratos]
    end

    C -->|GET /comanda/:token| R
    K -->|Subscreve Canal Realtime| RT
    X -->|Busca por Comanda| DB
    A -->|Auth & CRUD Menu| Auth
    A -->|Upload Imagens| Storage

    V --> DB
    RT -->|Push novos pedidos| K
```

---

## 4. Esquema de Banco de Dados (PostgreSQL DDL / Types)

```sql
-- Enum dos Status
CREATE TYPE status_comanda AS ENUM ('DISPONIVEL', 'EM_USO', 'ENCERRADA');
CREATE TYPE status_pedido AS ENUM ('PENDENTE', 'EM_PREPARO', 'CONCLUIDO', 'CANCELADO');

-- Tabela Restaurante
CREATE TABLE restaurantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
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
```

---

## 5. Próximos Passos no Ciclo BMad

1. **Criação das Histórias de Usuário (`bmad-create-epics-and-stories`)**: Fragmentar as tarefas em Épicos e Histórias prontas para codificação.
2. **Desenvolvimento Rápido / Aplicação Web (`bmad-quick-dev`)**: Implementar a aplicação React com banco local/mock ou Supabase real e apresentar o sistema funcionando na tela!
