import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

interface AsaasWebhookPayload {
  event: string
  payment?: {
    id: string
    customer: string
    subscription?: string
    value: number
    netValue?: number
    billingType: string
    status: string
    dueDate: string
    paymentDate?: string
    clientPaymentDate?: string
    invoiceUrl?: string
    bankSlipUrl?: string
    transactionReceiptUrl?: string
    description?: string
  }
  subscription?: {
    id: string
    customer: string
    status: string
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validação do Segredo de Autenticação do Webhook
    const webhookSecret = Deno.env.get('ASAAS_WEBHOOK_SECRET')
    const tokenHeader = req.headers.get('asaas-access-token')

    if (webhookSecret && webhookSecret !== 'your-asaas-webhook-secret') {
      if (!tokenHeader || tokenHeader !== webhookSecret) {
        return errorResponse('Acesso não autorizado: token de webhook inválido.', 401)
      }
    }

    const payload: AsaasWebhookPayload = await req.json()
    const { event, payment, subscription } = payload

    if (!event) {
      return errorResponse('Evento de webhook ausente.', 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse('Configuração do Supabase indisponível no servidor.', 500)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const customerId = payment?.customer || subscription?.customer
    const subscriptionId = payment?.subscription || subscription?.id

    // 2. Localizar o Restaurante correspondente
    let restaurante = null
    if (subscriptionId) {
      const { data } = await supabaseAdmin
        .from('restaurantes')
        .select('id, status_assinatura, plano')
        .eq('asaas_subscription_id', subscriptionId)
        .maybeSingle()
      restaurante = data
    }

    if (!restaurante && customerId) {
      const { data } = await supabaseAdmin
        .from('restaurantes')
        .select('id, status_assinatura, plano')
        .eq('asaas_customer_id', customerId)
        .maybeSingle()
      restaurante = data
    }

    // 3. Processamento dos Eventos Financeiros
    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        if (restaurante) {
          // Ativa a assinatura, reinicia contagem mensal de pedidos e atualiza início do ciclo
          await supabaseAdmin
            .from('restaurantes')
            .update({
              status_assinatura: 'active',
              pedidos_consumidos_mes: 0,
              data_inicio_ciclo: new Date().toISOString()
            })
            .eq('id', restaurante.id)
        }

        if (payment && restaurante) {
          // Registra ou atualiza a fatura no histórico financeiro
          await supabaseAdmin
            .from('faturas')
            .upsert({
              restaurante_id: restaurante.id,
              asaas_payment_id: payment.id,
              valor: Number(payment.value),
              forma_pagamento: payment.billingType || 'CREDIT_CARD',
              status: event === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : 'RECEIVED',
              url_fatura: payment.invoiceUrl || payment.bankSlipUrl || null,
              url_comprovante: payment.transactionReceiptUrl || null,
              data_vencimento: payment.dueDate || new Date().toISOString().split('T')[0],
              data_pagamento: payment.paymentDate || payment.clientPaymentDate || new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'asaas_payment_id' })
        }
        break
      }

      case 'PAYMENT_OVERDUE': {
        if (restaurante) {
          await supabaseAdmin
            .from('restaurantes')
            .update({
              status_assinatura: 'past_due'
            })
            .eq('id', restaurante.id)
        }

        if (payment && restaurante) {
          await supabaseAdmin
            .from('faturas')
            .upsert({
              restaurante_id: restaurante.id,
              asaas_payment_id: payment.id,
              valor: Number(payment.value),
              forma_pagamento: payment.billingType || 'CREDIT_CARD',
              status: 'OVERDUE',
              url_fatura: payment.invoiceUrl || payment.bankSlipUrl || null,
              data_vencimento: payment.dueDate || new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            }, { onConflict: 'asaas_payment_id' })
        }
        break
      }

      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_CANCELLED': {
        if (restaurante) {
          await supabaseAdmin
            .from('restaurantes')
            .update({
              status_assinatura: 'canceled'
            })
            .eq('id', restaurante.id)
        }
        break
      }

      default:
        // Eventos informativos ou não mapeados são aceitos com 200 OK para evitar reenvios do Asaas
        break
    }

    return jsonResponse({
      received: true,
      event,
      timestamp: new Date().toISOString()
    }, 200)
  } catch (err: any) {
    return errorResponse(`Erro no processamento do webhook: ${err.message || err}`, 500)
  }
})
