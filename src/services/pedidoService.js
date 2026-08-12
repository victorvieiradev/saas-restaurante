import { supabase } from '../lib/supabase'
import { updateComandaStatus } from './comandaService'

const STORAGE_KEY_PREFIX = 'restaurante_pedidos_'

/**
 * Auxiliar para obter pedidos do localStorage (Fallback Mock)
 */
function getMockPedidos(restauranteId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${restauranteId}`)
    if (raw) return JSON.parse(raw)
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
