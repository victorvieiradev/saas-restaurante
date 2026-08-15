import React, { useRef } from 'react'
import {
  CheckCircle2,
  Printer,
  ArrowRight,
  Receipt,
  X,
  Store,
  Calendar,
  CreditCard,
  Sparkles,
  QrCode,
  Tag
} from 'lucide-react'

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

function formatDataHora(isoString) {
  if (!isoString) return '--/--/---- --:--'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '--/--/---- --:--'
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '--/--/---- --:--'
  }
}

const LABELS_PAGAMENTO = {
  PIX: 'PIX (QR Code)',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  DINHEIRO: 'Dinheiro',
  VALE_REFEICAO: 'Vale Refeição'
}

export default function ReciboComandaModal({
  isOpen,
  onClose,
  fechamentoData,
  restaurante = null,
  onNovaComanda
}) {
  if (!isOpen || !fechamentoData) return null

  const {
    comanda_numero,
    forma_pagamento,
    subtotal,
    taxa_servico,
    desconto,
    valor_total,
    valor_recebido,
    troco,
    pedidos_resumo = [],
    fechado_em,
    id: transacaoId
  } = fechamentoData

  const numFormatado = comanda_numero ? String(comanda_numero).padStart(3, '0') : '001'
  const nomeRestaurante = restaurante?.nome || 'Restaurante Sabor & Arte'
  const formaPagamentoFormatada = LABELS_PAGAMENTO[forma_pagamento] || forma_pagamento || 'PIX'

  // Consolidar todos os itens de todos os pedidos desta sessão
  const todosItens = []
  pedidos_resumo.forEach(p => {
    (p.itens || []).forEach(it => {
      todosItens.push(it)
    })
  })

  const handlePrint = () => {
    window.print()
  }

  const handleAtenderProxima = () => {
    if (onNovaComanda) {
      onNovaComanda()
    } else if (onClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Banner de Sucesso */}
        <div className="p-6 bg-gradient-to-b from-emerald-500/20 to-transparent border-b border-slate-800 text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Pagamento Realizado com Sucesso!
          </h2>
          <p className="text-sm text-emerald-400 font-semibold">
            Comanda #{numFormatado} liberada e disponível para a próxima mesa.
          </p>
        </div>

        {/* Cupom / Recibo Imprimível */}
        <div className="p-6 space-y-5 max-h-[calc(75vh-150px)] overflow-y-auto">
          
          <div
            id="area-recibo-impressao"
            className="p-6 rounded-2xl bg-white text-slate-900 font-mono text-xs shadow-inner space-y-4 border border-slate-200"
          >
            {/* Header do Cupom */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 font-sans">
                {nomeRestaurante}
              </h3>
              <p className="text-[10px] text-slate-600">SISTEMA DE CARDÁPIO DIGITAL & POS</p>
              <p className="text-[10px] text-slate-500">{formatDataHora(fechado_em)}</p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-extrabold text-xs">
                  RECIBO &bull; COMANDA #{numFormatado}
                </span>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-2 border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
                <span>QTD ITEM</span>
                <span>TOTAL</span>
              </div>

              {todosItens.length === 0 ? (
                <p className="text-center text-slate-500 py-2">Consumo registrado</p>
              ) : (
                todosItens.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1 pr-2">
                      <span className="font-bold">{it.quantidade}x</span> {it.nome}
                    </div>
                    <span className="font-semibold whitespace-nowrap">
                      {formatMoney(it.subtotal || it.quantidade * it.preco_unitario)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Totais do Cupom */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span>{formatMoney(subtotal)}</span>
              </div>

              {taxa_servico > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Taxa de Serviço:</span>
                  <span>+{formatMoney(taxa_servico)}</span>
                </div>
              )}

              {desconto > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Desconto:</span>
                  <span>-{formatMoney(desconto)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL PAGO:</span>
                <span>{formatMoney(valor_total)}</span>
              </div>
            </div>

            {/* Detalhes do Pagamento */}
            <div className="space-y-1 text-[10px] text-slate-600">
              <div className="flex justify-between">
                <span>Forma de Pagamento:</span>
                <span className="font-bold text-slate-800">{formaPagamentoFormatada}</span>
              </div>

              {forma_pagamento === 'DINHEIRO' && (
                <>
                  <div className="flex justify-between">
                    <span>Valor Recebido:</span>
                    <span>{formatMoney(valor_recebido)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Troco:</span>
                    <span>{formatMoney(troco)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-1 text-[9px] text-slate-400 border-t border-slate-100">
                <span>Transação:</span>
                <span className="font-mono">{String(transacaoId || 'N/A').toUpperCase()}</span>
              </div>
            </div>

            {/* Rodapé do Cupom */}
            <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-500">
              <p>Obrigado pela preferência!</p>
              <p className="text-[8px] text-slate-400 mt-0.5">Volte sempre &bull; Documento Não Fiscal</p>
            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-6 bg-slate-800/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Imprimir Recibo</span>
          </button>

          <button
            type="button"
            onClick={handleAtenderProxima}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
          >
            <span>Atender Próxima Comanda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Estilo CSS exclusivo para impressão limpa de cupom via @media print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #area-recibo-impressao, #area-recibo-impressao * {
            visibility: visible !important;
          }
          #area-recibo-impressao {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}} />
    </div>
  )
}
