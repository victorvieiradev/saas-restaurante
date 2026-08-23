import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

interface CreateSubscriptionPayload {
  cliente: {
    nome?: string
    name?: string
    email: string
    cpfCnpj?: string
    cpf_cnpj?: string
    telefone?: string
    phone?: string
  }
  restaurante: {
    id?: string
    restauranteId?: string
    nome?: string
    slug?: string
  }
  restauranteId?: string
  cartao: {
    holderName?: string
    nomeTitular?: string
    number?: string
    numero?: string
    expiryMonth?: string | number
    mesValidade?: string | number
    expiryYear?: string | number
    anoValidade?: string | number
    ccv?: string | number
    cvv?: string | number
    codigoSeguranca?: string | number
  }
  endereco?: {
    postalCode?: string
    cep?: string
    address?: string
    logradouro?: string
    addressNumber?: string
    numero?: string
    addressComplement?: string
    complemento?: string
    province?: string
    bairro?: string
    city?: string
    cidade?: string
    state?: string
    uf?: string
  }
  plano?: string
  ciclo?: 'MONTHLY' | 'YEARLY'
}

const PLAN_VALUES: Record<string, { value: number; limite: number; nome: string }> = {
  starter: { value: 97.00, limite: 300, nome: 'Starter' },
  pro: { value: 197.00, limite: 1000, nome: 'Pro' },
  scale: { value: 397.00, limite: 3000, nome: 'Scale' },
  enterprise: { value: 997.00, limite: 999999, nome: 'Enterprise' }
}

function detectCardBrand(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '')
  if (/^4/.test(clean)) return 'VISA'
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD'
  if (/^3[47]/.test(clean)) return 'AMEX'
  if (/^(6011|65|64[4-9])/.test(clean)) return 'DISCOVER'
  if (/^(4011|438935|451416|4576|504175|5067|5090|627780|636297|636368)/.test(clean)) return 'ELO'
  if (/^(606282|3841)/.test(clean)) return 'HIPERCARD'
  return 'CREDIT_CARD'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: CreateSubscriptionPayload = await req.json()
    const { cliente, cartao, endereco, plano = 'starter', ciclo = 'MONTHLY' } = payload
    const restauranteId = payload.restauranteId || payload.restaurante?.id || payload.restaurante?.restauranteId

    // 1. Validações preliminares obrigatórias
    if (!cliente || !cliente.email) {
      return errorResponse('Dados do cliente/titular e e-mail são obrigatórios.', 400)
    }

    if (!cartao) {
      return errorResponse('Dados do cartão de crédito são obrigatórios.', 400)
    }

    const cardHolder = cartao.holderName || cartao.nomeTitular || cliente.nome || cliente.name
    const cardNumber = (cartao.number || cartao.numero || '').replace(/\D/g, '')
    const cardMonth = String(cartao.expiryMonth || cartao.mesValidade || '').padStart(2, '0')
    const cardYear = String(cartao.expiryYear || cartao.anoValidade || '')
    const cardCcv = String(cartao.ccv || cartao.cvv || cartao.codigoSeguranca || '')

    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      return errorResponse('Número do cartão de crédito inválido.', 400)
    }

    if (!cardMonth || !cardYear || !cardCcv) {
      return errorResponse('Dados de validade ou código de segurança do cartão incompletos.', 400)
    }

    const planoKey = plano.toLowerCase()
    const planoInfo = PLAN_VALUES[planoKey] || PLAN_VALUES.starter
    const valorPlano = planoInfo.value

    // 2. Cálculo do Trial de 14 Dias (D+14)
    const agora = new Date()
    const dataFimTrial = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000)
    const nextDueDate = dataFimTrial.toISOString().split('T')[0] // Formato YYYY-MM-DD para Asaas

    // 3. Integração com Asaas API
    const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3'
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    let asaasCustomerId = `cus_mock_${Date.now()}`
    let asaasSubscriptionId = `sub_mock_${Date.now()}`

    if (asaasApiKey && !asaasApiKey.includes('your-asaas-api-key')) {
      const asaasHeaders = {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'RestauranteApp-SaaS/1.0'
      }

      // 3a. Criar ou Recuperar Cliente no Asaas (POST /customers)
      const customerPayload = {
        name: cliente.nome || cliente.name || cardHolder,
        email: cliente.email,
        cpfCnpj: (cliente.cpfCnpj || cliente.cpf_cnpj || '').replace(/\D/g, ''),
        phone: (cliente.telefone || cliente.phone || '').replace(/\D/g, ''),
        postalCode: (endereco?.postalCode || endereco?.cep || '').replace(/\D/g, ''),
        addressNumber: endereco?.addressNumber || endereco?.numero || 'S/N',
        addressComplement: endereco?.addressComplement || endereco?.complemento || '',
        notificationDisabled: false
      }

      const customerRes = await fetch(`${asaasApiUrl}/customers`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify(customerPayload)
      })

      const customerData = await customerRes.json()
      if (!customerRes.ok) {
        const errorMsg = customerData.errors?.[0]?.description || 'Erro ao cadastrar cliente no gateway Asaas.'
        return errorResponse(`Falha Asaas (Cliente): ${errorMsg}`, customerRes.status, customerData)
      }
      asaasCustomerId = customerData.id

      // 3b. Criar Assinatura Recorrente no Asaas (POST /subscriptions)
      const subscriptionPayload = {
        customer: asaasCustomerId,
        billingType: 'CREDIT_CARD',
        value: valorPlano,
        nextDueDate: nextDueDate, // Cobrança apenas após o Trial de 14 dias (D+14)
        cycle: ciclo,
        description: `Assinatura RestauranteApp - Plano ${planoInfo.nome} (Trial 14 Dias Grátis)`,
        creditCard: {
          holderName: cardHolder,
          number: cardNumber,
          expiryMonth: cardMonth,
          expiryYear: cardYear.length === 2 ? `20${cardYear}` : cardYear,
          ccv: cardCcv
        },
        creditCardHolderInfo: {
          name: cardHolder,
          email: cliente.email,
          cpfCnpj: (cliente.cpfCnpj || cliente.cpf_cnpj || '').replace(/\D/g, ''),
          postalCode: (endereco?.postalCode || endereco?.cep || '').replace(/\D/g, ''),
          addressNumber: endereco?.addressNumber || endereco?.numero || 'S/N',
          addressComplement: endereco?.addressComplement || endereco?.complemento || '',
          phone: (cliente.telefone || cliente.phone || '').replace(/\D/g, '')
        }
      }

      const subRes = await fetch(`${asaasApiUrl}/subscriptions`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify(subscriptionPayload)
      })

      const subData = await subRes.json()
      if (!subRes.ok) {
        const errorMsg = subData.errors?.[0]?.description || 'Erro ao validar cartão ou criar assinatura no Asaas.'
        return errorResponse(`Falha Asaas (Assinatura): ${errorMsg}`, subRes.status, subData)
      }
      asaasSubscriptionId = subData.id
    }

    // 4. Persistência no Supabase (Atualização do Restaurante)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

    const cartaoUltimosDigitos = cardNumber.slice(-4)
    const cartaoBandeira = detectCardBrand(cardNumber)

    if (supabaseUrl && supabaseServiceKey && restauranteId) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

      const updateData = {
        plano: planoKey,
        status_assinatura: 'trialing',
        limite_pedidos_mes: planoInfo.limite,
        pedidos_consumidos_mes: 0,
        data_inicio_ciclo: agora.toISOString(),
        data_fim_trial: dataFimTrial.toISOString(),
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSubscriptionId,
        cartao_ultimos_digitos: cartaoUltimosDigitos,
        cartao_bandeira: cartaoBandeira,
        cpf_cnpj: cliente.cpfCnpj || cliente.cpf_cnpj || null,
        endereco_completo: endereco || null
      }

      const { error: dbError } = await supabaseAdmin
        .from('restaurantes')
        .update(updateData)
        .eq('id', restauranteId)

      if (dbError) {
        console.warn('Erro ao atualizar restaurante no Supabase:', dbError.message)
      }
    }

    // 5. Retorno de Sucesso com Garantia de R$ 0,00 Cobrado no Trial
    return jsonResponse({
      success: true,
      restauranteId: restauranteId || null,
      status: 'trialing',
      plano: planoKey,
      dataFimTrial: dataFimTrial.toISOString(),
      asaasCustomerId,
      asaasSubscriptionId,
      cartao: {
        ultimosDigitos: cartaoUltimosDigitos,
        bandeira: cartaoBandeira
      },
      message: 'Assinatura criada com sucesso! Trial de 14 dias ativo com R$ 0,00 cobrado agora.'
    })
  } catch (err: any) {
    return errorResponse(`Erro interno ao processar assinatura: ${err.message || err}`, 500)
  }
})
