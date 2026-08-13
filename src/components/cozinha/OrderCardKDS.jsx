import React, { useState, useEffect } from 'react'
import { Clock, AlertTriangle, Utensils, Receipt, CheckCircle2, Flame } from 'lucide-react'

/**
 * Calcula o tempo decorrido desde a data fornecida (em minutos e segundos ou formato legível)
 * @param {string|Date} dateString 
 * @returns {{ minutes: number, seconds: number, formatted: string, isLate: boolean }}
 */
function calculateElapsedTime(dateString) {
  if (!dateString) return { minutes: 0, seconds: 0, formatted: '00:00 min', isLate: false }
  
  const created = new Date(dateString).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, now - created)
  
  const totalSeconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')
  
  return {
    minutes,
    seconds,
    formatted: `${formattedMinutes}:${formattedSeconds} min`,
    isLate: minutes >= 15 // Considerado atrasado após 15 minutos
  }
}

export default function OrderCardKDS({ pedido }) {
  const [elapsed, setElapsed] = useState(() => calculateElapsedTime(pedido.criado_em))

  // Efeito para atualizar o cronômetro a cada 5 segundos
  useEffect(() => {
    setElapsed(calculateElapsedTime(pedido.criado_em))
    const interval = setInterval(() => {
      setElapsed(calculateElapsedTime(pedido.criado_em))
    }, 5000)

    return () => clearInterval(interval)
  }, [pedido.criado_em])

  const totalQuantidade = (pedido.itens || []).reduce((acc, item) => acc + (item.quantidade || 1), 0)
  const comandaDisplay = pedido.comandaNumero 
    ? `#${String(pedido.comandaNumero).padStart(3, '0')}` 
    : (pedido.numeroDisplay || `#${String(pedido.comanda_id || '001').slice(-3)}`)

  return (
    <div 
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
        elapsed.isLate 
          ? 'bg-slate-900 border-red-500/50 shadow-red-500/10' 
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Bar / Indicador de Alerta de Atraso */}
      {elapsed.isLate && (
        <div className="bg-red-500/20 text-red-300 text-xs font-semibold px-4 py-1 flex items-center justify-between border-b border-red-500/30 animate-pulse">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Atenção: Pedido com mais de 15 minutos</span>
          </span>
          <span className="font-mono font-bold">{elapsed.formatted}</span>
        </div>
      )}

      {/* Cabeçalho do Card */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comanda</span>
          <span className="text-2xl font-black text-white tracking-tight bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
            {comandaDisplay}
          </span>
        </div>

        {/* Stopwatch / Cronômetro */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
            elapsed.isLate 
              ? 'bg-red-500/15 text-red-400 border-red-500/30' 
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Tempo decorrido desde a criação do pedido"
        >
          <Clock className={`w-3.5 h-3.5 ${elapsed.isLate ? 'text-red-400 animate-spin-slow' : 'text-slate-400'}`} />
          <span>{elapsed.formatted}</span>
        </div>
      </div>

      {/* Lista de Itens do Pedido */}
      <div className="p-4 flex-1 space-y-3">
        {pedido.itens && pedido.itens.length > 0 ? (
          pedido.itens.map((item, index) => (
            <div key={item.id || index} className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg bg-orange-500/10 text-orange-400 font-extrabold text-sm border border-orange-500/20">
                    {item.quantidade}x
                  </span>
                  <span className="font-bold text-slate-100 text-base leading-snug pt-0.5">
                    {item.nome}
                  </span>
                </div>
              </div>

              {/* Observação do Item (Destacada em Amarelo/Âmbar) */}
              {item.observacao && (
                <div className="ml-9 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="font-medium italic">{item.observacao}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-xs text-slate-500 italic">
            Sem detalhes de itens disponíveis.
          </div>
        )}

        {/* Observação Geral do Pedido (se houver) */}
        {pedido.observacaoGeral && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-0.5">
            <div className="flex items-center gap-1 font-bold text-amber-400 text-[11px] uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              <span>Obs. Geral do Pedido:</span>
            </div>
            <p className="italic font-medium">{pedido.observacaoGeral}</p>
          </div>
        )}
      </div>

      {/* Rodapé do Card */}
      <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-slate-500" />
          <span>{totalQuantidade} {totalQuantidade === 1 ? 'item' : 'itens'}</span>
        </div>

        {pedido.valor_total != null && (
          <div className="font-semibold text-slate-300">
            Total: <span className="text-slate-100 font-bold">R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
