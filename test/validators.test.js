import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateCPF,
  validateCNPJ,
  validateDocument,
  maskCPF,
  maskCNPJ,
  maskDocument,
  maskPhone,
  maskCEP,
  maskCardNumber,
  maskCardExpiry,
  validateCardExpiry,
  detectCardBrand,
  generateSlug,
  calculateTrialEndDate,
  fetchAddressByCEP
} from '../src/utils/validators.js'

describe('validators & formatters Unit Tests', () => {
  describe('validateCPF', () => {
    test('valida CPFs matematicamente válidos', () => {
      // CPFs válidos conhecidos para teste
      assert.equal(validateCPF('52998224725'), true)
      assert.equal(validateCPF('529.982.247-25'), true)
      assert.equal(validateCPF('11144477735'), true)
    })

    test('rejeita CPFs com todos dígitos iguais', () => {
      assert.equal(validateCPF('000.000.000-00'), false)
      assert.equal(validateCPF('111.111.111-11'), false)
      assert.equal(validateCPF('99999999999'), false)
    })

    test('rejeita CPFs com dígitos verificadores incorretos', () => {
      assert.equal(validateCPF('52998224720'), false)
      assert.equal(validateCPF('12345678900'), false)
      assert.equal(validateCPF('abc'), false)
      assert.equal(validateCPF(''), false)
      assert.equal(validateCPF(null), false)
    })
  })

  describe('validateCNPJ', () => {
    test('valida CNPJs matematicamente válidos', () => {
      // CNPJs válidos conhecidos para teste
      assert.equal(validateCNPJ('11.222.333/0001-81'), true)
      assert.equal(validateCNPJ('11222333000181'), true)
      assert.equal(validateCNPJ('04.252.011/0001-10'), true)
    })

    test('rejeita CNPJs com todos dígitos iguais', () => {
      assert.equal(validateCNPJ('00.000.000/0000-00'), false)
      assert.equal(validateCNPJ('11111111111111'), false)
    })

    test('rejeita CNPJs inválidos', () => {
      assert.equal(validateCNPJ('11.222.333/0001-00'), false)
      assert.equal(validateCNPJ('12345'), false)
      assert.equal(validateCNPJ(''), false)
      assert.equal(validateCNPJ(null), false)
    })
  })

  describe('validateDocument', () => {
    test('valida documento com base no tipo ou tamanho', () => {
      assert.equal(validateDocument('52998224725', 'cpf'), true)
      assert.equal(validateDocument('11222333000181', 'cnpj'), true)
      assert.equal(validateDocument('52998224725'), true)
      assert.equal(validateDocument('11222333000181'), true)
      assert.equal(validateDocument('123'), false)
    })
  })

  describe('Máscaras de Formatação', () => {
    test('maskCPF formata corretamente', () => {
      assert.equal(maskCPF('52998224725'), '529.982.247-25')
      assert.equal(maskCPF('529982'), '529.982')
      assert.equal(maskCPF(''), '')
    })

    test('maskCNPJ formata corretamente', () => {
      assert.equal(maskCNPJ('11222333000181'), '11.222.333/0001-81')
      assert.equal(maskCNPJ('11222333'), '11.222.333')
      assert.equal(maskCNPJ(''), '')
    })

    test('maskDocument alterna CPF e CNPJ dinamicamente', () => {
      assert.equal(maskDocument('52998224725', 'cpf'), '529.982.247-25')
      assert.equal(maskDocument('11222333000181', 'cnpj'), '11.222.333/0001-81')
      assert.equal(maskDocument('11222333000181'), '11.222.333/0001-81')
    })

    test('maskPhone formata celular e fixo com DDD', () => {
      assert.equal(maskPhone('11987654321'), '(11) 98765-4321')
      assert.equal(maskPhone('1187654321'), '(11) 8765-4321')
      assert.equal(maskPhone('119'), '(11) 9')
    })

    test('maskCEP formata CEP', () => {
      assert.equal(maskCEP('01310100'), '01310-100')
      assert.equal(maskCEP('01310'), '01310')
    })

    test('maskCardNumber formata número de cartão de crédito', () => {
      assert.equal(maskCardNumber('4111111111111111'), '4111 1111 1111 1111')
      assert.equal(maskCardNumber('378282246310005'), '3782 822463 10005')
    })

    test('maskCardExpiry formata mês/ano', () => {
      assert.equal(maskCardExpiry('1228'), '12/28')
      assert.equal(maskCardExpiry('12'), '12')
      assert.equal(maskCardExpiry('1'), '1')
    })
  })

  describe('validateCardExpiry', () => {
    test('aceita datas futuras', () => {
      assert.equal(validateCardExpiry('12/30'), true)
      assert.equal(validateCardExpiry('01/29'), true)
    })

    test('rejeita meses inválidos ou datas passadas', () => {
      assert.equal(validateCardExpiry('13/28'), false)
      assert.equal(validateCardExpiry('00/28'), false)
      assert.equal(validateCardExpiry('05/20'), false)
      assert.equal(validateCardExpiry(''), false)
      assert.equal(validateCardExpiry('invalid'), false)
    })
  })

  describe('detectCardBrand', () => {
    test('detecta bandeiras de cartão de crédito corretamente', () => {
      assert.equal(detectCardBrand('4111 1111 1111 1111'), 'VISA')
      assert.equal(detectCardBrand('5123 4567 8901 2345'), 'MASTERCARD')
      assert.equal(detectCardBrand('3782 822463 10005'), 'AMEX')
      assert.equal(detectCardBrand('6062 8200 0000 0000'), 'HIPERCARD')
      assert.equal(detectCardBrand('4011 7800 0000 0000'), 'ELO')
      assert.equal(detectCardBrand('0000 0000 0000 0000'), 'UNKNOWN')
    })
  })

  describe('generateSlug', () => {
    test('converte texto em slug amigável sanitizado', () => {
      assert.equal(generateSlug('Cantina do Chef & Pizzaria!'), 'cantina-do-chef-pizzaria')
      assert.equal(generateSlug('Bistrô Sabor & Arte - 2026'), 'bistro-sabor-arte-2026')
      assert.equal(generateSlug('   Espaço Gourmet   '), 'espaco-gourmet')
      assert.equal(generateSlug(''), '')
    })
  })

  describe('calculateTrialEndDate', () => {
    test('calcula D+14 com formato ISO e texto legível', () => {
      const result = calculateTrialEndDate(14)
      assert.ok(result.isoDate)
      assert.ok(result.formattedDate)
      assert.ok(result.dias === 14)
      const diffDays = Math.round((new Date(result.isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      assert.ok(diffDays >= 13 && diffDays <= 15)
    })
  })

  describe('fetchAddressByCEP', () => {
    test('rejeita CEP incompleto sem chamar API', async () => {
      const res = await fetchAddressByCEP('123')
      assert.equal(res.data, null)
      assert.match(res.error, /CEP inválido/i)
    })

    test('busca CEP com sucesso na API ViaCEP ou mock', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = async (url) => {
        if (url.includes('01310100')) {
          return {
            ok: true,
            json: async () => ({
              cep: '01310-100',
              logradouro: 'Avenida Paulista',
              bairro: 'Bela Vista',
              localidade: 'São Paulo',
              uf: 'SP'
            })
          }
        }
        if (url.includes('99999999')) {
          return {
            ok: true,
            json: async () => ({ erro: true })
          }
        }
        return { ok: false }
      }

      try {
        const resOk = await fetchAddressByCEP('01310-100')
        assert.equal(resOk.error, null)
        assert.equal(resOk.data.logradouro, 'Avenida Paulista')
        assert.equal(resOk.data.cidade, 'São Paulo')
        assert.equal(resOk.data.uf, 'SP')

        const resNotFound = await fetchAddressByCEP('99999-999')
        assert.equal(resNotFound.data, null)
        assert.match(resNotFound.error, /não encontrado/i)
      } finally {
        globalThis.fetch = originalFetch
      }
    })
  })
})
