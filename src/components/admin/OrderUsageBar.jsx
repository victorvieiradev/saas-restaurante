import React from 'react'
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowUpRight
} from 'lucide-react'

/**
 * Componente visual de consumo de pedidos mensais e progresso do plano (Story 7.5 AC1)
 *
 * @param {Object} props
 * @param {Object} props.subStatus - Dados retornados por fetchSubscriptionStatus
 * @param {Function} [props.onUpgradeClick] - Callback disparado ao clicar no botão de upgrade
 * @param {boolean} [props.compact=false] - Modo compacto para cabeçalhos ou cards menores
 * @param {boolean} [props.showUpgradeButton=true] - Exibir botão de atalho para upgrade
 */
export default function OrderUsageBar({
  subStatus,
  onUpgradeClick,
  compact = false,
  showUpgradeButton = true
}) {
  if (!subStatus) return null

  const {
    plano = 'starter',
    plano_info = {},
    limite_pedidos_mes: limitePedidos,
    pedidos_consumidos_mes: pedidosConsumidos = 0,
    percentual_consumido: percentualConsumido = 0,
    data_renovacao_ciclo: dataRenovacao,
    data_fim_trial: dataFimTrial,
    is_trial: isTrial
  } = subStatus

  const isUnlimited = limitePedidos === null || limitePedidos === undefined

  // Determinação de cor com base na faixa de consumo
  let progressColor = 'from-emerald-500 to-teal-500'
  let textColor = 'text-emerald-400'
  let borderColor = 'border-emerald-500/30'
  let badgeBg = 'bg-emerald-500/10'

  if (!isUnlimited) {
    if (percentualConsumido >= 90) {
      progressColor = 'from-rose-500 to-red-600'
      textColor = 'text-rose-400'
      borderColor = 'border-rose-500/30'
      badgeBg = 'bg-rose-500/10'
    } else if (percentualConsumido >= 70) {
      progressColor = 'from-amber-500 to-yellow-500'
      textColor = 'text-amber-400'
      borderColor = 'border-amber-500/30'
      badgeBg = 'bg-amber-500/10'
    }
  }

  // Formatador de data
  const formatData = (isoStr) => {
    if (!isoStr) return null
    try {
      const str = String(isoStr)
      const d = str.includes('T') ? new Date(str) : new Date(str + 'T00:00:00')
      if (isNaN(d.getTime())) return null
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return null
    }
  }

  const dataExibicao = formatData(dataRenovacao || (isTrial ? dataFimTrial : null))

  if (compact) {
    return (
      <div className={`p-3.5 rounded-xl bg-slate-900 border ${borderColor} shadow-sm space-y-2`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <TrendingUp className={`w-4 h-4 ${textColor}`} />
            <span>Consumo:</span>
            <strong className="text-white font-bold">
              {isUnlimited ? `${pedidosConsumidos} pedidos` : `${pedidosConsumidos}/${limitePedidos}`}
            </strong>
            {!isUnlimited && <span className={`font-mono ${textColor}`}>({percentualConsumido}%)</span>}
          </div>

          {showUpgradeButton && onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Upgrade</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Barra de Progresso */}
        {!isUnlimited && (
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, percentualConsumido))}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-slate-900 border ${borderColor} shadow-xl space-y-4 relative overflow-hidden`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${badgeBg} ${borderColor} border ${textColor} text-xs font-bold uppercase tracking-wider`}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Volume Mensal de Pedidos</span>
            </span>

            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px] font-mono">
              Plano {plano_info?.nome || plano?.toUpperCase() || 'STARTER'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            {isUnlimited ? (
              <span>{pedidosConsumidos} pedidos consumidos neste ciclo (Volume Ilimitado)</span>
            ) : (
              <span>
                {pedidosConsumidos} de {limitePedidos} pedidos consumidos neste ciclo{' '}
                <span className={`font-mono text-sm sm:text-base font-extrabold ${textColor}`}>
                  ({percentualConsumido}%)
                </span>
              </span>
            )}
          </h3>
        </div>

        {showUpgradeButton && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-center flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fazer Upgrade de Plano</span>
          </button>
        )}
      </div>

      {/* Barra de Progresso Visual */}
      {!isUnlimited && (
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-700`}
              style={{ width: `${Math.min(100, Math.max(2, percentualConsumido))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0 pedidos</span>
            {dataExibicao && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Ciclo renova em <strong>{dataExibicao}</strong></span>
              </span>
            )}
            <span>{limitePedidos} pedidos/mês</span>
          </div>
        </div>
      )}

      {isUnlimited && dataExibicao && (
        <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Ciclo mensal renova em <strong className="text-slate-200">{dataExibicao}</strong>.</span>
        </div>
      )}
    </div>
  )
}
