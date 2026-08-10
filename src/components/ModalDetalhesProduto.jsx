import React, { useState } from 'react'
import { X, Plus, Minus, MessageSquare, ImageOff, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function ModalDetalhesProduto({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')

  if (!product) return null

  const formatPrice = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const subtotal = (Number(product.preco) || 0) * quantidade

  const handleAddToCart = () => {
    addToCart(product, quantidade, observacao)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho / Imagem com Botão de Fechar */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-950 overflow-hidden shrink-0">
          {product.imagem_url ? (
            <img
              src={product.imagem_url}
              alt={product.nome}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
              <ImageOff className="w-12 h-12 mb-2" />
              <span className="text-xs">Foto não disponível</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/50 backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Modal (Scrollable) */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div>
            <h2 className="text-xl font-bold text-white mb-1.5">{product.nome}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {product.descricao || 'Sem descrição informada.'}
            </p>
            <div className="mt-3 inline-block px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 font-extrabold text-lg">
              {formatPrice(product.preco)}
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Observações do Item */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span>Observações para este item (opcional)</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Sem cebola, gelo e limão, molho à parte..."
              maxLength={200}
              rows={2}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
            />
            <div className="text-right text-[10px] text-slate-500">
              {observacao.length}/200 caracteres
            </div>
          </div>

          {/* Seletor de Quantidade */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold text-slate-200">Quantidade:</span>
            <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setQuantidade((prev) => Math.max(1, prev - 1))}
                disabled={quantidade <= 1}
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-white font-bold text-base">
                {quantidade}
              </span>
              <button
                type="button"
                onClick={() => setQuantidade((prev) => prev + 1)}
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal / Botão Adicionar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0">
          <button
            onClick={handleAddToCart}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Adicionar ao Pedido</span>
            </div>
            <span>{formatPrice(subtotal)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
