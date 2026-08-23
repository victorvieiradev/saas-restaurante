-- ==============================================================================
-- Migration: 20260822000000_seed_victor_restaurant.sql
-- Cadastro de Restaurante de Teste, Equipe, Categorias e Produtos Reais
-- ==============================================================================

-- 1. RESTAURANTE DE TESTE (Victor)
INSERT INTO restaurantes (id, nome, slug, email, criado_em)
VALUES (
    'e1000000-0000-4000-8000-000000000001',
    'Bistrô & Grill do Victor',
    'bistro-do-victor',
    'victor@victor.com',
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET nome = EXCLUDED.nome, slug = EXCLUDED.slug, email = EXCLUDED.email;

-- 2. USUÁRIOS DA EQUIPE
-- Gestor titular (victor@victor.com / 12345678) + Equipe de apoio
INSERT INTO usuarios_restaurante (id, restaurante_id, email, senha, nome, role, ativo, criado_em)
VALUES 
    (
        'e4000000-0000-4000-8000-000000000001',
        'e1000000-0000-4000-8000-000000000001',
        'victor@victor.com',
        '12345678',
        'Victor Vieira (Gestor)',
        'GESTOR',
        true,
        NOW()
    ),
    (
        'e4000000-0000-4000-8000-000000000002',
        'e1000000-0000-4000-8000-000000000001',
        'cozinha.victor@victor.com',
        '12345678',
        'Cozinha - Chef Victor',
        'COZINHA',
        true,
        NOW()
    ),
    (
        'e4000000-0000-4000-8000-000000000003',
        'e1000000-0000-4000-8000-000000000001',
        'caixa.victor@victor.com',
        '12345678',
        'Operador de Caixa - Victor',
        'CAIXA',
        true,
        NOW()
    )
ON CONFLICT (email) DO UPDATE 
SET senha = EXCLUDED.senha, nome = EXCLUDED.nome, role = EXCLUDED.role, ativo = EXCLUDED.ativo, restaurante_id = EXCLUDED.restaurante_id;

-- 3. CATEGORIAS DO CARDÁPIO
INSERT INTO categorias (id, restaurante_id, nome, ordem, ativo)
VALUES
    ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Burgers Artesanais', 1, true),
    ('e2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'Carnes & Pratos Principais', 2, true),
    ('e2000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000001', 'Entradas & Petiscos', 3, true),
    ('e2000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', 'Bebidas & Drinks', 4, true),
    ('e2000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000001', 'Sobremesas Artesanais', 5, true)
ON CONFLICT (id) DO UPDATE 
SET nome = EXCLUDED.nome, ordem = EXCLUDED.ordem, ativo = EXCLUDED.ativo;

-- 4. PRODUTOS DO CARDÁPIO (Com descrições e URLs de alta qualidade)
INSERT INTO produtos (id, restaurante_id, categoria_id, nome, descricao, preco, imagem_url, disponivel)
VALUES
    -- Burgers
    (
        'e3000000-0000-4000-8000-000000000001',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000001',
        'Smash Burger Duplo Bacon',
        'Dois blends bovinos de 100g prensados na chapa ultra quente, cheddar inglês derretido, fatias de bacon crocante, cebola caramelizada e maionese defumada no pão brioche selado na manteiga.',
        38.90,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000002',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000001',
        'Burger de Costela com Provolone',
        'Hambúrguer artesanal de costela bovina 200g, queijo provolone derretido, barbecue rústico de goiabada cascão e folhas de rúcula fresca no pão australiano.',
        46.50,
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000003',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000001',
        'Chicken Crispy Honey Mustard',
        'Sobrecoxa marinada em ervas com empanamento super crocante, coleslaw cremoso de repolho roxo, picles artesanal e molho honey mustard no pão brioche.',
        34.90,
        'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
        true
    ),

    -- Pratos Principais
    (
        'e3000000-0000-4000-8000-000000000004',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000002',
        'Picanha Nobre na Grelha (400g)',
        'Corte nobre de picanha grelhado na brasa ao ponto do cliente, acompanhado de arroz biro-biro, farofa crocante de bacon e vinagrete fresco da casa.',
        89.90,
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000005',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000002',
        'Filé Mignon à Parmegiana Especial',
        'Filé mignon empanado em farinha panko, coberto com queijo mussarela gratinado ao forno e molho de tomate rústico pomodoro. Acompanha arroz branco e batatas fritas.',
        68.00,
        'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000006',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000002',
        'Salmão Grelhado com Risoto de Limão Siciliano',
        'Posta nobre de salmão grelhada com azeite de ervas finas e crosta leve de gergelim, acompanhado de risoto cremoso de arroz arbóreo e raspas de limão siciliano.',
        76.50,
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
        true
    ),

    -- Entradas & Petiscos
    (
        'e3000000-0000-4000-8000-000000000007',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000003',
        'Batata Rústica Trufada com Parmesão',
        '450g de batatas rústicas douradas e macias por dentro, salpicadas com azeite trufado, queijo parmesão ralado na hora e ramos frescos de alecrim.',
        32.00,
        'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000008',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000003',
        'Dadinhos de Tapioca com Geléia de Pimenta',
        '12 unidades crocantes de dadinhos de tapioca com queijo coalho artesanal, servidos com deliciosa geléia de pimenta agridoce.',
        28.50,
        'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000009',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000003',
        'Iscas de Tilápia Crocantes com Molho Tártaro',
        'Iscas de filé de tilápia fresca empanadas em crosta crocante de panko. Acompanha fatias de limão e molho tártaro especial.',
        44.00,
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
        true
    ),

    -- Bebidas
    (
        'e3000000-0000-4000-8000-000000000010',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000004',
        'Suco Natural de Frutas Vermelhas (500ml)',
        'Blend refrescante de morango, amora e framboesa frescas batidas na hora sem adição de conservantes ou açúcares.',
        14.50,
        'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000011',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000004',
        'Soda Italiana de Maracujá & Tangerina',
        'Bebida gaseificada com xarope natural de maracujá e tangerina, muito gelo e folhas frescas de hortelã.',
        16.00,
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000012',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000004',
        'Chopp Artesanal IPA (500ml)',
        'Chopp artesanal estilo India Pale Ale, aromático com notas de lúpulo cítrico e amargor marcante servido em caneca congelada.',
        18.00,
        'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=80',
        true
    ),

    -- Sobremesas
    (
        'e3000000-0000-4000-8000-000000000013',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000005',
        'Petit Gâteau com Sorvete de Baunilha',
        'Bolo quente de chocolate nobre com centro líquido cremoso, acompanhado de sorvete artesanal de baunilha e calda de morango.',
        24.90,
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
        true
    ),
    (
        'e3000000-0000-4000-8000-000000000014',
        'e1000000-0000-4000-8000-000000000001',
        'e2000000-0000-4000-8000-000000000005',
        'Cheesecake Clássico New York com Frutas Vermelhas',
        'Base crocante amanteigada de biscoito, recheio cremoso e suave de cream cheese com farta cobertura de geléia caseira de frutas vermelhas.',
        22.50,
        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
        true
    )
ON CONFLICT (id) DO UPDATE 
SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, preco = EXCLUDED.preco, imagem_url = EXCLUDED.imagem_url, disponivel = EXCLUDED.disponivel, categoria_id = EXCLUDED.categoria_id;
