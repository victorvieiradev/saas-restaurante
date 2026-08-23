import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { supabase } from '../src/lib/supabase.js'
import {
  fetchRestauranteById,
  fetchRestauranteBySlug,
  updateRestaurantSubscription,
  getMockRestaurantWithSubscription
} from '../src/services/restaurantService.js'

const VALID_REST_ID = '11111111-1111-4111-8111-111111111111'
const INVALID_REST_ID = 'invalid-uuid-123'

describe('restaurantService Unit Tests', () => {
  let originalFrom

  beforeEach(() => {
    originalFrom = supabase.from
  })

  afterEach(() => {
    supabase.from = originalFrom
  })

  describe('fetchRestauranteById', () => {
    test('retorna null se restauranteId for nulo ou inválido', async () => {
      assert.equal(await fetchRestauranteById(null), null)
      assert.equal(await fetchRestauranteById(''), null)
      assert.equal(await fetchRestauranteById(INVALID_REST_ID), null)
    })

    test('recupera restaurante completo com campos de assinatura no Supabase', async () => {
      const mockRestaurant = {
        id: VALID_REST_ID,
        nome: 'Restaurante Gourmet Test',
        slug: 'gourmet-test',
        email: 'gourmet@test.com',
        plano: 'pro',
        status_assinatura: 'active',
        limite_pedidos_mes: 1000,
        pedidos_consumidos_mes: 150,
        data_fim_trial: '2026-09-01T00:00:00Z',
        cartao_ultimos_digitos: '4242',
        cartao_bandeira: 'VISA'
      }

      supabase.from = (table) => {
        assert.equal(table, 'restaurantes')
        return {
          select: () => ({
            eq: (col, val) => {
              assert.equal(col, 'id')
              assert.equal(val, VALID_REST_ID)
              return {
                maybeSingle: () => Promise.resolve({ data: mockRestaurant, error: null })
              }
            }
          })
        }
      }

      const res = await fetchRestauranteById(VALID_REST_ID)
      assert.notEqual(res, null)
      assert.equal(res.id, VALID_REST_ID)
      assert.equal(res.plano, 'pro')
      assert.equal(res.status_assinatura, 'active')
      assert.equal(res.limite_pedidos_mes, 1000)
      assert.equal(res.pedidos_consumidos_mes, 150)
      assert.equal(res.cartao_ultimos_digitos, '4242')
    })

    test('retorna fallback mock se consulta falhar ou restaurante for demo', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('Network error') })
          })
        })
      })

      const res = await fetchRestauranteById('a0000000-0000-0000-0000-000000000001')
      assert.notEqual(res, null)
      assert.equal(res.plano, 'starter')
      assert.equal(res.status_assinatura, 'trialing')
      assert.equal(res.limite_pedidos_mes, 300)

      const victorMock = await fetchRestauranteById('e1000000-0000-4000-8000-000000000001')
      assert.notEqual(victorMock, null)
      assert.equal(victorMock.nome, 'Bistrô & Grill do Victor')
      assert.equal(victorMock.slug, 'bistro-do-victor')
    })
  })

  describe('fetchRestauranteBySlug', () => {
    test('retorna null se slug for vazio', async () => {
      assert.equal(await fetchRestauranteBySlug(''), null)
      assert.equal(await fetchRestauranteBySlug(null), null)
    })

    test('busca restaurante por slug com sucesso', async () => {
      const mockRestaurant = {
        id: VALID_REST_ID,
        nome: 'Bistrô do Victor',
        slug: 'bistro-do-victor',
        plano: 'starter',
        status_assinatura: 'trialing'
      }

      supabase.from = (table) => {
        assert.equal(table, 'restaurantes')
        return {
          select: () => ({
            eq: (col, val) => {
              assert.equal(col, 'slug')
              assert.equal(val, 'bistro-do-victor')
              return {
                maybeSingle: () => Promise.resolve({ data: mockRestaurant, error: null })
              }
            }
          })
        }
      }

      const res = await fetchRestauranteBySlug('bistro-do-victor')
      assert.equal(res.slug, 'bistro-do-victor')
      assert.equal(res.plano, 'starter')
    })
  })

  describe('updateRestaurantSubscription', () => {
    test('rejeita atualização se restauranteId for inválido', async () => {
      const { data, error } = await updateRestaurantSubscription(INVALID_REST_ID, { plano: 'pro' })
      assert.equal(data, null)
      assert.notEqual(error, null)
    })

    test('rejeita payload vazio ou com campos não permitidos', async () => {
      const { data, error } = await updateRestaurantSubscription(VALID_REST_ID, { campo_invalido: 'teste' })
      assert.equal(data, null)
      assert.notEqual(error, null)
    })

    test('atualiza dados de assinatura com sucesso no Supabase com campos sanitizados', async () => {
      const updatePayload = {
        plano: 'scale',
        status_assinatura: 'active',
        limite_pedidos_mes: 3000,
        asaas_customer_id: 'cus_000123',
        asaas_subscription_id: 'sub_000456',
        cartao_ultimos_digitos: '8888',
        cartao_bandeira: 'MASTERCARD',
        injetado: 'deve-ser-ignorado'
      }

      supabase.from = (table) => {
        assert.equal(table, 'restaurantes')
        return {
          update: (payload) => {
            assert.equal(payload.plano, 'scale')
            assert.equal(payload.status_assinatura, 'active')
            assert.equal(payload.limite_pedidos_mes, 3000)
            assert.equal(payload.injetado, undefined)
            return {
              eq: (col, val) => {
                assert.equal(col, 'id')
                assert.equal(val, VALID_REST_ID)
                return {
                  select: () => ({
                    single: () => Promise.resolve({ data: { id: VALID_REST_ID, ...payload }, error: null })
                  })
                }
              }
            }
          }
        }
      }

      const { data, error } = await updateRestaurantSubscription(VALID_REST_ID, updatePayload)
      assert.equal(error, null)
      assert.equal(data.plano, 'scale')
      assert.equal(data.status_assinatura, 'active')
      assert.equal(data.limite_pedidos_mes, 3000)
    })
  })

  describe('getMockRestaurantWithSubscription', () => {
    test('fornece estrutura de dados com campos de trial e limites padrão', () => {
      const mock = getMockRestaurantWithSubscription(VALID_REST_ID)
      assert.equal(mock.id, VALID_REST_ID)
      assert.equal(mock.plano, 'starter')
      assert.equal(mock.status_assinatura, 'trialing')
      assert.equal(mock.limite_pedidos_mes, 300)
      assert.equal(typeof mock.pedidos_consumidos_mes, 'number')
      assert.ok(mock.data_fim_trial)
    })
  })
})
