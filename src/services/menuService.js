import { supabase } from '../lib/supabase.js'

const INITIAL_CATEGORIES = [
  { id: 'cat-1', restaurante_id: 'rest-123-demo', nome: 'Pratos Principais', ordem: 1, ativo: true },
  { id: 'cat-2', restaurante_id: 'rest-123-demo', nome: 'Bebidas', ordem: 2, ativo: true },
  { id: 'cat-3', restaurante_id: 'rest-123-demo', nome: 'Entradas & Porções', ordem: 3, ativo: true },
  { id: 'cat-4', restaurante_id: 'rest-123-demo', nome: 'Sobremesas', ordem: 4, ativo: true },
]

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    restaurante_id: 'rest-123-demo',
    categoria_id: 'cat-1',
    nome: 'Hambúrguer Artesanal Gourmet',
    descricao: 'Pão brioche, 180g de blend bovino, queijo cheddar fatiado, bacon crocante e maionese da casa.',
    preco: 38.90,
    imagem_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    disponivel: true
  },
  {
    id: 'prod-2',
    restaurante_id: 'rest-123-demo',
    categoria_id: 'cat-1',
    nome: 'Filé Mignon ao Molho Madeirense',
    descricao: 'Acompanha arroz biro-biro e batatas rústicas com alecrim.',
    preco: 64.50,
    imagem_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    disponivel: true
  },
  {
    id: 'prod-3',
    restaurante_id: 'rest-123-demo',
    categoria_id: 'cat-2',
    nome: 'Suco Natural de Laranja (500ml)',
    descricao: 'Laranjas frescas espremidas na hora sem adição de água ou açúcar.',
    preco: 12.00,
    imagem_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    disponivel: true
  },
  {
    id: 'prod-4',
    restaurante_id: 'rest-123-demo',
    categoria_id: 'cat-2',
    nome: 'Refrigerante Lata 350ml',
    descricao: 'Coca-Cola, Guaraná Antarctica ou Sprite bem gelados.',
    preco: 7.50,
    imagem_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    disponivel: true
  },
  {
    id: 'prod-5',
    restaurante_id: 'rest-123-demo',
    categoria_id: 'cat-3',
    nome: 'Batata Rústica com Cheddar & Bacon',
    descricao: 'Porção de 400g de batatas selecionadas com páprica doce e ervas.',
    preco: 29.90,
    imagem_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
    disponivel: true
  },
  {
    id: 'prod-6',
    restaurante_id: 'rest-123-demo',
    categoria_id: 'cat-4',
    nome: 'Pudim de Leite Condensado Caseiro',
    descricao: 'Receita tradicional com calda de caramelo dourado sem furinhos.',
    preco: 14.90,
    imagem_url: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80',
    disponivel: false
  }
]

// Fallback LocalStorage Keys
const STORAGE_CAT_KEY = 'bmad_restaurante_categorias'
const STORAGE_PROD_KEY = 'bmad_restaurante_produtos'

function getLocalCategories(restauranteId) {
  const saved = localStorage.getItem(STORAGE_CAT_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return parsed.filter(c => c.restaurante_id === restauranteId || !c.restaurante_id || restauranteId === 'demo-restaurante-id' || restauranteId === 'rest-123-demo')
    } catch (e) {
      console.warn('Erro ao ler categorias do localStorage:', e)
    }
  }
  localStorage.setItem(STORAGE_CAT_KEY, JSON.stringify(INITIAL_CATEGORIES))
  return INITIAL_CATEGORIES
}

function saveLocalCategories(categories) {
  localStorage.setItem(STORAGE_CAT_KEY, JSON.stringify(categories))
}

function getLocalProducts(restauranteId) {
  const saved = localStorage.getItem(STORAGE_PROD_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return parsed.filter(p => p.restaurante_id === restauranteId || !p.restaurante_id || restauranteId === 'demo-restaurante-id' || restauranteId === 'rest-123-demo')
    } catch (e) {
      console.warn('Erro ao ler produtos do localStorage:', e)
    }
  }
  localStorage.setItem(STORAGE_PROD_KEY, JSON.stringify(INITIAL_PRODUCTS))
  return INITIAL_PRODUCTS
}

function saveLocalProducts(products) {
  localStorage.setItem(STORAGE_PROD_KEY, JSON.stringify(products))
}

// ----------------------------------------------------
// CATEGORIAS API
// ----------------------------------------------------

export async function fetchCategorias(restauranteId) {
  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .order('ordem', { ascending: true })

      if (!error && data) return data
    }
  } catch (err) {
    console.info('Usando dados locais para categorias (Supabase offline/mock):', err)
  }

  return getLocalCategories(restauranteId).sort((a, b) => a.ordem - b.ordem)
}

export async function saveCategoria(categoria, restauranteId) {
  const payload = {
    ...categoria,
    restaurante_id: restauranteId,
    ordem: Number(categoria.ordem) || 0
  }

  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      if (categoria.id) {
        const { data, error } = await supabase
          .from('categorias')
          .update(payload)
          .eq('id', categoria.id)
          .eq('restaurante_id', restauranteId)
          .select()
          .single()

        if (!error && data) return data
      } else {
        const { data, error } = await supabase
          .from('categorias')
          .insert(payload)
          .select()
          .single()

        if (!error && data) return data
      }
    }
  } catch (err) {
    console.info('Salvar categoria offline/mock:', err)
  }

  // Fallback LocalStorage
  const list = getLocalCategories(restauranteId)
  let updatedList = []
  if (categoria.id) {
    updatedList = list.map(c => c.id === categoria.id ? { ...c, ...payload } : c)
  } else {
    const newCat = { ...payload, id: `cat-${Date.now()}` }
    updatedList = [...list, newCat]
  }
  saveLocalCategories(updatedList)
  return payload
}

export async function toggleCategoriaStatus(id, ativo, restauranteId) {
  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const { error } = await supabase
        .from('categorias')
        .update({ ativo })
        .eq('id', id)
        .eq('restaurante_id', restauranteId)

      if (!error) return true
    }
  } catch (err) {
    console.info('Toggle categoria offline:', err)
  }

  const list = getLocalCategories(restauranteId)
  const updated = list.map(c => c.id === id ? { ...c, ativo } : c)
  saveLocalCategories(updated)
  return true
}

export async function deleteCategoria(id, restauranteId) {
  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .eq('restaurante_id', restauranteId)

      if (!error) return true
    }
  } catch (err) {
    console.info('Delete categoria offline:', err)
  }

  const list = getLocalCategories(restauranteId)
  const updated = list.filter(c => c.id !== id)
  saveLocalCategories(updated)
  return true
}

// ----------------------------------------------------
// PRODUTOS API
// ----------------------------------------------------

export async function fetchProdutos(restauranteId) {
  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(nome)')
        .eq('restaurante_id', restauranteId)
        .order('nome', { ascending: true })

      if (!error && data) return data
    }
  } catch (err) {
    console.info('Usando dados locais para produtos (Supabase offline/mock):', err)
  }

  return getLocalProducts(restauranteId)
}

export async function saveProduto(produto, restauranteId) {
  const payload = {
    ...produto,
    restaurante_id: restauranteId,
    preco: parseFloat(produto.preco) || 0
  }

  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      if (produto.id) {
        const { data, error } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', produto.id)
          .eq('restaurante_id', restauranteId)
          .select()
          .single()

        if (!error && data) return data
      } else {
        const { data, error } = await supabase
          .from('produtos')
          .insert(payload)
          .select()
          .single()

        if (!error && data) return data
      }
    }
  } catch (err) {
    console.info('Salvar produto offline/mock:', err)
  }

  // Fallback LocalStorage
  const list = getLocalProducts(restauranteId)
  let updatedList = []
  if (produto.id) {
    updatedList = list.map(p => p.id === produto.id ? { ...p, ...payload } : p)
  } else {
    const newProd = { ...payload, id: `prod-${Date.now()}` }
    updatedList = [...list, newProd]
  }
  saveLocalProducts(updatedList)
  return payload
}

export async function toggleProdutoDisponibilidade(id, disponivel, restauranteId) {
  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const { error } = await supabase
        .from('produtos')
        .update({ disponivel })
        .eq('id', id)
        .eq('restaurante_id', restauranteId)

      if (!error) return true
    }
  } catch (err) {
    console.info('Toggle disponibilidade produto offline:', err)
  }

  const list = getLocalProducts(restauranteId)
  const updated = list.map(p => p.id === id ? { ...p, disponivel } : p)
  saveLocalProducts(updated)
  return true
}

export async function deleteProduto(id, restauranteId) {
  try {
    if (supabase && import.meta?.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)
        .eq('restaurante_id', restauranteId)

      if (!error) return true
    }
  } catch (err) {
    console.info('Delete produto offline:', err)
  }

  const list = getLocalProducts(restauranteId)
  const updated = list.filter(p => p.id !== id)
  saveLocalProducts(updated)
  return true
}
