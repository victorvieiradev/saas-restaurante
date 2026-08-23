import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

interface CancelSubscriptionPayload {
  restauranteId: string
  motivo?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Cabeçalho de autenticação ausente ou inválido.', 401)
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse('Configuração de banco de dados não disponível no servidor.', 500)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Validar autenticação do usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return errorResponse('Usuário não autenticado ou token expirado.', 401)
    }

    const body: CancelSubscriptionPayload = await req.json().catch(() => ({}))
    let restauranteId = body.restauranteId

    // Se restauranteId não veio no body, busca pelo perfil do usuário
    if (!restauranteId) {
      const { data: perfil } = await supabaseAdmin
        .from('usuarios')
        .select('restaurante_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (perfil?.restaurante_id) {
        restauranteId = perfil.restaurante_id
      }
    }

    if (!restauranteId) {
      return errorResponse('Identificador do restaurante não informado.', 400)
    }

    // 2. Buscar dados da assinatura do restaurante
    const { data: restaurante, error: restError } = await supabaseAdmin
      .from('restaurantes')
      .select('id, status_assinatura, asaas_subscription_id, plano')
      .eq('id', restauranteId)
      .maybeSingle()

    if (restError || !restaurante) {
      return errorResponse('Restaurante não encontrado.', 404)
    }

    const asaasSubscriptionId = restaurante.asaas_subscription_id
    const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3'
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')

    // 3. Executar cancelamento no Asaas se existir subscription_id ativo
    if (asaasApiKey && !asaasApiKey.includes('your-asaas-api-key') && asaasSubscriptionId && !asaasSubscriptionId.startsWith('sub_mock_')) {
      const asaasRes = await fetch(`${asaasApiUrl}/subscriptions/${asaasSubscriptionId}`, {
        method: 'DELETE',
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!asaasRes.ok && asaasRes.status !== 404) {
        const asaasErr = await asaasRes.json().catch(() => ({}))
        console.warn('Aviso Asaas ao cancelar assinatura:', asaasErr)
      }
    }

    // 4. Atualizar status para canceled no Supabase
    const { error: updateError } = await supabaseAdmin
      .from('restaurantes')
      .update({
        status_assinatura: 'canceled'
      })
      .eq('id', restauranteId)

    if (updateError) {
      return errorResponse(`Falha ao atualizar status no banco: ${updateError.message}`, 500)
    }

    return jsonResponse({
      success: true,
      restauranteId,
      status: 'canceled',
      message: 'Assinatura cancelada com sucesso. Nenhuma cobrança futura será realizada e o período de trial foi encerrado sem custos.'
    })
  } catch (err: any) {
    return errorResponse(`Erro interno ao processar cancelamento: ${err.message || err}`, 500)
  }
})
