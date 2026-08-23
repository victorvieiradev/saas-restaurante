import { supabase } from '../lib/supabase.js'
import { updateComandaStatus } from './comandaService.js'
import { isValidUUID } from '../utils/uuid.js'

/**
 * Cria um novo pedido no sistema
 * @param {Object} params
 * @param {string} params.restauranteId
 * @param {string} params.comandaId
 * @param {string} [params.comandaNumero]
 * @param {Array} params.cartItems
 * @param {number} params.valorTotal
 * @param {string} [params.observacaoGeral]
 * @returns {Promise<{ success: boolean, pedido: Object, items: Array }>}
 */
export async function criarPedido({ restauranteId, comandaId, comandaNumero, cartItems, valorTotal, observacaoGeral }) {
  if (!restauranteId || !isValidUUID(restauranteId) || !comandaId || !isValidUUID(comandaId) || !cartItems || cartItems.length === 0) {
    throw new Error('Dados incompletos ou identificadores inválidos para criação do pedido.')
  }

  const timestamp = new Date().toISOString()
  
  let numComanda = comandaNumero
  if (!numComanda) numComanda = '001'
  const comandaNumeroFormatado = String(numComanda).padStart(3, '0')

  try {
    // 1. Inserir Pedido no Supabase
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        restaurante_id: restauranteId,
        comanda_id: comandaId,
        status: 'PENDENTE',
        valor_total: valorTotal,
        criado_em: timestamp
      })
      .select()
      .single()

    if (pedidoError || !pedidoData) {
      console.warn('Erro ao criar pedido no Supabase:', pedidoError?.message)
      throw pedidoError || new Error('Falha ao criar pedido no banco.')
    }

    // 2. Inserir itens do pedido no Supabase
    const payloadItens = cartItems.map(item => {
      const prodId = item.produto_id || item.id
      return {
        pedido_id: pedidoData.id,
        produto_id: isValidUUID(prodId) ? prodId : null,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        observacao: item.observacao ? (observacaoGeral ? `${item.observacao} | Geral: ${observacaoGeral}` : item.observacao) : (observacaoGeral || null)
      }
    })

    const { data: itensData, error: itensError } = await supabase
      .from('itens_pedido')
      .insert(payloadItens)
      .select()

    if (itensError) {
      console.warn('Erro ao inserir itens no Supabase:', itensError.message)
      throw itensError || new Error('Falha ao inserir itens do pedido no banco.')
    }

    // 3. Atualizar status da comanda para EM_USO
    await updateComandaStatus(comandaId, restauranteId, 'EM_USO')

    // 4. Disparar evento local
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('restaurante_pedido_sync', {
        detail: { restauranteId, pedido: pedidoData }
      }))
    }

    return {
      success: true,
      pedido: {
        ...pedidoData,
        comandaNumero: comandaNumeroFormatado,
        numeroDisplay: `#${comandaNumeroFormatado}`,
        observacaoGeral: observacaoGeral || null
      },
      items: itensData || payloadItens,
      isMock: false
    }
  } catch (err) {
    console.warn('Exceção ao criar pedido no Supabase:', err)
    throw err
  }
}

/**
 * Busca todos os pedidos atrelados a uma comanda específica formatados com itens para o Caixa POS
 * @param {string} comandaId - ID da comanda
 * @param {string} restauranteId - ID do restaurante
 * @param {string} [comandaNumero]
 * @param {Object} [options]
 * @param {boolean} [options.apenasAbertos=true]
 * @returns {Promise<Array>}
 */
export async function fetchPedidosComanda(comandaId, restauranteId, comandaNumero = null, { apenasAbertos = true } = {}) {
  if (!comandaId || !isValidUUID(comandaId)) return []

  try {
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        itens_pedido (
          id,
          quantidade,
          preco_unitario,
          observacao,
          produtos (
            id,
            nome,
            imagem_url,
            preco
          )
        )
      `)
      .order('criado_em', { ascending: true })

    if (restauranteId && isValidUUID(restauranteId)) {
      query = query.eq('restaurante_id', restauranteId)
    }

    query = query.eq('comanda_id', comandaId)

    const { data, error } = await query

    if (!error && Array.isArray(data)) {
      const filteredSupabase = apenasAbertos
        ? data.filter(p => !p.sessao_fechada_em)
        : data

      return filteredSupabase.map(pedido => {
        const itensFormatados = (pedido.itens_pedido || []).map(item => {
          const qty = Number(item.quantidade) > 0 ? Number(item.quantidade) : 1
          const unitPrice = item.preco_unitario != null ? Number(item.preco_unitario) : (Number(item.produtos?.preco) || 0)
          const sub = qty * unitPrice

          return {
            id: item.id,
            produto_id: item.produtos?.id || item.produto_id,
            nome: item.produtos?.nome || item.nome || 'Item do Cardápio',
            quantidade: qty,
            preco_unitario: unitPrice,
            subtotal: sub,
            observacao: item.observacao || null
          }
        })

        const totalCalculado = itensFormatados.reduce((acc, it) => acc + it.subtotal, 0)

        return {
          id: pedido.id,
          restaurante_id: pedido.restaurante_id,
          comanda_id: pedido.comanda_id,
          status: String(pedido.status || 'PENDENTE').toUpperCase(),
          valor_total: pedido.valor_total != null ? Number(pedido.valor_total) : totalCalculado,
          observacaoGeral: pedido.observacaoGeral || null,
          criado_em: pedido.criado_em,
          itens: itensFormatados
        }
      })
    }
  } catch (e) {
    console.warn('Exceção ao buscar pedidos da comanda no Supabase:', e)
  }

  return []
}

/**
 * Busca todos os pedidos ativos do restaurante para exibição no KDS da cozinha
 * @param {string} restauranteId
 * @returns {Promise<Array>}
 */
export async function fetchPedidosKDS(restauranteId) {
  if (!restauranteId || !isValidUUID(restauranteId)) return []

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        comandas:comanda_id (numero, qr_code_token),
        itens_pedido (
          id,
          quantidade,
          preco_unitario,
          observacao,
          produtos:produto_id (nome, imagem_url)
        )
      `)
      .eq('restaurante_id', restauranteId)
      .order('criado_em', { ascending: true })

    if (!error && data) {
      return data.map(pedido => ({
        ...pedido,
        comandaNumero: pedido.comandas?.numero || '001',
        numeroDisplay: pedido.numeroDisplay || `#${pedido.comandas?.numero || '001'}`,
        itens: (pedido.itens_pedido || []).map(item => ({
          id: item.id,
          nome: item.produtos?.nome || 'Item do Cardápio',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          observacao: item.observacao
        }))
      }))
    }
  } catch (e) {
    console.warn('Exceção ao consultar KDS no Supabase:', e)
  }

  return []
}

/**
 * Subscreve às mudanças em tempo real da tabela de pedidos no Supabase para a cozinha (KDS)
 * @param {string} restauranteId 
 * @param {Object} callbacks
 * @returns {Function} Função para cancelar a inscrição
 */
export function subscribeToPedidosKDS(restauranteId, { onNewPedido, onUpdatePedido, onStatusChange } = {}) {
  if (!restauranteId || !isValidUUID(restauranteId)) return () => {}

  try {
    const channelName = `kds-pedidos-${restauranteId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: `restaurante_id=eq.${restauranteId}`
        },
        async (payload) => {
          if (!payload.new) return
          const rawPedido = payload.new

          try {
            const { data } = await supabase
              .from('pedidos')
              .select(`
                *,
                comandas:comanda_id (numero, qr_code_token),
                itens_pedido (
                  id,
                  quantidade,
                  preco_unitario,
                  observacao,
                  produtos:produto_id (nome, imagem_url)
                )
              `)
              .eq('id', rawPedido.id)
              .single()

            if (data) {
              const pedidoFormatado = {
                ...data,
                comandaNumero: data.comandas?.numero || '001',
                numeroDisplay: data.numeroDisplay || `#${data.comandas?.numero || '001'}`,
                itens: (data.itens_pedido || []).map(item => ({
                  id: item.id,
                  nome: item.produtos?.nome || 'Item do Cardápio',
                  quantidade: item.quantidade,
                  preco_unitario: item.preco_unitario,
                  observacao: item.observacao
                }))
              }
              if (onNewPedido) onNewPedido(pedidoFormatado)
            } else {
              if (onNewPedido) onNewPedido(rawPedido)
            }
          } catch (err) {
            console.warn('Erro ao carregar detalhes do novo pedido Realtime:', err)
            if (onNewPedido) onNewPedido(rawPedido)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `restaurante_id=eq.${restauranteId}`
        },
        async (payload) => {
          if (!onUpdatePedido || !payload.new) return
          try {
            const { data } = await supabase
              .from('pedidos')
              .select(`
                *,
                comandas:comanda_id (numero),
                itens_pedido (
                  id,
                  quantidade,
                  preco_unitario,
                  observacao,
                  produtos:produto_id (nome, imagem_url)
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (data) {
              const pedidoFormatado = {
                ...data,
                comandaNumero: data.comandas?.numero || '001',
                numeroDisplay: data.numeroDisplay || `#${data.comandas?.numero || '001'}`,
                itens: (data.itens_pedido || []).map(item => ({
                  id: item.id,
                  nome: item.produtos?.nome || 'Item do Cardápio',
                  quantidade: item.quantidade,
                  preco_unitario: item.preco_unitario,
                  observacao: item.observacao
                }))
              }
              onUpdatePedido(pedidoFormatado)
            } else {
              onUpdatePedido(payload.new)
            }
          } catch (err) {
            console.warn('Erro ao carregar detalhes da atualização do pedido Realtime:', err)
            onUpdatePedido(payload.new)
          }
        }
      )
      .subscribe((status) => {
        if (onStatusChange) {
          onStatusChange(status)
        }
      })

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        console.warn('Erro ao remover canal Supabase Realtime:', e)
      }
    }
  } catch (e) {
    console.warn('Falha ao conectar Supabase Realtime:', e)
    if (onStatusChange) onStatusChange('FALLBACK')
    return () => {}
  }
}

/**
 * Atualiza o status de um pedido no Supabase
 * @param {string} pedidoId - ID do pedido
 * @param {'PENDENTE'|'EM_PREPARO'|'CONCLUIDO'|'CANCELADO'} novoStatus
 * @param {string} restauranteId - ID do restaurante
 * @returns {Promise<{ success: boolean, pedido?: Object, isMock: boolean }>}
 */
export async function atualizarStatusPedido(pedidoId, novoStatus, restauranteId) {
  if (!pedidoId || !isValidUUID(pedidoId) || !novoStatus || !restauranteId || !isValidUUID(restauranteId)) {
    throw new Error('ID do pedido e restaurante válidos são obrigatórios.')
  }

  const validStatuses = ['PENDENTE', 'EM_PREPARO', 'CONCLUIDO', 'CANCELADO']
  const upperStatus = novoStatus.toUpperCase()
  if (!validStatuses.includes(upperStatus)) {
    throw new Error(`Status inválido: ${novoStatus}. Esperado: ${validStatuses.join(', ')}`)
  }

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: upperStatus })
      .eq('id', pedidoId)
      .eq('restaurante_id', restauranteId)
      .select()
      .single()

    if (!error && data) {
      return { success: true, pedido: data, isMock: false }
    } else {
      console.warn('Erro ao atualizar status do pedido no Supabase:', error?.message)
      throw error || new Error('Falha ao atualizar pedido')
    }
  } catch (err) {
    console.warn('Exceção ao atualizar status no Supabase:', err)
    throw err
  }
}


