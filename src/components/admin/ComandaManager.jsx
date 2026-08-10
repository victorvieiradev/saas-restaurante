import React, { useState, useEffect } from 'react'
import {
  fetchComandas,
  gerarLoteComandas,
  updateComandaStatus,
  deleteComanda
} from '../../services/comandaService'
import {
  QrCode,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
  Printer
} from 'lucide-react'
import QRCodeModal from './QRCodeModal'
import PrintComandasModal from './PrintComandasModal'

export default function ComandaManager({ restauranteId }) {
  const [comandas, setComandas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal / Form para Geração em Lote
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [numeroInicial, setNumeroInicial] = useState('1')
  const [quantidade, setQuantidade] = useState('10')
  const [generating, setGenerating] = useState(false)

  // Modais de QR Code e Impressão
  const [selectedComandaForQR, setSelectedComandaForQR] = useState(null)
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Estados de UI e feedback
  const [notification, setNotification] = useState(null)
  const [copiedToken, setCopiedToken] = useState(null)

  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  const loadData = async () => {
    if (!restauranteId) return
    setLoading(true)
    try {
      const data = await fetchComandas(restauranteId)
      setComandas(data || [])
    } catch (e) {
      showToast('Erro ao carregar comandas', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [restauranteId])

  // Tratar geração em lote
  const handleGerarLote = async (e) => {
    e.preventDefault()
    const numInit = parseInt(numeroInicial, 10)
    const qty = parseInt(quantidade, 10)

    if (isNaN(numInit) || numInit < 1) {
      showToast('Número inicial deve ser no mínimo 1.', 'error')
      return
    }
    if (isNaN(qty) || qty < 1 || qty > 100) {
      showToast('Quantidade deve ser entre 1 e 100 comandas.', 'error')
      return
    }

    setGenerating(true)
    try {
      const novasList = await gerarLoteComandas(restauranteId, numInit, qty)
      showToast(`Sucesso! ${novasList.length} comanda(s) gerada(s).`, 'success')
      setShowBatchModal(false)
      loadData()
    } catch (err) {
      showToast('Erro ao gerar lote de comandas: ' + err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  // Alterar Status Manualmente (para testes/demo)
  const handleToggleStatus = async (comanda) => {
    const nextStatusMap = {
      'DISPONIVEL': 'EM_USO',
      'EM_USO': 'ENCERRADA',
      'ENCERRADA': 'DISPONIVEL'
    }
    const nextStatus = nextStatusMap[comanda.status] || 'DISPONIVEL'

    try {
      await updateComandaStatus(comanda.id, restauranteId, nextStatus)
      showToast(`Status da Comanda #${comanda.numero} alterado para ${nextStatus}.`)
      loadData()
    } catch (e) {
      showToast('Erro ao alterar status da comanda.', 'error')
    }
  }

  // Excluir Comanda
  const handleDelete = async (comanda) => {
    if (comanda.status === 'EM_USO') {
      showToast('Não é possível excluir uma comanda que está EM USO!', 'error')
      return
    }

    if (!window.confirm(`Tem certeza que deseja excluir a Comanda #${comanda.numero}?`)) {
      return
    }

    try {
      await deleteComanda(comanda.id, restauranteId)
      showToast(`Comanda #${comanda.numero} removida com sucesso.`)
      loadData()
    } catch (e) {
      showToast('Erro ao excluir comanda.', 'error')
    }
  }

  const copyToClipboard = (token) => {
    const url = `${window.location.origin}/comanda/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    showToast('Link do QR Code copiado para a área de transferência!')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // Filtragem
  const filteredComandas = comandas.filter(item => {
    const matchesSearch = item.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.qr_code_token.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Estatísticas
  const totalCount = comandas.length
  const disponiveisCount = comandas.filter(c => c.status === 'DISPONIVEL').length
  const emUsoCount = comandas.filter(c => c.status === 'EM_USO').length
  const encerradasCount = comandas.filter(c => c.status === 'ENCERRADA').length

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium flex items-center gap-3 transition-all animate-bounce ${
          notification.type === 'error'
            ? 'bg-red-950/90 text-red-200 border-red-800'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-orange-500" />
            <span>Gestão de Comandas & QR Codes</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gere números sequenciais e gerencie os cartões de mesa físicos dos seus clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={comandas.length === 0}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            <Printer className="w-5 h-5 text-orange-400" />
            <span>Imprimir QR Codes</span>
          </button>

          <button
            onClick={() => setShowBatchModal(true)}
            className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Gerar Lote</span>
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total de Comandas</p>
            <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-emerald-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Disponíveis</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{disponiveisCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-amber-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Em Uso (Mesa)</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{emUsoCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Encerradas</p>
            <p className="text-2xl font-bold text-slate-300 mt-1">{encerradasCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nº comanda ou token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'DISPONIVEL', 'EM_USO', 'ENCERRADA'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st === 'DISPONIVEL' ? 'Disponíveis' : st === 'EM_USO' ? 'Em Uso' : 'Encerradas'}
            </button>
          ))}

          <button
            onClick={loadData}
            title="Atualizar lista"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer ml-auto sm:ml-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabela de Comandas */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            <p>Carregando comandas do restaurante...</p>
          </div>
        ) : filteredComandas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <QrCode className="w-12 h-12 text-slate-600" />
            <p className="font-semibold text-slate-300">Nenhuma comanda encontrada</p>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery ? 'Tente ajustar os termos da busca ou os filtros.' : 'Clique no botão acima para gerar seu primeiro lote de comandas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Nº Comanda</th>
                  <th className="px-6 py-4">Token QR Code</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredComandas.map((comanda) => (
                  <tr key={comanda.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white font-mono text-base flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center text-sm font-bold border border-orange-500/20">
                        #{comanda.numero}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                          {comanda.qr_code_token}
                        </span>
                        <button
                          onClick={() => copyToClipboard(comanda.qr_code_token)}
                          title="Copiar Link do QR Code"
                          className="p-1 rounded text-slate-400 hover:text-orange-400 cursor-pointer"
                        >
                          {copiedToken === comanda.qr_code_token ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {comanda.status === 'DISPONIVEL' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Disponível</span>
                        </span>
                      )}
                      {comanda.status === 'EM_USO' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Em Uso (Cliente)</span>
                        </span>
                      )}
                      {comanda.status === 'ENCERRADA' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Encerrada</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/comanda/${comanda.qr_code_token}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir Cardápio Digital desta Comanda"
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Abrir Cardápio</span>
                        </a>

                        <button
                          onClick={() => setSelectedComandaForQR(comanda)}
                          title="Ver QR Code / Imprimir"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-400" />
                          <span>Ver QR</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(comanda)}
                          title="Alternar Status (Demo)"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all cursor-pointer"
                        >
                          Trocar Status
                        </button>

                        <button
                          onClick={() => handleDelete(comanda)}
                          title="Excluir Comanda"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de QR Code Individual */}
      {selectedComandaForQR && (
        <QRCodeModal
          comanda={selectedComandaForQR}
          onClose={() => setSelectedComandaForQR(null)}
        />
      )}

      {/* Modal de Impressão em Lote */}
      {showPrintModal && (
        <PrintComandasModal
          comandas={comandas}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Modal de Geração em Lote */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Gerar Lote de Comandas</h3>
                  <p className="text-xs text-slate-400">Criação rápida com número sequencial e token QR</p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGerarLote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Número Inicial da Sequência
                </label>
                <input
                  type="number"
                  min="1"
                  value={numeroInicial}
                  onChange={(e) => setNumeroInicial(e.target.value)}
                  placeholder="Ex: 1"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Ex: se digitar 1, a primeira comanda será #001.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quantidade de Comandas a Gerar
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Ex: 10"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Gera tokens de 12 caracteres únicos por comanda.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200">Prévia da Geração:</span>
                <p>Serão criadas <strong>{quantidade || 0}</strong> comandas sequenciais a partir do nº <strong>{String(numeroInicial || 1).padStart(3, '0')}</strong>.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar & Gerar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
