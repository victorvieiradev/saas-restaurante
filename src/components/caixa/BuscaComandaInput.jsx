import React, { useRef, useEffect } from 'react'
import { Search, Loader2, X, Hash } from 'lucide-react'

/**
 * Componente de Busca de Comanda com auto-foco, suporte a tecla Enter e formatação
 */
export default function BuscaComandaInput({
  termoBusca,
  setTermoBusca,
  onBuscar,
  isLoading = false,
  autoFocus = true
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (termoBusca && termoBusca.trim() && !isLoading) {
      onBuscar(termoBusca.trim())
    }
  }

  const handleClear = () => {
    setTermoBusca('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center shadow-lg rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
        <div className="absolute left-4 flex items-center pointer-events-none text-slate-500">
          <Hash className="w-5 h-5 text-orange-500/70" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Digite o número da comanda (ex: 015 ou 15)..."
          disabled={isLoading}
          className="w-full pl-12 pr-32 py-4 text-base md:text-lg bg-transparent text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        <div className="absolute right-3 flex items-center gap-2">
          {termoBusca && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!termoBusca || !termoBusca.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar Comanda</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
