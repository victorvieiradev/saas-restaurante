import React from 'react'
import { Clock, ChefHat, CheckCircle2, Flame, AlertCircle, ShoppingBag, Utensils, MessageSquare } from 'lucide-react'

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

function formatHora(isoString) {
  if (!isoString) return '--:--'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '--:--'
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}

function calcularPermanencia(isoString) {
  if (!isoString) return null
  try {
    const start = new Date(isoString).getTime()
    if (isNaN(start)) return null
    const diffMs = Math.max(0, Date.now() - start)
    const diffMinutes = Math.floor(diffMs / 60000)
    if (diffMinutes < 1) return 'recém-aberto'
    if (diffMinutes < 60) return `${diffMinutes} min`
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
  } catch {
    return null
  }
}

function StatusPedidoBadge({ status }) {
  const normStatus = String(status || '').toUpperCase()
  switch (normStatus) {
    case 'PENDENTE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
          <Clock className="w-3 h-3 animate-pulse" />
          <span>Pendente</span>
        </span>
      )
    case 'EM_PREPARO':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
          <Flame className="w-3 h-3" />
          <span>Em Preparo</span>
        </span>
      )
    case 'CONCLUIDO':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <CheckCircle2 className="w-3 h-3" />
          <span>Pronto / Concluído</span>
        </span>
      )
    case 'CANCELADO':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
          <AlertCircle className="w-3 h-3" />
          <span>Cancelado</span>
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
          {status}
        </span>
      )
  }
}

export default function ExtratoConsumoComanda({
  comanda,
  pedidos = [],
  restaurante = null
}) {
  if (!comanda) return null

  const rawNum = String(comanda.numero || '').replace(/^#/, '').trim()
  const numFormatado = rawNum ? rawNum.padStart(3, '0') : '001'
  
  const totalItens = pedidos.reduce((acc, p) => {
    if (String(p.status || '').toUpperCase() === 'CANCELADO') return acc
    return acc + (p.itens || []).reduce((subAcc, it) => subAcc + (Number(it.quantidade) > 0 ? Number(it.quantidade) : 1), 0)
  }, 0)

  // Timestamp de início da sessão (da comanda ou do primeiro pedido)
  const inicioTimestamp = comanda.sessao_iniciada_em || pedidos[0]?.criado_em
  const tempoPermanencia = calcularPermanencia(inicioTimestamp)

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Comanda */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Comanda <span className="text-orange-500">#{numFormatado}</span>
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                comanda.status === 'EM_USO'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : comanda.status === 'DISPONIVEL'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {comanda.status === 'EM_USO' ? '● Em Aberto (Uso)' : comanda.status === 'DISPONIVEL' ? '✓ Disponível' : 'Encerrada'}
            </span>
          </div>

          <p className="text-sm text-slate-400">
            {restaurante?.nome || 'Restaurante Sabor & Arte'} &bull; Token: <code className="text-xs text-slate-500">{comanda.qr_code_token || 'N/A'}</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-orange-400" />
            <span><strong className="text-white">{pedidos.length}</strong> {pedidos.length === 1 ? 'pedido' : 'pedidos'}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span><strong className="text-white">{totalItens}</strong> {totalItens === 1 ? 'item' : 'itens'}</span>
          </div>
          {inicioTimestamp && (
            <>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>
                  Início: <strong className="text-slate-300">{formatHora(inicioTimestamp)}</strong>
                  {tempoPermanencia && (
                    <span className="ml-1 text-xs text-amber-400/90 font-medium">({tempoPermanencia})</span>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lista de Pedidos ou Estado Vazio */}
      {pedidos.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <ChefHat className="w-7 h-7 text-orange-400/80" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum Pedido Registrado</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {comanda.status === 'DISPONIVEL'
              ? `A Comanda #${numFormatado} está limpa e disponível sem nenhum consumo ativo no momento.`
              : `A Comanda #${numFormatado} está aberta, mas nenhum pedido foi finalizado ainda.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>Extrato de Pedidos da Comanda ({pedidos.length})</span>
          </h3>

          {pedidos.map((pedido, index) => {
            const isCancelado = pedido.status === 'CANCELADO'

            return (
              <div
                key={pedido.id || index}
                className={`rounded-2xl bg-slate-900 border transition-all overflow-hidden ${
                  isCancelado ? 'border-red-900/40 opacity-75' : 'border-slate-800 shadow-md'
                }`}
              >
                {/* Header do Pedido */}
                <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center text-xs font-extrabold border border-orange-500/20">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white text-sm">
                        Envio #{String(pedido.id).slice(-4).toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        às {formatHora(pedido.criado_em)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusPedidoBadge status={pedido.status} />
                    <span className={`text-sm font-bold ${isCancelado ? 'line-through text-slate-500' : 'text-orange-400'}`}>
                      {formatMoney(pedido.valor_total)}
                    </span>
                  </div>
                </div>

                {/* Observação Geral do Pedido se houver */}
                {pedido.observacaoGeral && (
                  <div className="px-5 py-2 bg-amber-500/5 border-b border-amber-500/10 text-xs text-amber-300 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span><strong>Obs. Geral:</strong> {pedido.observacaoGeral}</span>
                  </div>
                )}

                {/* Tabela de Itens */}
                <div className="divide-y divide-slate-800/60">
                  {(pedido.itens || []).map((item, itemIdx) => (
                    <div
                      key={item.id || itemIdx}
                      className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors text-sm"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-400 min-w-[24px]">
                            {item.quantidade}x
                          </span>
                          <span className={`font-medium text-slate-200 truncate ${isCancelado ? 'line-through text-slate-500' : ''}`}>
                            {item.nome}
                          </span>
                        </div>
                        {item.observacao && (
                          <p className="text-xs text-amber-400/90 pl-8 flex items-center gap-1 italic">
                            <span>↳ Obs: {item.observacao}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className={`font-semibold ${isCancelado ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {formatMoney(item.subtotal || item.quantidade * item.preco_unitario)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatMoney(item.preco_unitario)} un.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
