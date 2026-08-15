import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  Percent,
  Tag,
  Sparkles,
  ShieldCheck,
  Coins
} from 'lucide-react'

const roundBRL = (val) => Math.round((Number(val) || 0) * 100) / 100

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(roundBRL(value))
}

const FORMAS_PAGAMENTO = [
  {
    id: 'PIX',
    label: 'PIX',
    descricao: 'Transferência instantânea via QR Code',
    icone: QrCode,
    corBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'CARTAO_CREDITO',
    label: 'Cartão de Crédito',
    descricao: 'À vista ou parcelado na maquininha',
    icone: CreditCard,
    corBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  },
  {
    id: 'CARTAO_DEBITO',
    label: 'Cartão de Débito',
    descricao: 'Débito em conta corrente',
    icone: CreditCard,
    corBadge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'DINHEIRO',
    label: 'Dinheiro',
    descricao: 'Cédulas / Moedas físicas com troco',
    icone: Banknote,
    corBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  {
    id: 'VALE_REFEICAO',
    label: 'Vale Refeição',
    descricao: 'Alelo, VR, Sodexo, Ticket, etc.',
    icone: UtensilsCrossed,
    corBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  }
]

export default function ModalPagamentoComanda({
  isOpen,
  onClose,
  comanda,
  pedidos = [],
  restaurante = null,
  onConfirmarPagamento,
  isProcessing = false
}) {
  if (!isOpen || !comanda) return null

  const rawNum = String(comanda.numero || '').replace(/^#/, '').trim()
  const numFormatado = rawNum ? rawNum.padStart(3, '0') : '001'

  // Calcular subtotal inicial excluindo cancelados
  const pedidosValidos = pedidos.filter(p => String(p.status || '').toUpperCase() !== 'CANCELADO')
  const subtotal = roundBRL(pedidosValidos.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0))

  // Estados de cálculo
  const [incluirTaxaServico, setIncluirTaxaServico] = useState(false)
  const [percentualTaxa, setPercentualTaxa] = useState(10)
  const [desconto, setDesconto] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [valorRecebido, setValorRecebido] = useState('')
  const [erroValidacao, setErroValidacao] = useState(null)
  const prevFormaRef = useRef(formaPagamento)

  // Reset de estado quando abrir para uma nova comanda ou reabrir modal
  useEffect(() => {
    if (isOpen) {
      setIncluirTaxaServico(false)
      setPercentualTaxa(10)
      setDesconto('')
      setFormaPagamento('PIX')
      setValorRecebido('')
      setErroValidacao(null)
      prevFormaRef.current = 'PIX'
    }
  }, [isOpen, comanda?.id])

  // Cálculos dinâmicos com arredondamento preciso BRL
  const taxaServicoValor = incluirTaxaServico
    ? roundBRL((subtotal * (Math.max(0, Number(percentualTaxa)) || 0)) / 100)
    : 0
  const descontoValor = roundBRL(Math.max(0, Math.min(subtotal, Number(desconto) || 0)))
  const valorTotalFinal = roundBRL(Math.max(0, subtotal + taxaServicoValor - descontoValor))

  const numValorRecebido = roundBRL(Number(valorRecebido) || 0)
  const trocoCalculado = formaPagamento === 'DINHEIRO'
    ? roundBRL(Math.max(0, numValorRecebido - valorTotalFinal))
    : 0

  // Validação estrita para dinheiro (se não digitou nada ou valor menor que o total)
  const valorInsuficiente = formaPagamento === 'DINHEIRO' && (
    (valorTotalFinal > 0 && numValorRecebido < valorTotalFinal) ||
    (!valorRecebido && valorTotalFinal > 0)
  )

  // Preencher valor recebido padrão apenas na transição inicial para DINHEIRO
  useEffect(() => {
    if (formaPagamento === 'DINHEIRO' && prevFormaRef.current !== 'DINHEIRO' && !valorRecebido) {
      setValorRecebido(valorTotalFinal.toFixed(2))
    }
    prevFormaRef.current = formaPagamento
  }, [formaPagamento, valorTotalFinal, valorRecebido])

  // Resetar mensagens de erro ao alterar valores
  useEffect(() => {
    setErroValidacao(null)
  }, [formaPagamento, valorRecebido, desconto, incluirTaxaServico, percentualTaxa])

  const handleSubmeter = (e) => {
    e?.preventDefault?.()
    if (isProcessing) return

    if (formaPagamento === 'DINHEIRO') {
      if (valorTotalFinal > 0 && numValorRecebido < valorTotalFinal) {
        setErroValidacao(`O valor recebido (${formatMoney(numValorRecebido)}) é menor que o total a pagar (${formatMoney(valorTotalFinal)}).`)
        return
      }
    }

    onConfirmarPagamento({
      formaPagamento,
      subtotal,
      taxaServico: taxaServicoValor,
      desconto: descontoValor,
      valorTotal: valorTotalFinal,
      valorRecebido: formaPagamento === 'DINHEIRO' ? numValorRecebido : valorTotalFinal,
      troco: trocoCalculado
    })
  }

  // Sugestões de cédulas para dinheiro
  const sugestoesCedulas = [
    valorTotalFinal,
    Math.ceil(valorTotalFinal / 10) * 10,
    Math.ceil(valorTotalFinal / 20) * 20,
    Math.ceil(valorTotalFinal / 50) * 50,
    100,
    200
  ].filter((v, idx, arr) => v >= valorTotalFinal && arr.indexOf(v) === idx).slice(0, 4)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Fechamento &bull; Comanda #{numFormatado}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {restaurante?.nome || 'Restaurante Sabor & Arte'} &bull; Conferência final e recebimento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto">
          
          {/* Seletor de Forma de Pagamento */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Selecione a Forma de Pagamento</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {FORMAS_PAGAMENTO.map((forma) => {
                const isSelected = formaPagamento === forma.id
                const Icone = forma.icone

                return (
                  <button
                    key={forma.id}
                    type="button"
                    onClick={() => setFormaPagamento(forma.id)}
                    disabled={isProcessing}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                        <Icone className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{forma.label}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{forma.descricao}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Opções Financeiras: Taxa de Serviço e Desconto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            
            {/* Toggle e Ajuste da Taxa de Serviço */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="taxa-servico-toggle" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Taxa de Serviço</span>
                </label>
                <input
                  type="checkbox"
                  id="taxa-servico-toggle"
                  checked={incluirTaxaServico}
                  onChange={(e) => setIncluirTaxaServico(e.target.checked)}
                  disabled={isProcessing}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {incluirTaxaServico ? (
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={percentualTaxa}
                      onChange={(e) => setPercentualTaxa(e.target.value)}
                      disabled={isProcessing}
                      className="w-full pl-3 pr-7 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">
                    +{formatMoney(taxaServicoValor)}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Opcional (não incluído na conta).
                </p>
              )}
            </div>

            {/* Campo Desconto */}
            <div className="space-y-1.5">
              <label htmlFor="desconto-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>Desconto (R$)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                <input
                  id="desconto-input"
                  type="number"
                  step="0.50"
                  min="0"
                  max={subtotal}
                  placeholder="0,00"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  disabled={isProcessing}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Seção Dinheiro: Valor Recebido e Troco */}
          {formaPagamento === 'DINHEIRO' && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Coins className="w-4 h-4" />
                <span>Recebimento em Dinheiro & Cálculo de Troco</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Valor Recebido do Cliente (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min={0}
                      value={valorRecebido}
                      onChange={(e) => setValorRecebido(e.target.value)}
                      disabled={isProcessing}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border text-base font-bold text-white focus:outline-none ${
                        valorInsuficiente
                          ? 'border-red-500 text-red-300 focus:border-red-500'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
                  <span className="text-xs text-slate-400">Troco a Devolver:</span>
                  <div className={`text-2xl font-extrabold ${trocoCalculado > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {formatMoney(trocoCalculado)}
                  </div>
                </div>
              </div>

              {/* Sugestões Rápidas de Cédulas */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Atalhos rápidos de valor:</span>
                <div className="flex flex-wrap gap-2">
                  {sugestoesCedulas.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValorRecebido(Number(val).toFixed(2))}
                      disabled={isProcessing}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      {formatMoney(val)}
                    </button>
                  ))}
                </div>
              </div>

              {valorInsuficiente && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {!valorRecebido
                      ? 'Informe o valor em dinheiro recebido do cliente.'
                      : `Valor recebido insuficiente. Faltam ${formatMoney(valorTotalFinal - numValorRecebido)}.`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Resumo Consolidado de Valores */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Subtotal dos itens ({pedidosValidos.length} {pedidosValidos.length === 1 ? 'pedido' : 'pedidos'}):</span>
              <span className="font-semibold text-slate-200">{formatMoney(subtotal)}</span>
            </div>

            {taxaServicoValor > 0 && (
              <div className="flex items-center justify-between text-sm text-amber-400">
                <span>Taxa de serviço ({percentualTaxa}%):</span>
                <span className="font-semibold">+{formatMoney(taxaServicoValor)}</span>
              </div>
            )}

            {descontoValor > 0 && (
              <div className="flex items-center justify-between text-sm text-blue-400">
                <span>Desconto aplicado:</span>
                <span className="font-semibold">-{formatMoney(descontoValor)}</span>
              </div>
            )}

            <div className="border-t border-slate-800 pt-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Total Final a Pagar
                </span>
                <span className="text-xs text-emerald-400/80 font-medium">
                  Forma: {FORMAS_PAGAMENTO.find(f => f.id === formaPagamento)?.label}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {formatMoney(valorTotalFinal)}
              </div>
            </div>
          </div>

          {erroValidacao && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{erroValidacao}</span>
            </div>
          )}

        </div>

        {/* Modal Footer / Botão de Ação */}
        <div className="p-6 bg-slate-800/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmeter}
            disabled={isProcessing || valorInsuficiente}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando Pagamento...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Pagamento & Liberar Comanda</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
