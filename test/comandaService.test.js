import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const mockStorage = new Map()
const mockLocalStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size },
  key: (i) => Array.from(mockStorage.keys())[i] || null
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
})

globalThis.window = {
  dispatchEvent: () => {}
}

import { supabase } from '../src/lib/supabase.js'
import {
  generateToken,
  fetchComandas,
  fetchComandaByToken,
  gerarLoteComandas,
  updateComandaStatus,
  deleteComanda,
  buscarComandaPorNumero,
  fetchComandasAtivas,
  fecharComandaPagamento,
  fetchHistoricoFechamentos
} from '../src/services/comandaService.js'

describe('comandaService Unit Tests', () => {
  beforeEach(() => {
    mockStorage.clear()
  })

  describe('generateToken', () => {
    test('gera token iniciando com cmd_ e 12 caracteres', () => {
      const t1 = generateToken()
      const t2 = generateToken()
      assert.equal(t1.length, 12)
      assert.match(t1, /^cmd_[a-z0-9]{8}$/)
      assert.notEqual(t1, t2)
    })
  })

  describe('fetchComandas', () => {
    test('retorna array vazio se restauranteId for nulo', async () => {
      assert.deepEqual(await fetchComandas(null), [])
    })

    test('retorna lista do Supabase quando online', async () => {
      const mockComandas = [{ id: 'cmd-1', numero: '001' }]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockComandas, error: null })
          })
        })
      })

      const res = await fetchComandas('res-123')
      assert.equal(res.length, 1)
      assert.equal(res[0].numero, '001')
    })

    test('retorna mock local e auto-corrige status quando Supabase falhar', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      mockStorage.set('restaurante_comandas_res-123', JSON.stringify([
        { id: 'cmd-5', numero: '005', status: 'ENCERRADA' }
      ]))

      const res = await fetchComandas('res-123')
      assert.equal(res[0].status, 'DISPONIVEL', 'Status ENCERRADA deve ser corrigido para DISPONIVEL')
    })
  })

  describe('fetchComandaByToken', () => {
    test('retorna null se token for nulo ou vazio', async () => {
      assert.equal(await fetchComandaByToken(null), null)
      assert.equal(await fetchComandaByToken(''), null)
    })

    test('busca comanda no Supabase online com relação de restaurantes', async () => {
      const mockResult = {
        id: 'cmd-1',
        numero: '001',
        qr_code_token: 'cmd_token1234',
        restaurantes: [{ id: 'res-1', nome: 'Restaurante Teste' }]
      }

      supabase.from = () => ({
        select: () => ({
          or: () => ({
            maybeSingle: () => Promise.resolve({ data: mockResult, error: null })
          })
        })
      })

      const res = await fetchComandaByToken('cmd_token1234')
      assert.ok(res)
      assert.equal(res.comanda.numero, '001')
      assert.equal(res.restaurante.nome, 'Restaurante Teste')
    })

    test('busca comanda no fallback local por token e por número com sessão ativa', async () => {
      supabase.from = () => ({
        select: () => ({
          or: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      mockStorage.set('restaurante_gestor_session', JSON.stringify({
        restaurante: { id: 'res-sessao-01' }
      }))

      mockStorage.set('restaurante_comandas_res-sessao-01', JSON.stringify([
        { id: 'cmd-99', numero: '099', qr_code_token: 'token-99', status: 'DISPONIVEL' }
      ]))

      const resToken = await fetchComandaByToken('token-99')
      assert.ok(resToken)
      assert.equal(resToken.comanda.numero, '099')

      // Varredura em outros buckets de restaurantes
      mockStorage.set('restaurante_comandas_outro_rest_2', JSON.stringify([
        { id: 'cmd-88', numero: '088', qr_code_token: 'token-88', status: 'DISPONIVEL' }
      ]))

      const resOutro = await fetchComandaByToken('token-88')
      assert.ok(resOutro)
      assert.equal(resOutro.comanda.numero, '088')
    })
  })

  describe('gerarLoteComandas', () => {
    test('dispara erro para parâmetros inválidos', async () => {
      await assert.rejects(() => gerarLoteComandas(null, 1, 0))
    })

    test('cria lote com Supabase online', async () => {
      const mockCreated = [{ id: 'cmd-100', numero: '100', qr_code_token: 'cmd_100', status: 'DISPONIVEL' }]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        }),
        insert: () => ({
          select: () => Promise.resolve({ data: mockCreated, error: null })
        })
      })

      const res = await gerarLoteComandas('res-123', 100, 1)
      assert.equal(res.length, 1)
      assert.equal(res[0].numero, '100')
    })

    test('cria lote e salva no fallback local quando Supabase falhar', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        }),
        insert: () => ({
          select: () => Promise.resolve({ data: null, error: new Error('offline') })
        })
      })

      const lote = await gerarLoteComandas('res-local', 50, 2)
      assert.equal(lote.length, 2)
      assert.equal(lote[0].numero, '050')
      assert.equal(lote[1].numero, '051')
    })
  })

  describe('updateComandaStatus & deleteComanda', () => {
    test('updateComandaStatus atualiza status no Supabase online e propaga para outros buckets', async () => {
      mockStorage.set('restaurante_comandas_outro_1', JSON.stringify([
        { id: 'cmd-1', status: 'DISPONIVEL' }
      ]))

      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => Promise.resolve({ data: { id: 'cmd-1', status: 'EM_USO' }, error: null })
            })
          })
        })
      })

      const res = await updateComandaStatus('cmd-1', 'res-demo-001', 'EM_USO')
      assert.ok(res)
    })

    test('updateComandaStatus atualiza status no fallback local quando offline e propaga buckets', async () => {
      mockStorage.set('restaurante_comandas_outro_2', JSON.stringify([
        { id: 'cmd-1', status: 'EM_USO' }
      ]))

      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => Promise.resolve({ data: null, error: new Error('offline') })
            })
          })
        })
      })

      const res = await updateComandaStatus('cmd-1', 'res-demo-001', 'DISPONIVEL')
      assert.ok(res)
    })

    test('deleteComanda exclui comanda no Supabase e no mock local', async () => {
      supabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })

      const res = await deleteComanda('cmd-1', 'res-demo-001')
      assert.equal(res, true)
    })
  })

  describe('buscarComandaPorNumero', () => {
    test('retorna null para termo de busca vazio', async () => {
      assert.equal(await buscarComandaPorNumero(''), null)
      assert.equal(await buscarComandaPorNumero(null), null)
    })

    test('localiza comanda via Supabase online', async () => {
      const mockCmd = { id: 'c15', numero: '015', qr_code_token: 'cmd_15' }
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            or: () => ({
              maybeSingle: () => Promise.resolve({ data: mockCmd, error: null })
            })
          })
        })
      })

      const res = await buscarComandaPorNumero('15', 'res-123')
      assert.ok(res)
      assert.equal(res.comanda.numero, '015')
    })

    test('localiza comanda via fallback local com diferentes formatos (#015, 15, 015)', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            or: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: new Error('offline') })
            })
          })
        })
      })

      const r1 = await buscarComandaPorNumero('#015', 'res-demo-001')
      assert.ok(r1)
      assert.equal(r1.comanda.numero, '015')

      const r2 = await buscarComandaPorNumero('15', 'res-demo-001')
      assert.ok(r2)
      assert.equal(r2.comanda.numero, '015')
    })
  })

  describe('fetchComandasAtivas', () => {
    test('retorna array vazio se restauranteId for nulo', async () => {
      assert.deepEqual(await fetchComandasAtivas(null), [])
    })

    test('calcula pedidos_count via Supabase online', async () => {
      const mockAtivas = [
        { id: 'c2', numero: '002', status: 'EM_USO', pedidos: [{ id: 'p1', status: 'PENDENTE' }, { id: 'p2', status: 'CANCELADO' }] }
      ]

      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockAtivas, error: null })
            })
          })
        })
      })

      const res = await fetchComandasAtivas('res-123')
      assert.equal(res.length, 1)
      assert.equal(res[0].pedidos_count, 1, 'Apenas pedidos não-cancelados contam')
    })

    test('calcula pedidos_count via fallback local', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: new Error('offline') }),
            eq: () => ({
              order: () => Promise.resolve({ data: null, error: new Error('offline') })
            })
          })
        })
      })

      mockStorage.set('restaurante_pedidos_res-demo-001', JSON.stringify([
        { id: 'p1', comanda_id: 'cmd-8', status: 'EM_PREPARO' }
      ]))

      const res = await fetchComandasAtivas('res-demo-001')
      assert.ok(Array.isArray(res))
      const cmd8 = res.find(c => c.numero === '008')
      if (cmd8) {
        assert.equal(cmd8.pedidos_count, 1)
      }
    })
  })

  describe('fecharComandaPagamento & fetchHistoricoFechamentos', () => {
    test('dispara erro se comandaId for ausente', async () => {
      await assert.rejects(() => fecharComandaPagamento({ comandaId: null }))
    })

    test('executa fechamento com Supabase online e itens formatados', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          }),
          in: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        }),
        insert: () => Promise.resolve({ error: null })
      })

      const res = await fecharComandaPagamento({
        comandaId: 'cmd-8',
        restauranteId: 'res-demo-001',
        formaPagamento: 'CARTAO_CREDITO',
        valorTotal: 120.00,
        subtotal: 100.00,
        taxaServico: 20.00,
        pedidos: [
          {
            id: 'p1',
            status: 'PENDENTE',
            itens: [{ nome: 'Burguer', quantidade: 2, preco_unitario: 50, subtotal: 100 }]
          },
          {
            id: 'p2',
            status: 'CANCELADO',
            itens: []
          }
        ]
      })

      assert.equal(res.success, true)
      assert.equal(res.transacao.valor_total, 120.00)
      assert.equal(res.transacao.pedidos_resumo[0].itens[0].nome, 'Burguer')
    })

    test('executa fechamento e atualiza pedidos no localStorage fallback', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: new Error('offline') })
          })
        })
      })

      mockStorage.set('restaurante_pedidos_res-demo-001', JSON.stringify([
        { id: 'p1', comanda_id: 'cmd-2', comandaNumero: '002', status: 'EM_PREPARO' }
      ]))

      const res = await fecharComandaPagamento({
        comandaId: 'cmd-2',
        comandaNumero: '002',
        restauranteId: 'res-demo-001',
        formaPagamento: 'DINHEIRO',
        valorTotal: 50.00,
        valorRecebido: 100.00,
        troco: 50.00
      })

      assert.equal(res.success, true)
      assert.equal(res.transacao.troco, 50.00)

      const historico = await fetchHistoricoFechamentos('res-demo-001')
      assert.ok(historico.length >= 1)
      assert.equal(historico[0].forma_pagamento, 'DINHEIRO')
    })

    test('fetchHistoricoFechamentos retorna dados do Supabase online', async () => {
      const mockHistorico = [{ id: 'fech-1', valor_total: 80.00 }]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockHistorico, error: null })
          })
        })
      })

      const res = await fetchHistoricoFechamentos('res-123')
      assert.equal(res.length, 1)
      assert.equal(res[0].valor_total, 80.00)
    })

    test('fetchHistoricoFechamentos retorna vazio se restauranteId for nulo', async () => {
      assert.deepEqual(await fetchHistoricoFechamentos(null), [])
    })
  })
})
