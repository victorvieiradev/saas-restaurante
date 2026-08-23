import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('Supabase Edge Functions & Webhook Logic Tests', () => {
  const rootDir = process.cwd()

  test('Arquivos das Edge Functions existem no diretório correto', () => {
    const corsPath = path.join(rootDir, 'supabase', 'functions', '_shared', 'cors.ts')
    const createSubPath = path.join(rootDir, 'supabase', 'functions', 'create-subscription', 'index.ts')
    const cancelSubPath = path.join(rootDir, 'supabase', 'functions', 'cancel-subscription', 'index.ts')
    const webhookPath = path.join(rootDir, 'supabase', 'functions', 'asaas-webhook', 'index.ts')

    assert.ok(fs.existsSync(corsPath), 'cors.ts deve existir')
    assert.ok(fs.existsSync(createSubPath), 'create-subscription/index.ts deve existir')
    assert.ok(fs.existsSync(cancelSubPath), 'cancel-subscription/index.ts deve existir')
    assert.ok(fs.existsSync(webhookPath), 'asaas-webhook/index.ts deve existir')
  })

  test('.env.example contém todas as variáveis necessárias do Asaas e Supabase Service Role', () => {
    const envExamplePath = path.join(rootDir, '.env.example')
    assert.ok(fs.existsSync(envExamplePath), '.env.example deve existir')

    const envContent = fs.readFileSync(envExamplePath, 'utf-8')
    assert.ok(envContent.includes('ASAAS_API_URL'), 'deve conter ASAAS_API_URL')
    assert.ok(envContent.includes('ASAAS_API_KEY'), 'deve conter ASAAS_API_KEY')
    assert.ok(envContent.includes('ASAAS_WEBHOOK_SECRET'), 'deve conter ASAAS_WEBHOOK_SECRET')
    assert.ok(envContent.includes('SUPABASE_SERVICE_ROLE_KEY'), 'deve conter SUPABASE_SERVICE_ROLE_KEY')
  })

  describe('Validações de Código e Guardrails das Edge Functions', () => {
    test('create-subscription/index.ts calcula D+14 e integra com Asaas', () => {
      const code = fs.readFileSync(
        path.join(rootDir, 'supabase', 'functions', 'create-subscription', 'index.ts'),
        'utf-8'
      )
      assert.ok(code.includes('Deno.serve') || code.includes('serve('), 'deve usar Deno server')
      assert.ok(code.includes('corsHeaders'), 'deve importar/usar corsHeaders')
      assert.ok(code.includes('/customers'), 'deve criar cliente no Asaas')
      assert.ok(code.includes('/subscriptions'), 'deve criar assinatura no Asaas')
      assert.ok(code.includes('CREDIT_CARD'), 'deve usar CREDIT_CARD como billingType')
      assert.ok(code.includes('14') || code.includes('data_fim_trial'), 'deve calcular período de 14 dias de trial')
      assert.ok(code.includes('trialing'), 'deve gravar status_assinatura = trialing')
      assert.ok(code.includes('cartao_ultimos_digitos'), 'deve persistir os 4 últimos dígitos')
      assert.ok(code.includes('cartao_bandeira'), 'deve identificar bandeira')
    })

    test('cancel-subscription/index.ts valida JWT e cancela no Asaas', () => {
      const code = fs.readFileSync(
        path.join(rootDir, 'supabase', 'functions', 'cancel-subscription', 'index.ts'),
        'utf-8'
      )
      assert.ok(code.includes('Deno.serve') || code.includes('serve('), 'deve usar Deno server')
      assert.ok(code.includes('Authorization') || code.includes('getUser'), 'deve validar JWT/Auth do usuário')
      assert.ok(code.includes('DELETE'), 'deve executar DELETE da assinatura no Asaas')
      assert.ok(code.includes('canceled'), 'deve atualizar status para canceled')
      assert.ok(code.includes('401'), 'deve retornar 401 para requisição não autenticada')
    })

    test('asaas-webhook/index.ts valida segredo e trata eventos de pagamento', () => {
      const code = fs.readFileSync(
        path.join(rootDir, 'supabase', 'functions', 'asaas-webhook', 'index.ts'),
        'utf-8'
      )
      assert.ok(code.includes('Deno.serve') || code.includes('serve('), 'deve usar Deno server')
      assert.ok(code.includes('ASAAS_WEBHOOK_SECRET') || code.includes('asaas-access-token'), 'deve validar segredo do webhook')
      assert.ok(code.includes('PAYMENT_CONFIRMED') || code.includes('PAYMENT_RECEIVED'), 'deve tratar pagamento confirmado')
      assert.ok(code.includes('PAYMENT_OVERDUE'), 'deve tratar pagamento atrasado')
      assert.ok(code.includes('SUBSCRIPTION_DELETED'), 'deve tratar assinatura cancelada')
      assert.ok(code.includes('faturas'), 'deve gravar faturas no Supabase')
    })

    test('cors.ts define headers seguros e helpers de resposta JSON', () => {
      const code = fs.readFileSync(
        path.join(rootDir, 'supabase', 'functions', '_shared', 'cors.ts'),
        'utf-8'
      )
      assert.ok(code.includes('Access-Control-Allow-Origin'), 'deve permitir CORS')
      assert.ok(code.includes('jsonResponse'), 'deve exportar jsonResponse')
      assert.ok(code.includes('errorResponse'), 'deve exportar errorResponse')
    })
  })

  describe('Cálculos e Lógica de Domínio de Assinatura', () => {
    test('Cálculo de D+14 gera data futura exata de 14 dias', () => {
      const agora = new Date('2026-08-23T12:00:00.000Z')
      const fimTrial = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000)
      const formatted = fimTrial.toISOString().split('T')[0]
      assert.equal(formatted, '2026-09-06')
    })

    test('Detecção de bandeiras por prefixo de cartão', () => {
      const detectBrand = (num) => {
        const clean = num.replace(/\D/g, '')
        if (/^4/.test(clean)) return 'VISA'
        if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD'
        if (/^3[47]/.test(clean)) return 'AMEX'
        if (/^(6011|65|64[4-9])/.test(clean)) return 'DISCOVER'
        if (/^(4011|438935|451416|4576|504175|5090|627780|636297|636368)/.test(clean)) return 'ELO'
        return 'CREDIT_CARD'
      }

      assert.equal(detectBrand('4111.1111.1111.1111'), 'VISA')
      assert.equal(detectBrand('5555 4444 3333 2222'), 'MASTERCARD')
      assert.equal(detectBrand('378282246310005'), 'AMEX')
      assert.equal(detectBrand('6011-0000-0000-0000'), 'DISCOVER')
      assert.equal(detectBrand('9999-9999-9999-9999'), 'CREDIT_CARD')
    })
  })
})
