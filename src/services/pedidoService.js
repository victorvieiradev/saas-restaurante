import { supabase } from '../lib/supabase.js'
import { updateComandaStatus } from './comandaService.js'

const STORAGE_KEY_PREFIX = 'restaurante_pedidos_'

/**
 * Auxiliar para obter pedidos do localStorage (Fallback Mock)
 */
function getMockPedidos(restauranteId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${restauranteId}`)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('Erro ao ler mock de pedidos:', e)
  }
  return []
}

/**
 * Auxiliar para salvar pedidos no localStorage (Fallback Mock)
 */
function saveMockPedidos(restauranteId, data) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${restauranteId}`, JSON.stringify(data))
  } catch (e) {
    console.warn('Erro ao salvar mock de pedidos:', e)
  }
}

/**
 * Cria um novo pedido no sistema
 * @param {Object} params
 * @param {string} params.restauranteId
 * @param {string} params.comandaId
 * @param {string} [params.comandaNumero] - Número visível da comanda (ex: '015')
 * @param {Array} params.cartItems - Lista de itens do carrinho [{ produto_id, quantidade, preco, observacao, nome, ... }]
 * @param {number} params.valorTotal - Soma total do pedido
 * @param {string} [params.observacaoGeral] - Observação geral para o pedido/cozinha
 * @returns {Promise<{ success: boolean, pedido: Object, items: Array, isMock: boolean }>}
 */
export async function criarPedido({ restauranteId, comandaId, comandaNumero, cartItems, valorTotal, observacaoGeral }) {
  if (!restauranteId || !comandaId || !cartItems || cartItems.length === 0) {
    throw new Error('Dados incompletos para criação do pedido.')
  }

  const timestamp = new Date().toISOString()
  
  // Determinar número da comanda formatado
  let numComanda = comandaNumero
  if (!numComanda && comandaId) {
    const extracted = comandaId.replace(/\D/g, '')
    if (extracted) numComanda = extracted.padStart(3, '0')
  }
  if (!numComanda) numComanda = '015'
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

    if (!pedidoError && pedidoData) {
      // 2. Preparar e inserir itens do pedido no Supabase
      const payloadItens = cartItems.map(item => ({
        pedido_id: pedidoData.id,
        produto_id: item.produto_id || item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        observacao: item.observacao ? (observacaoGeral ? `${item.observacao} | Geral: ${observacaoGeral}` : item.observacao) : (observacaoGeral || null)
      }))

      const { data: itensData, error: itensError } = await supabase
        .from('itens_pedido')
        .insert(payloadItens)
        .select()

      if (itensError) {
        console.warn('Erro ao inserir itens no Supabase:', itensError.message)
      }

      // 3. Atualizar status da comanda para EM_USO
      await updateComandaStatus(comandaId, restauranteId, 'EM_USO')

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
    } else {
      console.warn('Supabase criarPedido falhou. Usando fallback local:', pedidoError?.message)
    }
  } catch (err) {
    console.warn('Exceção ao criar pedido no Supabase. Usando fallback local:', err)
  }

  // --- FALLBACK LOCAL STORAGE ---
  const novoPedidoId = `ped-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const mockItems = cartItems.map(item => ({
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    pedido_id: novoPedidoId,
    produto_id: item.produto_id || item.id,
    nome: item.nome,
    quantidade: item.quantidade,
    preco_unitario: item.preco,
    subtotal: item.subtotal || item.preco * item.quantidade,
    observacao: item.observacao || null
  }))

  const novoPedidoMock = {
    id: novoPedidoId,
    restaurante_id: restauranteId,
    comanda_id: comandaId,
    comandaNumero: comandaNumeroFormatado,
    numeroDisplay: `#${comandaNumeroFormatado}`,
    status: 'PENDENTE',
    valor_total: valorTotal,
    observacaoGeral: observacaoGeral || null,
    criado_em: timestamp,
    itens: mockItems
  }

  // Salvar no bucket do restaurante
  const pedidosExistentes = getMockPedidos(restauranteId)
  saveMockPedidos(restauranteId, [novoPedidoMock, ...pedidosExistentes])

  // Atualizar status da comanda mock no localStorage
  await updateComandaStatus(comandaId, restauranteId, 'EM_USO')

  // Disparar evento de sincronização local para atualizar Cozinha e Caixa imediatamente
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('restaurante_pedido_sync', {
      detail: { restauranteId, pedido: novoPedidoMock }
    }))
  }

  return {
    success: true,
    pedido: novoPedidoMock,
    items: mockItems,
    isMock: true
  }
}

/**
 * Busca todos os pedidos atrelados a uma comanda específica formatados com itens para o Caixa POS
 * @param {string} comandaId - ID da comanda
 * @param {string} restauranteId - ID do restaurante
 * @param {string} [comandaNumero] - Número opcional da comanda (ex: '015')
 * @param {Object} [options]
 * @param {boolean} [options.apenasAbertos=true] - Se deve trazer apenas pedidos da sessão atual em aberto
 * @returns {Promise<Array>} Lista normalizada de pedidos com itens
 */
export async function fetchPedidosComanda(comandaId, restauranteId = 'demo-restaurante-id', comandaNumero = null, { apenasAbertos = true } = {}) {
  if (!comandaId && !comandaNumero) return []

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

    if (restauranteId) {
      query = query.eq('restaurante_id', restauranteId)
    }

    if (comandaId) {
      query = query.eq('comanda_id', comandaId)
    }

    const { data, error } = await query

    // Se o Supabase respondeu com sucesso (mesmo com array vazio [] quando não há pedidos)
    if (!error && Array.isArray(data)) {
      const filteredSupabase = apenasAbertos
        ? data.filter(p => !p.sessao_fechada_em && p.pago !== true && String(p.status || '').toUpperCase() !== 'PAGO')
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

  // --- FALLBACK LOCAL STORAGE ---
  const allPedidos = getMockPedidos(restauranteId)
  const cleanTargetNum = comandaNumero ? String(comandaNumero).replace(/\D/g, '') : ''

  const filtered = allPedidos.filter(p => {
    // Isolamento multi-tenant
    if (p.restaurante_id && restauranteId && p.restaurante_id !== restauranteId) return false

    // Se estiver filtrando apenas abertos, excluir sessões fechadas/pagas
    if (apenasAbertos && (p.sessao_fechada_em || p.pago === true || String(p.status || '').toUpperCase() === 'PAGO')) {
      return false
    }

    if (comandaId && p.comanda_id === comandaId) return true
    
    // Comparação precisa de número de comanda
    if (cleanTargetNum) {
      const pNum = String(p.comandaNumero || '').replace(/\D/g, '')
      if (pNum && (pNum === cleanTargetNum || pNum.padStart(3, '0') === cleanTargetNum.padStart(3, '0'))) return true
    }

    return false
  })

  // Normalizar estrutura de itens no mock local
  return filtered.map(pedido => {
    const itens = (pedido.itens || []).map(item => {
      const qty = Number(item.quantidade) > 0 ? Number(item.quantidade) : 1
      const unitPrice = item.preco_unitario != null ? Number(item.preco_unitario) : (Number(item.preco) || 0)
      const sub = item.subtotal != null ? Number(item.subtotal) : (qty * unitPrice)

      return {
        id: item.id || `it-${Math.random()}`,
        produto_id: item.produto_id || item.id,
        nome: item.nome || 'Item do Cardápio',
        quantidade: qty,
        preco_unitario: unitPrice,
        subtotal: sub,
        observacao: item.observacao || null
      }
    })

    const totalCalculado = itens.reduce((acc, it) => acc + it.subtotal, 0)

    return {
      id: pedido.id,
      restaurante_id: pedido.restaurante_id || restauranteId,
      comanda_id: pedido.comanda_id || comandaId,
      status: String(pedido.status || 'PENDENTE').toUpperCase(),
      valor_total: pedido.valor_total != null ? Number(pedido.valor_total) : totalCalculado,
      observacaoGeral: pedido.observacaoGeral || null,
      criado_em: pedido.criado_em || new Date().toISOString(),
      itens
    }
  })
}


/**
 * Busca todos os pedidos ativos do restaurante para exibição no KDS da cozinha
 * @param {string} restauranteId
 * @returns {Promise<Array>} Lista de pedidos formatados para o KDS
 */
export async function fetchPedidosKDS(restauranteId = 'demo-restaurante-id') {
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

    if (!error && data && data.length > 0) {
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
    console.warn('Exceção ao consultar KDS no Supabase. Usando fallback:', e)
  }

  // --- FALLBACK LOCAL STORAGE ---
  const allLocal = getMockPedidos(restauranteId)
  if (allLocal && allLocal.length > 0) {
    return allLocal
  }

  // Seed de pedidos de demonstração para a Cozinha caso não haja nenhum registrado
  const now = Date.now()
  const demoSeed = [
    {
      id: 'ped-demo-1',
      restaurante_id: restauranteId,
      comanda_id: 'comanda-demo-15',
      comandaNumero: '015',
      numeroDisplay: '#015',
      status: 'PENDENTE',
      valor_total: 68.90,
      observacaoGeral: 'Mesa perto da janela',
      criado_em: new Date(now - 4 * 60 * 1000).toISOString(), // 4 minutos atrás
      itens: [
        { id: 'it-1', nome: 'Hambúrguer Artesanal Smash', quantidade: 2, observacao: 'Sem cebola e sem tomate' },
        { id: 'it-2', nome: 'Batata Frita Rustica', quantidade: 1, observacao: 'Molho de alho à parte' },
        { id: 'it-3', nome: 'Refrigerante Guaraná 350ml', quantidade: 2, observacao: 'Gelo e limão' }
      ]
    },
    {
      id: 'ped-demo-2',
      restaurante_id: restauranteId,
      comanda_id: 'comanda-demo-08',
      comandaNumero: '008',
      numeroDisplay: '#008',
      status: 'EM_PREPARO',
      valor_total: 94.00,
      observacaoGeral: null,
      criado_em: new Date(now - 18 * 60 * 1000).toISOString(), // 18 minutos atrás (Atrasado!)
      itens: [
        { id: 'it-4', nome: 'Pizza Margherita Especial', quantidade: 1, observacao: 'Massa fina, caprichar no manjericão' },
        { id: 'it-5', nome: 'Suco Natural de Laranja 500ml', quantidade: 2, observacao: 'Sem açúcar' }
      ]
    },
    {
      id: 'ped-demo-3',
      restaurante_id: restauranteId,
      comanda_id: 'comanda-demo-03',
      comandaNumero: '003',
      numeroDisplay: '#003',
      status: 'CONCLUIDO',
      valor_total: 42.50,
      observacaoGeral: null,
      criado_em: new Date(now - 25 * 60 * 1000).toISOString(), // 25 minutos atrás
      itens: [
        { id: 'it-6', nome: 'Espeto de Alcatra Completo', quantidade: 1, observacao: 'Ponto para mal passado' },
        { id: 'it-7', nome: 'Cerveja Long Neck 355ml', quantidade: 2, observacao: null }
      ]
    }
  ]

  saveMockPedidos(restauranteId, demoSeed)
  return demoSeed
}

/**
 * Subscreve às mudanças em tempo real da tabela de pedidos no Supabase para a cozinha (KDS)
 * @param {string} restauranteId 
 * @param {Object} callbacks
 * @param {Function} [callbacks.onNewPedido] - Chamado quando um pedido é criado (INSERT)
 * @param {Function} [callbacks.onUpdatePedido] - Chamado quando um pedido é alterado (UPDATE)
 * @param {Function} [callbacks.onStatusChange] - Chamado com o status da conexão Realtime ('SUBSCRIBED', etc.)
 * @returns {Function} Função para cancelar a inscrição
 */
export function subscribeToPedidosKDS(restauranteId = 'demo-restaurante-id', { onNewPedido, onUpdatePedido, onStatusChange } = {}) {
  if (!restauranteId) return () => {}

  try {
    const channelName = `kds-pedidos-${restauranteId}-${Math.random().toString(36).substring(2, 7)}`
    
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
            // Buscar detalhes completos do pedido recém-criado
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
        (payload) => {
          if (onUpdatePedido && payload.new) {
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
 * Atualiza o status de um pedido no Supabase e no fallback local
 * @param {string} pedidoId - ID do pedido
 * @param {'PENDENTE'|'EM_PREPARO'|'CONCLUIDO'|'CANCELADO'} novoStatus - Novo status do pedido
 * @param {string} [restauranteId='demo-restaurante-id'] - ID do restaurante
 * @returns {Promise<{ success: boolean, pedido?: Object, isMock: boolean }>}
 */
export async function atualizarStatusPedido(pedidoId, novoStatus, restauranteId = 'demo-restaurante-id') {
  if (!pedidoId || !novoStatus) {
    throw new Error('ID do pedido e novo status são obrigatórios.')
  }

  const validStatuses = ['PENDENTE', 'EM_PREPARO', 'CONCLUIDO', 'CANCELADO']
  const upperStatus = novoStatus.toUpperCase()
  if (!validStatuses.includes(upperStatus)) {
    throw new Error(`Status inválido: ${novoStatus}. Esperado: ${validStatuses.join(', ')}`)
  }

  // 1. Tentar atualizar no Supabase
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: upperStatus })
      .eq('id', pedidoId)
      .eq('restaurante_id', restauranteId)
      .select()
      .single()

    if (!error && data) {
      // Sincronizar também no fallback local caso exista
      const localList = getMockPedidos(restauranteId)
      const index = localList.findIndex(p => p.id === pedidoId)
      if (index !== -1) {
        localList[index] = { ...localList[index], status: upperStatus }
        saveMockPedidos(restauranteId, localList)
      }

      return { success: true, pedido: data, isMock: false }
    } else {
      console.warn('Supabase atualizarStatusPedido falhou. Tentando fallback local:', error?.message)
    }
  } catch (err) {
    console.warn('Exceção ao atualizar status no Supabase. Usando fallback local:', err)
  }

  // 2. Fallback Local Storage
  const localList = getMockPedidos(restauranteId)
  const index = localList.findIndex(p => p.id === pedidoId)
  if (index !== -1) {
    localList[index] = { ...localList[index], status: upperStatus }
    saveMockPedidos(restauranteId, localList)
    return { success: true, pedido: localList[index], isMock: true }
  }

  return { success: true, pedido: { id: pedidoId, status: upperStatus }, isMock: true }
}


