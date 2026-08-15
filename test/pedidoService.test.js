import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const mockStorage = new Map()
const mockLocalStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
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
  criarPedido,
  fetchPedidosComanda,
  fetchPedidosKDS,
  subscribeToPedidosKDS,
  atualizarStatusPedido
} from '../src/services/pedidoService.js'

describe('pedidoService Unit Tests', () => {
  beforeEach(() => {
    mockStorage.clear()
  })

  describe('criarPedido', () => {
    test('dispara erro se parâmetros forem insuficientes', async () => {
      await assert.rejects(() => criarPedido({ restauranteId: null, cartItems: [] }))
    })

    test('insere pedido com itens via Supabase online', async () => {
      const mockPedido = { id: 'ped-1', status: 'PENDENTE', valor_total: 50.00 }
      const mockItens = [{ id: 'it-1', quantidade: 2, preco_unitario: 25.00 }]

      supabase.from = (table) => {
        if (table === 'pedidos') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockPedido, error: null })
              })
            })
          }
        }
        if (table === 'itens_pedido') {
          return {
            insert: () => ({
              select: () => Promise.resolve({ data: mockItens, error: null })
            })
          }
        }
        if (table === 'comandas') {
          return {
            update: () => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({ single: () => Promise.resolve({ error: null }) })
                })
              })
            })
          }
        }
      }

      const res = await criarPedido({
        restauranteId: 'res-123',
        comandaId: 'cmd-15',
        comandaNumero: '015',
        cartItems: [{ id: 'prod-1', quantidade: 2, preco: 25.00, observacao: 'Sem sal' }],
        valorTotal: 50.00,
        observacaoGeral: 'Mesa 1'
      })

      assert.equal(res.success, true)
      assert.equal(res.isMock, false)
      assert.equal(res.pedido.id, 'ped-1')
    })

    test('cria pedido via fallback local quando Supabase falhar', async () => {
      supabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        }),
        update: () => ({
          eq: () => ({ eq: () => Promise.resolve({ error: null }) })
        })
      })

      const res = await criarPedido({
        restauranteId: 'res-local',
        comandaId: 'cmd-02',
        comandaNumero: '002',
        cartItems: [{ id: 'prod-1', nome: 'Suco', quantidade: 1, preco: 10.00 }],
        valorTotal: 10.00
      })

      assert.equal(res.success, true)
      assert.equal(res.isMock, true)
      assert.equal(res.pedido.status, 'PENDENTE')
    })
  })

  describe('fetchPedidosComanda', () => {
    test('retorna array vazio se não houver comandaId nem comandaNumero', async () => {
      assert.deepEqual(await fetchPedidosComanda(null, 'res-123', null), [])
    })

    test('busca pedidos da comanda via Supabase online', async () => {
      const mockDbPedidos = [
        {
          id: 'p1',
          comanda_id: 'cmd-1',
          restaurante_id: 'res-123',
          status: 'PENDENTE',
          valor_total: 30.00,
          itens_pedido: [
            { id: 'it-1', quantidade: 1, preco_unitario: 30.00, produtos: { id: 'prod-1', nome: 'Prato Feito' } }
          ]
        }
      ]

      supabase.from = () => ({
        select: () => ({
          order: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: mockDbPedidos, error: null })
            })
          })
        })
      })

      const res = await fetchPedidosComanda('cmd-1', 'res-123')
      assert.equal(res.length, 1)
      assert.equal(res[0].itens[0].nome, 'Prato Feito')
    })

    test('busca pedidos da comanda via fallback local e filtra apenasAbertos', async () => {
      supabase.from = () => ({
        select: () => ({
          order: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: null, error: new Error('offline') })
            })
          })
        })
      })

      mockStorage.set('restaurante_pedidos_res-123', JSON.stringify([
        {
          id: 'p-aberto',
          comanda_id: 'c1',
          comandaNumero: '001',
          restaurante_id: 'res-123',
          status: 'EM_PREPARO',
          itens: [{ id: 'it-1', nome: 'Burger', quantidade: 1, preco_unitario: 30, subtotal: 30 }]
        },
        {
          id: 'p-pago',
          comanda_id: 'c1',
          comandaNumero: '001',
          restaurante_id: 'res-123',
          status: 'PAGO',
          pago: true
        }
      ]))

      const abertos = await fetchPedidosComanda('c1', 'res-123', '001', { apenasAbertos: true })
      assert.equal(abertos.length, 1)
      assert.equal(abertos[0].id, 'p-aberto')
      assert.equal(abertos[0].itens[0].preco_unitario, 30)

      const todos = await fetchPedidosComanda('c1', 'res-123', '001', { apenasAbertos: false })
      assert.equal(todos.length, 2)
    })
  })

  describe('fetchPedidosKDS & subscribeToPedidosKDS', () => {
    test('fetchPedidosKDS retorna dados do Supabase online', async () => {
      const mockKDS = [
        {
          id: 'pkds-1',
          status: 'PENDENTE',
          comandas: { numero: '015' },
          itens_pedido: [{ id: 'i1', quantidade: 2, preco_unitario: 10, produtos: { nome: 'Suco' } }]
        }
      ]

      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockKDS, error: null })
          })
        })
      })

      const res = await fetchPedidosKDS('res-123')
      assert.equal(res.length, 1)
      assert.equal(res[0].comandaNumero, '015')
    })

    test('fetchPedidosKDS gera seed demo no fallback local se não houver pedidos', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      const seed = await fetchPedidosKDS('res-demo-seed')
      assert.ok(Array.isArray(seed))
      assert.equal(seed.length, 3)
      assert.equal(seed[0].status, 'PENDENTE')
      assert.equal(seed[1].status, 'EM_PREPARO')
      assert.equal(seed[2].status, 'CONCLUIDO')
    })

    test('subscribeToPedidosKDS conecta canal Realtime, processa eventos INSERT e UPDATE e faz cleanup', () => {
      let insertCallback = null
      let updateCallback = null
      let statusCallback = null
      let channelRemoved = false

      supabase.channel = () => {
        return {
          on: function(eventType, config, cb) {
            if (config.event === 'INSERT') insertCallback = cb
            if (config.event === 'UPDATE') updateCallback = cb
            return this
          },
          subscribe: (fn) => { statusCallback = fn; if (fn) fn('SUBSCRIBED') }
        }
      }
      supabase.removeChannel = () => {
        channelRemoved = true
      }

      let capturedNew = null
      let capturedUpdated = null
      let capturedStatus = null

      const unsubscribe = subscribeToPedidosKDS('res-123', {
        onNewPedido: (p) => { capturedNew = p },
        onUpdatePedido: (p) => { capturedUpdated = p },
        onStatusChange: (s) => { capturedStatus = s }
      })

      assert.equal(capturedStatus, 'SUBSCRIBED')

      // Simular evento INSERT do Realtime
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'p-realtime',
                comandas: { numero: '007' },
                itens_pedido: [{ id: 'i-1', quantidade: 1, produtos: { nome: 'Drink' } }]
              }
            })
          })
        })
      })

      insertCallback({ new: { id: 'p-realtime' } })

      // Simular evento UPDATE do Realtime
      updateCallback({ new: { id: 'p-realtime', status: 'CONCLUIDO' } })
      assert.equal(capturedUpdated.status, 'CONCLUIDO')

      // Cleanup
      unsubscribe()
      assert.equal(channelRemoved, true)
    })

    test('subscribeToPedidosKDS retorna noop se restauranteId for nulo', () => {
      const unsub = subscribeToPedidosKDS(null)
      assert.doesNotThrow(unsub)
    })
  })

  describe('atualizarStatusPedido', () => {
    test('dispara erro se parâmetros forem inválidos', async () => {
      await assert.rejects(() => atualizarStatusPedido(null, 'STATUS_INVALIDO'))
      await assert.rejects(() => atualizarStatusPedido('p1', 'STATUS_INEXISTENTE'))
    })

    test('atualiza status no Supabase online e no fallback local', async () => {
      // Online
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'p1', status: 'EM_PREPARO' }, error: null })
              })
            })
          })
        })
      })

      const resOnline = await atualizarStatusPedido('p1', 'EM_PREPARO', 'res-123')
      assert.equal(resOnline.success, true)
      assert.equal(resOnline.pedido.status, 'EM_PREPARO')

      // Offline
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: new Error('offline') })
              })
            })
          })
        })
      })

      mockStorage.set('restaurante_pedidos_res-123', JSON.stringify([
        { id: 'p1', status: 'EM_PREPARO' }
      ]))

      const resOffline = await atualizarStatusPedido('p1', 'CONCLUIDO', 'res-123')
      assert.equal(resOffline.success, true)
      assert.equal(resOffline.pedido.status, 'CONCLUIDO')
    })
  })
})
