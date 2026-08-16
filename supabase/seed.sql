-- ==============================================================================
-- Supabase Seed Data (Dados Iniciais de Teste e Demonstração)
-- Executado automaticamente pelo Supabase CLI ou manualmente via SQL Editor
-- ==============================================================================

-- 1. RESTAURANTE DEMO
INSERT INTO restaurantes (id, nome, slug, email)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Restaurante Sabor & Arte', 'sabor-arte', 'admin@restaurante.com')
ON CONFLICT (id) DO NOTHING;

-- 2. USUÁRIOS DA EQUIPE (Admin Gestor, Cozinha KDS, Caixa POS)
INSERT INTO usuarios_restaurante (id, restaurante_id, email, senha, nome, role, ativo)
VALUES 
    ('usr-demo-admin-01', 'a0000000-0000-0000-0000-000000000001', 'admin@restaurante.com', '123456', 'Gestor Administrador', 'GESTOR', true),
    ('usr-demo-cozinha-02', 'a0000000-0000-0000-0000-000000000001', 'cozinha@restaurante.com', '123456', 'Pedro Cozinheiro', 'COZINHA', true),
    ('usr-demo-caixa-03', 'a0000000-0000-0000-0000-000000000001', 'caixa@restaurante.com', '123456', 'Maria Operadora de Caixa', 'CAIXA', true)
ON CONFLICT (email) DO UPDATE 
SET nome = EXCLUDED.nome, role = EXCLUDED.role, ativo = EXCLUDED.ativo;

-- 3. CATEGORIAS INICIAIS
INSERT INTO categorias (id, restaurante_id, nome, ordem, ativo)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Pratos Principais', 1, true),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Bebidas', 2, true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Entradas & Porções', 3, true),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sobremesas', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 4. PRODUTOS INICIAIS DO CARDÁPIO
INSERT INTO produtos (id, restaurante_id, categoria_id, nome, descricao, preco, imagem_url, disponivel)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Hambúrguer Artesanal Gourmet', 'Pão brioche, 180g de blend bovino, queijo cheddar fatiado, bacon crocante e maionese da casa.', 38.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', true),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Filé Mignon ao Molho Madeirense', 'Acompanha arroz biro-biro e batatas rústicas com alecrim.', 64.50, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80', true),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Suco Natural de Laranja (500ml)', 'Laranjas frescas espremidas na hora sem adição de água ou açúcar.', 12.00, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80', true),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Refrigerante Lata 350ml', 'Coca-Cola, Guaraná Antarctica ou Sprite bem gelados.', 7.50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80', true),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Batata Rústica com Cheddar & Bacon', 'Porção de 400g de batatas selecionadas com páprica doce e ervas.', 29.90, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80', true),
    ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Pudim de Leite Condensado Caseiro', 'Receita tradicional com calda de caramelo dourado sem furinhos.', 14.90, 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80', true)
ON CONFLICT (id) DO NOTHING;

-- 5. LOTE DE COMANDAS INICIAIS (001 a 015)
INSERT INTO comandas (id, restaurante_id, numero, qr_code_token, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '001', 'cmd_a1b2c3d4e5f6', 'DISPONIVEL'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '002', 'cmd_b2c3d4e5f6a1', 'DISPONIVEL'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '003', 'cmd_c3d4e5f6a1b2', 'DISPONIVEL'),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '004', 'cmd_d4e5f6a1b2c3', 'DISPONIVEL'),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '005', 'cmd_e5f6a1b2c3d4', 'DISPONIVEL'),
    ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '008', 'demo-token-008', 'DISPONIVEL'),
    ('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', '015', 'demo-token-015', 'DISPONIVEL')
ON CONFLICT (qr_code_token) DO NOTHING;
