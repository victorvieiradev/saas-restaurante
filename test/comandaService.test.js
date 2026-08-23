import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

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

const VALID_REST_ID = '11111111-1111-4111-8111-111111111111'
const VALID_CMD_ID = '55555555-5555-4555-8555-555555555555'

describe('comandaService Unit Tests (Production)', () => {
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
    test('retorna array vazio se restauranteId for nulo ou inválido', async () => {
      assert.deepEqual(await fetchComandas(null), [])
      assert.deepEqual(await fetchComandas('invalido'), [])
    })

    test('retorna lista do Supabase quando online', async () => {
      const mockComandas = [{ id: VALID_CMD_ID, numero: '001', restaurante_id: VALID_REST_ID }]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockComandas, error: null })
          })
        })
      })

      const res = await fetchComandas(VALID_REST_ID)
      assert.equal(res.length, 1)
      assert.equal(res[0].numero, '001')
    })
  })

  describe('fetchComandaByToken', () => {
    test('retorna null se token for nulo ou vazio', async () => {
      assert.equal(await fetchComandaByToken(null), null)
      assert.equal(await fetchComandaByToken(''), null)
    })

    test('busca comanda no Supabase online com relação de restaurantes', async () => {
      const mockResult = {
        id: VALID_CMD_ID,
        numero: '001',
        qr_code_token: 'cmd_a1b2c3d4',
        restaurante_id: VALID_REST_ID,
        restaurantes: { id: VALID_REST_ID, nome: 'Restaurante Real', slug: 'restaurante-real' }
      }

      supabase.from = () => ({
        select: () => ({
          or: () => ({
            maybeSingle: () => Promise.resolve({ data: mockResult, error: null })
          })
        })
      })

      const res = await fetchComandaByToken('cmd_a1b2c3d4')
      assert.ok(res)
      assert.equal(res.comanda.numero, '001')
      assert.equal(res.restaurante.nome, 'Restaurante Real')
    })
  })

  describe('gerarLoteComandas', () => {
    test('valida parâmetros e cria registros no Supabase', async () => {
      supabase.from = (table) => {
        if (table === 'comandas') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null })
              })
            }),
            insert: (payload) => ({
              select: () => Promise.resolve({ data: payload.map(p => ({ ...p, id: VALID_CMD_ID })), error: null })
            })
          }
        }
      }

      const res = await gerarLoteComandas(VALID_REST_ID, 1, 3, 3)
      assert.equal(res.length, 3)
      assert.equal(res[0].numero, '001')
      assert.equal(res[1].numero, '002')
      assert.equal(res[2].numero, '003')
    })
  })

  describe('updateComandaStatus & deleteComanda', () => {
    test('updateComandaStatus atualiza status no Supabase', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => Promise.resolve({ data: [{ id: VALID_CMD_ID, status: 'EM_USO' }], error: null })
            })
          })
        })
      })

      const res = await updateComandaStatus(VALID_CMD_ID, VALID_REST_ID, 'EM_USO')
      assert.ok(res)
    })

    test('deleteComanda exclui comanda no Supabase', async () => {
      supabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })

      const res = await deleteComanda(VALID_CMD_ID, VALID_REST_ID)
      assert.equal(res, true)
    })
  })

  describe('buscarComandaPorNumero', () => {
    test('busca comanda por número no Supabase', async () => {
      const mockResult = {
        id: VALID_CMD_ID,
        numero: '015',
        qr_code_token: 'cmd_15token',
        restaurante_id: VALID_REST_ID,
        restaurantes: { id: VALID_REST_ID, nome: 'Restaurante Teste' }
      }

      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            or: () => ({
              maybeSingle: () => Promise.resolve({ data: mockResult, error: null })
            })
          })
        })
      })

      const res = await buscarComandaPorNumero('015', VALID_REST_ID)
      assert.ok(res)
      assert.equal(res.comanda.numero, '015')
    })
  })

  describe('fetchComandasAtivas', () => {
    test('retorna lista de comandas ativas', async () => {
      const mockCmds = [
        { id: VALID_CMD_ID, numero: '001', status: 'EM_USO', pedidos: [{ id: 'p1', status: 'PENDENTE' }] }
      ]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockCmds, error: null })
            })
          })
        })
      })

      const res = await fetchComandasAtivas(VALID_REST_ID)
      assert.equal(res.length, 1)
      assert.equal(res[0].pedidos_count, 1)
    })
  })

  describe('fecharComandaPagamento & fetchHistoricoFechamentos', () => {
    test('dispara erro se comandaId for ausente', async () => {
      await assert.rejects(() => fecharComandaPagamento({ comandaId: null, restauranteId: VALID_REST_ID }))
    })

    test('executa fechamento com Supabase online', async () => {
      supabase.from = (table) => {
        if (table === 'comandas') {
          return {
            update: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ error: null })
              })
            })
          }
        }
        if (table === 'pedidos') {
          return {
            update: () => ({
              in: () => ({
                eq: () => Promise.resolve({ error: null })
              })
            })
          }
        }
        if (table === 'pagamentos') {
          return {
            insert: () => Promise.resolve({ error: null })
          }
        }
        return {}
      }

      const res = await fecharComandaPagamento({
        comandaId: VALID_CMD_ID,
        restauranteId: VALID_REST_ID,
        formaPagamento: 'CARTAO_CREDITO',
        valorTotal: 120.00,
        subtotal: 100.00,
        taxaServico: 20.00,
        pedidos: []
      })

      assert.equal(res.success, true)
      assert.equal(res.transacao.valor_total, 120.00)
    })

    test('rejeita fechamento se gravação do pagamento falhar no Supabase', async () => {
      supabase.from = (table) => {
        if (table === 'comandas') {
          return {
            update: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ error: null })
              })
            })
          }
        }
        if (table === 'pagamentos') {
          return {
            insert: () => Promise.resolve({ error: new Error('Payment DB Error') })
          }
        }
        return {}
      }

      await assert.rejects(
        () => fecharComandaPagamento({
          comandaId: VALID_CMD_ID,
          restauranteId: VALID_REST_ID,
          formaPagamento: 'PIX',
          valorTotal: 50.00,
          subtotal: 50.00,
          pedidos: []
        }),
        /Payment DB Error/
      )
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

      const res = await fetchHistoricoFechamentos(VALID_REST_ID)
      assert.equal(res.length, 1)
      assert.equal(res[0].valor_total, 80.00)
    })

    test('fetchHistoricoFechamentos retorna vazio se restauranteId for nulo', async () => {
      assert.deepEqual(await fetchHistoricoFechamentos(null), [])
    })
  })
})
