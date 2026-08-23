import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateRoiMetrics,
  PRICING_PLANS,
  FAQ_ITEMS,
  MODULES_SHOWCASE,
  STATS_DATA,
  PAIN_POINTS,
  BENEFITS_DATA
} from '../src/utils/landingPageData.js'

describe('Landing Page & Sales Conversion Engine Unit Tests', () => {
  describe('ROI Calculator Logic', () => {
    test('Calcula métricas de ROI padrão corretamente', () => {
      // 20 mesas, ticket médio R$ 80, 2.5 giros por dia
      const metrics = calculateRoiMetrics({ mesas: 20, ticketMedio: 80, girosDia: 2.5 })

      assert.ok(metrics, 'Métricas devem ser calculadas')
      assert.equal(metrics.pedidosDia, 50) // 20 * 2.5
      assert.equal(metrics.faturamentoMensalAtual, 120000) // 50 * 80 * 30
      
      // Ganho projetado com aumento de 25% no ticket médio + 15% aumento no giro
      assert.ok(metrics.faturamentoMensalProjetado > metrics.faturamentoMensalAtual)
      assert.ok(metrics.ganhoMensalEstimado > 0)
      assert.ok(metrics.horasEconomizadasMes > 0)
      assert.ok(metrics.roiMultiplier > 10, 'O ROI projetado deve ser expressivo (>10x)')
    })

    test('Trata valores de entrada mínimos ou limítrofes defensivamente', () => {
      const minMetrics = calculateRoiMetrics({ mesas: 1, ticketMedio: 10, girosDia: 1 })
      assert.equal(minMetrics.pedidosDia, 1)
      assert.equal(minMetrics.faturamentoMensalAtual, 300)
      assert.ok(minMetrics.ganhoMensalEstimado > 0)

      const zeroMetrics = calculateRoiMetrics({ mesas: 0, ticketMedio: 0, girosDia: 0 })
      assert.equal(zeroMetrics.pedidosDia, 0)
      assert.equal(zeroMetrics.faturamentoMensalAtual, 0)
      assert.equal(zeroMetrics.ganhoMensalEstimado, 0)

      const negativeMetrics = calculateRoiMetrics({ mesas: -10, ticketMedio: -50, girosDia: -2 })
      assert.equal(negativeMetrics.pedidosDia, 0)
      assert.equal(negativeMetrics.faturamentoMensalAtual, 0)
      assert.equal(negativeMetrics.ganhoMensalEstimado, 0)
    })
  })

  describe('Pricing Plans Configuration', () => {
    test('Possui planos válidos com opções mensal e anual com desconto', () => {
      assert.ok(Array.isArray(PRICING_PLANS), 'PRICING_PLANS deve ser um array')
      assert.equal(PRICING_PLANS.length, 3, 'Deve conter 3 planos: Starter, Pro e Scale')

      const [starter, pro, scale] = PRICING_PLANS

      assert.equal(starter.id, 'starter')
      assert.equal(typeof starter.priceMonthly, 'number')
      assert.equal(typeof starter.priceAnnual, 'number')
      assert.ok(starter.priceAnnual < starter.priceMonthly, 'Plano anual deve ter desconto')
      assert.ok(starter.features.length >= 4)

      assert.equal(pro.id, 'pro')
      assert.equal(pro.highlight, true, 'Plano Pro deve ser destacado como mais popular')
      assert.ok(pro.priceAnnual < pro.priceMonthly)
      assert.ok(pro.features.length >= 6)

      assert.equal(scale.id, 'scale')
      assert.ok(scale.features.length >= 6)
    })
  })

  describe('Modules Showcase & Features Structure', () => {
    test('Exibe os 4 módulos essenciais do ecossistema SaaS', () => {
      assert.ok(Array.isArray(MODULES_SHOWCASE))
      assert.equal(MODULES_SHOWCASE.length, 4, 'Deve conter os 4 módulos do sistema')

      const moduleIds = MODULES_SHOWCASE.map(m => m.id)
      assert.ok(moduleIds.includes('cliente'), 'Deve conter Módulo Cliente QR')
      assert.ok(moduleIds.includes('cozinha'), 'Deve conter Módulo Cozinha KDS')
      assert.ok(moduleIds.includes('caixa'), 'Deve conter Módulo Caixa POS')
      assert.ok(moduleIds.includes('gestor'), 'Deve conter Módulo Painel Gestor')

      MODULES_SHOWCASE.forEach(m => {
        assert.ok(m.title, `Módulo ${m.id} deve ter título`)
        assert.ok(m.tag, `Módulo ${m.id} deve ter tag`)
        assert.ok(m.description, `Módulo ${m.id} deve ter descrição`)
        assert.ok(Array.isArray(m.highlights) && m.highlights.length >= 3, `Módulo ${m.id} deve ter destaques`)
      })
    })
  })

  describe('FAQ Content & Objection Handling', () => {
    test('Estrutura de FAQ contém perguntas claras e respostas persuasivas', () => {
      assert.ok(Array.isArray(FAQ_ITEMS))
      assert.ok(FAQ_ITEMS.length >= 5, 'Deve conter pelo menos 5 perguntas frequentes')

      FAQ_ITEMS.forEach((item, index) => {
        assert.ok(item.question && item.question.length > 10, `Item ${index} deve ter pergunta detalhada`)
        assert.ok(item.answer && item.answer.length > 20, `Item ${index} deve ter resposta detalhada`)
      })
    })
  })

  describe('Copywriting & Social Proof Data', () => {
    test('Contém estatísticas de prova social e contrastes de dores vs soluções', () => {
      assert.ok(Array.isArray(STATS_DATA) && STATS_DATA.length >= 4)
      assert.ok(Array.isArray(PAIN_POINTS) && PAIN_POINTS.length >= 4)
      assert.ok(Array.isArray(BENEFITS_DATA) && BENEFITS_DATA.length >= 4)
    })
  })
})
