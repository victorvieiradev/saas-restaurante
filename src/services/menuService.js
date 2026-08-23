import { supabase } from '../lib/supabase.js'
import { isValidUUID } from '../utils/uuid.js'

// ----------------------------------------------------
// CATEGORIAS API
// ----------------------------------------------------

export async function fetchCategorias(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) return []

  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('ordem', { ascending: true })

    if (error) {
      console.warn('Erro ao buscar categorias no Supabase:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.warn('Erro em fetchCategorias:', err)
    return []
  }
}

export async function saveCategoria(categoria, restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    throw new Error('ID do restaurante é obrigatório.')
  }

  const payload = {
    restaurante_id: restauranteId,
    nome: categoria.nome?.trim(),
    ordem: Number(categoria.ordem) || 0,
    ativo: categoria.ativo !== undefined ? Boolean(categoria.ativo) : true
  }

  if (categoria?.id && !isValidUUID(categoria.id)) {
    throw new Error('ID de categoria inválido.')
  }

  const isEditing = Boolean(categoria.id && isValidUUID(categoria.id))

  try {
    let result
    if (isEditing) {
      result = await supabase
        .from('categorias')
        .update(payload)
        .eq('id', categoria.id)
        .eq('restaurante_id', restauranteId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('categorias')
        .insert(payload)
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return result.data
  } catch (err) {
    console.warn('Erro ao salvar categoria no Supabase:', err)
    throw err
  }
}

export async function toggleCategoriaStatus(id, ativo, restauranteId) {
  if (!id || !isValidUUID(id) || !restauranteId || !isValidUUID(restauranteId)) {
    return false
  }

  try {
    const { error } = await supabase
      .from('categorias')
      .update({ ativo })
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    if (error) {
      console.warn('Erro ao alterar status da categoria:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('Erro em toggleCategoriaStatus:', err)
    return false
  }
}

export async function deleteCategoria(id, restauranteId) {
  if (!id || !isValidUUID(id) || !restauranteId || !isValidUUID(restauranteId)) {
    return false
  }

  try {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    if (error) {
      console.warn('Erro ao excluir categoria no Supabase:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('Erro em deleteCategoria:', err)
    return false
  }
}

// ----------------------------------------------------
// PRODUTOS API
// ----------------------------------------------------

export async function fetchProdutos(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) return []

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categorias(nome)')
      .eq('restaurante_id', restauranteId)
      .order('nome', { ascending: true })

    if (error) {
      console.warn('Erro ao buscar produtos no Supabase:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.warn('Erro em fetchProdutos:', err)
    return []
  }
}

export async function saveProduto(produto, restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    throw new Error('ID do restaurante é obrigatório.')
  }

  const payload = {
    restaurante_id: restauranteId,
    categoria_id: isValidUUID(produto.categoria_id) ? produto.categoria_id : null,
    nome: produto.nome?.trim(),
    descricao: produto.descricao?.trim() || null,
    preco: parseFloat(produto.preco) || 0,
    imagem_url: produto.imagem_url?.trim() || null,
    disponivel: produto.disponivel !== undefined ? Boolean(produto.disponivel) : true
  }

  if (produto?.id && !isValidUUID(produto.id)) {
    throw new Error('ID de produto inválido.')
  }

  const isEditing = Boolean(produto.id && isValidUUID(produto.id))

  try {
    let result
    if (isEditing) {
      result = await supabase
        .from('produtos')
        .update(payload)
        .eq('id', produto.id)
        .eq('restaurante_id', restauranteId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('produtos')
        .insert(payload)
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return result.data
  } catch (err) {
    console.warn('Erro ao salvar produto no Supabase:', err)
    throw err
  }
}

export async function toggleProdutoDisponibilidade(id, disponivel, restauranteId) {
  if (!id || !isValidUUID(id) || !restauranteId || !isValidUUID(restauranteId)) {
    return false
  }

  try {
    const { error } = await supabase
      .from('produtos')
      .update({ disponivel })
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    if (error) {
      console.warn('Erro ao alterar disponibilidade do produto:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('Erro em toggleProdutoDisponibilidade:', err)
    return false
  }
}

export async function deleteProduto(id, restauranteId) {
  if (!id || !isValidUUID(id) || !restauranteId || !isValidUUID(restauranteId)) {
    return false
  }

  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    if (error) {
      console.warn('Erro ao excluir produto no Supabase:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('Erro em deleteProduto:', err)
    return false
  }
}

