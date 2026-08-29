import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { supabase } from '../src/lib/supabase.js'
import {
  fetchSubscriptionStatus,
  upgradeSubscription,
  PLANS_CONFIG
} from '../src/services/subscriptionService.js'

const VALID_REST_ID = '33333333-3333-4333-8333-333333333333'
const INVALID_REST_ID = 'invalid-id-xyz'

describe('Story 7.5: Gestão e Alerta de Limites de Pedidos & Upgrade de Plano', () => {
  let originalFrom
  const proto = Object.getPrototypeOf(supabase)
  const originalFunctionsDescriptor = Object.getOwnPropertyDescriptor(proto, 'functions') ||
    Object.getOwnPropertyDescriptor(supabase, 'functions')

  beforeEach(() => {
    originalFrom = supabase.from
  })

  afterEach(() => {
    supabase.from = originalFrom
    if (originalFunctionsDescriptor) {
      Object.defineProperty(proto, 'functions', originalFunctionsDescriptor)
      delete supabase.functions
    }
  })

  describe('AC1: Widget e Cálculo de Consumo de Pedidos (OrderUsageBar)', () => {
    test('calcula percentual de consumo e pedidos restantes com precisão para plano Starter (300 pedidos)', async () => {
      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_REST_ID,
                    nome: 'Bistrô Teste',
                    plano: 'starter',
                    status_assinatura: 'active',
                    limite_pedidos_mes: 300,
                    pedidos_consumidos_mes: 150,
                    data_inicio_ciclo: '2026-08-01T00:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          }
        }
        return originalFrom(table)
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.ok(status)
      assert.equal(status.plano, 'starter')
      assert.equal(status.limite_pedidos_mes, 300)
      assert.equal(status.pedidos_consumidos_mes, 150)
      assert.equal(status.pedidos_restantes, 150)
      assert.equal(status.percentual_consumido, 50)
      assert.equal(status.alerta_80, false)
      assert.equal(status.alerta_100, false)
      assert.ok(status.data_renovacao_ciclo)
    })

    test('trata plano Enterprise ou sem limite como volume ilimitado (0% ou nulo)', async () => {
      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_REST_ID,
                    nome: 'Rede Gastronômica',
                    plano: 'enterprise',
                    status_assinatura: 'active',
                    limite_pedidos_mes: null,
                    pedidos_consumidos_mes: 5420,
                    data_inicio_ciclo: '2026-08-01T00:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          }
        }
        return originalFrom(table)
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.ok(status)
      assert.equal(status.limite_pedidos_mes, null)
      assert.equal(status.pedidos_consumidos_mes, 5420)
      assert.equal(status.percentual_consumido, 0)
      assert.equal(status.alerta_80, false)
      assert.equal(status.alerta_100, false)
    })
  })

  describe('AC2: Alerta Amigável de Consumo em 80% (Warning)', () => {
    test('ativa flag de alerta de 80% quando consumo atinge 240 de 300 pedidos (80%)', async () => {
      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_REST_ID,
                    nome: 'Café Expresso',
                    plano: 'starter',
                    status_assinatura: 'active',
                    limite_pedidos_mes: 300,
                    pedidos_consumidos_mes: 240,
                    data_inicio_ciclo: '2026-08-01T00:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          }
        }
        return originalFrom(table)
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.ok(status)
      assert.equal(status.percentual_consumido, 80)
      assert.equal(status.alerta_80, true)
      assert.equal(status.alerta_100, false)
      assert.equal(status.pedidos_restantes, 60)
    })

    test('ativa flag de alerta de 80% para consumo intermediário (ex: 88%)', async () => {
      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_REST_ID,
                    nome: 'Pizzaria Bella',
                    plano: 'pro',
                    status_assinatura: 'active',
                    limite_pedidos_mes: 1200,
                    pedidos_consumidos_mes: 1056, // 88%
                    data_inicio_ciclo: '2026-08-01T00:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          }
        }
        return originalFrom(table)
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.ok(status)
      assert.equal(status.percentual_consumido, 88)
      assert.equal(status.alerta_80, true)
      assert.equal(status.alerta_100, false)
    })
  })

  describe('AC3: Alerta de Limite Atingido em 100% & Fair Use Policy', () => {
    test('ativa flag de alerta de 100% e limite excedido quando consumo atinge 300 de 300 pedidos', async () => {
      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_REST_ID,
                    nome: 'Burger King Mock',
                    plano: 'starter',
                    status_assinatura: 'active',
                    limite_pedidos_mes: 300,
                    pedidos_consumidos_mes: 300,
                    data_inicio_ciclo: '2026-08-01T00:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          }
        }
        return originalFrom(table)
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.ok(status)
      assert.equal(status.percentual_consumido, 100)
      assert.equal(status.limite_excedido, true)
      assert.equal(status.alerta_100, true)
      assert.equal(status.alerta_80, false) // 100% sobrepõe o aviso de 80%
      assert.equal(status.pedidos_restantes, 0)
      // Garantia de Fair Use: não bloqueia o restaurante (is_bloqueado deve permanecer false se assinatura estiver ativa)
      assert.equal(status.is_bloqueado, false)
    })

    test('mantém funcionamento normal se consumo ultrapassar 100% (ex: 320 pedidos) sem travar salão', async () => {
      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_REST_ID,
                    nome: 'Hamburgueria Pico do Almoço',
                    plano: 'starter',
                    status_assinatura: 'active',
                    limite_pedidos_mes: 300,
                    pedidos_consumidos_mes: 320,
                    data_inicio_ciclo: '2026-08-01T00:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          }
        }
        return originalFrom(table)
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.ok(status)
      assert.equal(status.percentual_consumido, 100) // cap visual em 100%
      assert.equal(status.limite_excedido, true)
      assert.equal(status.alerta_100, true)
      assert.equal(status.is_bloqueado, false) // Fair use: ZERO DOWNTIME operacional
    })
  })

  describe('AC4: Modal e Serviço de Upgrade de Plano (upgradeSubscription)', () => {
    test('rejeita upgrade com ID de restaurante ou plano inválido', async () => {
      const res1 = await upgradeSubscription(INVALID_REST_ID, 'pro')
      assert.ok(res1.error)

      const res2 = await upgradeSubscription(VALID_REST_ID, 'plano_inexistente')
      assert.ok(res2.error)
    })

    test('realiza upgrade de Starter para Pro atualizando limite para 1.200 pedidos', async () => {
      let updatedPayload = null

      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            update: (payload) => {
              updatedPayload = payload
              return {
                eq: () => ({
                  select: () => ({
                    single: async () => ({
                      data: {
                        id: VALID_REST_ID,
                        plano: 'pro',
                        limite_pedidos_mes: 1200,
                        status_assinatura: 'active'
                      },
                      error: null
                    })
                  })
                })
              }
            }
          }
        }
        return originalFrom(table)
      }

      const result = await upgradeSubscription(VALID_REST_ID, 'pro')
      assert.equal(result.error, null)
      assert.ok(result.data)
      assert.equal(result.data.success, true)
      assert.equal(result.data.plano, 'pro')
      assert.equal(result.data.limite_pedidos_mes, 1200)
      assert.equal(updatedPayload.plano, 'pro')
      assert.equal(updatedPayload.limite_pedidos_mes, 1200)
    })

    test('realiza upgrade de Pro para Scale atualizando limite para 3.500 pedidos', async () => {
      let updatedPayload = null

      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            update: (payload) => {
              updatedPayload = payload
              return {
                eq: () => ({
                  select: () => ({
                    single: async () => ({
                      data: {
                        id: VALID_REST_ID,
                        plano: 'scale',
                        limite_pedidos_mes: 3500,
                        status_assinatura: 'active'
                      },
                      error: null
                    })
                  })
                })
              }
            }
          }
        }
        return originalFrom(table)
      }

      const result = await upgradeSubscription(VALID_REST_ID, 'scale')
      assert.equal(result.error, null)
      assert.ok(result.data)
      assert.equal(result.data.success, true)
      assert.equal(result.data.plano, 'scale')
      assert.equal(result.data.limite_pedidos_mes, 3500)
      assert.equal(updatedPayload.plano, 'scale')
      assert.equal(updatedPayload.limite_pedidos_mes, 3500)
    })

    test('invoca Edge Function upgrade-subscription com sucesso quando online', async () => {
      let calledFunction = null
      let calledBody = null

      Object.defineProperty(supabase, 'functions', {
        value: {
          invoke: async (fnName, options) => {
            calledFunction = fnName
            calledBody = options?.body
            return {
              data: {
                success: true,
                restauranteId: VALID_REST_ID,
                plano: 'pro',
                limite_pedidos_mes: 1200
              },
              error: null
            }
          }
        },
        configurable: true,
        writable: true
      })

      const result = await upgradeSubscription(VALID_REST_ID, 'pro', { ciclo: 'MONTHLY' })
      assert.equal(result.error, null)
      assert.equal(result.isMock, false)
      assert.equal(calledFunction, 'upgrade-subscription')
      assert.equal(calledBody.restauranteId, VALID_REST_ID)
      assert.equal(calledBody.plano, 'pro')
    })
  })

  describe('Edge Cases & Boundary Validations', () => {
    test('calcula limites e cores de alerta para faixas 69%, 70%, 89% e 90%', () => {
      const getThresholdCategory = (consumed, limit) => {
        const pct = Math.min(100, Math.round((consumed / limit) * 100))
        if (pct >= 90) return 'danger'
        if (pct >= 70) return 'warning'
        return 'success'
      }

      assert.equal(getThresholdCategory(207, 300), 'success') // 69%
      assert.equal(getThresholdCategory(210, 300), 'warning') // 70%
      assert.equal(getThresholdCategory(267, 300), 'warning') // 89%
      assert.equal(getThresholdCategory(270, 300), 'danger')  // 90%
      assert.equal(getThresholdCategory(300, 300), 'danger')  // 100%
    })

    test('retorna nulo quando ID do restaurante não for informado no fetchSubscriptionStatus', async () => {
      const resNull = await fetchSubscriptionStatus(null)
      assert.equal(resNull, null)

      const resInvalid = await fetchSubscriptionStatus(INVALID_REST_ID)
      assert.equal(resInvalid, null)
    })

    test('trata pedidos_consumidos_mes não numérico ou NaN sem quebrar o cálculo', async () => {
      supabase.from = (table) => {
        if (table === 'restaurantes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_REST_ID,
                    nome: 'Restaurante Teste',
                    plano: 'starter',
                    status_assinatura: 'active',
                    limite_pedidos_mes: 300,
                    pedidos_consumidos_mes: 'invalid-string',
                    data_inicio_ciclo: '2026-08-01T00:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          }
        }
        return originalFrom(table)
      }

      const status = await fetchSubscriptionStatus(VALID_REST_ID)
      assert.ok(status)
      assert.equal(status.pedidos_consumidos_mes, 0)
      assert.equal(status.percentual_consumido, 0)
      assert.equal(Number.isNaN(status.percentual_consumido), false)
    })

    test('retorna erro se Edge Function upgrade-subscription retornar success: false por recusa de cartão', async () => {
      Object.defineProperty(supabase, 'functions', {
        value: {
          invoke: async () => ({
            data: {
              success: false,
              message: 'Transação não autorizada pela operadora do cartão.'
            },
            error: null
          })
        },
        configurable: true,
        writable: true
      })

      const res = await upgradeSubscription(VALID_REST_ID, 'pro')
      assert.equal(res.data, null)
      assert.ok(res.error)
      assert.match(res.error.message, /operadora/i)
    })
  })
})


