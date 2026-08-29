import React, { useState } from 'react'
import {
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { PLANS_CONFIG, upgradeSubscription } from '../../services/subscriptionService'

/**
 * Modal de Upgrade de Plano com 1 Clique (Story 7.5 AC4)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está visível
 * @param {Function} props.onClose - Callback ao fechar o modal
 * @param {string} props.restauranteId - UUID do restaurante
 * @param {Object} props.subStatus - Estado atual da assinatura
 * @param {Function} props.onSuccess - Callback após sucesso no upgrade
 */
export default function UpgradePlanModal({
  isOpen,
  onClose,
  restauranteId,
  subStatus,
  onSuccess
}) {
  if (!isOpen) return null

  const currentPlanKey = (subStatus?.plano || 'starter').toLowerCase()
  const currentPlan = PLANS_CONFIG[currentPlanKey] || PLANS_CONFIG.starter
  const currentLimit = subStatus?.limite_pedidos_mes ?? currentPlan.limite_pedidos ?? 300

  // Planos disponíveis para upgrade
  const planHierarchy = ['starter', 'pro', 'scale', 'enterprise']
  const currentIndex = planHierarchy.indexOf(currentPlanKey)

  // Determina plano selecionado por padrão (o próximo nível)
  const defaultNextPlan = currentIndex < 1 ? 'pro' : (currentIndex === 1 ? 'scale' : 'enterprise')
  const [selectedPlanKey, setSelectedPlanKey] = useState(defaultNextPlan)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  React.useEffect(() => {
    if (isOpen) {
      setSelectedPlanKey(defaultNextPlan)
      setError(null)
    }
  }, [isOpen, defaultNextPlan])

  const formatValor = (v) => {
    if (v === null || v === undefined) return 'Sob Consulta'
    const num = Number(v)
    if (!Number.isFinite(num)) return 'R$ 0,00'
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Lista de planos para exibição no modal (apenas planos superiores ou todos relevantes)
  const availablePlans = ['pro', 'scale', 'enterprise'].filter(key => {
    const idx = planHierarchy.indexOf(key)
    return idx > currentIndex
  })

  const handleConfirmUpgrade = async () => {
    if (!restauranteId) {
      setError('ID do restaurante não informado.')
      return
    }

    if (selectedPlanKey === 'enterprise') {
      // Para Enterprise, abre WhatsApp ou contato
      window.open('https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20o%20upgrade%20para%20o%20Plano%20Enterprise%20do%20RestauranteApp.', '_blank')
      onClose()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await upgradeSubscription(restauranteId, selectedPlanKey)
      if (res.error) {
        setError(res.error.message || 'Falha ao atualizar plano.')
      } else {
        if (onSuccess) {
          onSuccess(res.data)
        }
        onClose()
      }
    } catch (err) {
      setError('Erro de comunicação ao processar upgrade.')
    } finally {
      setLoading(false)
    }
  }

  const selectedPlanInfo = PLANS_CONFIG[selectedPlanKey]
  const diffValor = selectedPlanInfo?.preco_mensal && currentPlan.preco_mensal
    ? selectedPlanInfo.preco_mensal - currentPlan.preco_mensal
    : 0

  const diffPedidos = selectedPlanInfo?.limite_pedidos && currentLimit
    ? selectedPlanInfo.limite_pedidos - currentLimit
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                  Upgrade com 1 Clique
                </span>
                <span className="text-xs text-slate-400">Plano Atual: <strong>{currentPlan.nome}</strong> ({currentLimit} pedidos)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Aumente o Limite do Seu Restaurante
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Planos Disponíveis */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-300">
            Escolha o plano ideal para a demanda do seu estabelecimento:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePlans.map((key) => {
              const plan = PLANS_CONFIG[key]
              const isSelected = selectedPlanKey === key
              const isRecommended = key === 'pro' || (currentPlanKey === 'pro' && key === 'scale')

              const pedidosBonus = (plan.limite_pedidos && currentLimit && plan.limite_pedidos > currentLimit)
                ? plan.limite_pedidos - currentLimit
                : null

              const extraMensal = plan.preco_mensal && currentPlan.preco_mensal
                ? plan.preco_mensal - currentPlan.preco_mensal
                : null

              return (
                <div
                  key={key}
                  onClick={() => setSelectedPlanKey(key)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 relative ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                      Mais Escolhido
                    </span>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Plano {plan.nome}</span>
                      </h3>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-700'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">{plan.descricao}</p>

                    <div className="pt-2">
                      <div className="text-2xl font-extrabold text-white">
                        {formatValor(plan.preco_mensal)}
                        {plan.preco_mensal && <span className="text-xs font-normal text-slate-400"> /mês</span>}
                      </div>

                      {extraMensal !== null && extraMensal > 0 && (
                        <p className="text-[11px] text-orange-400 font-semibold mt-0.5">
                          + {formatValor(extraMensal)}/mês de diferença
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Benefícios Rápidos */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        {plan.limite_pedidos ? `${plan.limite_pedidos} pedidos/mês` : 'Volume Ilimitado'}
                        {pedidosBonus ? ` (+${pedidosBonus.toLocaleString('pt-BR')} pedidos)` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span>KDS ilimitado & Cardápio Digital</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumo do Upgrade Selecionado */}
        {selectedPlanInfo && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Novo limite imediato:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {selectedPlanInfo.limite_pedidos ? `${selectedPlanInfo.limite_pedidos.toLocaleString('pt-BR')} pedidos/mês` : 'Ilimitado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cobrança proporcional/ajustada:</span>
              <span className="font-mono text-white">
                {selectedPlanInfo.preco_mensal
                  ? `${formatValor(selectedPlanInfo.preco_mensal)}/mês no cartão cadastrado`
                  : 'Sob consulta personalizada com nossa equipe'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Sem taxa de adesão. O novo limite entra em vigor instantaneamente.</span>
            </div>
          </div>
        )}

        {/* Ações do Modal */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleConfirmUpgrade}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>
              {loading
                ? 'Atualizando Plano...'
                : selectedPlanKey === 'enterprise'
                ? 'Falar com Consultor Enterprise'
                : 'Confirmar Upgrade Agora'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
