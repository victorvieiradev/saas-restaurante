import { supabase } from '../lib/supabase'

const STORAGE_KEY_PREFIX = 'restaurante_usuarios_equipe_'

export const DEMO_USERS = [
  {
    id: 'usr-demo-admin-01',
    restaurante_id: 'res-demo-001',
    email: 'admin@restaurante.com',
    nome: 'Gestor Administrador',
    role: 'GESTOR',
    ativo: true,
    criado_em: '2026-08-01T10:00:00Z',
  },
  {
    id: 'usr-demo-cozinha-02',
    restaurante_id: 'res-demo-001',
    email: 'cozinha@restaurante.com',
    nome: 'Pedro Cozinheiro',
    role: 'COZINHA',
    ativo: true,
    criado_em: '2026-08-02T11:00:00Z',
  },
  {
    id: 'usr-demo-caixa-03',
    restaurante_id: 'res-demo-001',
    email: 'caixa@restaurante.com',
    nome: 'Maria Operadora de Caixa',
    role: 'CAIXA',
    ativo: true,
    criado_em: '2026-08-03T12:00:00Z',
  }
]

function getMockUsuarios(restauranteId = 'res-demo-001') {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${restauranteId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Erro ao ler mock de usuários:', e)
  }

  const initial = DEMO_USERS.map(u => ({ ...u, restaurante_id: restauranteId }))
  saveMockUsuarios(restauranteId, initial)
  return initial
}

function saveMockUsuarios(restauranteId, data) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${restauranteId}`, JSON.stringify(data))
  } catch (e) {
    console.warn('Erro ao persistir mock de usuários:', e)
  }
}

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
      query = query.eq('restaurante_id', restauranteId)
    }

    const { data, error } = await query.maybeSingle()

    if (data && !error) {
      return data
    }
  } catch (err) {
    console.warn('Fallback ativado na busca do perfil de usuário:', err)
  }

  // Fallback para mock local
  const currentRestId = restauranteId || 'res-demo-001'
  const mockList = getMockUsuarios(currentRestId)
  const found = mockList.find(u => u.email.toLowerCase() === normalizedEmail)

  if (found) {
    return found
  }

  // Se for o e-mail admin padrão e não estiver na lista mock
  if (normalizedEmail === 'admin@restaurante.com') {
    return DEMO_USERS[0]
  }

  return null
}

/**
 * Lista todos os membros da equipe de um restaurante
 */
export async function fetchUsuariosEquipe(restauranteId = 'res-demo-001') {
  try {
    const { data, error } = await supabase
      .from('usuarios_restaurante')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('criado_em', { ascending: false })

    if (data && !error && data.length > 0) {
      saveMockUsuarios(restauranteId, data)
      return { data, error: null }
    }
  } catch (err) {
    console.warn('Fallback ativado na listagem da equipe:', err)
  }

  const mockData = getMockUsuarios(restauranteId)
  return { data: mockData, error: null }
}

/**
 * Cadastra ou atualiza um usuário / membro da equipe
 */
export async function saveUsuarioEquipe(usuario, restauranteId = 'res-demo-001') {
  const isEditing = Boolean(usuario.id && !usuario.id.startsWith('temp-'))
  const id = isEditing ? usuario.id : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const payload = {
    id,
    restaurante_id: restauranteId,
    email: usuario.email.trim().toLowerCase(),
    nome: usuario.nome.trim(),
    role: usuario.role || 'COZINHA',
    ativo: usuario.ativo !== undefined ? Boolean(usuario.ativo) : true,
    criado_em: usuario.criado_em || new Date().toISOString(),
  }

  try {
    let result
    if (isEditing) {
      result = await supabase
        .from('usuarios_restaurante')
        .update(payload)
        .eq('id', id)
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
      const mockList = getMockUsuarios(restauranteId)
      const updatedMock = isEditing
        ? mockList.map(u => (u.id === id ? result.data : u))
        : [result.data, ...mockList]
      saveMockUsuarios(restauranteId, updatedMock)
      return { data: result.data, error: null }
    }
  } catch (err) {
    console.warn('Fallback ativado ao salvar usuário da equipe:', err)
  }

  // Fallback Local
  const mockList = getMockUsuarios(restauranteId)
  const existingIdx = mockList.findIndex(u => u.id === id || u.email === payload.email)
  let updatedMock = []

  if (existingIdx >= 0) {
    updatedMock = [...mockList]
    updatedMock[existingIdx] = { ...mockList[existingIdx], ...payload }
  } else {
    updatedMock = [payload, ...mockList]
  }

  saveMockUsuarios(restauranteId, updatedMock)
  return { data: payload, error: null }
}

/**
 * Alterna o status de ativo/inativo de um membro da equipe
 */
export async function toggleUsuarioStatus(id, ativo, restauranteId = 'res-demo-001') {
  try {
    const { data, error } = await supabase
      .from('usuarios_restaurante')
      .update({ ativo })
      .eq('id', id)
      .eq('restaurante_id', restauranteId)
      .select()
      .single()

    if (data && !error) {
      const mockList = getMockUsuarios(restauranteId)
      const updated = mockList.map(u => (u.id === id ? { ...u, ativo } : u))
      saveMockUsuarios(restauranteId, updated)
      return { data, error: null }
    }
  } catch (err) {
    console.warn('Fallback ativado ao alterar status do usuário:', err)
  }

  const mockList = getMockUsuarios(restauranteId)
  const updated = mockList.map(u => (u.id === id ? { ...u, ativo } : u))
  saveMockUsuarios(restauranteId, updated)
  return { data: { id, ativo }, error: null }
}

/**
 * Remove um membro da equipe
 */
export async function deleteUsuario(id, restauranteId = 'res-demo-001') {
  try {
    const { error } = await supabase
      .from('usuarios_restaurante')
      .delete()
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    if (!error) {
      const mockList = getMockUsuarios(restauranteId)
      const updated = mockList.filter(u => u.id !== id)
      saveMockUsuarios(restauranteId, updated)
      return { error: null }
    }
  } catch (err) {
    console.warn('Fallback ativado ao remover usuário:', err)
  }

  const mockList = getMockUsuarios(restauranteId)
  const updated = mockList.filter(u => u.id !== id)
  saveMockUsuarios(restauranteId, updated)
  return { error: null }
}
