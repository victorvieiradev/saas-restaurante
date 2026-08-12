import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Utensils, QrCode, AlertTriangle, Loader2, Lock, RefreshCw, Store, CheckCircle2, ArrowLeft } from 'lucide-react'
import { fetchComandaByToken } from '../services/comandaService'
import CardapioCliente from '../components/CardapioCliente'
import { CartProvider, useCart } from '../context/CartContext'
import BarraCarrinhoFlutuante from '../components/BarraCarrinhoFlutuante'
import ModalRevisaoPedido from '../components/ModalRevisaoPedido'
import ModalSucessoPedido from '../components/ModalSucessoPedido'

function ComandaClienteConteudo({ comandaData, loadComanda }) {
  const { comanda, restaurante } = comandaData || {}
  const { lastCreatedOrder, isSuccessOpen, setIsSuccessOpen } = useCart()
  const isEmUso = comanda?.status === 'EM_USO'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Cabeçalho Fixo da Comanda / Restaurante */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{restaurante?.nome || 'Restaurante Sabor & Arte'}</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Atendimento via Cardápio Digital</span>
              <span>&bull;</span>
              <span className="text-slate-300 font-medium">Mesa / Comanda</span>
            </p>
          </div>
        </div>

        {/* Badge da Comanda & Status */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-lg shadow-md shadow-orange-500/20 flex items-center gap-2">
            <QrCode className="w-5 h-5 opacity-80" />
            <span>Comanda #{comanda?.numero || '---'}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
            isEmUso
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isEmUso ? 'Em Atendimento' : 'Disponível'}</span>
          </div>
        </div>
      </div>

      {/* Componente Interativo do Cardápio Digital (Story 3.2 + Story 3.3) */}
      <CardapioCliente restauranteId={restaurante?.id || comanda?.restaurante_id} />

      {/* Componentes de Carrinho e Revisão (Story 3.3 + Story 3.4) */}
      <BarraCarrinhoFlutuante />
      <ModalRevisaoPedido 
        restauranteId={restaurante?.id || comanda?.restaurante_id} 
        comandaId={comanda?.id} 
        onOrderSent={loadComanda} 
      />
      <ModalSucessoPedido 
        isOpen={isSuccessOpen} 
        onClose={() => setIsSuccessOpen(false)} 
        orderData={lastCreatedOrder} 
      />
    </div>
  )
}

export default function ComandaCliente() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comandaData, setComandaData] = useState(null)

  const loadComanda = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    setError(null)

    try {
      const result = await fetchComandaByToken(token)
      if (!result || !result.comanda) {
        setError('not_found')
      } else if (result.comanda.status === 'ENCERRADA') {
        setComandaData(result)
        setError('encerrada')
      } else {
        setComandaData(result)
      }
    } catch (err) {
      console.error('Erro ao validar token da comanda:', err)
      if (!isBackground) setError('not_found')
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  useEffect(() => {
    loadComanda()
  }, [token])

  // Estado de Carregamento
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Validando Comanda</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          Aguarde um instante enquanto conectamos ao restaurante...
        </p>
      </div>
    )
  }

  // Estado de Erro: Comanda Não Encontrada ou Token Inválido
  if (error === 'not_found') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Código Inválido
        </span>
        <h2 className="text-2xl font-extrabold text-white mb-3">Comanda Não Encontrada</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Não encontramos uma comanda ativa com o código <code className="text-orange-400 font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{token}</code>. Por favor, leia o QR Code novamente ou peça ajuda ao garçom.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={loadComanda}
            className="w-full py-3 px-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>
          <Link
            to="/"
            className="w-full py-3 px-5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
      </div>
    )
  }

  // Estado de Erro: Comanda Encerrada
  if (error === 'encerrada') {
    const { comanda, restaurante } = comandaData || {}
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/10">
          <Lock className="w-10 h-10" />
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Comanda Fechada
        </span>
        <h2 className="text-2xl font-extrabold text-white mb-2">
          Comanda #{comanda?.numero || '---'} Encerrada
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Esta comanda foi finalizada no caixa do estabelecimento <strong className="text-slate-200">{restaurante?.nome}</strong>. Para fazer novos pedidos, solicite a abertura de uma nova comanda ao garçom.
        </p>
        <Link
          to="/"
          className="w-full py-3 px-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ir para a Página Inicial</span>
        </Link>
      </div>
    )
  }

  // Estado de Sucesso (Validação Concluída com Sucesso)
  const { comanda } = comandaData || {}

  return (
    <CartProvider comandaId={comanda?.id}>
      <ComandaClienteConteudo comandaData={comandaData} loadComanda={loadComanda} />
    </CartProvider>
  )
}
