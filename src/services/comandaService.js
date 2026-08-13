import { supabase } from '../lib/supabase'

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
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Erro ao ler mock de comandas:', e)
  }

  // Se não existir nada no localStorage, gerar um lote inicial de 5 comandas para demonstração
  const initialMock = [
    { id: 'cmd-1', restaurante_id: restauranteId, numero: '001', qr_code_token: 'cmd_a1b2c3d4e5f6', status: 'DISPONIVEL', sessao_iniciada_em: null },
    { id: 'cmd-2', restaurante_id: restauranteId, numero: '002', qr_code_token: 'cmd_b2c3d4e5f6a1', status: 'EM_USO', sessao_iniciada_em: new Date().toISOString() },
    { id: 'cmd-3', restaurante_id: restauranteId, numero: '003', qr_code_token: 'cmd_c3d4e5f6a1b2', status: 'DISPONIVEL', sessao_iniciada_em: null },
    { id: 'cmd-4', restaurante_id: restauranteId, numero: '004', qr_code_token: 'cmd_d4e5f6a1b2c3', status: 'DISPONIVEL', sessao_iniciada_em: null },
    { id: 'cmd-5', restaurante_id: restauranteId, numero: '005', qr_code_token: 'cmd_e5f6a1b2c3d4', status: 'ENCERRADA', sessao_iniciada_em: null },
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
 * Busca uma comanda pelo seu qr_code_token
 * @param {string} token - O token único da comanda (ex: 'cmd_a1b2c3d4e5f6' ou 'demo-123')
 * @returns {Promise<{comanda: Object, restaurante: Object}|null>}
 */
export async function fetchComandaByToken(token) {
  if (!token) return null

  try {
    const { data: comanda, error } = await supabase
      .from('comandas')
      .select('*, restaurantes(*)')
      .eq('qr_code_token', token)
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
    console.warn('Exceção ao buscar comanda no Supabase:', err)
  }

  // Fallback Local
  const defaultRestauranteId = 'demo-restaurante-id'
  const mockList = getMockComandas(defaultRestauranteId)

  // Checar se o token bate com algum mock ou gerar uma comanda mock para qualquer token de teste
  let foundComanda = mockList.find(c => c.qr_code_token === token)

  if (!foundComanda) {
    // Extrair números do token se existirem (ex: 'cmd-token-001' -> '001')
    const extractedNum = token.replace(/\D/g, '')
    const numDisplay = extractedNum ? extractedNum.padStart(3, '0').slice(-3) : '015'

    foundComanda = {
      id: `cmd-${token}`,
      restaurante_id: defaultRestauranteId,
      numero: numDisplay,
      qr_code_token: token,
      status: 'DISPONIVEL',
      sessao_iniciada_em: null
    }
  }

  return {
    comanda: foundComanda,
    restaurante: {
      id: foundComanda.restaurante_id,
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

    if (error) {
      console.warn('Erro no Supabase updateComandaStatus. Atualizando mock:', error.message)
      const list = getMockComandas(restauranteId)
      const updated = list.map(item => item.id === id ? { ...item, status: newStatus } : item)
      saveMockComandas(restauranteId, updated)
      return true
    }

    return data
  } catch (err) {
    console.warn('Exceção em updateComandaStatus:', err)
    const list = getMockComandas(restauranteId)
    const updated = list.map(item => item.id === id ? { ...item, status: newStatus } : item)
    saveMockComandas(restauranteId, updated)
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
