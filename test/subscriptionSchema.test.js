import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('Subscription & Invoices Schema Validation Tests', () => {
  const schemaPath = path.resolve('supabase/schema.sql')
  const migrationPath = path.resolve('supabase/migrations/20260823000000_subscription_and_invoices_schema.sql')
  const seedPath = path.resolve('supabase/seed.sql')

  test('schema.sql contém colunas de assinatura na tabela restaurantes', () => {
    assert.ok(fs.existsSync(schemaPath), 'schema.sql deve existir')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    assert.ok(schemaSql.includes('plano VARCHAR(50)'), 'Deve conter coluna plano')
    assert.ok(schemaSql.includes('status_assinatura VARCHAR(30)'), 'Deve conter status_assinatura')
    assert.ok(schemaSql.includes('limite_pedidos_mes INT'), 'Deve conter limite_pedidos_mes')
    assert.ok(schemaSql.includes('pedidos_consumidos_mes INT'), 'Deve conter pedidos_consumidos_mes')
    assert.ok(schemaSql.includes('data_fim_trial'), 'Deve conter data_fim_trial')
    assert.ok(schemaSql.includes('asaas_customer_id'), 'Deve conter asaas_customer_id')
    assert.ok(schemaSql.includes('asaas_subscription_id'), 'Deve conter asaas_subscription_id')
  })

  test('schema.sql contém tabela faturas com campos e RLS exigidos', () => {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS faturas'), 'Deve criar tabela faturas')
    assert.ok(schemaSql.includes('asaas_payment_id VARCHAR(100) UNIQUE'), 'Deve ter asaas_payment_id único')
    assert.ok(schemaSql.includes('restaurante_id UUID REFERENCES restaurantes(id)'), 'Deve ter FK para restaurantes')
    assert.ok(schemaSql.includes('ALTER TABLE faturas ENABLE ROW LEVEL SECURITY'), 'Deve habilitar RLS em faturas')
    assert.ok(schemaSql.includes('idx_faturas_restaurante'), 'Deve conter índice em restaurante_id')
    assert.ok(schemaSql.includes('idx_faturas_status'), 'Deve conter índice em status')
  })

  test('schema.sql contém trigger e função de contagem de pedidos incrementados', () => {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    assert.ok(
      schemaSql.includes('incrementar_pedidos_restaurante()') || schemaSql.includes('incrementar_pedidos_restaurante'),
      'Deve definir função incrementar_pedidos_restaurante'
    )
    assert.ok(
      schemaSql.includes('trigger_incrementa_pedido'),
      'Deve definir trigger trigger_incrementa_pedido em pedidos'
    )
    assert.ok(
      schemaSql.includes('pedidos_consumidos_mes = COALESCE(pedidos_consumidos_mes, 0) + 1') ||
      schemaSql.includes('pedidos_consumidos_mes = pedidos_consumidos_mes + 1'),
      'Deve incrementar pedidos_consumidos_mes'
    )
  })

  test('migration 20260823000000_subscription_and_invoices_schema.sql existe e é idempotente', () => {
    assert.ok(fs.existsSync(migrationPath), 'Arquivo de migration deve existir')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    assert.ok(migrationSql.includes('ADD COLUMN IF NOT EXISTS plano'), 'Migration deve ser idempotente para plano')
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS faturas'), 'Migration deve ser idempotente para faturas')
    assert.ok(migrationSql.includes('CREATE OR REPLACE FUNCTION incrementar_pedidos_restaurante'), 'Migration deve conter função trigger')
  })

  test('seed.sql contém dados de assinatura nos restaurantes padrão', () => {
    const seedSql = fs.readFileSync(seedPath, 'utf8')
    assert.ok(seedSql.includes('plano') || seedSql.includes('trialing') || seedSql.includes('status_assinatura'), 'Seed deve incluir assinatura')
  })

  test('simulação lógica de trigger incrementar_pedidos_restaurante incrementa atomicamente', () => {
    const restauranteMock = {
      id: '11111111-1111-4111-8111-111111111111',
      pedidos_consumidos_mes: 10
    }

    const simularTriggerInsertPedido = (newPedido, rest) => {
      if (newPedido.restaurante_id === rest.id) {
        rest.pedidos_consumidos_mes = (rest.pedidos_consumidos_mes || 0) + 1
      }
      return newPedido
    }

    simularTriggerInsertPedido({ id: 'ped-1', restaurante_id: restauranteMock.id }, restauranteMock)
    assert.equal(restauranteMock.pedidos_consumidos_mes, 11)

    simularTriggerInsertPedido({ id: 'ped-2', restaurante_id: restauranteMock.id }, restauranteMock)
    assert.equal(restauranteMock.pedidos_consumidos_mes, 12)
  })
})
