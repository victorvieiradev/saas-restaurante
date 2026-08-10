import React from 'react'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function BarraCarrinhoFlutuante() {
  const { totalItems, totalAmount, setIsRevisionOpen } = useCart()

  if (totalItems <= 0) return null

  const formatPrice = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 border border-orange-500/30 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 ring-1 ring-orange-500/20">
        {/* Info do Carrinho */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
              {totalItems}
            </span>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total parcial</p>
            <p className="text-lg font-black text-white leading-none mt-0.5">
              {formatPrice(totalAmount)}
            </p>
          </div>
        </div>

        {/* Botão para Abrir Revisão */}
        <button
          onClick={() => setIsRevisionOpen(true)}
          className="px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          <span>Ver Pedido</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
