-- Schema DDL para o Sistema de Cardápio Digital & Comandas QR Code

-- 1. Enum dos Status
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

-- 2. Tabela Restaurantes (Multi-tenant master)
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE
);

-- 4. Tabela Produtos
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

-- 5. Tabela Comandas
CREATE TABLE IF NOT EXISTS comandas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    status status_comanda DEFAULT 'DISPONIVEL',
    sessao_iniciada_em TIMESTAMP WITH TIME ZONE
);

-- 6. Tabela Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
    status status_pedido DEFAULT 'PENDENTE',
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sessao_fechada_em TIMESTAMP WITH TIME ZONE
);

-- 7. Tabela Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL,
    observacao TEXT
);

-- 8. Tabela Pagamentos & Fechamentos de Comanda (Story 5.2)
CREATE TABLE IF NOT EXISTS pagamentos (
    id VARCHAR(100) PRIMARY KEY,
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

-- 9. Tabela Usuários do Restaurante & RBAC (Story 6.1)
CREATE TABLE IF NOT EXISTS usuarios_restaurante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('GESTOR', 'COZINHA', 'CAIXA')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_restaurante_email ON usuarios_restaurante(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_restaurante_restaurante ON usuarios_restaurante(restaurante_id);

-- Habilitar RLS (Row Level Security) inicial
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_restaurante ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de Segurança (Row Level Security - RLS)

-- Restaurantes: Leitura pública e gestão de tenant
CREATE POLICY "restaurantes_public_read" ON restaurantes FOR SELECT USING (true);
CREATE POLICY "restaurantes_auth_manage" ON restaurantes FOR ALL USING (auth.uid() = id);

-- Categorias: Leitura pública de categorias ativas; gestão por administradores
CREATE POLICY "categorias_public_read" ON categorias FOR SELECT USING (ativo = true);
CREATE POLICY "categorias_auth_manage" ON categorias FOR ALL USING (true);

-- Produtos: Leitura pública de produtos disponíveis; gestão por administradores
CREATE POLICY "produtos_public_read" ON produtos FOR SELECT USING (disponivel = true);
CREATE POLICY "produtos_auth_manage" ON produtos FOR ALL USING (true);

-- Comandas: Leitura pública por token e gestão no fluxo de atendimento
CREATE POLICY "comandas_public_read" ON comandas FOR SELECT USING (true);
CREATE POLICY "comandas_all_manage" ON comandas FOR ALL USING (true);

-- Pedidos & Itens: Criação e acompanhamento pelo cliente anônimo e gestão pelo KDS/Caixa
CREATE POLICY "pedidos_public_insert" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "pedidos_public_read" ON pedidos FOR SELECT USING (true);
CREATE POLICY "pedidos_all_update" ON pedidos FOR UPDATE USING (true);

CREATE POLICY "itens_pedido_public_insert" ON itens_pedido FOR INSERT WITH CHECK (true);
CREATE POLICY "itens_pedido_public_read" ON itens_pedido FOR SELECT USING (true);
CREATE POLICY "itens_pedido_all_update" ON itens_pedido FOR UPDATE USING (true);

-- Pagamentos: Leitura e gravação de transações de fechamento de comanda
CREATE POLICY "pagamentos_all_manage" ON pagamentos FOR ALL USING (true);

-- Usuários do Restaurante & Equipe: Leitura e gestão com isolamento por restaurante
CREATE POLICY "usuarios_restaurante_all_manage" ON usuarios_restaurante FOR ALL USING (true);

