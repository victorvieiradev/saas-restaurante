import { supabase } from '../lib/supabase.js'
import { isValidUUID } from '../utils/uuid.js'
import { fetchRestauranteById, updateRestaurantSubscription } from './restaurantService.js'
import { detectCardBrand } from '../utils/validators.js'

/**
 * Tabela de Configuração e Limites dos Planos SaaS
 */
export const PLANS_CONFIG = {
  starter: {
    id: 'starter',
    nome: 'Starter',
    preco_mensal: 119.00,
    preco_anual: 95.00,
    preco: 119.00,
    limite_pedidos: 300,
    taxa_adicional: 0.20,
    descricao: 'Ideal para cafés, lanchonetes e pequenos bistrôs que querem começar.'
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    preco_mensal: 229.00,
    preco_anual: 183.00,
    preco: 229.00,
    limite_pedidos: 1200,
    taxa_adicional: 0.15,
    descricao: 'O mais completo para restaurantes, bares e hamburguerias em crescimento.'
  },
  scale: {
    id: 'scale',
    nome: 'Scale',
    preco_mensal: 399.00,
    preco_anual: 319.00,
    preco: 399.00,
    limite_pedidos: 3500,
    taxa_adicional: 0.10,
    descricao: 'Projetado para operações de alta escala, franquias e redes.'
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Enterprise',
    preco_mensal: null,
    preco_anual: null,
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

/**
 * Cria ou atualiza assinatura com período de trial de 14 dias (D+14)
 * Comunica com a Edge Function 'create-subscription' e provê fallback mock
 * @param {Object} payload - { cliente, cartao, endereco, plano, ciclo, restauranteId, restaurante }
 * @returns {Promise<{ data: Object|null, error: Error|null, isMock?: boolean }>}
 */
export async function createSubscription(payload) {
  if (!payload || typeof payload !== 'object') {
    return { data: null, error: new Error('Dados de assinatura inválidos.') }
  }

  const { cliente, cartao, plano = 'starter', ciclo = 'MONTHLY', restauranteId, restaurante } = payload
  const targetRestauranteId = restauranteId || restaurante?.id

  if (!cliente || !cliente.email) {
    return { data: null, error: new Error('E-mail do titular é obrigatório.') }
  }

  if (!cartao || (!cartao.number && !cartao.numero)) {
    return { data: null, error: new Error('Número do cartão de crédito é obrigatório.') }
  }

  // Tenta invocar a Edge Function no Supabase
  try {
    if (supabase && supabase.functions && typeof supabase.functions.invoke === 'function') {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: payload
      })

      if (!error && data && data.success) {
        return { data, error: null, isMock: false }
      }

      if (error) {
        console.warn('Aviso: Edge Function create-subscription indisponível ou retornou erro:', error.message)
      }
    }
  } catch (err) {
    console.warn('Exceção ao invocar Edge Function create-subscription:', err)
  }

  // Fallback Mock Local (simula criação e atualiza restaurante local/Supabase)
  const agora = Date.now()
  const dataFimTrial = new Date(agora + 14 * 24 * 60 * 60 * 1000).toISOString()
  const rawCardNumber = String(cartao.number || cartao.numero || '4242').replace(/\D/g, '')
  const ultimosDigitos = rawCardNumber.slice(-4) || '4242'
  const planoKey = (plano || 'starter').toLowerCase()
  const planoConfig = PLANS_CONFIG[planoKey] || PLANS_CONFIG.starter

  const mockResponse = {
    success: true,
    restauranteId: targetRestauranteId || null,
    status: 'trialing',
    plano: planoKey,
    dataFimTrial,
    asaasCustomerId: `cus_mock_${agora}`,
    asaasSubscriptionId: `sub_mock_${agora}`,
    cartao: {
      ultimosDigitos,
      bandeira: detectCardBrand(rawCardNumber) || (rawCardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD')
    },
    message: 'Assinatura criada com sucesso! Trial de 14 dias ativo com R$ 0,00 cobrado agora.'
  }

  if (targetRestauranteId && isValidUUID(targetRestauranteId)) {
    await updateRestaurantSubscription(targetRestauranteId, {
      plano: planoKey,
      status_assinatura: 'trialing',
      limite_pedidos_mes: planoConfig.limite_pedidos,
      pedidos_consumidos_mes: 0,
      data_inicio_ciclo: new Date().toISOString(),
      data_fim_trial: dataFimTrial,
      asaas_customer_id: mockResponse.asaasCustomerId,
      asaas_subscription_id: mockResponse.asaasSubscriptionId,
      cartao_ultimos_digitos: ultimosDigitos,
      cartao_bandeira: mockResponse.cartao.bandeira,
      cpf_cnpj: cliente.cpfCnpj || cliente.cpf_cnpj || null,
      endereco_completo: payload.endereco || null
    })
  }

  return { data: mockResponse, error: null, isMock: true }
}

/**
 * Cancela a assinatura ativa do restaurante
 * Comunica com a Edge Function 'cancel-subscription' e provê fallback mock
 * @param {string} restauranteId - UUID do restaurante
 * @param {string} [motivo] - Motivo opcional do cancelamento
 * @returns {Promise<{ data: Object|null, error: Error|null, isMock?: boolean }>}
 */
export async function cancelSubscription(restauranteId, motivo = '') {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: null, error: new Error('ID do restaurante inválido.') }
  }

  try {
    if (supabase && supabase.functions && typeof supabase.functions.invoke === 'function') {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { restauranteId, motivo }
      })

      if (!error && data && data.success) {
        return { data, error: null, isMock: false }
      }

      if (error) {
        console.warn('Aviso: Edge Function cancel-subscription indisponível:', error.message)
      }
    }
  } catch (err) {
    console.warn('Exceção ao invocar Edge Function cancel-subscription:', err)
  }

  // Fallback Mock Local
  const res = await updateRestaurantSubscription(restauranteId, {
    status_assinatura: 'canceled'
  })

  if (res.error) {
    return { data: null, error: res.error }
  }

  return {
    data: {
      success: true,
      restauranteId,
      status: 'canceled',
      message: 'Assinatura cancelada com sucesso. Nenhuma cobrança será realizada.'
    },
    error: null,
    isMock: true
  }
}

/**
 * Atualiza o cartão de crédito cadastrado na assinatura
 * @param {string} restauranteId - UUID do restaurante
 * @param {Object} cartaoData - { numero/number, nomeTitular, validade, cvv, cpfCnpj }
 * @returns {Promise<{ data: Object|null, error: Error|null, isMock?: boolean }>}
 */
export async function updateCreditCard(restauranteId, cartaoData) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: null, error: new Error('ID do restaurante inválido.') }
  }

  if (!cartaoData || typeof cartaoData !== 'object') {
    return { data: null, error: new Error('Dados do cartão de crédito incompletos ou inválidos.') }
  }

  const rawCardNumber = String(cartaoData.numero || cartaoData.number || '').replace(/\D/g, '')
  if (rawCardNumber.length < 13) {
    return { data: null, error: new Error('Número do cartão de crédito incompleto ou inválido.') }
  }

  const ultimosDigitos = rawCardNumber.slice(-4)
  const bandeira = detectCardBrand(rawCardNumber) || (rawCardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD')

  try {
    if (supabase && supabase.functions && typeof supabase.functions.invoke === 'function') {
      const { data, error } = await supabase.functions.invoke('update-card', {
        body: { restauranteId, cartao: cartaoData }
      })

      if (!error && data && data.success) {
        return { data, error: null, isMock: false }
      }
    }
  } catch (err) {
    console.warn('Exceção ao atualizar cartão via Edge Function:', err)
  }

  // Fallback Mock Local / Supabase Direct Update
  const updatePayload = {
    cartao_ultimos_digitos: ultimosDigitos,
    cartao_bandeira: bandeira
  }

  const res = await updateRestaurantSubscription(restauranteId, updatePayload)
  if (res.error) {
    return { data: null, error: res.error }
  }

  return {
    data: {
      success: true,
      restauranteId,
      cartao: {
        ultimosDigitos,
        bandeira
      },
      message: 'Cartão de crédito atualizado com sucesso.'
    },
    error: null,
    isMock: true
  }
}

/**
 * Reativa a assinatura de um restaurante cancelado
 * @param {string} restauranteId - UUID do restaurante
 * @param {Object} [options] - { plano, ciclo }
 * @returns {Promise<{ data: Object|null, error: Error|null, isMock?: boolean }>}
 */
export async function reactivateSubscription(restauranteId, options = {}) {
  if (!restauranteId || !isValidUUID(restauranteId)) {
    return { data: null, error: new Error('ID do restaurante inválido.') }
  }

  const planoKey = (options?.plano || 'pro').toLowerCase()
  const planoConfig = PLANS_CONFIG[planoKey] || PLANS_CONFIG.pro

  try {
    if (supabase && supabase.functions && typeof supabase.functions.invoke === 'function') {
      const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
        body: { restauranteId, plano: planoKey, ciclo: options?.ciclo || 'MONTHLY' }
      })

      if (!error && data && data.success) {
        return { data, error: null, isMock: false }
      }
    }
  } catch (err) {
    console.warn('Exceção ao invocar Edge Function reactivate-subscription:', err)
  }

  const payload = {
    status_assinatura: 'active',
    plano: planoKey,
    limite_pedidos_mes: planoConfig.limite_pedidos,
    data_inicio_ciclo: new Date().toISOString()
  }

  const res = await updateRestaurantSubscription(restauranteId, payload)
  if (res.error) {
    return { data: null, error: res.error }
  }

  return {
    data: {
      success: true,
      restauranteId,
      status: 'active',
      plano: planoKey,
      message: 'Assinatura reativada com sucesso!'
    },
    error: null,
    isMock: true
  }
}

