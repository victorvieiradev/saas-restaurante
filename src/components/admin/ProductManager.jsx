import React, { useState, useEffect } from 'react'
import {
  fetchProdutos,
  fetchCategorias,
  saveProduto,
  toggleProdutoDisponibilidade,
  deleteProduto
} from '../../services/menuService'
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
  Image as ImageIcon,
  DollarSign,
  Tag,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

export default function ProductManager({ restauranteId }) {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    nome: '',
    descricao: '',
    preco: '',
    categoria_id: '',
    imagem_url: '',
    disponivel: true
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  // Feedback Toast
  const [feedback, setFeedback] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([
        fetchProdutos(restauranteId),
        fetchCategorias(restauranteId)
      ])
      setProdutos(prods)
      setCategorias(cats)
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (restauranteId) {
      loadData()
    }
  }, [restauranteId])

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setCurrentProduct({
        id: prod.id,
        nome: prod.nome || '',
        descricao: prod.descricao || '',
        preco: prod.preco !== undefined ? prod.preco.toString() : '',
        categoria_id: prod.categoria_id || (categorias[0]?.id || ''),
        imagem_url: prod.imagem_url || '',
        disponivel: prod.disponivel ?? true
      })
    } else {
      setCurrentProduct({
        id: null,
        nome: '',
        descricao: '',
        preco: '',
        categoria_id: categorias[0]?.id || '',
        imagem_url: '',
        disponivel: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentProduct.nome.trim() || !currentProduct.categoria_id) return

    setSubmitting(true)
    try {
      await saveProduto(currentProduct, restauranteId)
      showToast(currentProduct.id ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      showToast('Erro ao salvar produto.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleDisponibilidade = async (prod) => {
    const nextState = !prod.disponivel
    try {
      setProdutos(prev => prev.map(p => p.id === prod.id ? { ...p, disponivel: nextState } : p))
      await toggleProdutoDisponibilidade(prod.id, nextState, restauranteId)
      showToast(`Produto marcado como ${nextState ? 'Disponível' : 'Esgotado'}.`)
    } catch (err) {
      showToast('Erro ao atualizar disponibilidade.', 'error')
      await loadData()
    }
  }

  const confirmDelete = (prod) => {
    setProductToDelete(prod)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduto(productToDelete.id, restauranteId)
      showToast('Produto removido do cardápio!')
      setDeleteModalOpen(false)
      setProductToDelete(null)
      await loadData()
    } catch (err) {
      showToast('Erro ao excluir produto.', 'error')
    }
  }

  // Multi-filtro por categoria e busca
  const filteredProducts = produtos.filter(p => {
    const matchCat = selectedCategoryFilter === 'all' || p.categoria_id === selectedCategoryFilter
    const matchSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.descricao && p.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCat && matchSearch
  })

  const getCategoryName = (catId) => {
    const found = categorias.find(c => c.id === catId)
    return found ? found.nome : 'Geral'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm font-medium">Carregando itens do cardápio...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/90 border-red-500/30 text-red-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <span>Cardápio & Produtos</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre pratos, porções e bebidas, ajuste preços e controle itens esgotados.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todos ({produtos.length})
          </button>
          {categorias.map(cat => {
            const count = produtos.filter(p => p.categoria_id === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.nome} ({count})
              </button>
            )
          })}
        </div>

        {/* Input de Busca */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Grid de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Nenhum produto encontrado</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              {searchQuery
                ? 'Nenhum resultado corresponde aos termos da busca.'
                : 'Cadastre os pratos e bebidas do cardápio do seu estabelecimento.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className={`rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between overflow-hidden shadow-lg hover:border-slate-700 ${
                !prod.disponivel ? 'border-red-950/60 opacity-80' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Imagem do Produto */}
                <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                  {prod.imagem_url ? (
                    <img
                      src={prod.imagem_url}
                      alt={prod.nome}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800/80"
                    style={{ display: prod.imagem_url ? 'none' : 'flex' }}
                  >
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">Sem Imagem</span>
                  </div>

                  {/* Badge de Categoria */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-orange-500" />
                    <span>{getCategoryName(prod.categoria_id)}</span>
                  </span>

                  {/* Badge de Disponibilidade */}
                  <button
                    onClick={() => handleToggleDisponibilidade(prod)}
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md shadow-md cursor-pointer transition-all ${
                      prod.disponivel
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900'
                    }`}
                  >
                    {prod.disponivel ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    <span>{prod.disponivel ? 'Disponível' : 'Esgotado'}</span>
                  </button>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-bold text-white leading-snug line-clamp-1">
                    {prod.nome}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[32px]">
                    {prod.descricao || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </div>

              {/* Rodapé do Card: Preço e Ações */}
              <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-800/80 mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Preço</span>
                  <span className="text-lg font-extrabold text-orange-500">
                    R$ {Number(prod.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(prod)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Editar Produto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(prod)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                    title="Excluir Produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {currentProduct.id ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hambúrguer Tradicional, Suco de Laranja"
                  value={currentProduct.nome}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
                />
              </div>

              {/* Categoria e Preço */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Categoria *
                  </label>
                  <select
                    required
                    value={currentProduct.categoria_id}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, categoria_id: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-sm transition-all cursor-pointer"
                  >
                    <option value="" disabled>Selecione uma categoria</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Preço (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0,00"
                      value={currentProduct.preco}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, preco: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-sm transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Descrição / Ingredientes
                </label>
                <textarea
                  rows="3"
                  placeholder="Descreva os ingredientes, modo de preparo ou detalhes do prato..."
                  value={currentProduct.descricao}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all resize-none"
                />
              </div>

              {/* URL da Imagem */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL da Imagem da Foto
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto-do-prato.jpg"
                  value={currentProduct.imagem_url}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, imagem_url: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
                />
              </div>

              {/* Preview da Imagem */}
              {currentProduct.imagem_url && (
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-700">
                    <img
                      src={currentProduct.imagem_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Erro+Imagem' }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">Pré-visualização da imagem do cardápio</span>
                </div>
              )}

              {/* Disponibilidade Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <span className="text-sm font-semibold text-white block">Status do Item</span>
                  <span className="text-xs text-slate-400">Marque se o item está disponível para pedidos hoje</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentProduct(prev => ({ ...prev, disponivel: !prev.disponivel }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentProduct.disponivel
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {currentProduct.disponivel ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{currentProduct.disponivel ? 'Disponível' : 'Esgotado'}</span>
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{currentProduct.id ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Excluir Produto?</h3>
              <p className="text-slate-400 text-sm mt-2">
                Tem certeza que deseja remover <strong className="text-slate-200">"{productToDelete.nome}"</strong> do cardápio? Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
