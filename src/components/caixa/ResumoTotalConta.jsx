import React from 'react'
import { Receipt, CheckCircle2, ArrowRight, XCircle, CreditCard, ShieldCheck } from 'lucide-react'

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

export default function ResumoTotalConta({
  comanda,
  pedidos = [],
  onProsseguirPagamento,
  onLimparSelecao
}) {
  if (!comanda) return null

  // Calcular valores acumulados excluindo pedidos cancelados
  const pedidosValidos = pedidos.filter(p => String(p.status || '').toUpperCase() !== 'CANCELADO')
  const totalValor = pedidosValidos.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
  const totalItens = pedidosValidos.reduce((acc, p) => {
    return acc + (p.itens || []).reduce((subAcc, it) => subAcc + (Number(it.quantidade) > 0 ? Number(it.quantidade) : 1), 0)
  }, 0)

  // Há consumo se houver pedidos válidos cadastrados
  const temConsumo = pedidosValidos.length > 0
  const isDisponivel = comanda.status === 'DISPONIVEL'

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 sticky top-24">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-lg">Resumo da Conta</h3>
        </div>
        <button
          onClick={onLimparSelecao}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Outra Comanda</span>
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span>Pedidos registrados:</span>
          <span className="font-bold text-slate-200">{pedidosValidos.length}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Itens totais:</span>
          <span className="font-bold text-slate-200">{totalItens}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Taxa de serviço (opcional):</span>
          <span className="text-xs text-slate-500 font-medium">Não inclusa</span>
        </div>
      </div>

      {/* Total Geral Destacado */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Valor Total a Pagar
        </span>
        <div className="text-3xl font-extrabold text-orange-400 flex items-baseline justify-between">
          <span>{formatMoney(totalValor)}</span>
          <span className="text-xs font-normal text-slate-500">BRL</span>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-3">
        <button
          onClick={onProsseguirPagamento}
          disabled={!temConsumo}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Prosseguir para Pagamento</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {isDisponivel && !temConsumo && (
          <div className="flex items-center gap-2 text-xs text-emerald-400/90 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Comanda limpa e disponível. Nenhuma cobrança pendente.</span>
          </div>
        )}
      </div>

      {/* Dica de Segurança */}
      <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5 justify-center">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Conferência de conta POS &bull; Terminal Operacional</span>
      </div>
    </div>
  )
}
