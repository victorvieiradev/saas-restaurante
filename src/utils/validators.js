/**
 * Utilitários de Validação Matemática, Máscaras e Formatação
 * Utilizados no Onboarding, Checkout e formulários SaaS.
 */

/**
 * Validação Matemática do CPF (Dígitos Verificadores)
 * @param {string} cpf
 * @returns {boolean}
 */
export function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false
  const cleanCpf = cpf.replace(/\D/g, '')

  if (cleanCpf.length !== 11) return false
  // Rejeita sequências conhecidas de dígitos repetidos
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false

  // 1º Dígito Verificador
  let sum1 = 0
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(cleanCpf[i], 10) * (10 - i)
  }
  let rem1 = (sum1 * 10) % 11
  if (rem1 === 10 || rem1 === 11) rem1 = 0
  if (rem1 !== parseInt(cleanCpf[9], 10)) return false

  // 2º Dígito Verificador
  let sum2 = 0
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(cleanCpf[i], 10) * (11 - i)
  }
  let rem2 = (sum2 * 10) % 11
  if (rem2 === 10 || rem2 === 11) rem2 = 0
  if (rem2 !== parseInt(cleanCpf[10], 10)) return false

  return true
}

/**
 * Validação Matemática do CNPJ (Dígitos Verificadores)
 * @param {string} cnpj
 * @returns {boolean}
 */
export function validateCNPJ(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') return false
  const cleanCnpj = cnpj.replace(/\D/g, '')

  if (cleanCnpj.length !== 14) return false
  // Rejeita sequências conhecidas de dígitos repetidos
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false

  // 1º Dígito Verificador
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum1 = 0
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(cleanCnpj[i], 10) * w1[i]
  }
  let rem1 = sum1 % 11
  rem1 = rem1 < 2 ? 0 : 11 - rem1
  if (rem1 !== parseInt(cleanCnpj[12], 10)) return false

  // 2º Dígito Verificador
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum2 = 0
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(cleanCnpj[i], 10) * w2[i]
  }
  let rem2 = sum2 % 11
  rem2 = rem2 < 2 ? 0 : 11 - rem2
  if (rem2 !== parseInt(cleanCnpj[13], 10)) return false

  return true
}

/**
 * Valida Documento (CPF ou CNPJ)
 * @param {string} doc
 * @param {'cpf'|'cnpj'|string} [type]
 * @returns {boolean}
 */
export function validateDocument(doc, type) {
  if (!doc) return false
  const clean = String(doc).replace(/\D/g, '')
  if (type === 'cpf') return validateCPF(clean)
  if (type === 'cnpj') return validateCNPJ(clean)

  if (clean.length === 11) return validateCPF(clean)
  if (clean.length === 14) return validateCNPJ(clean)
  return false
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 * @param {string} value
 * @returns {string}
 */
export function maskCPF(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 * @param {string} value
 * @returns {string}
 */
export function maskCNPJ(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/**
 * Aplica máscara dinâmica de documento (CPF ou CNPJ)
 * @param {string} value
 * @param {'cpf'|'cnpj'} [type]
 * @returns {string}
 */
export function maskDocument(value, type) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '')
  if (type === 'cnpj' || digits.length > 11) {
    return maskCNPJ(digits)
  }
  return maskCPF(digits)
}

/**
 * Aplica máscara de Telefone celular ou fixo com DDD: (11) 98765-4321 ou (11) 8765-4321
 * @param {string} value
 * @returns {string}
 */
export function maskPhone(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : ''
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Aplica máscara de CEP: 00000-000
 * @param {string} value
 * @returns {string}
 */
export function maskCEP(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Aplica máscara de Cartão de Crédito
 * Formata em blocos de 4 dígitos ou 4-6-5 para Amex
 * @param {string} value
 * @returns {string}
 */
export function maskCardNumber(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 19)
  // Amex (15 dígitos)
  if (/^3[47]/.test(digits)) {
    return digits
      .replace(/^(\d{4})(\d)/, '$1 $2')
      .replace(/^(\d{4})\s(\d{6})(\d)/, '$1 $2 $3')
      .slice(0, 17)
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

/**
 * Aplica máscara de Validade do Cartão: MM/AA
 * @param {string} value
 * @returns {string}
 */
export function maskCardExpiry(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/**
 * Validação de data de expiração de cartão (MM/AA ou MM/AAAA)
 * @param {string} expiry
 * @returns {boolean}
 */
export function validateCardExpiry(expiry) {
  if (!expiry || typeof expiry !== 'string') return false
  const clean = expiry.replace(/\D/g, '')
  if (clean.length !== 4 && clean.length !== 6) return false

  const month = parseInt(clean.slice(0, 2), 10)
  if (month < 1 || month > 12) return false

  let year = parseInt(clean.slice(2), 10)
  if (clean.length === 4) {
    year += 2000
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false
  if (year > currentYear + 25) return false

  return true
}

/**
 * Detecção de Bandeira do Cartão de Crédito por Regex de BIN
 * Suporta: VISA, MASTERCARD, ELO, HIPERCARD, AMEX
 * @param {string} cardNumber
 * @returns {'VISA'|'MASTERCARD'|'ELO'|'HIPERCARD'|'AMEX'|'UNKNOWN'}
 */
export function detectCardBrand(cardNumber) {
  if (!cardNumber) return 'UNKNOWN'
  const digits = String(cardNumber).replace(/\D/g, '')

  if (!digits) return 'UNKNOWN'

  // Elo (Múltiplos BINs nacionais)
  const eloRegex = /^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-7][0-9]|9000)|627780|63(6297|6368)|650(03[1-3]|04[0-9]|05[0-1]|40[5-9]|4[1-3][0-9]|48[5-9]|49[0-9]|50[0-9]|51[0-9]|52[0-9]|53[0-8]|70[0-9]|71[0-9]|72[0-7]|90[1-9]|9[1-6][0-9]|97[0-8])|6516[5-7][0-9]|6550[0-5][0-9])/
  if (eloRegex.test(digits) || /^(4011|4312|4389|4514|4576|5041|5066|5067|5090|627780|636297|636368|6500|6504|6505|6516|6550)/.test(digits)) {
    return 'ELO'
  }

  // Hipercard
  if (/^(606282|3841)/.test(digits)) {
    return 'HIPERCARD'
  }

  // American Express
  if (/^3[47]/.test(digits)) {
    return 'AMEX'
  }

  // Visa
  if (/^4/.test(digits)) {
    return 'VISA'
  }

  // Mastercard
  if (/^(5[1-5]|2[2-7])/.test(digits)) {
    return 'MASTERCARD'
  }

  return 'UNKNOWN'
}

/**
 * Gera slug de URL amigável a partir do nome
 * Ex: "Cantina do Chef & Bar!" -> "cantina-do-chef-bar"
 * @param {string} text
 * @returns {string}
 */
export function generateSlug(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
    .replace(/[\s_]+/g, '-') // substitui espaços/underscores por hífen
    .replace(/-+/g, '-') // remove hífens duplicados
    .replace(/^-+|-+$/g, '') // remove hífens nas extremidades
}

/**
 * Calcula a data de término do período de teste gratuito (Trial D+14)
 * @param {number} [days=14]
 * @returns {{ isoDate: string, formattedDate: string, dias: number }}
 */
export function calculateTrialEndDate(days = 14) {
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ]
  const dia = String(future.getDate()).padStart(2, '0')
  const mesNome = meses[future.getMonth()]
  const ano = future.getFullYear()
  
  const formattedDate = `${dia} de ${mesNome} de ${ano}`

  return {
    isoDate: future.toISOString(),
    formattedDate,
    dias: days
  }
}

/**
 * Consulta endereço pelo CEP na API ViaCEP
 * @param {string} cep
 * @returns {Promise<{ data: { logradouro: string, bairro: string, cidade: string, uf: string, cep: string }|null, error: string|null }>}
 */
export function fetchAddressByCEP(cep) {
  const cleanCep = String(cep || '').replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    return Promise.resolve({ data: null, error: 'CEP inválido. Deve conter 8 dígitos.' })
  }

  // Fallback / Consulta à API ViaCEP
  return fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
    headers: { 'Accept': 'application/json' }
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Erro na consulta do CEP: ${response.statusText}`)
      }
      const data = await response.json()
      if (data.erro) {
        return { data: null, error: 'CEP não encontrado.' }
      }
      return {
        data: {
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
          cep: data.cep || maskCEP(cleanCep)
        },
        error: null
      }
    })
    .catch((err) => {
      console.warn('Falha na consulta ViaCEP:', err.message)
      return { data: null, error: 'Não foi possível consultar o CEP automaticamente. Preencha os campos manualmente.' }
    })
}
