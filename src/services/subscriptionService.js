import { supabase } from '../lib/supabase.js'
import { isValidUUID } from '../utils/uuid.js'
import { fetchRestauranteById } from './restaurantService.js'

/**
 * Tabela de Configuração e Limites dos Planos SaaS
 */
export const PLANS_CONFIG = {
  starter: {
    id: 'starter',
    nome: 'Starter',
    preco: 97.00,
    limite_pedidos: 300,
    taxa_adicional: 0.20,
    descricao: 'Ideal para cafeterias, lanchonetes e pequenos restaurantes em início de operação.'
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    preco: 197.00,
    limite_pedidos: 1000,
    taxa_adicional: 0.15,
    descricao: 'Perfeito para restaurantes e bares com fluxo constante e equipe distribuída.'
  },
  scale: {
    id: 'scale',
    nome: 'Scale',
    preco: 397.00,
    limite_pedidos: 3000,
    taxa_adicional: 0.10,
    descricao: 'Projetado para operações de alta performance e casas de grande porte.'
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: null,
    limite_pedidos: null,
    taxa_adicional: null,
    descricao: 'Volume ilimitado com suporte dedicado e SLA garantido sob consulta.'
  }
}

/**
 * Faturas de demonstração para fallback e testes locais
 */
export const MOCK_FATURAS = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    restaurante_id: 'a0000000-0000-0000-0000-000000000001',
    asaas_payment_id: 'pay_mock_asaas_001',
    valor: 97.00,
    forma_pagamento: 'CREDIT_CARD',
    status: 'CONFIRMED',
    url_fatura: 'https://asaas.com/i/mock001',
    url_comprovante: 'https://asaas.com/c/mock001',
    data_vencimento: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    data_pagamento: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    restaurante_id: 'a0000000-0000-0000-0000-000000000001',
    asaas_payment_id: 'pay_mock_asaas_002',
    valor: 97.00,
    forma_pagamento: 'CREDIT_CARD',
    status: 'RECEIVED',
    url_fatura: 'https://asaas.com/i/mock002',
    url_comprovante: 'https://asaas.com/c/mock002',
    data_vencimento: new Date().toISOString().split('T')[0],
    data_pagamento: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
]

/**
 * Retorna faturas mock formatadas para um restaurante
 */
export function getMockFaturas(restauranteId) {
  return MOCK_FATURAS.map(fat => ({
    ...fat,
    restaurante_id: restauranteId || fat.restaurante_id
  }))
}

/**
 * Busca histórico de faturas do restaurante
 * @param {string} restauranteId - UUID do restaurante
 * @returns {Promise<{ data: Array, error: Error|null, isMock?: boolean }>}
 */
export async function fetchFaturas(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: [], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('faturas')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      return { data, error: null, isMock: false }
    }

    if (error) {
      console.warn('Erro ao consultar faturas no Supabase:', error.message)
    }
  } catch (err) {
    console.warn('Exceção ao buscar faturas:', err)
  }

  // Fallback mock para desenvolvimento / demonstração
  return {
    data: getMockFaturas(restauranteId),
    error: null,
    isMock: true
  }
}

/**
 * Calcula e consolida os indicadores de assinatura e consumo de um restaurante
 * @param {string} restauranteId - UUID do restaurante
 * @returns {Promise<Object|null>}
 */
export async function fetchSubscriptionStatus(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return null
  }

  const restaurante = await fetchRestauranteById(restauranteId)
  if (!restaurante) return null

  const planoKey = (restaurante.plano || 'starter').toLowerCase()
  const planoInfo = PLANS_CONFIG[planoKey] || PLANS_CONFIG.starter
  const limitePedidos = restaurante.limite_pedidos_mes !== undefined && restaurante.limite_pedidos_mes !== null
    ? Number(restaurante.limite_pedidos_mes)
    : (planoInfo.limite_pedidos ?? null)
  const pedidosConsumidos = Number(restaurante.pedidos_consumidos_mes || 0)

  const percentualConsumido = limitePedidos !== null && limitePedidos > 0
    ? Math.min(100, Math.round((pedidosConsumidos / limitePedidos) * 100))
    : 0

  const limiteExcedido = limitePedidos !== null && limitePedidos > 0 && pedidosConsumidos >= limitePedidos
  const pedidosRestantes = limitePedidos !== null ? Math.max(0, limitePedidos - pedidosConsumidos) : null

  // Cálculo de dias restantes de trial
  let diasRestantesTrial = 0
  let isTrial = (restaurante.status_assinatura || '').toLowerCase() === 'trialing'

  if (restaurante.data_fim_trial) {
    const fimTrial = new Date(restaurante.data_fim_trial).getTime()
    if (!Number.isNaN(fimTrial)) {
      const agora = Date.now()
      const diffMs = fimTrial - agora
      diasRestantesTrial = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      if (diffMs <= 0 && isTrial) {
        isTrial = false
      }
    }
  }

  const statusNormalizado = (restaurante.status_assinatura || 'trialing').toLowerCase()
  const isBloqueado = statusNormalizado === 'canceled' || statusNormalizado === 'past_due' || (statusNormalizado === 'trialing' && diasRestantesTrial <= 0 && !restaurante.cartao_ultimos_digitos)

  return {
    restaurante_id: restaurante.id,
    plano: planoKey,
    plano_info: planoInfo,
    status_assinatura: statusNormalizado,
    limite_pedidos_mes: limitePedidos,
    pedidos_consumidos_mes: pedidosConsumidos,
    pedidos_restantes: pedidosRestantes,
    percentual_consumido: percentualConsumido,
    limite_excedido: limiteExcedido,
    is_trial: isTrial,
    dias_restantes_trial: diasRestantesTrial,
    data_inicio_ciclo: restaurante.data_inicio_ciclo,
    data_fim_trial: restaurante.data_fim_trial,
    cartao_ultimos_digitos: restaurante.cartao_ultimos_digitos,
    cartao_bandeira: restaurante.cartao_bandeira,
    is_bloqueado: isBloqueado
  }
}

/**
 * Salva ou atualiza uma fatura no banco de dados (upsert via asaas_payment_id)
 * @param {Object} faturaData
 * @param {string} restauranteId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function saveFatura(faturaData, restauranteId) {
  if (!faturaData || typeof faturaData !== 'object' || faturaData.valor === undefined || faturaData.valor === null || isNaN(Number(faturaData.valor))) {
    return { data: null, error: new Error('Dados da fatura incompletos ou valor inválido.') }
  }

  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: null, error: new Error('ID do restaurante inválido ou não informado.') }
  }

  const payload = {
    restaurante_id: restauranteId,
    asaas_payment_id: faturaData.asaas_payment_id || `pay_local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    valor: Number(faturaData.valor),
    forma_pagamento: faturaData.forma_pagamento || 'CREDIT_CARD',
    status: faturaData.status || 'PENDING',
    url_fatura: faturaData.url_fatura || null,
    url_comprovante: faturaData.url_comprovante || null,
    data_vencimento: faturaData.data_vencimento || new Date().toISOString().split('T')[0],
    data_pagamento: faturaData.data_pagamento || null
  }

  try {
    const { data, error } = await supabase
      .from('faturas')
      .upsert(payload, { onConflict: 'asaas_payment_id' })
      .select()
      .single()

    if (!error && data) {
      return { data, error: null }
    }

    return { data: null, error: error || new Error('Falha ao salvar fatura.') }
  } catch (err) {
    console.warn('Exceção ao salvar fatura no Supabase:', err)
    return { data: null, error: err }
  }
}
