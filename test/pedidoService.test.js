import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

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

const VALID_REST_ID = '11111111-1111-4111-8111-111111111111'
const VALID_CMD_ID = '55555555-5555-4555-8555-555555555555'
const VALID_PED_ID = '66666666-6666-4666-8666-666666666666'
const VALID_PROD_ID = '77777777-7777-4777-8777-777777777777'

describe('pedidoService Unit Tests (Production)', () => {
  describe('criarPedido', () => {
    test('dispara erro se parâmetros forem insuficientes ou não-UUID', async () => {
      await assert.rejects(() => criarPedido({ restauranteId: null, cartItems: [] }))
      await assert.rejects(() => criarPedido({ restauranteId: 'invalido', comandaId: VALID_CMD_ID, cartItems: [{ id: VALID_PROD_ID, quantidade: 1, preco: 10 }] }))
    })

    test('insere pedido com itens via Supabase online', async () => {
      const mockPedido = { id: VALID_PED_ID, status: 'PENDENTE', valor_total: 50.00, restaurante_id: VALID_REST_ID, comanda_id: VALID_CMD_ID }
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
                  select: () => Promise.resolve({ data: [{ id: VALID_CMD_ID, status: 'EM_USO' }], error: null })
                })
              })
            })
          }
        }
        return {}
      }

      const res = await criarPedido({
        restauranteId: VALID_REST_ID,
        comandaId: VALID_CMD_ID,
        comandaNumero: '015',
        cartItems: [{ id: VALID_PROD_ID, quantidade: 2, preco: 25.00, observacao: 'Sem sal' }],
        valorTotal: 50.00,
        observacaoGeral: 'Mesa 1'
      })

      assert.equal(res.success, true)
      assert.equal(res.isMock, false)
      assert.equal(res.pedido.id, VALID_PED_ID)
    })

    test('rejeita criação se inserção de itens falhar no Supabase', async () => {
      supabase.from = (table) => {
        if (table === 'pedidos') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: VALID_PED_ID }, error: null })
              })
            })
          }
        }
        if (table === 'itens_pedido') {
          return {
            insert: () => ({
              select: () => Promise.resolve({ data: null, error: new Error('DB Constraint Violation') })
            })
          }
        }
        return {}
      }

      await assert.rejects(
        () => criarPedido({
          restauranteId: VALID_REST_ID,
          comandaId: VALID_CMD_ID,
          cartItems: [{ id: VALID_PROD_ID, quantidade: 1, preco: 10 }]
        }),
        /DB Constraint Violation/
      )
    })
  })

  describe('fetchPedidosComanda', () => {
    test('retorna array vazio para comandaId inválido', async () => {
      assert.deepEqual(await fetchPedidosComanda(null), [])
      assert.deepEqual(await fetchPedidosComanda('invalido'), [])
    })

    test('busca pedidos da comanda via Supabase online', async () => {
      const mockData = [
        {
          id: VALID_PED_ID,
          restaurante_id: VALID_REST_ID,
          comanda_id: VALID_CMD_ID,
          status: 'PENDENTE',
          valor_total: 50.00,
          itens_pedido: [
            {
              id: 'it-1',
              quantidade: 2,
              preco_unitario: 25.00,
              produtos: { id: VALID_PROD_ID, nome: 'Hambúrguer Gourmet', preco: 25.00 }
            }
          ]
        }
      ]

      supabase.from = () => ({
        select: () => ({
          order: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: mockData, error: null })
            })
          })
        })
      })

      const res = await fetchPedidosComanda(VALID_CMD_ID, VALID_REST_ID)
      assert.equal(res.length, 1)
      assert.equal(res[0].itens[0].nome, 'Hambúrguer Gourmet')
    })
  })

  describe('fetchPedidosKDS', () => {
    test('fetchPedidosKDS retorna dados do Supabase online', async () => {
      const mockData = [
        {
          id: VALID_PED_ID,
          restaurante_id: VALID_REST_ID,
          comandas: { numero: '015', qr_code_token: 'cmd_15' },
          itens_pedido: [{ id: 'it-1', quantidade: 1, preco_unitario: 30, produtos: { nome: 'Pizza' } }]
        }
      ]

      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockData, error: null })
          })
        })
      })

      const res = await fetchPedidosKDS(VALID_REST_ID)
      assert.equal(res.length, 1)
      assert.equal(res[0].comandaNumero, '015')
    })
  })

  describe('subscribeToPedidosKDS & atualizarStatusPedido', () => {
    test('subscribeToPedidosKDS conecta canal Realtime para restaurante válido', () => {
      let statusCallback = null
      supabase.channel = () => ({
        on: function() { return this },
        subscribe: (cb) => {
          statusCallback = cb
          cb('SUBSCRIBED')
        }
      })
      supabase.removeChannel = () => {}

      let currentStatus = null
      const unsub = subscribeToPedidosKDS(VALID_REST_ID, {
        onStatusChange: (s) => { currentStatus = s }
      })

      assert.equal(currentStatus, 'SUBSCRIBED')
      assert.equal(typeof unsub, 'function')
    })

    test('subscribeToPedidosKDS retorna noop se restauranteId for nulo', () => {
      const unsub = subscribeToPedidosKDS(null)
      assert.doesNotThrow(unsub)
    })

    test('dispara erro se parâmetros forem inválidos', async () => {
      await assert.rejects(() => atualizarStatusPedido(null, 'STATUS_INVALIDO', VALID_REST_ID))
      await assert.rejects(() => atualizarStatusPedido(VALID_PED_ID, 'STATUS_INEXISTENTE', VALID_REST_ID))
    })

    test('atualiza status no Supabase online', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: VALID_PED_ID, status: 'EM_PREPARO' }, error: null })
              })
            })
          })
        })
      })

      const res = await atualizarStatusPedido(VALID_PED_ID, 'EM_PREPARO', VALID_REST_ID)
      assert.equal(res.success, true)
      assert.equal(res.pedido.status, 'EM_PREPARO')
    })
  })
})
