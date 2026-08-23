-- ==============================================================================
-- Migration: 20260823000000_subscription_and_invoices_schema.sql
-- Modelagem de Assinaturas, Faturas Asaas & Trigger de Volume de Pedidos
-- ==============================================================================

-- 1. EXTENSÃO DA TABELA RESTAURANTES (CAMPOS DE ASSINATURA & TRIAL)
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS plano VARCHAR(50) DEFAULT 'starter';
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS status_assinatura VARCHAR(30) DEFAULT 'trialing';
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS limite_pedidos_mes INT DEFAULT 300;
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS pedidos_consumidos_mes INT DEFAULT 0;
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS data_inicio_ciclo TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS data_fim_trial TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100);
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(100);
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS cartao_ultimos_digitos VARCHAR(4);
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS cartao_bandeira VARCHAR(30);
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20);
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS endereco_completo JSONB;

-- 2. TABELA FATURAS (Histórico Financeiro e Cobranças Asaas)
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

-- 3. ÍNDICES DE DESEMPENHO EM FATURAS
CREATE INDEX IF NOT EXISTS idx_faturas_restaurante ON faturas(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_faturas_asaas_payment ON faturas(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);

-- 4. TRIGGER E FUNÇÃO DE INCREMENTO DE PEDIDOS ATÔMICO
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

-- 5. REALTIME EM FATURAS
ALTER TABLE faturas REPLICA IDENTITY FULL;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE faturas;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. ROW LEVEL SECURITY (RLS) EM FATURAS
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "faturas_public_read" ON faturas FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "faturas_all_manage" ON faturas FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
