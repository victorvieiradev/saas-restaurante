-- ==============================================================================
-- Schema DDL Completo para o Sistema de Cardápio Digital & Comandas QR Code
-- Compatível com Supabase PostgreSQL, Realtime Push (KDS/Caixa) e RLS Multi-Tenant
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
    plano VARCHAR(50) DEFAULT 'starter',
    status_assinatura VARCHAR(30) DEFAULT 'trialing',
    limite_pedidos_mes INT DEFAULT 300,
    pedidos_consumidos_mes INT DEFAULT 0,
    data_inicio_ciclo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fim_trial TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    asaas_customer_id VARCHAR(100),
    asaas_subscription_id VARCHAR(100),
    cartao_ultimos_digitos VARCHAR(4),
    cartao_bandeira VARCHAR(30),
    cpf_cnpj VARCHAR(20),
    endereco_completo JSONB,
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

-- 10. TABELA FATURAS (Histórico de Faturamento / SaaS)
CREATE TABLE IF NOT EXISTS faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    asaas_payment_id VARCHAR(100) UNIQUE,
    valor NUMERIC(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50) DEFAULT 'CREDIT_CARD',
    status VARCHAR(30) NOT NULL,
    url_fatura TEXT,
    url_comprovante TEXT,
    data_vencimento DATE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_faturas_restaurante ON faturas(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_faturas_asaas_payment ON faturas(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);

-- 11. FUNÇÃO E TRIGGER DE CONTAGEM DE PEDIDOS
CREATE OR REPLACE FUNCTION incrementar_pedidos_restaurante()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.restaurante_id IS NOT NULL THEN
        UPDATE restaurantes
        SET pedidos_consumidos_mes = COALESCE(pedidos_consumidos_mes, 0) + 1
        WHERE id = NEW.restaurante_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_incrementa_pedido ON pedidos;
CREATE TRIGGER trigger_incrementa_pedido
AFTER INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION incrementar_pedidos_restaurante();

-- 12. CONFIGURAÇÃO SUPABASE REALTIME (KDS, Caixa POS & Faturas)
-- Habilita o envio de alterações de banco em tempo real via WebSockets
ALTER TABLE pedidos REPLICA IDENTITY FULL;
ALTER TABLE comandas REPLICA IDENTITY FULL;
ALTER TABLE pagamentos REPLICA IDENTITY FULL;
ALTER TABLE faturas REPLICA IDENTITY FULL;

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

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE faturas;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 13. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;

-- 14. POLÍTICAS DE ACESSO (RLS Policies)

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

-- Faturas (SaaS Invoices)
DO $$ BEGIN
    CREATE POLICY "faturas_public_read" ON faturas FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "faturas_all_manage" ON faturas FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

