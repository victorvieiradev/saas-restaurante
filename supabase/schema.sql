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
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Habilitar RLS (Row Level Security) inicial
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
