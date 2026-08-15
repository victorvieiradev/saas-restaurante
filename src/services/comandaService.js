import { supabase } from '../lib/supabase.js'

// Hash generator de 12 caracteres hexadecimais/alfanuméricos únicos para o qr_code_token
export function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'cmd_'
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

const STORAGE_KEY_PREFIX = 'restaurante_comandas_'

function getMockComandas(restauranteId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${restauranteId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Auto-correção para comanda 005 caso tenha ficado com status ENCERRADA por herança de mock antigo
        let modified = false
        const normalized = parsed.map(c => {
          if ((c.id === 'cmd-5' || c.numero === '005' || c.qr_code_token === 'cmd_e5f6a1b2c3d4') && c.status === 'ENCERRADA') {
            modified = true
            return { ...c, status: 'DISPONIVEL' }
          }
          return c
        })
        if (modified) {
          saveMockComandas(restauranteId, normalized)
        }
        return normalized
      }
    }
  } catch (e) {
    console.warn('Erro ao ler mock de comandas:', e)
  }

  // Se não existir nada no localStorage, gerar um lote inicial de comandas para demonstração
  const initialMock = [
    { id: 'cmd-1', restaurante_id: restauranteId, numero: '001', qr_code_token: 'cmd_a1b2c3d4e5f6', status: 'DISPONIVEL', sessao_iniciada_em: null },
    { id: 'cmd-2', restaurante_id: restauranteId, numero: '002', qr_code_token: 'cmd_b2c3d4e5f6a1', status: 'EM_USO', sessao_iniciada_em: new Date().toISOString() },
    { id: 'cmd-3', restaurante_id: restauranteId, numero: '003', qr_code_token: 'cmd_c3d4e5f6a1b2', status: 'DISPONIVEL', sessao_iniciada_em: null },
    { id: 'cmd-4', restaurante_id: restauranteId, numero: '004', qr_code_token: 'cmd_d4e5f6a1b2c3', status: 'DISPONIVEL', sessao_iniciada_em: null },
    { id: 'cmd-5', restaurante_id: restauranteId, numero: '005', qr_code_token: 'cmd_e5f6a1b2c3d4', status: 'DISPONIVEL', sessao_iniciada_em: null },
    { id: 'cmd-8', restaurante_id: restauranteId, numero: '008', qr_code_token: 'demo-token-008', status: 'EM_USO', sessao_iniciada_em: new Date().toISOString() },
    { id: 'cmd-15', restaurante_id: restauranteId, numero: '015', qr_code_token: 'demo-token-015', status: 'DISPONIVEL', sessao_iniciada_em: null },
  ]
  saveMockComandas(restauranteId, initialMock)
  return initialMock
}

function saveMockComandas(restauranteId, data) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${restauranteId}`, JSON.stringify(data))
  } catch (e) {
    console.warn('Erro ao salvar mock de comandas:', e)
  }
}

/**
 * Busca todas as comandas cadastradas para o restaurante
 */
export async function fetchComandas(restauranteId) {
  if (!restauranteId) return []

  try {
    const { data, error } = await supabase
      .from('comandas')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('numero', { ascending: true })

    if (error || !data) {
      console.warn('Supabase fetchComandas falhou ou banco offline. Usando fallback local:', error?.message)
      return getMockComandas(restauranteId)
    }

    return data
  } catch (err) {
    console.warn('Erro em fetchComandas:', err)
    return getMockComandas(restauranteId)
  }
}

/**
 * Busca uma comanda pelo seu qr_code_token ou número
 * @param {string} token - O token único da comanda ou número (ex: 'cmd_a1b2c3d4e5f6', 'demo-token-015', '015')
 * @returns {Promise<{comanda: Object, restaurante: Object}|null>}
 */
export async function fetchComandaByToken(token) {
  if (!token) return null

  // 1. Tentar buscar no Supabase
  try {
    const safeToken = String(token).trim().replace(/[(),."'\s]/g, '')
    if (safeToken) {
      const { data: comanda, error } = await supabase
        .from('comandas')
        .select('*, restaurantes(*)')
        .or(`qr_code_token.eq.${safeToken},numero.eq.${safeToken}`)
        .maybeSingle()

      if (!error && comanda) {
        const restauranteObj = Array.isArray(comanda.restaurantes) ? comanda.restaurantes[0] : comanda.restaurantes
        const restaurante = restauranteObj || {
          id: comanda.restaurante_id,
          nome: 'Restaurante Sabor & Arte',
          slug: 'restaurante-sabor-arte'
        }
        return { comanda, restaurante }
      }
    }
  } catch (err) {
    console.warn('Exceção ao buscar comanda no Supabase:', err)
  }

  // 2. Fallback Local: Identificar restaurante ativo na sessão
  let activeRestauranteId = 'res-demo-001'
  try {
    const sessionRaw = localStorage.getItem('restaurante_gestor_session')
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw)
      if (parsed?.restaurante?.id) {
        activeRestauranteId = parsed.restaurante.id
      }
    }
  } catch (e) {}

  // 3. Procurar no bucket do restaurante ativo primeiro, depois nos outros
  let foundComanda = null
  let foundRestauranteId = activeRestauranteId
  const cleanNum = token.replace(/\D/g, '')

  const isMatch = (c) => (
    c.qr_code_token === token || 
    String(c.numero) === token ||
    (cleanNum && String(c.numero).padStart(3, '0') === cleanNum.padStart(3, '0')) ||
    (cleanNum && String(c.numero) === cleanNum)
  )

  // Tentar primeiro no bucket ativo
  const activeList = getMockComandas(activeRestauranteId)
  const activeMatch = activeList.find(isMatch)

  if (activeMatch) {
    foundComanda = activeMatch
    foundRestauranteId = activeMatch.restaurante_id || activeRestauranteId
  } else {
    // Vasculhar chaves do localStorage caso esteja em outro bucket
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX) && key !== `${STORAGE_KEY_PREFIX}${activeRestauranteId}`) {
        try {
          const list = JSON.parse(localStorage.getItem(key))
          if (Array.isArray(list)) {
            const match = list.find(isMatch)
            if (match) {
              foundComanda = match
              foundRestauranteId = match.restaurante_id || key.replace(STORAGE_KEY_PREFIX, '')
              break
            }
          }
        } catch (e) {}
      }
    }
  }

  // Se não foi encontrada em nenhum bucket existente, criar uma comanda dinâmica
  if (!foundComanda) {
    const numDisplay = cleanNum ? cleanNum.padStart(3, '0') : '015'

    foundComanda = {
      id: `cmd-${token}`,
      restaurante_id: activeRestauranteId,
      numero: numDisplay,
      qr_code_token: token,
      status: 'DISPONIVEL',
      sessao_iniciada_em: null
    }

    // Persistir no bucket ativo para permitir consultas futuras
    const currentList = getMockComandas(activeRestauranteId)
    const exists = currentList.some(c => c.id === foundComanda.id || c.qr_code_token === token)
    if (!exists) {
      saveMockComandas(activeRestauranteId, [foundComanda, ...currentList])
    }
  }

  return {
    comanda: foundComanda,
    restaurante: {
      id: foundRestauranteId || activeRestauranteId,
      nome: 'Restaurante Sabor & Arte',
      slug: 'restaurante-sabor-arte'
    }
  }
}

/**
 * Gera um lote de comandas sequenciais
 * @param {string} restauranteId
 * @param {number} numeroInicial - Ex: 1 ou 10
 * @param {number} quantidade - Ex: 10
 * @param {number} paddingZero - Número de dígitos com zeros à esquerda (ex: 3 para "001")
 */
export async function gerarLoteComandas(restauranteId, numeroInicial, quantidade, paddingZero = 3) {
  if (!restauranteId || quantidade <= 0) {
    throw new Error('Parâmetros inválidos para geração de comandas.')
  }

  // Buscar comandas existentes para evitar duplicidade de número
  const comandasExistentes = await fetchComandas(restauranteId)
  const numerosExistentes = new Set(comandasExistentes.map(c => String(c.numero).padStart(paddingZero, '0')))

  const novasComandas = []
  let countCreated = 0
  let currentNum = parseInt(numeroInicial, 10)

  while (countCreated < quantidade) {
    const numeroFormatado = String(currentNum).padStart(paddingZero, '0')

    if (!numerosExistentes.has(numeroFormatado)) {
      novasComandas.push({
        id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    // Tentar persistir no Supabase
    const payloadSupabase = novasComandas.map(({ id, ...rest }) => rest)
    const { data, error } = await supabase
      .from('comandas')
      .insert(payloadSupabase)
      .select()

    if (error) {
      console.warn('Erro ao salvar lote no Supabase. Gravando no fallback local:', error.message)
      const currentList = getMockComandas(restauranteId)
      const updatedList = [...currentList, ...novasComandas]
      saveMockComandas(restauranteId, updatedList)
      return novasComandas
    }

    return data
  } catch (err) {
    console.warn('Exceção ao inserir lote de comandas. Usando mock local:', err)
    const currentList = getMockComandas(restauranteId)
    const updatedList = [...currentList, ...novasComandas]
    saveMockComandas(restauranteId, updatedList)
    return novasComandas
  }
}

/**
 * Altera o status de uma comanda
 */
export async function updateComandaStatus(id, restauranteId, newStatus) {
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

    // Atualizar bucket do restaurante ativo
    const list = getMockComandas(restauranteId)
    const updated = list.map(item => (item.id === id || item.qr_code_token === id || item.numero === id ? { ...item, status: newStatus } : item))
    saveMockComandas(restauranteId, updated)

    // Sincronizar em todos os outros buckets locais
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const bList = JSON.parse(localStorage.getItem(key))
          if (Array.isArray(bList)) {
            const bUpdated = bList.map(item => (item.id === id || item.qr_code_token === id || item.numero === id ? { ...item, status: newStatus } : item))
            localStorage.setItem(key, JSON.stringify(bUpdated))
          }
        } catch (e) {}
      }
    }

    // Disparar evento para atualizar views abertas em tempo real
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('restaurante_comanda_status_changed', {
        detail: { comandaId: id, restauranteId, newStatus }
      }))
    }

    if (error) {
      console.warn('Erro no Supabase updateComandaStatus. Atualizando mock local:', error.message)
      return true
    }

    return data
  } catch (err) {
    console.warn('Exceção em updateComandaStatus:', err)
    const list = getMockComandas(restauranteId)
    const updated = list.map(item => (item.id === id || item.qr_code_token === id || item.numero === id ? { ...item, status: newStatus } : item))
    saveMockComandas(restauranteId, updated)

    // Sincronizar em todos os outros buckets locais
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const bList = JSON.parse(localStorage.getItem(key))
          if (Array.isArray(bList)) {
            const bUpdated = bList.map(item => (item.id === id || item.qr_code_token === id || item.numero === id ? { ...item, status: newStatus } : item))
            localStorage.setItem(key, JSON.stringify(bUpdated))
          }
        } catch (e) {}
      }
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('restaurante_comanda_status_changed', {
        detail: { comandaId: id, restauranteId, newStatus }
      }))
    }

    return true
  }
}

/**
 * Exclui uma comanda
 */
export async function deleteComanda(id, restauranteId) {
  try {
    const { error } = await supabase
      .from('comandas')
      .delete()
      .eq('id', id)
      .eq('restaurante_id', restauranteId)

    if (error) {
      console.warn('Erro ao excluir no Supabase. Atualizando mock:', error.message)
    }

    const list = getMockComandas(restauranteId)
    const updated = list.filter(item => item.id !== id)
    saveMockComandas(restauranteId, updated)
    return true
  } catch (err) {
    console.warn('Exceção em deleteComanda:', err)
    const list = getMockComandas(restauranteId)
    const updated = list.filter(item => item.id !== id)
    saveMockComandas(restauranteId, updated)
    return true
  }
}

/**
 * Busca comanda por número digitado ou token no Caixa POS
 * @param {string} termoBusca - Ex: "15", "015", "#015", "cmd_demo15"
 * @param {string} restauranteId - ID do restaurante
 * @returns {Promise<{comanda: Object, restaurante: Object}|null>}
 */
export async function buscarComandaPorNumero(termoBusca, restauranteId = 'demo-restaurante-id') {
  if (!termoBusca || !termoBusca.trim()) return null

  // Sanitizar entrada removendo caracteres de injeção ou controle do PostgREST
  const rawClean = termoBusca.trim().replace(/^#/, '')
  const safeTermo = rawClean.replace(/[(),."'\s]/g, '')
  if (!safeTermo) return null

  const cleanDigits = safeTermo.replace(/\D/g, '')
  const intVal = cleanDigits ? parseInt(cleanDigits, 10) : null
  const standardPad = intVal !== null ? String(intVal).padStart(3, '0') : null
  const unpadded = intVal !== null ? String(intVal) : null

  // 1. Tentar buscar no Supabase com query segura
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
        nome: 'Restaurante Sabor & Arte',
        slug: 'restaurante-sabor-arte'
      }
      return { comanda, restaurante }
    }
  } catch (err) {
    console.warn('Exceção ao buscar comanda no Supabase para o Caixa:', err)
  }

  // 2. Fallback Local
  const todasComandas = await fetchComandas(restauranteId)
  if (Array.isArray(todasComandas) && todasComandas.length > 0) {
    const encontrada = todasComandas.find(c => {
      const numStr = String(c.numero || '').replace(/^#/, '').trim()
      const numDigits = numStr.replace(/\D/g, '')
      const tokenStr = String(c.qr_code_token || '').trim()

      return (
        numStr === safeTermo ||
        tokenStr === safeTermo ||
        (standardPad && numStr === standardPad) ||
        (unpadded && numStr === unpadded) ||
        (cleanDigits && numDigits === cleanDigits)
      )
    })

    if (encontrada) {
      return {
        comanda: encontrada,
        restaurante: {
          id: restauranteId,
          nome: 'Restaurante Sabor & Arte',
          slug: 'restaurante-sabor-arte'
        }
      }
    }
  }

  return null
}

/**
 * Busca todas as comandas com status 'EM_USO' com contagem de pedidos para o Caixa POS
 * @param {string} restauranteId
 * @returns {Promise<Array>} Lista de comandas ativas com pedidos_count
 */
export async function fetchComandasAtivas(restauranteId = 'demo-restaurante-id') {
  if (!restauranteId) return []

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

  // Fallback Local com contagem a partir de localStorage
  const all = await fetchComandas(restauranteId)
  const ativas = (all || []).filter(c => c.status === 'EM_USO')
  
  let mockPedidos = []
  try {
    const raw = localStorage.getItem(`restaurante_pedidos_${restauranteId}`)
    if (raw) mockPedidos = JSON.parse(raw)
  } catch (e) {}

  return ativas.map(cmd => {
    const cmdNum = String(cmd.numero || '').replace(/^#/, '').trim()
    const count = (mockPedidos || []).filter(p => {
      const pNum = String(p.comandaNumero || '').replace(/^#/, '').trim()
      const isMatch = p.comanda_id === cmd.id || (cmdNum && pNum && (pNum === cmdNum || String(pNum).padStart(3, '0') === String(cmdNum).padStart(3, '0')))
      return isMatch && !p.sessao_fechada_em && p.pago !== true && String(p.status || '').toUpperCase() !== 'CANCELADO' && String(p.status || '').toUpperCase() !== 'PAGO'
    }).length

    return {
      ...cmd,
      pedidos_count: count
    }
  })
}

/**
 * Realiza o fechamento de conta, registro do pagamento e liberação da comanda
 * (Invariantes AD-1, AD-5 / Story 5.2)
 * 
 * @param {Object} params
 * @param {string} params.restauranteId
 * @param {string} params.comandaId
 * @param {string} [params.comandaNumero]
 * @param {Array} [params.pedidos] - Lista de pedidos a serem encerrados nesta sessão
 * @param {string} params.formaPagamento - 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO' | 'VALE_REFEICAO'
 * @param {number} params.valorTotal - Valor total final pago
 * @param {number} [params.subtotal] - Subtotal dos itens antes de taxas/descontos
 * @param {number} [params.valorRecebido] - Para pagamentos em dinheiro
 * @param {number} [params.troco] - Troco calculado
 * @param {number} [params.taxaServico] - Valor da taxa de serviço (se aplicada)
 * @param {number} [params.desconto] - Valor do desconto (se aplicado)
 * @returns {Promise<{ success: boolean, transacao: Object, isMock: boolean }>}
 */
export async function fecharComandaPagamento({
  restauranteId = 'demo-restaurante-id',
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
  if (!comandaId) {
    throw new Error('ID da comanda é obrigatório para fechamento.')
  }

  const safeRestauranteId = restauranteId || 'demo-restaurante-id'
  const timestamp = new Date().toISOString()
  const transacaoId = `fech-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  
  // Apenas pedidos válidos não-cancelados devem transicionar para CONCLUIDO
  const validPedidos = pedidos.filter(p => String(p.status || '').toUpperCase() !== 'CANCELADO')
  const validPedidosIds = validPedidos.map(p => p.id).filter(Boolean)
  const allPedidosIds = pedidos.map(p => p.id).filter(Boolean)

  const rawNum = String(comandaNumero || '').replace(/^#/, '').trim()
  const numFormatado = rawNum ? rawNum.padStart(3, '0') : '001'

  const roundVal = (v) => Math.round((Number(v) || 0) * 100) / 100

  const transacao = {
    id: transacaoId,
    restaurante_id: safeRestauranteId,
    comanda_id: comandaId,
    comanda_numero: numFormatado,
    forma_pagamento: formaPagamento,
    subtotal: roundVal(subtotal || valorTotal),
    taxa_servico: roundVal(taxaServico),
    desconto: roundVal(desconto),
    valor_total: roundVal(valorTotal),
    valor_recebido: roundVal(valorRecebido || valorTotal),
    troco: roundVal(troco),
    pedidos_ids: allPedidosIds,
    pedidos_resumo: pedidos.map(p => ({
      id: p.id,
      status: p.status,
      criado_em: p.criado_em,
      valor_total: p.valor_total,
      itens: (p.itens || []).map(it => ({
        nome: it.nome,
        quantidade: it.quantidade,
        preco_unitario: it.preco_unitario,
        subtotal: it.subtotal
      }))
    })),
    fechado_em: timestamp,
    status: 'PAGO'
  }

  let supabaseSuccess = false

  // 1. Atualizar comanda no Supabase para DISPONIVEL e sessao_iniciada_em: null
  try {
    const { error: cmdError } = await supabase
      .from('comandas')
      .update({
        status: 'DISPONIVEL',
        sessao_iniciada_em: null
      })
      .eq('id', comandaId)
      .eq('restaurante_id', safeRestauranteId)

    if (!cmdError) {
      // 2. Marcar pedidos válidos como pagos / fechados no Supabase (preservando CANCELADOS)
      if (validPedidosIds.length > 0) {
        await supabase
          .from('pedidos')
          .update({
            sessao_fechada_em: timestamp,
            status: 'CONCLUIDO'
          })
          .in('id', validPedidosIds)
          .eq('restaurante_id', safeRestauranteId)
      }

      // Marcar sessao_fechada_em também nos cancelados sem sobrescrever status
      const canceladosIds = pedidos.filter(p => String(p.status || '').toUpperCase() === 'CANCELADO').map(p => p.id).filter(Boolean)
      if (canceladosIds.length > 0) {
        await supabase
          .from('pedidos')
          .update({
            sessao_fechada_em: timestamp
          })
          .in('id', canceladosIds)
          .eq('restaurante_id', safeRestauranteId)
      }

      // 3. Gravar transação de pagamento no Supabase (se existir tabela pagamentos)
      try {
        await supabase
          .from('pagamentos')
          .insert({
            id: transacao.id,
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
      } catch (e) {}

      supabaseSuccess = true
    }
  } catch (err) {
    console.warn('Exceção ao fechar comanda no Supabase. Utilizando fallback local:', err)
  }

  // --- PERSISTÊNCIA LOCAL (Fallback e Sincronização) ---
  const comandasList = getMockComandas(safeRestauranteId)
  const updatedComandas = comandasList.map(c => {
    const cNum = String(c.numero || '').replace(/^#/, '').trim()
    const isMatch = c.id === comandaId || (rawNum && (cNum === rawNum || cNum.padStart(3, '0') === rawNum.padStart(3, '0')))
    if (isMatch) {
      return { ...c, status: 'DISPONIVEL', sessao_iniciada_em: null }
    }
    return c
  })
  saveMockComandas(safeRestauranteId, updatedComandas)

  // Marcar pedidos como pagos/fechados no mock
  try {
    const pedidosKey = `restaurante_pedidos_${safeRestauranteId}`
    const rawPedidos = localStorage.getItem(pedidosKey)
    if (rawPedidos) {
      const allPeds = JSON.parse(rawPedidos)
      const updatedPeds = allPeds.map(p => {
        const matchId = allPedidosIds.includes(p.id)
        const pNum = String(p.comandaNumero || '').replace(/^#/, '').trim()
        const matchCmd = p.comanda_id === comandaId || (rawNum && (pNum === rawNum || pNum.padStart(3, '0') === rawNum.padStart(3, '0')))
        if (matchId || matchCmd) {
          const isCancelado = String(p.status || '').toUpperCase() === 'CANCELADO'
          return {
            ...p,
            sessao_fechada_em: timestamp,
            pago: true,
            status: isCancelado ? 'CANCELADO' : 'CONCLUIDO'
          }
        }
        return p
      })
      localStorage.setItem(pedidosKey, JSON.stringify(updatedPeds))
    }
  } catch (e) {
    console.warn('Erro ao atualizar pedidos no localStorage:', e)
  }

  // Salvar registro de fechamento no histórico financeiro local
  try {
    const fechamentosKey = `restaurante_fechamentos_${safeRestauranteId}`
    const rawFech = localStorage.getItem(fechamentosKey)
    const listFech = rawFech ? JSON.parse(rawFech) : []
    listFech.unshift(transacao)
    localStorage.setItem(fechamentosKey, JSON.stringify(listFech))
  } catch (e) {
    console.warn('Erro ao salvar fechamento no localStorage:', e)
  }

  // Limpar carrinho da comanda caso exista
  try {
    localStorage.removeItem(`cardapio_carrinho_${comandaId}`)
  } catch (e) {}

  // Disparar eventos para avisar todas as telas abertas
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('restaurante_comanda_fechada', {
      detail: { restauranteId: safeRestauranteId, comandaId, comandaNumero: numFormatado, transacao }
    }))
    window.dispatchEvent(new CustomEvent('restaurante_pedido_sync', {
      detail: { restauranteId: safeRestauranteId }
    }))
  }

  return {
    success: true,
    transacao,
    isMock: !supabaseSuccess
  }
}

/**
 * Consulta histórico de transações de fechamento de comandas
 * @param {string} restauranteId
 * @returns {Promise<Array>}
 */
export async function fetchHistoricoFechamentos(restauranteId = 'demo-restaurante-id') {
  if (!restauranteId) return []

  try {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('criado_em', { ascending: false })

    if (!error && data && data.length > 0) {
      return data
    }
  } catch (e) {
    console.warn('Exceção ao buscar pagamentos no Supabase:', e)
  }

  try {
    const fechamentosKey = `restaurante_fechamentos_${restauranteId}`
    const rawFech = localStorage.getItem(fechamentosKey)
    return rawFech ? JSON.parse(rawFech) : []
  } catch (e) {
    return []
  }
}


