import React, { useEffect, useState } from 'react'
import { Search, X, Utensils, Plus, Sparkles, Check, AlertCircle, ImageOff, Layers } from 'lucide-react'
import { fetchCategorias, fetchProdutos } from '../services/menuService'
import ModalDetalhesProduto from './ModalDetalhesProduto'

export default function CardapioCliente({ restauranteId }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    async function loadMenuData() {
      if (!restauranteId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const [catData, prodData] = await Promise.all([
          fetchCategorias(restauranteId),
          fetchProdutos(restauranteId)
        ])
        
        // Filtrar apenas categorias ativas
        const activeCats = (catData || []).filter(c => c.ativo !== false)
        setCategories(activeCats)
        setProducts(prodData || [])
      } catch (err) {
        console.error('Erro ao carregar o cardápio:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMenuData()
  }, [restauranteId])

  // Filtragem combinada por Categoria e Busca por Texto
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCat === 'all' || p.categoria_id === selectedCat
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query || 
      p.nome?.toLowerCase().includes(query) || 
      p.descricao?.toLowerCase().includes(query)
    
    return matchesCategory && matchesSearch
  })

  // Formatador de Preço (R$)
  const formatPrice = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Barra de Busca e Filtro por Categoria */}
      <div className="space-y-4">
        {/* Campo de Busca por Texto */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prato, bebida ou sobremesa..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Abas Horizontais de Categorias (Scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedCat === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-lg shadow-orange-500/20 scale-[1.02]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas as Categorias</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">
              {products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = products.filter(p => p.categoria_id === cat.id).length
            const isSelected = selectedCat === cat.id

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-lg shadow-orange-500/20 scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{cat.nome}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Estado de Carregamento (Skeleton Loaders) */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4 animate-pulse">
              <div className="w-24 h-24 rounded-xl bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-slate-800 rounded w-1/3" />
                  <div className="h-8 bg-slate-800 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado Sem Resultados */}
      {!loading && filteredProducts.length === 0 && (
        <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-2">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum prato encontrado</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Não encontramos nenhum item correspondente aos seus filtros.{' '}
            {searchQuery && (
              <span>Termo buscado: <strong className="text-orange-400">"{searchQuery}"</strong></span>
            )}
          </p>
          <button
            onClick={() => {
              setSelectedCat('all')
              setSearchQuery('')
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            Limpar Filtros e Ver Todos
          </button>
        </div>
      )}

      {/* Grid de Cards de Produtos */}
      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => {
            const isIndisponivel = product.disponivel === false

            return (
              <div
                key={product.id}
                onClick={() => {
                  if (!isIndisponivel) setSelectedProduct(product)
                }}
                className={`p-4 rounded-2xl bg-slate-900 border transition-all duration-200 flex flex-col justify-between gap-4 group ${
                  isIndisponivel
                    ? 'border-slate-800/60 opacity-60 cursor-not-allowed'
                    : 'border-slate-800 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 cursor-pointer'
                }`}
              >
                <div className="flex gap-4">
                  {/* Imagem do Produto */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative">
                    {product.imagem_url ? (
                      <img
                        src={product.imagem_url}
                        alt={product.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/50">
                        <ImageOff className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Sem Foto</span>
                      </div>
                    )}

                    {/* Badge de Esgotado */}
                    {isIndisponivel && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-2 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider">
                          Esgotado
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informações do Produto */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                        {product.nome}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {product.descricao || 'Sem descrição informada.'}
                      </p>
                    </div>

                    {/* Preço e Ação */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Preço</span>
                        <span className="text-lg font-extrabold text-orange-500">
                          {formatPrice(product.preco)}
                        </span>
                      </div>

                      <button
                        disabled={isIndisponivel}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isIndisponivel) setSelectedProduct(product)
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                          isIndisponivel
                            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 active:scale-95'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Detalhes do Produto */}
      {selectedProduct && (
        <ModalDetalhesProduto
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
