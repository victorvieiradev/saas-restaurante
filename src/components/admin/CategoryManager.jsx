import React, { useState, useEffect } from 'react'
import {
  fetchCategorias,
  saveCategoria,
  toggleCategoriaStatus,
  deleteCategoria,
  fetchProdutos
} from '../../services/menuService'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FolderPlus,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react'

export default function CategoryManager({ restauranteId }) {
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState({ id: null, nome: '', ordem: 1, ativo: true })
  const [submitting, setSubmitting] = useState(false)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  // Toast feedback
  const [feedback, setFeedback] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, prods] = await Promise.all([
        fetchCategorias(restauranteId),
        fetchProdutos(restauranteId)
      ])
      setCategorias(cats)
      setProdutos(prods)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
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

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setCurrentCategory({ ...cat })
    } else {
      const nextOrdem = categorias.length > 0 ? Math.max(...categorias.map(c => Number(c.ordem) || 0)) + 1 : 1
      setCurrentCategory({ id: null, nome: '', ordem: nextOrdem, ativo: true })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentCategory.nome.trim()) return

    setSubmitting(true)
    try {
      await saveCategoria(currentCategory, restauranteId)
      showToast(currentCategory.id ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!')
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      showToast('Erro ao salvar categoria.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (cat) => {
    const nextState = !cat.ativo
    try {
      setCategorias(prev => prev.map(c => c.id === cat.id ? { ...c, ativo: nextState } : c))
      await toggleCategoriaStatus(cat.id, nextState, restauranteId)
      showToast(`Categoria ${nextState ? 'ativada' : 'desativada'}.`)
    } catch (err) {
      showToast('Erro ao alterar status.', 'error')
      await loadData()
    }
  }

  const confirmDelete = (cat) => {
    setCategoryToDelete(cat)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    try {
      await deleteCategoria(categoryToDelete.id, restauranteId)
      showToast('Categoria removida com sucesso!')
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
      await loadData()
    } catch (err) {
      showToast('Erro ao remover categoria.', 'error')
    }
  }

  // Quantidade de produtos vinculados
  const getProductCount = (catId) => {
    return produtos.filter(p => p.categoria_id === catId).length
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm font-medium">Carregando categorias do cardápio...</p>
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
            <FolderPlus className="w-5 h-5 text-orange-500" />
            <span>Gestão de Categorias</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Organize o cardápio em seções (ex: Entradas, Pratos, Bebidas, Sobremesas).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Categories Grid / Table */}
      {categorias.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Nenhuma categoria cadastrada</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              Crie a primeira categoria para começar a organizar os itens do cardápio do restaurante.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Categoria</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold w-16 text-center">Ordem</th>
                  <th className="py-3.5 px-4 font-semibold">Nome da Categoria</th>
                  <th className="py-3.5 px-4 font-semibold">Produtos Vinculados</th>
                  <th className="py-3.5 px-4 font-semibold">Visibilidade</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categorias.map((cat) => {
                  const prodCount = getProductCount(cat.id)
                  return (
                    <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold border border-slate-700">
                          {cat.ordem}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-white">
                        {cat.nome}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                          {prodCount} {prodCount === 1 ? 'produto' : 'produtos'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggle(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            cat.ativo
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {cat.ativo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{cat.ativo ? 'Ativa' : 'Inativa (Oculta)'}</span>
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(cat)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Editar Categoria"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(cat)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            title="Excluir Categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {currentCategory.id ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Entradas, Pratos Principais, Bebidas"
                  value={currentCategory.nome}
                  onChange={(e) => setCurrentCategory(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentCategory.ordem}
                    onChange={(e) => setCurrentCategory(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-sm transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Visibilidade
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentCategory(prev => ({ ...prev, ativo: !prev.ativo }))}
                    className={`w-full py-3 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      currentCategory.ativo
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {currentCategory.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{currentCategory.ativo ? 'Ativa' : 'Inativa'}</span>
                  </button>
                </div>
              </div>

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
                  <span>{currentCategory.id ? 'Salvar Alterações' : 'Criar Categoria'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Excluir Categoria?</h3>
              <p className="text-slate-400 text-sm mt-2">
                Tem certeza que deseja remover a categoria <strong className="text-slate-200">"{categoryToDelete.nome}"</strong>?
                {getProductCount(categoryToDelete.id) > 0 && (
                  <span className="block text-red-400 font-semibold mt-1">
                    Aviso: Existem {getProductCount(categoryToDelete.id)} produtos vinculados a esta categoria.
                  </span>
                )}
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
