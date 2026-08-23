import { supabase } from '../lib/supabase.js'
import { isValidUUID } from '../utils/uuid.js'

/**
 * Mock base para restaurante com controle de assinatura e limites de trial
 */
export function getMockRestaurantWithSubscription(restauranteId = 'a0000000-0000-0000-0000-000000000001') {
  const dataFimTrial = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  const dataInicioCiclo = new Date().toISOString()
  const isVictor = restauranteId === 'e1000000-0000-4000-8000-000000000001'

  return {
    id: restauranteId,
    nome: isVictor ? 'Bistrô & Grill do Victor' : 'Restaurante Sabor & Arte (Demo)',
    slug: isVictor ? 'bistro-do-victor' : 'sabor-arte',
    email: isVictor ? 'victor@victor.com' : 'admin@restaurante.com',
    plano: 'starter',
    status_assinatura: 'trialing',
    limite_pedidos_mes: 300,
    pedidos_consumidos_mes: isVictor ? 15 : 42,
    data_inicio_ciclo: dataInicioCiclo,
    data_fim_trial: dataFimTrial,
    asaas_customer_id: isVictor ? 'cus_mock_victor_001' : 'cus_mock_demo_001',
    asaas_subscription_id: isVictor ? 'sub_mock_victor_001' : 'sub_mock_demo_001',
    cartao_ultimos_digitos: isVictor ? '8888' : '4242',
    cartao_bandeira: isVictor ? 'MASTERCARD' : 'VISA',
    cpf_cnpj: '12.345.678/0001-90',
    endereco_completo: {
      logradouro: 'Av. Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01310-100'
    },
    criado_em: dataInicioCiclo
  }
}

/**
 * Busca os dados completos de um restaurante por ID (incluindo assinatura e limites)
 * @param {string} restauranteId - UUID do restaurante
 * @returns {Promise<Object|null>}
 */
export async function fetchRestauranteById(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('id', restauranteId)
      .maybeSingle()

    if (!error && data) {
      return {
        ...data,
        plano: data.plano || 'starter',
        status_assinatura: data.status_assinatura || 'trialing',
        limite_pedidos_mes: data.limite_pedidos_mes !== null && data.limite_pedidos_mes !== undefined ? Number(data.limite_pedidos_mes) : null,
        pedidos_consumidos_mes: Number(data.pedidos_consumidos_mes ?? 0)
      }
    }

    if (error) {
      console.warn('Erro ao buscar restaurante no Supabase:', error.message)
    }
  } catch (err) {
    console.warn('Exceção ao buscar restaurante:', err)
  }

  // Fallback mock para IDs conhecidos ou falhas de rede
  if (restauranteId === 'a0000000-0000-0000-0000-000000000001' || restauranteId === 'e1000000-0000-4000-8000-000000000001') {
    return getMockRestaurantWithSubscription(restauranteId)
  }

  return null
}

/**
 * Busca restaurante por slug amigável
 * @param {string} slug - Slug do restaurante
 * @returns {Promise<Object|null>}
 */
export async function fetchRestauranteBySlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('slug', slug.trim())
      .maybeSingle()

    if (!error && data) {
      return {
        ...data,
        plano: data.plano || 'starter',
        status_assinatura: data.status_assinatura || 'trialing',
        limite_pedidos_mes: data.limite_pedidos_mes !== null && data.limite_pedidos_mes !== undefined ? Number(data.limite_pedidos_mes) : null,
        pedidos_consumidos_mes: Number(data.pedidos_consumidos_mes ?? 0)
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar restaurante por slug:', err)
  }

  return null
}

/**
 * Atualiza campos de assinatura, plano ou dados cadastrais do restaurante
 * @param {string} restauranteId - UUID do restaurante
 * @param {Object} subscriptionData - Campos a serem atualizados
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateRestaurantSubscription(restauranteId, subscriptionData) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: null, error: new Error('ID do restaurante inválido ou não informado.') }
  }

  if (!subscriptionData || typeof subscriptionData !== 'object') {
    return { data: null, error: new Error('Dados de assinatura inválidos.') }
  }

  const allowedFields = [
    'plano',
    'status_assinatura',
    'limite_pedidos_mes',
    'pedidos_consumidos_mes',
    'data_inicio_ciclo',
    'data_fim_trial',
    'asaas_customer_id',
    'asaas_subscription_id',
    'cartao_ultimos_digitos',
    'cartao_bandeira',
    'cpf_cnpj',
    'endereco_completo'
  ]

  const payload = {}
  for (const field of allowedFields) {
    if (subscriptionData[field] !== undefined) {
      payload[field] = subscriptionData[field]
    }
  }

  if (Object.keys(payload).length === 0) {
    return { data: null, error: new Error('Nenhum campo de assinatura válido fornecido para atualização.') }
  }

  try {
    const { data, error } = await supabase
      .from('restaurantes')
      .update(payload)
      .eq('id', restauranteId)
      .select()
      .single()

    if (!error && data) {
      return { data, error: null }
    }

    return { data: null, error: error || new Error('Falha ao atualizar assinatura do restaurante.') }
  } catch (err) {
    console.warn('Exceção ao atualizar assinatura do restaurante:', err)
    return { data: null, error: err }
  }
}

/**
 * Cadastra um novo restaurante com período de trial de 14 dias
 * @param {Object} restauranteData - { nome, email, slug, cpf_cnpj, endereco_completo, plano, telefone }
 * @returns {Promise<{ data: Object|null, error: Error|null, isMock?: boolean }>}
 */
export async function createRestaurante(restauranteData) {
  if (!restauranteData || typeof restauranteData !== 'object') {
    return { data: null, error: new Error('Dados do restaurante inválidos.') }
  }

  const { nome, email, slug, cpf_cnpj, endereco_completo, plano = 'starter', telefone } = restauranteData

  if (!nome || !String(nome).trim()) {
    return { data: null, error: new Error('Nome do restaurante é obrigatório.') }
  }

  if (!email || !String(email).trim()) {
    return { data: null, error: new Error('E-mail de contato é obrigatório.') }
  }

  const cleanEmail = String(email).trim().toLowerCase()
  const cleanName = String(nome).trim()
  const cleanSlug = slug ? String(slug).trim().toLowerCase() : cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

  const dataFimTrial = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const dataInicioCiclo = new Date().toISOString()
  const planoKey = (plano || 'starter').toLowerCase()

  const defaultLimits = {
    starter: 300,
    pro: 1200,
    scale: 3500,
    enterprise: null
  }

  const payload = {
    nome: cleanName,
    slug: cleanSlug,
    email: cleanEmail,
    plano: planoKey,
    status_assinatura: 'trialing',
    limite_pedidos_mes: defaultLimits[planoKey] !== undefined ? defaultLimits[planoKey] : 300,
    pedidos_consumidos_mes: 0,
    data_inicio_ciclo: dataInicioCiclo,
    data_fim_trial: dataFimTrial,
    cpf_cnpj: cpf_cnpj || null,
    endereco_completo: endereco_completo || null
  }

  try {
    const { data, error } = await supabase
      .from('restaurantes')
      .insert(payload)
      .select()
      .single()

    if (!error && data) {
      return { data, error: null, isMock: false }
    }

    if (error) {
      console.warn('Aviso ao inserir restaurante no Supabase:', error.message)
    }
  } catch (err) {
    console.warn('Exceção ao criar restaurante no Supabase:', err)
  }

  // Fallback mock para desenvolvimento / offline
  const mockId = `r${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const mockCreated = {
    id: mockId,
    ...payload,
    telefone: telefone || null,
    criado_em: dataInicioCiclo
  }

  return { data: mockCreated, error: null, isMock: true }
}

