import React, { useEffect, useState } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, Send, MessageSquare, UtensilsCrossed, Loader2, AlertCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { criarPedido } from '../services/pedidoService'

export default function ModalRevisaoPedido({ restauranteId, comandaId, onOrderSent }) {
  const {
    cartItems,
    totalItems,
    totalAmount,
    observacaoGeral,
    setObservacaoGeral,
    removeFromCart,
    updateQuantity,
    clearCart,
    isRevisionOpen,
    setIsRevisionOpen,
    setLastCreatedOrder,
    setIsSuccessOpen
  } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Fechar modal de revisão se todos os itens forem removidos (AC5)
  useEffect(() => {
    if (isRevisionOpen && cartItems.length === 0 && !isSubmitting) {
      const timer = setTimeout(() => {
        setIsRevisionOpen(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isRevisionOpen, cartItems.length, isSubmitting, setIsRevisionOpen])

  if (!isRevisionOpen) return null

  const formatPrice = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const handleSendOrder = async () => {
    if (!cartItems || cartItems.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    const targetRestauranteId = restauranteId || 'demo-restaurante-id'
    const targetComandaId = comandaId || 'cmd-demo-015'

    try {
      const result = await criarPedido({
        restauranteId: targetRestauranteId,
        comandaId: targetComandaId,
        cartItems,
        valorTotal: totalAmount,
        observacaoGeral
      })

      if (result && result.success) {
        // Armazenar dados do pedido criado para exibição no modal de sucesso
        setLastCreatedOrder({
          pedido: result.pedido,
          items: result.items
        })

        // Fechar revisão, limpar carrinho e abrir modal de sucesso
        setIsRevisionOpen(false)
        clearCart()
        setIsSuccessOpen(true)

        // Notificar componente pai (ComandaCliente) para atualizar o status da comanda em background
        if (onOrderSent) {
          onOrderSent(true)
        }
      } else {
        setSubmitError('Não foi possível gravar o pedido. Por favor, tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao enviar pedido para a cozinha:', err)
      setSubmitError('Ocorreu um erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Revisão do Pedido</h2>
              <p className="text-xs text-slate-400">
                {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && !isSubmitting && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 transition-colors"
                title="Esvaziar carrinho"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => !isSubmitting && setIsRevisionOpen(false)}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Carrinho (Scrollable) */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Alerta de Erro se Houver */}
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Carrinho Vazio */}
          {cartItems.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Seu carrinho está vazio</h3>
                <p className="text-slate-400 text-xs max-w-xs">
                  Navegue pelo cardápio e adicione seus pratos e bebidas favoritos.
                </p>
              </div>
              <button
                onClick={() => setIsRevisionOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                Voltar ao Cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Lista de Itens */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex gap-3 sm:gap-4 items-start"
                  >
                    {/* Imagem Miniatura */}
                    {item.imagem_url ? (
                      <img
                        src={item.imagem_url}
                        alt={item.nome}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-900 shrink-0 border border-slate-800"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center text-slate-600">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}

                    {/* Detalhes do Item */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{item.nome}</h4>
                        {!isSubmitting && (
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors shrink-0"
                            title="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Observação do Item */}
                      {item.observacao && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[200px]">"{item.observacao}"</span>
                        </div>
                      )}

                      {/* Controles de Quantidade & Subtotal */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40">
                        <span className="text-sm font-bold text-orange-500">
                          {formatPrice(item.subtotal)}
                        </span>

                        <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                            disabled={isSubmitting}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-white px-1">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                            disabled={isSubmitting}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Observação Geral do Pedido */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span>Observação geral para a cozinha (opcional)</span>
                </label>
                <textarea
                  value={observacaoGeral}
                  onChange={(e) => setObservacaoGeral(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Ex: Favor trazer tudo junto, ou servir as bebidas antes..."
                  rows={2}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 transition-all resize-none disabled:opacity-50"
                />
              </div>
            </>
          )}
        </div>

        {/* Rodapé / Resumo do Valor & Botão Enviar */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Subtotal dos itens</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-white font-extrabold text-lg pt-1 border-t border-slate-800">
                <span>Total</span>
                <span className="text-orange-500">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={handleSendOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Pedido para a Cozinha...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Pedido para a Cozinha</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
