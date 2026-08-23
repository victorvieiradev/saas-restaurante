import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { supabase } from '../src/lib/supabase.js'
import {
  fetchFaturas,
  fetchSubscriptionStatus,
  saveFatura,
  MOCK_FATURAS,
  PLANS_CONFIG
} from '../src/services/subscriptionService.js'

const VALID_REST_ID = '11111111-1111-4111-8111-111111111111'
const INVALID_REST_ID = 'invalid-uuid-123'

describe('subscriptionService Unit Tests', () => {
  let originalFrom

  beforeEach(() => {
    originalFrom = supabase.from
  })

  afterEach(() => {
    supabase.from = originalFrom
  })

  describe('fetchFaturas', () => {
    test('retorna array vazio se restauranteId for inválido', async () => {
      const res = await fetchFaturas(INVALID_REST_ID)
      assert.deepEqual(res.data, [])
      assert.equal(res.error, null)
    })

    test('busca faturas ordenadas do Supabase', async () => {
      const mockFaturasList = [
        {
          id: 'fatura-001',
          restaurante_id: VALID_REST_ID,
          asaas_payment_id: 'pay_001',
          valor: 97.00,
          forma_pagamento: 'CREDIT_CARD',
          status: 'CONFIRMED',
          data_vencimento: '2026-08-10',
          created_at: '2026-08-10T10:00:00Z'
        },
        {
          id: 'fatura-002',
          restaurante_id: VALID_REST_ID,
          asaas_payment_id: 'pay_002',
          valor: 97.00,
          forma_pagamento: 'CREDIT_CARD',
          status: 'PENDING',
          data_vencimento: '2026-09-10',
          created_at: '2026-08-20T10:00:00Z'
        }
      ]

      supabase.from = (table) => {
        assert.equal(table, 'faturas')
        return {
          select: () => ({
            eq: (col, val) => {
              assert.equal(col, 'restaurante_id')
              assert.equal(val, VALID_REST_ID)
              return {
                order: (orderCol, { ascending }) => {
                  assert.equal(orderCol, 'created_at')
                  assert.equal(ascending, false)
                  return Promise.resolve({ data: mockFaturasList, error: null })
                }
              }
            }
          })
        }
      }

      const res = await fetchFaturas(VALID_REST_ID)
      assert.equal(res.data.length, 2)
      assert.equal(res.data[0].id, 'fatura-001')
      assert.equal(res.error, null)
    })

    test('usa fallback mock de faturas se Supabase falhar', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: new Error('Network error') })
          })
        })
      })

      const res = await fetchFaturas('a0000000-0000-0000-0000-000000000001')
      assert.ok(Array.isArray(res.data))
      assert.ok(res.data.length > 0)
      assert.equal(res.isMock, true)
    })
  })

  describe('fetchSubscriptionStatus', () => {
    test('retorna status padrão e cálculo de trial/consumo', async () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()

      const mockRest = {
        id: VALID_REST_ID,
        nome: 'Restaurante Teste',
        plano: 'Starter',
        status_assinatura: 'trialing',
        limite_pedidos_mes: 300,
        pedidos_consumidos_mes: 60,
        data_inicio_ciclo: now.toISOString(),
        data_fim_trial: futureDate,
        cartao_ultimos_digitos: '1234',
        cartao_bandeira: 'MASTERCARD'
      }

      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: mockRest, error: null })
              })
            })
          }
        }
        if (table === 'faturas') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null })
              })
            })
          }
        }
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.notEqual(status, null)
      assert.equal(status.plano, 'starter')
      assert.equal(status.status_assinatura, 'trialing')
      assert.equal(status.limite_pedidos_mes, 300)
      assert.equal(status.pedidos_consumidos_mes, 60)
      assert.equal(status.percentual_consumido, 20) // 60 / 300 = 20%
      assert.ok(status.dias_restantes_trial >= 9 && status.dias_restantes_trial <= 11)
      assert.equal(status.is_trial, true)
      assert.equal(status.is_bloqueado, false)
    })

    test('trata plano Enterprise ilimitado sem limite fixo', async () => {
      const mockRest = {
        id: VALID_REST_ID,
        plano: 'enterprise',
        status_assinatura: 'active',
        limite_pedidos_mes: null,
        pedidos_consumidos_mes: 5000
      }

      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockRest, error: null })
          })
        })
      })

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.equal(status.limite_pedidos_mes, null)
      assert.equal(status.percentual_consumido, 0)
      assert.equal(status.limite_excedido, false)
      assert.equal(status.pedidos_restantes, null)
    })

    test('trata data_fim_trial inválida sem gerar NaN', async () => {
      const mockRest = {
        id: VALID_REST_ID,
        plano: 'starter',
        status_assinatura: 'trialing',
        data_fim_trial: 'data-invalida'
      }

      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockRest, error: null })
          })
        })
      })

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.equal(status.dias_restantes_trial, 0)
    })

    test('detecta limite excedido ou status vencido/cancelado', async () => {
      const mockRest = {
        id: VALID_REST_ID,
        plano: 'starter',
        status_assinatura: 'past_due',
        limite_pedidos_mes: 300,
        pedidos_consumidos_mes: 305
      }

      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: mockRest, error: null })
              })
            })
          }
        }
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.equal(status.is_bloqueado, true)
      assert.equal(status.limite_excedido, true)
      assert.equal(status.percentual_consumido, 100)
    })
  })

  describe('saveFatura', () => {
    test('rejeita fatura com dados ou restauranteId inválido', async () => {
      const { data, error } = await saveFatura(null, VALID_REST_ID)
      assert.equal(data, null)
      assert.notEqual(error, null)

      const res2 = await saveFatura({ valor: 'abc' }, INVALID_REST_ID)
      assert.equal(res2.data, null)
      assert.notEqual(res2.error, null)
    })

    test('permite fatura promocional/gratuita com valor zero', async () => {
      supabase.from = () => ({
        upsert: (payload) => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'fat-zero', ...payload }, error: null })
          })
        })
      })

      const { data, error } = await saveFatura({ valor: 0 }, VALID_REST_ID)
      assert.equal(error, null)
      assert.equal(data.valor, 0)
    })

    test('salva ou atualiza fatura no Supabase com sucesso', async () => {
      const faturaPayload = {
        asaas_payment_id: 'pay_asaas_999',
        valor: 197.00,
        forma_pagamento: 'CREDIT_CARD',
        status: 'CONFIRMED',
        url_fatura: 'https://asaas.com/i/999',
        data_vencimento: '2026-09-01'
      }

      supabase.from = (table) => {
        assert.equal(table, 'faturas')
        return {
          upsert: (payload, opts) => {
            assert.equal(opts.onConflict, 'asaas_payment_id')
            return {
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'fat-uuid-999', restaurante_id: VALID_REST_ID, ...payload },
                  error: null
                })
              })
            }
          }
        }
      }

      const { data, error } = await saveFatura(faturaPayload, VALID_REST_ID)
      assert.equal(error, null)
      assert.equal(data.asaas_payment_id, 'pay_asaas_999')
      assert.equal(data.status, 'CONFIRMED')
      assert.equal(data.valor, 197.00)
    })
  })

  describe('Constantes e Configurações de Planos', () => {
    test('PLANS_CONFIG possui os planos previstos no PRD/Story', () => {
      assert.ok(PLANS_CONFIG.starter)
      assert.ok(PLANS_CONFIG.pro)
      assert.ok(PLANS_CONFIG.scale)
      assert.equal(PLANS_CONFIG.starter.limite_pedidos, 300)
      assert.equal(PLANS_CONFIG.pro.limite_pedidos, 1000)
      assert.equal(PLANS_CONFIG.scale.limite_pedidos, 3000)
    })

    test('MOCK_FATURAS exporta faturas padrão válidas', () => {
      assert.ok(Array.isArray(MOCK_FATURAS))
      assert.ok(MOCK_FATURAS.length > 0)
      assert.ok(MOCK_FATURAS[0].status)
      assert.ok(MOCK_FATURAS[0].valor > 0)
    })
  })
})
