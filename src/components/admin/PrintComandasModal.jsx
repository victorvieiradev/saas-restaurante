import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  Lock,
  Scissors,
  Layers,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react'

export default function PrintComandasModal({
  comandas = [],
  restauranteName = 'Restaurante',
  onClose
}) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState(
    new Set(comandas.map((c) => c.id))
  )

  // Filtragem de comandas
  const filteredComandas = comandas.filter((item) => {
    if (statusFilter === 'ALL') return true
    return item.status === statusFilter
  })

  // Alternar seleção de comanda individual
  const toggleSelect = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Alternar selecionar todas
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredComandas.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredComandas.map((c) => c.id)))
    }
  }

  // Apenas comandas que serão efetivamente impressas
  const comandasParaImprimir = filteredComandas.filter((c) =>
    selectedIds.has(c.id)
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden">
      
      {/* Barra Superior / Toolbar de Controle de Impressão (no-print) */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Impressão de QR Codes em Lote</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-orange-400 font-mono font-semibold">
                {comandasParaImprimir.length} selecionada(s)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Grade otimizada para papel A4 com linhas pontilhadas de corte manual.
            </p>
          </div>
        </div>

        {/* Filtros e Seleção */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
            {['ALL', 'DISPONIVEL', 'EM_USO'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Todas' : st === 'DISPONIVEL' ? 'Disponíveis' : 'Em Uso'}
              </button>
            ))}
          </div>

          {/* Toggle All */}
          <button
            onClick={toggleSelectAll}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            {selectedIds.size === filteredComandas.length ? (
              <CheckSquare className="w-4 h-4 text-orange-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedIds.size === filteredComandas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </span>
          </button>

          {/* Action Buttons */}
          <button
            onClick={handlePrint}
            disabled={comandasParaImprimir.length === 0}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir ({comandasParaImprimir.length})</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            title="Fechar Prévia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO / FOLHA A4 PREVIEW */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950/80 flex justify-center">
        <div className="print-area w-full max-w-5xl">
          {comandasParaImprimir.length === 0 ? (
            <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3 no-print">
              <Layers className="w-12 h-12 text-slate-600" />
              <p className="font-semibold text-slate-300">Nenhuma comanda selecionada para impressão</p>
              <p className="text-xs text-slate-500">Selecione pelo menos uma comanda nos filtros acima.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comandasParaImprimir.map((comanda) => {
                const qrUrl = `${window.location.origin}/comanda/${comanda.qr_code_token}`
                const isSelected = selectedIds.has(comanda.id)

                return (
                  <div
                    key={comanda.id}
                    className={`relative rounded-3xl p-5 bg-white text-slate-900 border-2 border-dashed transition-all flex flex-col items-center justify-between text-center min-h-[360px] shadow-lg ${
                      isSelected
                        ? 'border-slate-400 opacity-100 ring-2 ring-orange-500/20'
                        : 'border-slate-200 opacity-50'
                    }`}
                  >
                    {/* Botão Checkbox de Seleção Rápida (no-print) */}
                    <button
                      onClick={() => toggleSelect(comanda.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-orange-500 hover:text-white transition-all cursor-pointer no-print"
                      title="Alternar seleção para impressão"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-orange-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </button>

                    {/* Indicador Guia de Corte */}
                    <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-slate-400" /> Linha de Corte
                      </span>
                      <span>A4 Print Card</span>
                    </div>

                    {/* Topo do Cartão: Restaurante & Nº Comanda */}
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        {restauranteName}
                      </p>
                      <h3 className="text-3xl font-black font-mono text-orange-600 tracking-tight">
                        Comanda #{comanda.numero}
                      </h3>
                    </div>

                    {/* Imagem do QR Code SVG */}
                    <div className="my-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                      <QRCodeSVG
                        value={qrUrl}
                        size={175}
                        level="H"
                        includeMargin={true}
                        fgColor="#0F172A"
                        bgColor="#FFFFFF"
                      />
                    </div>

                    {/* Instrução ao Cliente */}
                    <div className="space-y-0.5 px-2">
                      <p className="text-xs font-extrabold text-slate-800">
                        Aponte a câmera do seu celular
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Faça seu pedido diretamente pelo cardápio digital
                      </p>
                    </div>

                    {/* Rodapé / Token */}
                    <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>Token: {comanda.qr_code_token}</span>
                      <span className="font-semibold text-slate-600 uppercase">Mesa Física</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
