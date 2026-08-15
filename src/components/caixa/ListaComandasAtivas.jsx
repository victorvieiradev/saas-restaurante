import React from 'react'
import { Sparkles, RefreshCw, UserCheck, CheckCircle2 } from 'lucide-react'

/**
 * Componente de lista de atalhos rápidos com as comandas ativas (status EM_USO)
 */
export default function ListaComandasAtivas({
  comandasAtivas = [],
  comandaSelecionada = null,
  onSelectComanda,
  onRefresh,
  isLoading = false
}) {
  if (comandasAtivas.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-300">Nenhuma Comanda Ativa em Uso</h4>
            <p className="text-xs text-slate-500">Todas as comandas estão disponíveis ou aguardando primeiro pedido.</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Comandas Ativas no Salão ({comandasAtivas.length})</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {comandasAtivas.map((cmd) => {
          const isSelected = comandaSelecionada?.id === cmd.id
          const rawNum = String(cmd.numero || '').replace(/^#/, '').trim()
          const numeroFormatado = rawNum ? rawNum.padStart(3, '0') : '001'
          const qtdPedidos = cmd.pedidos_count || 1

          return (
            <button
              key={cmd.id}
              onClick={() => onSelectComanda(cmd)}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border ${
                isSelected
                  ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/25 scale-105'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>#{numeroFormatado}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                isSelected ? 'bg-orange-600/80 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {qtdPedidos} {qtdPedidos === 1 ? 'ped.' : 'peds.'}
              </span>
              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
