import { supabase } from '../lib/supabase'
import { updateComandaStatus } from './comandaService'

const STORAGE_KEY_PREFIX = 'restaurante_pedidos_'

/**
 * Auxiliar para obter pedidos do localStorage (Fallback Mock)
 */
function getMockPedidos(restauranteId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${restauranteId}`)
    let result = raw ? JSON.parse(raw) : []

    // Migração/Mesclagem automática dos pedidos criados sob a chave legado rest-123-demo
    if (restauranteId === 'demo-restaurante-id') {
      const rawLegacy = localStorage.getItem(`${STORAGE_KEY_PREFIX}rest-123-demo`)
      if (rawLegacy) {
        try {
          const legacyList = JSON.parse(rawLegacy)
          if (Array.isArray(legacyList) && legacyList.length > 0) {
            const existingIds = new Set(result.map(p => p.id))
            const newFromLegacy = legacyList.filter(p => !existingIds.has(p.id))
            if (newFromLegacy.length > 0) {
              result = [...newFromLegacy, ...result]
              saveMockPedidos(restauranteId, result)
            }
          }
        } catch (err) {
          console.warn('Erro ao mesclar pedidos legado:', err)
        }
      }
    }

    return result
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
 * @param {Array} params.cartItems - Lista de itens do carrinho [{ produto_id, quantidade, preco, observacao, nome, ... }]
 * @param {number} params.valorTotal - Soma total do pedido
 * @param {string} [params.observacaoGeral] - Observação geral para o pedido/cozinha
 * @returns {Promise<{ success: boolean, pedido: Object, items: Array, isMock: boolean }>}
 */
export async function criarPedido({ restauranteId, comandaId, cartItems, valorTotal, observacaoGeral }) {
  if (!restauranteId || !comandaId || !cartItems || cartItems.length === 0) {
    throw new Error('Dados incompletos para criação do pedido.')
  }

  const timestamp = new Date().toISOString()
  const numeroPedidoGerado = Math.floor(100 + Math.random() * 900) // Ex: 104, 842

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
          numeroDisplay: `#${numeroPedidoGerado}`,
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
    numeroDisplay: `#${numeroPedidoGerado}`,
    status: 'PENDENTE',
    valor_total: valorTotal,
    observacaoGeral: observacaoGeral || null,
    criado_em: timestamp,
    itens: mockItems
  }

  const pedidosExistentes = getMockPedidos(restauranteId)
  saveMockPedidos(restauranteId, [novoPedidoMock, ...pedidosExistentes])

  // Atualizar status da comanda mock no localStorage
  await updateComandaStatus(comandaId, restauranteId, 'EM_USO')

  return {
    success: true,
    pedido: novoPedidoMock,
    items: mockItems,
    isMock: true
  }
}

/**
 * Busca todos os pedidos atrelados a uma comanda específica
 */
export async function fetchPedidosComanda(comandaId, restauranteId) {
  if (!comandaId) return []

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, itens_pedido(*, produtos(*))')
      .eq('comanda_id', comandaId)
      .order('criado_em', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch (e) {
    console.warn('Exceção ao buscar pedidos da comanda:', e)
  }

  // Fallback local
  const allPedidos = getMockPedidos(restauranteId)
  return allPedidos.filter(p => p.comanda_id === comandaId)
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


