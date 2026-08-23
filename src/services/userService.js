import { supabase } from '../lib/supabase.js'
import { isValidUUID } from '../utils/uuid.js'

/**
 * Busca o perfil detalhado do usuário por e-mail e/ou ID do restaurante
 */
export async function fetchUserProfile(email, restauranteId = null) {
  if (!email) return null

  const normalizedEmail = email.trim().toLowerCase()

  try {
    let query = supabase
      .from('usuarios_restaurante')
      .select('*')
      .ilike('email', normalizedEmail)

    if (restauranteId) {
      if (!isValidUUID(restauranteId)) return null
      query = query.eq('restaurante_id', restauranteId)
    }

    const { data, error } = await query.maybeSingle()

    if (data && !error) {
      return data
    }
  } catch (err) {
    console.warn('Erro ao buscar perfil de usuário no Supabase:', err)
  }

  return null
}

/**
 * Lista todos os membros da equipe de um restaurante
 */
export async function fetchUsuariosEquipe(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: [], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('usuarios_restaurante')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('criado_em', { ascending: false })

    if (error) {
      console.warn('Erro ao listar equipe no Supabase:', error.message)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.warn('Exceção ao listar equipe:', err)
    return { data: [], error: err }
  }
}

/**
 * Cadastra ou atualiza um usuário / membro da equipe
 */
export async function saveUsuarioEquipe(usuario, restauranteId) {
  if (!usuario || typeof usuario !== 'object' || !usuario.email) {
    return { data: null, error: new Error('Dados do usuário inválidos.') }
  }

  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: null, error: new Error('ID de restaurante inválido ou não informado.') }
  }

  if (usuario.id && !isValidUUID(usuario.id)) {
    return { data: null, error: new Error('ID do usuário inválido.') }
  }

  const isEditing = Boolean(usuario.id)

  const payload = {
    restaurante_id: restauranteId,
    email: usuario.email.trim().toLowerCase(),
    senha: usuario.senha?.trim() || '123456',
    nome: usuario.nome?.trim() || 'Usuário',
    role: usuario.role || 'COZINHA',
    ativo: usuario.ativo !== undefined ? Boolean(usuario.ativo) : true,
  }

  if (isEditing) {
    payload.id = usuario.id
  }

  try {
    let result
    if (isEditing) {
      result = await supabase
        .from('usuarios_restaurante')
        .update(payload)
        .eq('id', usuario.id)
        .eq('restaurante_id', restauranteId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('usuarios_restaurante')
        .insert([payload])
        .select()
        .single()
    }

    if (result.data && !result.error) {
      return { data: result.data, error: null }
    }

    return { data: null, error: result.error }
  } catch (err) {
    console.warn('Erro ao salvar usuário da equipe no Supabase:', err)
    return { data: null, error: err }
  }
}

/**
 * Alterna o status de ativo/inativo de um membro da equipe
 */
export async function toggleUsuarioStatus(id, ativo, restauranteId) {
  if (!id || !isValidUUID(id) || !restauranteId || !isValidUUID(restauranteId)) {
    return { data: null, error: new Error('Parâmetros inválidos.') }
  }

  try {
    const { data, error } = await supabase
      .from('usuarios_restaurante')
      .update({ ativo })
      .eq('id', id)
      .eq('restaurante_id', restauranteId)
      .select()
      .single()

    if (data && !error) {
      return { data, error: null }
    }
    return { data: null, error }
  } catch (err) {
    console.warn('Erro ao alterar status do usuário no Supabase:', err)
    return { data: null, error: err }
  }
}

/**
 * Remove um membro da equipe
 */
export async function deleteUsuario(id, restauranteId) {
  if (!id || !isValidUUID(id) || !restauranteId || !isValidUUID(restauranteId)) {
    return { error: new Error('Parâmetros inválidos.') }
  }

  try {
    const { error } = await supabase
      .from('usuarios_restaurante')
      .delete()
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    return { error: error || null }
  } catch (err) {
    console.warn('Erro ao remover usuário no Supabase:', err)
    return { error: err }
  }
}

