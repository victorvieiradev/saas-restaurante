import { supabase } from '../lib/supabase.js'
import { isValidUUID, generateUUID } from '../utils/uuid.js'

// Hash generator de caracteres únicos para o qr_code_token
export function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'cmd_'
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(bytes[i] % chars.length)
    }
  } else {
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  return token
}

/**
 * Busca todas as comandas cadastradas para o restaurante
 */
export async function fetchComandas(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) return []

  try {
    const { data, error } = await supabase
      .from('comandas')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('numero', { ascending: true })

    if (error) {
      console.warn('Erro ao buscar comandas no Supabase:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.warn('Erro em fetchComandas:', err)
    return []
  }
}

/**
 * Busca uma comanda pelo seu qr_code_token ou número
 * @param {string} token - O token único da comanda ou número
 * @param {string} [restauranteId] - ID opcional do restaurante para desambiguação
 * @returns {Promise<{comanda: Object, restaurante: Object}|null>}
 */
export async function fetchComandaByToken(token, restauranteId = null) {
  if (!token) return null

  try {
    const safeToken = String(token).trim().replace(/[(),."'\s]/g, '')
    if (!safeToken) return null

    let query = supabase
      .from('comandas')
      .select('*, restaurantes(*)')

    if (restauranteId && isValidUUID(restauranteId)) {
      query = query.eq('restaurante_id', restauranteId)
      query = query.or(`qr_code_token.eq.${safeToken},numero.eq.${safeToken}`)
    } else {
      query = query.or(`qr_code_token.eq.${safeToken},numero.eq.${safeToken}`)
    }

    const { data: comanda, error } = await query.maybeSingle()

    if (!error && comanda) {
      const restauranteObj = Array.isArray(comanda.restaurantes) ? comanda.restaurantes[0] : comanda.restaurantes
      const restaurante = restauranteObj || {
        id: comanda.restaurante_id,
        nome: 'Restaurante',
        slug: 'restaurante'
      }
      return { comanda, restaurante }
    }
  } catch (err) {
    console.warn('Exceção ao buscar comanda no Supabase:', err)
  }

  return null
}

/**
 * Gera um lote de comandas sequenciais
 * @param {string} restauranteId
 * @param {number} numeroInicial
 * @param {number} quantidade
 * @param {number} paddingZero
 */
export async function gerarLoteComandas(restauranteId, numeroInicial, quantidade, paddingZero = 3) {
  const numIni = parseInt(numeroInicial, 10)
  const qty = parseInt(quantidade, 10)
  if (!restauranteId || !isValidUUID(restauranteId) || isNaN(numIni) || numIni < 0 || isNaN(qty) || qty <= 0) {
    throw new Error('Parâmetros inválidos para geração de comandas.')
  }

  const comandasExistentes = await fetchComandas(restauranteId)
  const numerosExistentes = new Set(comandasExistentes.map(c => String(c.numero).padStart(paddingZero, '0')))

  const novasComandas = []
  let countCreated = 0
  let currentNum = parseInt(numeroInicial, 10)

  while (countCreated < quantidade) {
    const numeroFormatado = String(currentNum).padStart(paddingZero, '0')

    if (!numerosExistentes.has(numeroFormatado)) {
      novasComandas.push({
        restaurante_id: restauranteId,
        numero: numeroFormatado,
        qr_code_token: generateToken(),
        status: 'DISPONIVEL',
        sessao_iniciada_em: null
      })
      countCreated++
    }
    currentNum++
  }

  try {
    const { data, error } = await supabase
      .from('comandas')
      .insert(novasComandas)
      .select()

    if (error) {
      console.warn('Erro ao salvar lote no Supabase:', error.message)
      throw error
    }

    return data || novasComandas
  } catch (err) {
    console.warn('Exceção ao inserir lote de comandas:', err)
    throw err
  }
}

/**
 * Altera o status de uma comanda
 */
export async function updateComandaStatus(id, restauranteId, newStatus) {
  if (!id || !restauranteId || !isValidUUID(restauranteId) || !isValidUUID(id)) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('comandas')
      .update({
        status: newStatus,
        sessao_iniciada_em: newStatus === 'EM_USO' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .eq('restaurante_id', restauranteId)
      .select()

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('restaurante_comanda_status_changed', {
        detail: { comandaId: id, restauranteId, newStatus }
      }))
    }

    if (error) {
      console.warn('Erro no Supabase updateComandaStatus:', error.message)
      return false
    }

    return data
  } catch (err) {
    console.warn('Exceção em updateComandaStatus:', err)
    return false
  }
}

/**
 * Exclui uma comanda
 */
export async function deleteComanda(id, restauranteId) {
  if (!id || !restauranteId || !isValidUUID(restauranteId) || !isValidUUID(id)) {
    return false
  }

  try {
    const { error } = await supabase
      .from('comandas')
      .delete()
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    if (error) {
      console.warn('Erro ao excluir no Supabase:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('Exceção em deleteComanda:', err)
    return false
  }
}

/**
 * Busca comanda por número digitado ou token no Caixa POS
 * @param {string} termoBusca
 * @param {string} restauranteId
 * @returns {Promise<{comanda: Object, restaurante: Object}|null>}
 */
export async function buscarComandaPorNumero(termoBusca, restauranteId) {
  if (!termoBusca || !termoBusca.trim() || !restauranteId || !isValidUUID(restauranteId)) return null

  const rawClean = termoBusca.trim().replace(/^#/, '')
  const safeTermo = rawClean.replace(/[(),."'\s]/g, '')
  if (!safeTermo) return null

  const cleanDigits = safeTermo.replace(/\D/g, '')
  const intVal = cleanDigits ? parseInt(cleanDigits, 10) : null
  const standardPad = intVal !== null ? String(intVal).padStart(3, '0') : null
  const unpadded = intVal !== null ? String(intVal) : null

  try {
    const filters = new Set()
    filters.add(`qr_code_token.eq.${safeTermo}`)
    filters.add(`numero.eq.${safeTermo}`)
    if (standardPad) filters.add(`numero.eq.${standardPad}`)
    if (unpadded) filters.add(`numero.eq.${unpadded}`)

    const queryFilterStr = Array.from(filters).join(',')

    const { data: comanda, error } = await supabase
      .from('comandas')
      .select('*, restaurantes(*)')
      .eq('restaurante_id', restauranteId)
      .or(queryFilterStr)
      .maybeSingle()

    if (!error && comanda) {
      const restauranteObj = Array.isArray(comanda.restaurantes) ? comanda.restaurantes[0] : comanda.restaurantes
      const restaurante = restauranteObj || {
        id: comanda.restaurante_id,
        nome: 'Restaurante',
        slug: 'restaurante'
      }
      return { comanda, restaurante }
    }
  } catch (err) {
    console.warn('Exceção ao buscar comanda no Supabase para o Caixa:', err)
  }

  return null
}

/**
 * Busca todas as comandas com status 'EM_USO' com contagem de pedidos para o Caixa POS
 * @param {string} restauranteId
 * @returns {Promise<Array>}
 */
export async function fetchComandasAtivas(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) return []

  try {
    const { data, error } = await supabase
      .from('comandas')
      .select('*, pedidos(id, status)')
      .eq('restaurante_id', restauranteId)
      .eq('status', 'EM_USO')
      .order('numero', { ascending: true })

    if (!error && data) {
      return data.map(cmd => {
        const activePedidos = (cmd.pedidos || []).filter(p => String(p.status || '').toUpperCase() !== 'CANCELADO')
        return {
          ...cmd,
          pedidos_count: activePedidos.length
        }
      })
    }
  } catch (err) {
    console.warn('Exceção ao buscar comandas ativas no Supabase:', err)
  }

  return []
}

/**
 * Realiza o fechamento de conta, registro do pagamento e liberação da comanda
 */
export async function fecharComandaPagamento({
  restauranteId,
  comandaId,
  comandaNumero,
  pedidos = [],
  formaPagamento = 'PIX',
  valorTotal = 0,
  subtotal = 0,
  valorRecebido = 0,
  troco = 0,
  taxaServico = 0,
  desconto = 0
}) {
  if (!comandaId || !restauranteId || !isValidUUID(restauranteId) || !isValidUUID(comandaId)) {
    throw new Error('ID da comanda e restaurante são obrigatórios para fechamento.')
  }

  const timestamp = new Date().toISOString()
  const validPedidos = pedidos.filter(p => String(p.status || '').toUpperCase() !== 'CANCELADO')
  const validPedidosIds = validPedidos.map(p => p.id).filter(id => isValidUUID(id))

  const rawNum = String(comandaNumero || '').replace(/^#/, '').trim()
  const numFormatado = rawNum ? rawNum.padStart(3, '0') : '001'
  const roundVal = (v) => Math.round((Number(v) || 0) * 100) / 100

  const transacao = {
    id: `pag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    restaurante_id: restauranteId,
    comanda_id: comandaId,
    comanda_numero: numFormatado,
    forma_pagamento: formaPagamento,
    subtotal: roundVal(subtotal || valorTotal),
    taxa_servico: roundVal(taxaServico),
    desconto: roundVal(desconto),
    valor_total: roundVal(valorTotal),
    valor_recebido: roundVal(valorRecebido || valorTotal),
    troco: roundVal(troco),
    pedidos_ids: validPedidosIds,
    fechado_em: timestamp,
    status: 'PAGO'
  }

  // 1. Atualizar comanda no Supabase para DISPONIVEL e sessao_iniciada_em: null
  const { error: cmdError } = await supabase
    .from('comandas')
    .update({
      status: 'DISPONIVEL',
      sessao_iniciada_em: null
    })
    .eq('id', comandaId)
    .eq('restaurante_id', restauranteId)

  if (cmdError) {
    throw cmdError
  }

  // 2. Marcar pedidos válidos como concluidos e encerrados
  if (validPedidosIds.length > 0) {
    await supabase
      .from('pedidos')
      .update({
        sessao_fechada_em: timestamp,
        status: 'CONCLUIDO'
      })
      .in('id', validPedidosIds)
      .eq('restaurante_id', restauranteId)
  }

  // Marcar sessao_fechada_em também nos cancelados
  const canceladosIds = pedidos
    .filter(p => String(p.status || '').toUpperCase() === 'CANCELADO')
    .map(p => p.id)
    .filter(id => isValidUUID(id))

  if (canceladosIds.length > 0) {
    await supabase
      .from('pedidos')
      .update({
        sessao_fechada_em: timestamp
      })
      .in('id', canceladosIds)
      .eq('restaurante_id', restauranteId)
  }

  // 3. Gravar transação de pagamento no Supabase
  const { error: pagError } = await supabase
    .from('pagamentos')
    .insert({
      restaurante_id: transacao.restaurante_id,
      comanda_id: transacao.comanda_id,
      forma_pagamento: transacao.forma_pagamento,
      valor_total: transacao.valor_total,
      taxa_servico: transacao.taxa_servico,
      desconto: transacao.desconto,
      valor_recebido: transacao.valor_recebido,
      troco: transacao.troco,
      criado_em: timestamp
    })

  if (pagError) {
    console.warn('Erro ao registrar pagamento no Supabase:', pagError.message)
    throw pagError || new Error('Falha ao registrar pagamento no banco.')
  }

  // Limpar carrinho da comanda caso exista no browser
  try {
    localStorage.removeItem(`cardapio_carrinho_${comandaId}`)
  } catch (e) {}

  // Disparar eventos para avisar telas abertas
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('restaurante_comanda_fechada', {
      detail: { restauranteId, comandaId, comandaNumero: numFormatado, transacao }
    }))
    window.dispatchEvent(new CustomEvent('restaurante_pedido_sync', {
      detail: { restauranteId }
    }))
  }

  return {
    success: true,
    transacao,
    isMock: false
  }
}

/**
 * Consulta histórico de transações de fechamento de comandas
 * @param {string} restauranteId
 * @returns {Promise<Array>}
 */
export async function fetchHistoricoFechamentos(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) return []

  try {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('criado_em', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch (e) {
    console.warn('Exceção ao buscar pagamentos no Supabase:', e)
  }

  return []
}


