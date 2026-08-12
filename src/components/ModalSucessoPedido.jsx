import React from 'react'
import { CheckCircle2, Sparkles, Clock, Utensils, MessageSquare, ArrowRight, ShoppingBag } from 'lucide-react'

export default function ModalSucessoPedido({ isOpen, onClose, orderData }) {
  if (!isOpen || !orderData) return null

  const { pedido, items } = orderData

  const formatPrice = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo / Animação de Sucesso */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-500/15 via-slate-950/40 to-slate-950 border-b border-slate-800/80 flex flex-col items-center text-center relative overflow-hidden">
          {/* Efeitos de Luz em Segundo Plano */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Ícone Animado */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md animate-pulse">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
          </div>

          {/* Título & Badge de Status */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1.5 leading-tight">
            Pedido Enviado para a Cozinha!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed mb-4">
            Sua solicitação foi registrada com sucesso e já está na fila de preparo.
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Status: Recebido (Pendente) &bull; {formatTime(pedido?.criado_em)}</span>
          </div>
        </div>

        {/* Conteúdo / Resumo dos Itens (Scrollable) */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Informações do Pedido */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-extrabold text-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Número do Pedido</span>
                <span className="text-base font-extrabold text-white">{pedido?.numeroDisplay || `#${pedido?.id?.slice(0, 5)}`}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Valor Total</span>
              <span className="text-base font-extrabold text-orange-500">{formatPrice(pedido?.valor_total)}</span>
            </div>
          </div>

          {/* Lista de Itens do Pedido */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
              <span>Itens Solicitados ({items?.length || 0})</span>
            </h3>

            <div className="space-y-2">
              {items && items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {item.quantidade}x
                      </span>
                      <span className="text-xs font-bold text-white truncate">{item.nome || 'Produto'}</span>
                    </div>

                    {item.observacao && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
                        <MessageSquare className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[220px]">"{item.observacao}"</span>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-slate-300 shrink-0">
                    {formatPrice((item.preco_unitario || item.preco || 0) * item.quantidade)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observação Geral */}
          {pedido?.observacaoGeral && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1 mb-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Observação Geral do Pedido</span>
              </span>
              <p className="text-xs text-slate-300 italic">"{pedido.observacaoGeral}"</p>
            </div>
          )}
        </div>

        {/* Rodapé / Botão de Ação */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Fazer Novo Pedido / Voltar ao Cardápio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
