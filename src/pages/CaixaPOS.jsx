import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, ArrowLeft, AlertCircle, RefreshCw, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { buscarComandaPorNumero, fetchComandasAtivas, fecharComandaPagamento } from '../services/comandaService'
import { fetchPedidosComanda } from '../services/pedidoService'
import { supabase } from '../lib/supabase'
import BuscaComandaInput from '../components/caixa/BuscaComandaInput'
import ListaComandasAtivas from '../components/caixa/ListaComandasAtivas'
import ExtratoConsumoComanda from '../components/caixa/ExtratoConsumoComanda'
import ResumoTotalConta from '../components/caixa/ResumoTotalConta'
import ModalPagamentoComanda from '../components/caixa/ModalPagamentoComanda'
import ReciboComandaModal from '../components/caixa/ReciboComandaModal'

export default function CaixaPOS() {
  const { restaurante } = useAuth()
  const restauranteId = restaurante?.id

  const [termoBusca, setTermoBusca] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAtivas, setIsLoadingAtivas] = useState(false)
  const [comandasAtivas, setComandasAtivas] = useState([])
  const [comandaSelecionada, setComandaSelecionada] = useState(null)
  const [pedidosComanda, setPedidosComanda] = useState([])
  const [erroBusca, setErroBusca] = useState(null)
  const [feedbackMsg, setFeedbackMsg] = useState(null)

  // Estados dos Modais de Fechamento (Story 5.2)
  const [isModalPagamentoOpen, setIsModalPagamentoOpen] = useState(false)
  const [isModalReciboOpen, setIsModalReciboOpen] = useState(false)
  const [isProcessingPagamento, setIsProcessingPagamento] = useState(false)
  const [fechamentoConcluido, setFechamentoConcluido] = useState(null)

  // Ref de controle de requisição para prevenir race conditions
  const requestIdRef = useRef(0)
  const comandaSelecionadaRef = useRef(null)

  useEffect(() => {
    comandaSelecionadaRef.current = comandaSelecionada
  }, [comandaSelecionada])

  // Carregar lista de comandas ativas em uso
  const carregarComandasAtivas = useCallback(async () => {
    if (!restauranteId) {
      setComandasAtivas([])
      return
    }
    setIsLoadingAtivas(true)
    try {
      const ativas = await fetchComandasAtivas(restauranteId)
      setComandasAtivas(ativas || [])
    } catch (err) {
      console.warn('Erro ao carregar comandas ativas no Caixa:', err)
    } finally {
      setIsLoadingAtivas(false)
    }
  }, [restauranteId])

  useEffect(() => {
    if (restauranteId) {
      carregarComandasAtivas()
    }
  }, [carregarComandasAtivas, restauranteId])

  // Sincronização em Tempo Real (Invariante AD-3: WebSockets + Local Events)
  useEffect(() => {
    // 1. Ouvinte para eventos de pedidos locais (Modo Mock/Offline)
    const handleLocalSync = () => {
      carregarComandasAtivas()
      const current = comandaSelecionadaRef.current
      if (current) {
        fetchPedidosComanda(current.id, restauranteId, current.numero).then(pedidos => {
          if (comandaSelecionadaRef.current?.id === current.id) {
            setPedidosComanda(pedidos || [])
          }
        })
      }
    }

    const handleComandaFechada = (e) => {
      carregarComandasAtivas()
      const current = comandaSelecionadaRef.current
      if (current && (e.detail?.comandaId === current.id || e.detail?.comandaNumero === current.numero)) {
        // Se a comanda atualmente aberta foi fechada, limpar seleção
        setComandaSelecionada(null)
        setPedidosComanda([])
      }
    }

    window.addEventListener('restaurante_pedido_sync', handleLocalSync)
    window.addEventListener('restaurante_comanda_fechada', handleComandaFechada)

    // 2. Subscrição Supabase Realtime (se online)
    let channel = null
    try {
      channel = supabase
        .channel(`caixa-realtime-${restauranteId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pedidos', filter: `restaurante_id=eq.${restauranteId}` },
          () => {
            carregarComandasAtivas()
            const current = comandaSelecionadaRef.current
            if (current) {
              fetchPedidosComanda(current.id, restauranteId, current.numero).then(pedidos => {
                if (comandaSelecionadaRef.current?.id === current.id) {
                  setPedidosComanda(pedidos || [])
                }
              })
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'comandas', filter: `restaurante_id=eq.${restauranteId}` },
          () => {
            carregarComandasAtivas()
          }
        )
        .subscribe()
    } catch (e) {
      console.warn('Supabase Realtime não inicializado no Caixa:', e)
    }

    return () => {
      window.removeEventListener('restaurante_pedido_sync', handleLocalSync)
      window.removeEventListener('restaurante_comanda_fechada', handleComandaFechada)
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (e) {}
      }
    }
  }, [restauranteId, carregarComandasAtivas])

  // Executar busca de comanda com proteção contra Race Condition
  const handleBuscar = async (termo) => {
    if (!termo || !termo.trim()) return

    const thisRequestId = ++requestIdRef.current
    setIsLoading(true)
    setErroBusca(null)
    setFeedbackMsg(null)
    setPedidosComanda([]) // Limpar pedidos anteriores para evitar estado transitório inconsistente

    try {
      const result = await buscarComandaPorNumero(termo, restauranteId)

      // Se outra requisição mais nova foi disparada enquanto aguardávamos, descartar resultado obsoleto
      if (thisRequestId !== requestIdRef.current) return

      if (result && result.comanda) {
        // Buscar pedidos detalhados vinculados a esta comanda
        const pedidos = await fetchPedidosComanda(
          result.comanda.id,
          restauranteId,
          result.comanda.numero
        )

        if (thisRequestId !== requestIdRef.current) return

        setComandaSelecionada(result.comanda)
        setPedidosComanda(pedidos || [])
      } else {
        setComandaSelecionada(null)
        setPedidosComanda([])
        setErroBusca(`Nenhuma comanda encontrada com o termo "${termo}". Verifique o número digitado e tente novamente.`)
      }
    } catch (err) {
      console.error('Erro na busca de comanda no Caixa:', err)
      if (thisRequestId === requestIdRef.current) {
        setErroBusca('Ocorreu um erro ao consultar a comanda. Tente novamente.')
      }
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  // Selecionar comanda a partir da barra de atalhos rápidos
  const handleSelectComanda = (cmd) => {
    const raw = String(cmd.numero || '').replace(/^#/, '').trim()
    const num = raw ? raw.padStart(3, '0') : ''
    setTermoBusca(num)
    handleBuscar(num)
  }

  // Limpar seleção
  const handleLimparSelecao = () => {
    setComandaSelecionada(null)
    setPedidosComanda([])
    setErroBusca(null)
    setTermoBusca('')
  }

  // Ação de prosseguir pagamento -> Abre o modal de checkout (Story 5.2)
  const handleProsseguirPagamento = () => {
    setIsModalPagamentoOpen(true)
  }

  // Confirmação do pagamento e fechamento da conta (Story 5.2)
  const handleConfirmarPagamento = async (dadosPagamento) => {
    if (!comandaSelecionada) return
    setIsProcessingPagamento(true)

    try {
      const result = await fecharComandaPagamento({
        restauranteId,
        comandaId: comandaSelecionada.id,
        comandaNumero: comandaSelecionada.numero,
        pedidos: pedidosComanda,
        ...dadosPagamento
      })

      if (result && result.success) {
        setFechamentoConcluido(result.transacao)
        setIsModalPagamentoOpen(false)
        setIsModalReciboOpen(true)
        
        // Atualizar imediatamente as comandas ativas e limpar a comanda em segundo plano
        const num = String(comandaSelecionada.numero || '').padStart(3, '0')
        setComandaSelecionada(null)
        setPedidosComanda([])
        setTermoBusca('')
        await carregarComandasAtivas()

        setFeedbackMsg({
          tipo: 'sucesso',
          texto: `Comanda #${num} fechada com sucesso! Pagamento registrado e comanda liberada.`
        })
      } else {
        throw new Error('Falha ao processar fechamento.')
      }
    } catch (err) {
      console.error('Erro ao processar fechamento de comanda:', err)
      alert('Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.')
    } finally {
      setIsProcessingPagamento(false)
    }
  }

  // Atender próxima comanda (Fecha recibo e limpa estado para novo atendimento)
  const handleAtenderProximaComanda = () => {
    setIsModalReciboOpen(false)
    setFechamentoConcluido(null)
    handleLimparSelecao()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                <Receipt className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Terminal Caixa <span className="text-emerald-400">POS</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Busca de comandas, conferência de histórico de consumo, pagamento e fechamento de contas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarComandasAtivas}
              disabled={isLoadingAtivas}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAtivas ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </Link>
          </div>
        </div>

        {/* Notificação de Feedback */}
        {feedbackMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{feedbackMsg.texto}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs text-emerald-400/80 hover:text-white uppercase font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Seção 1: Busca de Comanda & Atalhos Rápidos */}
        <div className="space-y-4">
          <BuscaComandaInput
            termoBusca={termoBusca}
            setTermoBusca={setTermoBusca}
            onBuscar={handleBuscar}
            isLoading={isLoading}
            autoFocus={!comandaSelecionada}
          />

          <ListaComandasAtivas
            comandasAtivas={comandasAtivas}
            comandaSelecionada={comandaSelecionada}
            onSelectComanda={handleSelectComanda}
            onRefresh={carregarComandasAtivas}
            isLoading={isLoadingAtivas}
          />
        </div>

        {/* Mensagem de Erro de Busca */}
        {erroBusca && (
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <h4 className="font-bold text-red-200">Comanda Não Encontrada</h4>
              <p className="text-red-300/90">{erroBusca}</p>
            </div>
          </div>
        )}

        {/* Seção 2: Visualização da Comanda Selecionada */}
        {comandaSelecionada && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Coluna Principal: Extrato e Itens (2 colunas) */}
            <div className="lg:col-span-2 space-y-6">
              <ExtratoConsumoComanda
                comanda={comandaSelecionada}
                pedidos={pedidosComanda}
                restaurante={restaurante}
              />
            </div>

            {/* Coluna Lateral: Totalizador e Pagamento (1 coluna) */}
            <div className="lg:col-span-1">
              <ResumoTotalConta
                comanda={comandaSelecionada}
                pedidos={pedidosComanda}
                onProsseguirPagamento={handleProsseguirPagamento}
                onLimparSelecao={handleLimparSelecao}
              />
            </div>
          </div>
        )}

        {/* Estado Inicial quando nenhuma comanda foi buscada ainda */}
        {!comandaSelecionada && !erroBusca && (
          <div className="py-16 px-4 rounded-3xl bg-slate-900/30 border border-slate-800/60 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
              <Receipt className="w-8 h-8 text-emerald-400/80" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">Nenhuma Comanda Selecionada</h3>
              <p className="text-sm text-slate-400">
                Digite o número da comanda no campo de busca acima ou clique em uma das comandas ativas para visualizar o extrato de consumo e total a pagar.
              </p>
            </div>
          </div>
        )}

        {/* Modal de Pagamento & Checkout (Story 5.2 - AC1, AC2) */}
        <ModalPagamentoComanda
          isOpen={isModalPagamentoOpen}
          onClose={() => setIsModalPagamentoOpen(false)}
          comanda={comandaSelecionada}
          pedidos={pedidosComanda}
          restaurante={restaurante}
          onConfirmarPagamento={handleConfirmarPagamento}
          isProcessing={isProcessingPagamento}
        />

        {/* Modal de Recibo & Comprovante de Pagamento (Story 5.2 - AC4) */}
        <ReciboComandaModal
          isOpen={isModalReciboOpen}
          onClose={() => setIsModalReciboOpen(false)}
          fechamentoData={fechamentoConcluido}
          restaurante={restaurante}
          onNovaComanda={handleAtenderProximaComanda}
        />

      </div>
    </div>
  )
}

