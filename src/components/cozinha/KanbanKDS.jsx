import React, { useState, useEffect, useCallback } from 'react'
import { ChefHat, RefreshCw, Clock, AlertCircle, CheckCircle2, Flame, Layers, Radio, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import OrderCardKDS from './OrderCardKDS'
import { fetchPedidosKDS, subscribeToPedidosKDS } from '../../services/pedidoService'
import { playNewOrderSound, getSoundPreference, setSoundPreference, unlockAudio } from '../../lib/soundNotification'

export default function KanbanKDS({ restauranteId = 'demo-restaurante-id' }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  
  // Estado do Som e Conexão WebSocket
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => getSoundPreference())
  const [realtimeStatus, setRealtimeStatus] = useState('CONNECTING') // 'SUBSCRIBED' | 'CONNECTING' | 'FALLBACK'

  // Alternar preferência de som
  const toggleSound = () => {
    const nextState = !isAudioEnabled
    setIsAudioEnabled(nextState)
    setSoundPreference(nextState)
    if (nextState) {
      unlockAudio()
      playNewOrderSound() // Testar e desbloquear áudio do navegador
    }
  }

  // Função para carregar pedidos do KDS
  const loadKDSData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true)
    try {
      const data = await fetchPedidosKDS(restauranteId)
      
      setPedidos((prevPedidos) => {
        const novosList = data || []
        
        // Se não for a primeira carga e houver pedidos novos, toca o áudio
        if (prevPedidos.length > 0 && novosList.length > 0) {
          const existingIds = new Set(prevPedidos.map(p => p.id))
          const temNovoPedido = novosList.some(p => !existingIds.has(p.id))
          if (temNovoPedido) {
            playNewOrderSound()
          }
        }
        
        return novosList
      })
      
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Erro ao carregar pedidos do KDS:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [restauranteId])

  // Efeito principal: carga inicial, polling secundário e inscrição WebSockets Realtime
  useEffect(() => {
    loadKDSData()

    // 1. Inscrição em Tempo Real no Supabase
    const unsubscribe = subscribeToPedidosKDS(restauranteId, {
      onNewPedido: (novoPedido) => {
        setPedidos((prevPedidos) => {
          // Previne duplicatas se o pedido já estiver no estado
          const jaExiste = prevPedidos.some((p) => p.id === novoPedido.id)
          if (jaExiste) return prevPedidos

          // Se for novo pedido, toca notificação sonora
          playNewOrderSound()
          setLastUpdated(new Date())
          return [novoPedido, ...prevPedidos]
        })
      },
      onUpdatePedido: (pedidoAtualizado) => {
        setPedidos((prevPedidos) =>
          prevPedidos.map((p) => (p.id === pedidoAtualizado.id ? { ...p, ...pedidoAtualizado } : p))
        )
        setLastUpdated(new Date())
      },
      onStatusChange: (status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('SUBSCRIBED')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'FALLBACK') {
          setRealtimeStatus('FALLBACK')
        }
      }
    })

    // 2. Polling secundário a cada 10s como garantia de fallback
    const timer = setInterval(() => {
      loadKDSData(false)
    }, 10000)

    return () => {
      clearInterval(timer)
      unsubscribe()
    }
  }, [restauranteId, loadKDSData])

  // Filtragem dos pedidos pelas 3 colunas (insensível a caixa)
  const pendentes = pedidos.filter(p => p.status?.toUpperCase() === 'PENDENTE')
  const emPreparo = pedidos.filter(p => p.status?.toUpperCase() === 'EM_PREPARO')
  const concluidos = pedidos.filter(p => p.status?.toUpperCase() === 'CONCLUIDO')

  return (
    <div className="space-y-6" onClick={unlockAudio}>
      {/* Barra de Controle do KDS */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Monitor KDS - Cozinha</h2>
              
              {/* Badge do Status da Conexão WebSockets / Realtime */}
              {realtimeStatus === 'SUBSCRIBED' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Ao Vivo (Realtime)</span>
                </span>
              ) : realtimeStatus === 'CONNECTING' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                  <Wifi className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>Conectando...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/20">
                  <Radio className="w-3.5 h-3.5 text-orange-400" />
                  <span>Modo Polling (Ativo)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Gerenciamento visual da fila de pedidos em tempo real &bull; Atualizado às {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Controles: Ativar/Desativar Som, Contador e Botão Refresh */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          
          {/* Botão de Toggle de Alerta Sonoro */}
          <button
            onClick={toggleSound}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isAudioEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title={isAudioEnabled ? 'Alerta sonoro ativado (Clique para mutar)' : 'Alerta sonoro desativado (Clique para ativar)'}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Som Ativado</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Som Mutado</span>
              </>
            )}
          </button>

          {/* Estatísticas de Pedidos por Coluna */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium px-4 py-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {pendentes.length} Pendentes
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              {emPreparo.length} Em Preparo
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {concluidos.length} Concluídos
            </span>
          </div>

          {/* Botão de Atualizar Manual */}
          <button
            onClick={() => loadKDSData(true)}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700 flex items-center gap-2 disabled:opacity-50"
            title="Atualizar lista de pedidos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Grid Kanban de 3 Colunas */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Carregando pedidos da cozinha...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUNA 1: PENDENTES */}
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-white text-base">Pendentes</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold text-xs">
                {pendentes.length}
              </span>
            </div>

            <div className="space-y-4">
              {pendentes.length > 0 ? (
                pendentes.map(pedido => (
                  <OrderCardKDS key={pedido.id} pedido={pedido} />
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 text-slate-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs font-medium">Nenhum pedido pendente na fila.</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 2: EM PREPARO */}
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <h3 className="font-bold text-white text-base">Em Preparo</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-extrabold text-xs">
                {emPreparo.length}
              </span>
            </div>

            <div className="space-y-4">
              {emPreparo.length > 0 ? (
                emPreparo.map(pedido => (
                  <OrderCardKDS key={pedido.id} pedido={pedido} />
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 text-slate-500 space-y-2">
                  <Flame className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs font-medium">Nenhum pedido em preparo no momento.</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 3: CONCLUÍDOS */}
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-white text-base">Concluídos</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold text-xs">
                {concluidos.length}
              </span>
            </div>

            <div className="space-y-4">
              {concluidos.length > 0 ? (
                concluidos.map(pedido => (
                  <OrderCardKDS key={pedido.id} pedido={pedido} />
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs font-medium">Nenhum pedido marcado como concluído.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
