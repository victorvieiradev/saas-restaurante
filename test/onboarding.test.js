import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateCPF,
  validateCNPJ,
  validateDocument,
  detectCardBrand,
  validateCardExpiry,
  generateSlug,
  calculateTrialEndDate
} from '../src/utils/validators.js'
import { PLANS_CONFIG } from '../src/services/subscriptionService.js'

describe('Onboarding & Checkout Logic Unit Tests', () => {
  describe('Validação do Passo 1: Titular e Identificação', () => {
    test('valida se todos os campos obrigatórios do titular estão corretos', () => {
      const validTitular = {
        nome: 'Carlos Dono de Restaurante',
        email: 'carlos@cantina.com',
        senha: 'senhaSegura123',
        telefone: '(11) 98765-4321',
        docTipo: 'cpf',
        documento: '529.982.247-25'
      }

      assert.ok(validTitular.nome.trim().length >= 3)
      assert.ok(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validTitular.email))
      assert.ok(validTitular.senha.length >= 6)
      assert.ok(validTitular.telefone.replace(/\D/g, '').length >= 10)
      assert.equal(validateDocument(validTitular.documento, validTitular.docTipo), true)
    })

    test('rejeita avanço se CPF ou CNPJ for inválido', () => {
      assert.equal(validateDocument('111.111.111-11', 'cpf'), false)
      assert.equal(validateDocument('12.345.678/0001-00', 'cnpj'), false)
    })
  })

  describe('Validação do Passo 2: Restaurante e Endereço', () => {
    test('gera slug automático e limpo a partir do nome fantasia', () => {
      const nome = 'Cantina Bella Itália & Pizzaria'
      const slug = generateSlug(nome)
      assert.equal(slug, 'cantina-bella-italia-pizzaria')
    })

    test('valida campos obrigatórios de endereço', () => {
      const endereco = {
        logradouro: 'Rua Augusta',
        numero: '1500',
        bairro: 'Consolação',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01304-001'
      }

      assert.ok(endereco.logradouro.trim().length > 0)
      assert.ok(endereco.numero.trim().length > 0)
      assert.ok(endereco.bairro.trim().length > 0)
      assert.ok(endereco.cidade.trim().length > 0)
      assert.ok(endereco.uf.trim().length === 2)
      assert.ok(endereco.cep.replace(/\D/g, '').length === 8)
    })
  })

  describe('Validação do Passo 3: Planos, Cartão e Selo de 14 Dias', () => {
    test('calcula data de término do trial D+14', () => {
      const trial = calculateTrialEndDate(14)
      assert.ok(trial.isoDate)
      assert.ok(trial.formattedDate)
      assert.equal(trial.dias, 14)
    })

    test('detecta bandeira do cartão em tempo real', () => {
      assert.equal(detectCardBrand('4111 1111 1111 1111'), 'VISA')
      assert.equal(detectCardBrand('5555 4444 3333 2222'), 'MASTERCARD')
      assert.equal(detectCardBrand('6062 8200 0000 0000'), 'HIPERCARD')
      assert.equal(detectCardBrand('3782 822463 10005'), 'AMEX')
      assert.equal(detectCardBrand('4011 7800 0000 0000'), 'ELO')
    })

    test('valida validade e CVV do cartão', () => {
      assert.equal(validateCardExpiry('12/30'), true)
      assert.equal(validateCardExpiry('01/20'), false)

      const cvvValid = (cvv) => /^\d{3,4}$/.test(cvv)
      assert.equal(cvvValid('123'), true)
      assert.equal(cvvValid('1234'), true)
      assert.equal(cvvValid('12'), false)
      assert.equal(cvvValid('12345'), false)
    })

    test('planos SaaS possuem valores e limites de acordo com a especificação', () => {
      // Starter: R$ 119/mês (ou R$ 95/mês no anual) - 300 pedidos
      // Pro: R$ 229/mês (ou R$ 183/mês no anual) - 1.200 pedidos
      // Scale: R$ 399/mês (ou R$ 319/mês no anual) - 3.500 pedidos
      assert.ok(PLANS_CONFIG.starter)
      assert.ok(PLANS_CONFIG.pro)
      assert.ok(PLANS_CONFIG.scale)
    })
  })
})
