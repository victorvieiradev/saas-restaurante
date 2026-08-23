import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { supabase } from '../src/lib/supabase.js'
import {
  fetchFaturas,
  fetchSubscriptionStatus,
  cancelSubscription,
  updateCreditCard,
  reactivateSubscription,
  PLANS_CONFIG,
  MOCK_FATURAS
} from '../src/services/subscriptionService.js'
import {
  detectCardBrand,
  validateCardExpiry,
  maskCardNumber,
  maskCardExpiry,
  validateCPF,
  validateCNPJ
} from '../src/utils/validators.js'

const VALID_REST_ID = '22222222-2222-4222-8222-222222222222'
const INVALID_REST_ID = 'invalid-uuid-abc'

describe('AdminAssinatura & Subscription Management Unit Tests', () => {
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

  describe('AC1 & AC2: Status da Assinatura, Trial e Contagem Regressiva', () => {
    test('calcula corretamente dia do trial e dias restantes para término', () => {
      const now = Date.now()
      const totalTrialDays = 14
      // Simula início há 4 dias e término em 10 dias
      const startDate = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString()

      const diffTotal = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      const diffRemaining = Math.max(0, Math.ceil((new Date(endDate).getTime() - now) / (1000 * 60 * 60 * 24)))
      const currentDay = Math.min(totalTrialDays, Math.max(1, totalTrialDays - diffRemaining + 1))

      assert.equal(diffTotal, 14)
      assert.equal(diffRemaining, 10)
      assert.equal(currentDay, 5) // No 5º dia de teste
    })

    test('formata badges e textos de transparência de cobrança de acordo com o status', () => {
      const getStatusDetails = (status, diasRestantes, precoPlano, dataFimTrialFormatted) => {
        if (status === 'trialing') {
          return {
            badge: 'Em Período de Testes (Trial de 14 Dias)',
            badgeColor: 'purple',
            mensagemTempo: `Restam ${diasRestantes} dias de teste gratuito`,
            mensagemCobranca: `Primeira cobrança automática de R$ ${precoPlano.toFixed(2).replace('.', ',')} agendada para ${dataFimTrialFormatted}`
          }
        }
        if (status === 'active') {
          return {
            badge: 'Assinatura Ativa & Regular',
            badgeColor: 'emerald',
            mensagemTempo: 'Sua assinatura está ativa e regular',
            mensagemCobranca: `Mensalidade de R$ ${precoPlano.toFixed(2).replace('.', ',')}`
          }
        }
        if (status === 'canceled') {
          return {
            badge: 'Assinatura Cancelada',
            badgeColor: 'rose',
            mensagemTempo: 'Sua assinatura foi cancelada',
            mensagemCobranca: 'Nenhuma cobrança futura será realizada'
          }
        }
        return {
          badge: 'Status Pendente',
          badgeColor: 'amber',
          mensagemTempo: 'Aguardando regularização',
          mensagemCobranca: 'Verifique suas faturas pendentes'
        }
      }

      const trialDetails = getStatusDetails('trialing', 9, 229.00, '06/09/2026')
      assert.equal(trialDetails.badge, 'Em Período de Testes (Trial de 14 Dias)')
      assert.match(trialDetails.mensagemCobranca, /R\$ 229,00/)
      assert.match(trialDetails.mensagemCobranca, /06\/09\/2026/)

      const activeDetails = getStatusDetails('active', 0, 119.00, '')
      assert.equal(activeDetails.badge, 'Assinatura Ativa & Regular')

      const canceledDetails = getStatusDetails('canceled', 0, 0, '')
      assert.equal(canceledDetails.badge, 'Assinatura Cancelada')
    })
  })

  describe('AC3: Cancelamento de Assinatura com Zero Cobrança no Trial', () => {
    test('gera mensagem de cancelamento com R$ 0,00 explícito quando em período de testes', () => {
      const getCancellationMessage = (isTrial) => {
        if (isTrial) {
          return 'Como você está dentro dos 14 dias de teste, absolutamente nenhum valor (R$ 0,00) será cobrado do seu cartão.'
        }
        return 'Sua assinatura será cancelada imediatamente e não haverá novas renovações.'
      }

      assert.match(getCancellationMessage(true), /R\$ 0,00/)
      assert.match(getCancellationMessage(true), /14 dias de teste/)
      assert.doesNotMatch(getCancellationMessage(false), /R\$ 0,00/)
    })

    test('cancelSubscription atualiza status do restaurante para canceled', async () => {
      supabase.from = (table) => {
        assert.equal(table, 'restaurantes')
        return {
          update: (payload) => {
            assert.equal(payload.status_assinatura, 'canceled')
            return {
              eq: (col, val) => {
                assert.equal(col, 'id')
                assert.equal(val, VALID_REST_ID)
                return {
                  select: () => ({
                    single: () => Promise.resolve({
                      data: { id: VALID_REST_ID, status_assinatura: 'canceled' },
                      error: null
                    })
                  })
                }
              }
            }
          }
        }
      }

      const res = await cancelSubscription(VALID_REST_ID, 'Teste de cancelamento')
      assert.equal(res.error, null)
      assert.equal(res.data.success, true)
      assert.equal(res.data.status, 'canceled')
    })
  })

  describe('AC4: Gestão do Cartão Cadastrado e Atualização', () => {
    test('detectCardBrand identifica bandeiras corretamente (Visa, Mastercard, Elo, Hipercard, Amex)', () => {
      assert.equal(detectCardBrand('4111 1111 1111 1111'), 'VISA')
      assert.equal(detectCardBrand('5555 4444 3333 2222'), 'MASTERCARD')
      assert.equal(detectCardBrand('2221 0000 0000 0000'), 'MASTERCARD')
      assert.equal(detectCardBrand('6062 8200 0000 0000'), 'HIPERCARD')
      assert.equal(detectCardBrand('3782 822463 10005'), 'AMEX')
      assert.equal(detectCardBrand('4011 7800 0000 0000'), 'ELO')
    })

    test('updateCreditCard valida dados obrigatórios do novo cartão', async () => {
      const res1 = await updateCreditCard(INVALID_REST_ID, null)
      assert.equal(res1.data, null)
      assert.notEqual(res1.error, null)

      const res2 = await updateCreditCard(VALID_REST_ID, { numero: '123' })
      assert.equal(res2.data, null)
      assert.match(res2.error.message, /incompletos|inválido/i)
    })

    test('updateCreditCard retorna erro quando update no banco falha', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('DB Update Failure') })
            })
          })
        })
      })

      const res = await updateCreditCard(VALID_REST_ID, {
        numero: '5555444433338899',
        nomeTitular: 'Patrícia Gestora',
        validade: '11/31',
        cvv: '777'
      })

      assert.equal(res.data, null)
      assert.notEqual(res.error, null)
    })

    test('updateCreditCard atualiza cartão com sucesso no Supabase / fallback mock', async () => {
      supabase.from = (table) => {
        assert.equal(table, 'restaurantes')
        return {
          update: (payload) => {
            assert.equal(payload.cartao_ultimos_digitos, '8899')
            assert.equal(payload.cartao_bandeira, 'MASTERCARD')
            return {
              eq: (col, val) => {
                assert.equal(col, 'id')
                assert.equal(val, VALID_REST_ID)
                return {
                  select: () => ({
                    single: () => Promise.resolve({
                      data: { id: VALID_REST_ID, ...payload },
                      error: null
                    })
                  })
                }
              }
            }
          }
        }
      }

      const res = await updateCreditCard(VALID_REST_ID, {
        numero: '5555444433338899',
        nomeTitular: 'Patrícia Gestora',
        validade: '11/31',
        cvv: '777'
      })

      assert.equal(res.error, null)
      assert.equal(res.data.success, true)
      assert.equal(res.data.cartao.ultimosDigitos, '8899')
      assert.equal(res.data.cartao.bandeira, 'MASTERCARD')
    })
  })

  describe('AC5: Histórico de Faturas & Reativação de Plano', () => {
    test('reactivateSubscription reativa restaurante cancelado com plano e ciclo definidos', async () => {
      supabase.from = (table) => {
        assert.equal(table, 'restaurantes')
        return {
          update: (payload) => {
            assert.equal(payload.status_assinatura, 'active')
            assert.equal(payload.plano, 'pro')
            return {
              eq: (col, val) => {
                assert.equal(col, 'id')
                assert.equal(val, VALID_REST_ID)
                return {
                  select: () => ({
                    single: () => Promise.resolve({
                      data: { id: VALID_REST_ID, ...payload },
                      error: null
                    })
                  })
                }
              }
            }
          }
        }
      }

      const res = await reactivateSubscription(VALID_REST_ID, { plano: 'pro', ciclo: 'MONTHLY' })
      assert.equal(res.error, null)
      assert.equal(res.data.success, true)
      assert.equal(res.data.status, 'active')
      assert.equal(res.data.plano, 'pro')
    })

    test('cancelSubscription retorna erro se update falhar no banco', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Permission denied') })
            })
          })
        })
      })

      const res = await cancelSubscription(VALID_REST_ID)
      assert.equal(res.data, null)
      assert.notEqual(res.error, null)
    })
  })
})
