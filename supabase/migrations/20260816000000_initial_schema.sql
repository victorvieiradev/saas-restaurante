-- ==============================================================================
-- Migration: 20260816000000_initial_schema.sql
-- Sistema de Cardápio Digital & Comandas QR Code
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE status_comanda AS ENUM ('DISPONIVEL', 'EM_USO', 'ENCERRADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_pedido AS ENUM ('PENDENTE', 'EM_PREPARO', 'CONCLUIDO', 'CANCELADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role_usuario AS ENUM ('GESTOR', 'COZINHA', 'CAIXA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA RESTAURANTES (Multi-tenant master)
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE
);

-- 4. TABELA PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    imagem_url TEXT,
    disponivel BOOLEAN DEFAULT TRUE
);

-- 5. TABELA COMANDAS
CREATE TABLE IF NOT EXISTS comandas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    status status_comanda DEFAULT 'DISPONIVEL',
    sessao_iniciada_em TIMESTAMP WITH TIME ZONE
);

-- 6. TABELA PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
    status status_pedido DEFAULT 'PENDENTE',
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sessao_fechada_em TIMESTAMP WITH TIME ZONE
);

-- 7. TABELA ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL,
    observacao TEXT
);

-- 8. TABELA PAGAMENTOS & FECHAMENTO DE COMANDA
CREATE TABLE IF NOT EXISTS pagamentos (
    id VARCHAR(100) PRIMARY KEY DEFAULT ('pag_' || replace(gen_random_uuid()::text, '-', '')),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    comanda_id UUID REFERENCES comandas(id) ON DELETE SET NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    taxa_servico DECIMAL(10, 2) DEFAULT 0.00,
    desconto DECIMAL(10, 2) DEFAULT 0.00,
    valor_recebido DECIMAL(10, 2) NOT NULL,
    troco DECIMAL(10, 2) DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA USUÁRIOS DO RESTAURANTE & RBAC
CREATE TABLE IF NOT EXISTS usuarios_restaurante (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) DEFAULT '123456',
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('GESTOR', 'COZINHA', 'CAIXA')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES DE DESEMPENHO
CREATE INDEX IF NOT EXISTS idx_usuarios_restaurante_email ON usuarios_restaurante(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_restaurante_restaurante ON usuarios_restaurante(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante ON pedidos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_comanda ON pedidos(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comandas_token ON comandas(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_comandas_restaurante ON comandas(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_produtos_restaurante ON produtos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias(restaurante_id);

-- 10. CONFIGURAÇÃO SUPABASE REALTIME (KDS & Caixa POS)
ALTER TABLE pedidos REPLICA IDENTITY FULL;
ALTER TABLE comandas REPLICA IDENTITY FULL;
ALTER TABLE pagamentos REPLICA IDENTITY FULL;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comandas;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pagamentos;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_restaurante ENABLE ROW LEVEL SECURITY;

-- 12. POLÍTICAS DE ACESSO (RLS Policies)

-- Restaurantes
DO $$ BEGIN
    CREATE POLICY "restaurantes_public_read" ON restaurantes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "restaurantes_auth_manage" ON restaurantes FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Categorias
DO $$ BEGIN
    CREATE POLICY "categorias_public_read" ON categorias FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "categorias_all_manage" ON categorias FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Produtos
DO $$ BEGIN
    CREATE POLICY "produtos_public_read" ON produtos FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "produtos_all_manage" ON produtos FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Comandas
DO $$ BEGIN
    CREATE POLICY "comandas_public_read" ON comandas FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "comandas_all_manage" ON comandas FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Pedidos & Itens
DO $$ BEGIN
    CREATE POLICY "pedidos_public_insert" ON pedidos FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "pedidos_public_read" ON pedidos FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "pedidos_all_update" ON pedidos FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "itens_pedido_public_insert" ON itens_pedido FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "itens_pedido_public_read" ON itens_pedido FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "itens_pedido_all_update" ON itens_pedido FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Pagamentos
DO $$ BEGIN
    CREATE POLICY "pagamentos_all_manage" ON pagamentos FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Usuários do Restaurante & Equipe
DO $$ BEGIN
    CREATE POLICY "usuarios_restaurante_all_manage" ON usuarios_restaurante FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
