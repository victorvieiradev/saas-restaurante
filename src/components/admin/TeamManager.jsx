import React, { useState, useEffect, useMemo } from 'react'
import {
  fetchUsuariosEquipe,
  saveUsuarioEquipe,
  toggleUsuarioStatus,
  deleteUsuario
} from '../../services/userService'
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChefHat,
  Receipt,
  Crown,
  Search,
  AlertTriangle,
  Loader2,
  X,
  Mail,
  User,
  Power,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

export default function TeamManager({ restauranteId = 'res-demo-001' }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState({
    id: null,
    nome: '',
    email: '',
    senha: '',
    role: 'COZINHA',
    ativo: true
  })
  const [submitting, setSubmitting] = useState(false)

  // Modal de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  // Feedback Toast
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (type, message) => {
    setFeedback({ type, message })
    setTimeout(() => {
      setFeedback(null)
    }, 4000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchUsuariosEquipe(restauranteId)
      if (!error && data) {
        setUsuarios(data)
      }
    } catch (err) {
      console.error('Erro ao carregar equipe:', err)
      showFeedback('error', 'Falha ao carregar lista da equipe.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (restauranteId) {
      loadData()
    }
  }, [restauranteId])

  // Filtragem de Usuários
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      const matchesSearch =
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [usuarios, searchTerm, roleFilter])

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    return {
      total: usuarios.length,
      ativos: usuarios.filter(u => u.ativo).length,
      cozinha: usuarios.filter(u => u.role === 'COZINHA').length,
      caixa: usuarios.filter(u => u.role === 'CAIXA').length,
      gestores: usuarios.filter(u => u.role === 'GESTOR').length,
    }
  }, [usuarios])

  const handleOpenCreate = () => {
    setCurrentUser({
      id: null,
      nome: '',
      email: '',
      senha: '',
      role: 'COZINHA',
      ativo: true
    })
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user) => {
    setCurrentUser({
      id: user.id,
      nome: user.nome,
      email: user.email,
      senha: '',
      role: user.role,
      ativo: user.ativo
    })
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const isEditing = Boolean(currentUser.id)

    if (!currentUser.nome.trim() || !currentUser.email.trim()) {
      showFeedback('error', 'Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Validação de formato de e-mail básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(currentUser.email.trim())) {
      showFeedback('error', 'Por favor, insira um e-mail válido.')
      return
    }

    // Validação de senha
    if (!isEditing && (!currentUser.senha || currentUser.senha.trim().length < 6)) {
      showFeedback('error', 'Por favor, defina uma senha com no mínimo 6 caracteres.')
      return
    }

    if (isEditing && currentUser.senha && currentUser.senha.trim().length < 6) {
      showFeedback('error', 'A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await saveUsuarioEquipe(currentUser, restauranteId)
      if (error) {
        showFeedback('error', error.message || 'Erro ao salvar colaborador.')
      } else {
        showFeedback(
          'success',
          isEditing
            ? `Colaborador "${data.nome}" atualizado com sucesso!`
            : `Colaborador "${data.nome}" cadastrado com sucesso!`
        )
        setIsModalOpen(false)
        await loadData()
      }
    } catch (err) {
      showFeedback('error', 'Erro de comunicação ao salvar colaborador.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (user) => {
    const novoStatus = !user.ativo
    try {
      const { error } = await toggleUsuarioStatus(user.id, novoStatus, restauranteId)
      if (!error) {
        setUsuarios(prev =>
          prev.map(u => (u.id === user.id ? { ...u, ativo: novoStatus } : u))
        )
        showFeedback(
          'success',
          `Status de "${user.nome}" alterado para ${novoStatus ? 'Ativo' : 'Inativo'}.`
        )
      } else {
        showFeedback('error', 'Falha ao alterar o status do colaborador.')
      }
    } catch (err) {
      showFeedback('error', 'Erro ao alterar status.')
    }
  }

  const handlePromptDelete = (user) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setSubmitting(true)
    try {
      const { error } = await deleteUsuario(userToDelete.id, restauranteId)
      if (!error) {
        showFeedback('success', `Colaborador "${userToDelete.nome}" removido com sucesso.`)
        setDeleteModalOpen(false)
        setUserToDelete(null)
        await loadData()
      } else {
        showFeedback('error', 'Erro ao remover colaborador.')
      }
    } catch (err) {
      showFeedback('error', 'Erro de comunicação ao excluir.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderRoleBadge = (role) => {
    switch (role) {
      case 'GESTOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Crown className="w-3.5 h-3.5" />
            <span>Gestor</span>
          </span>
        )
      case 'COZINHA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Cozinha</span>
          </span>
        )
      case 'CAIXA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Receipt className="w-3.5 h-3.5" />
            <span>Caixa</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
            {role}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 shadow-xl animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header da Aba de Equipe */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Controle de Acesso RBAC</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            <span>Gestão da Equipe</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Cadastre os operadores e defina quais painéis cada membro pode acessar.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Colaborador</span>
        </button>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Membros</span>
            <h4 className="text-2xl font-bold text-white mt-0.5">{stats.total}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Operadores Cozinha</span>
            <h4 className="text-2xl font-bold text-amber-400 mt-0.5">{stats.cozinha}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Operadores Caixa</span>
            <h4 className="text-2xl font-bold text-emerald-400 mt-0.5">{stats.caixa}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Usuários Ativos</span>
            <h4 className="text-2xl font-bold text-blue-400 mt-0.5">{stats.ativos}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
          {[
            { key: 'ALL', label: 'Todos' },
            { key: 'COZINHA', label: 'Cozinha' },
            { key: 'CAIXA', label: 'Caixa' },
            { key: 'GESTOR', label: 'Gestor' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === tab.key
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-sm font-medium">Carregando membros da equipe...</span>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Nenhum colaborador encontrado</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {searchTerm || roleFilter !== 'ALL'
                  ? 'Nenhum membro corresponde aos filtros de busca aplicados.'
                  : 'Comece adicionando seu primeiro operador de cozinha ou caixa para o restaurante.'}
              </p>
            </div>
            {(searchTerm || roleFilter !== 'ALL') ? (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setRoleFilter('ALL')
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/20 transition-colors cursor-pointer"
              >
                Cadastrar Colaborador
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Membro</th>
                  <th className="py-3.5 px-4">Função / Papel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Cadastrado em</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsuarios.map((member) => {
                  const isGestorPrincipal = member.role === 'GESTOR' && member.email.toLowerCase() === 'admin@restaurante.com'
                  const initials = member.nome
                    ? member.nome
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U'

                  return (
                    <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{member.nome}</span>
                              {isGestorPrincipal && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                  Titular
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {renderRoleBadge(member.role)}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isGestorPrincipal}
                          onClick={() => handleToggleStatus(member)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            member.ativo
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          } ${isGestorPrincipal ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          title={isGestorPrincipal ? 'O gestor titular não pode ser desativado' : 'Clique para alternar status'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${member.ativo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                          <span>{member.ativo ? 'Ativo' : 'Inativo'}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400 hidden md:table-cell">
                        {member.criado_em
                          ? new Date(member.criado_em).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Editar Colaborador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            disabled={isGestorPrincipal}
                            onClick={() => handlePromptDelete(member)}
                            className={`p-2 rounded-lg transition-colors ${
                              isGestorPrincipal
                                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 cursor-pointer'
                            }`}
                            title={isGestorPrincipal ? 'Gestor titular não pode ser excluído' : 'Excluir Colaborador'}
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
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Users className="w-5 h-5 text-orange-500" />
                <span>{currentUser.id ? 'Editar Colaborador' : 'Novo Colaborador'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Campo Nome */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nome Completo <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={currentUser.nome}
                    onChange={(e) => setCurrentUser({ ...currentUser, nome: e.target.value })}
                    placeholder="Ex: Pedro Henrique"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Campo E-mail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  E-mail de Acesso <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                    placeholder="Ex: pedro.cozinha@restaurante.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Utilizado para autenticação no painel operacional.
                </p>
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Senha de Acesso{' '}
                  {currentUser.id ? (
                    <span className="text-[11px] text-slate-500 font-normal lowercase">(deixe em branco para manter)</span>
                  ) : (
                    <span className="text-orange-500">*</span>
                  )}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!currentUser.id}
                    value={currentUser.senha || ''}
                    onChange={(e) => setCurrentUser({ ...currentUser, senha: e.target.value })}
                    placeholder={currentUser.id ? '•••••••• (manter senha atual)' : 'Mínimo de 6 caracteres (ex: 123456)'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {currentUser.id
                    ? 'Preencha apenas caso deseje redefinir a senha do operador.'
                    : 'Senha utilizada pelo colaborador para acessar o KDS ou POS (mínimo 6 dígitos).'}
                </p>
              </div>

              {/* Seletor de Papel / Função */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Função / Papel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentUser({ ...currentUser, role: 'COZINHA' })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                      currentUser.role === 'COZINHA'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Cozinha (KDS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentUser({ ...currentUser, role: 'CAIXA' })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                      currentUser.role === 'CAIXA'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Caixa (POS)</span>
                  </button>
                </div>
              </div>

              {/* Toggle de Status Ativo */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white">Status da Conta</span>
                  <p className="text-[11px] text-slate-400">
                    {currentUser.ativo
                      ? 'Operador autorizado a fazer login no sistema.'
                      : 'Acesso bloqueado temporariamente.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentUser({ ...currentUser, ativo: !currentUser.ativo })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    currentUser.ativo ? 'bg-orange-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      currentUser.ativo ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Colaborador</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Excluir Colaborador?</h3>
              <p className="text-slate-400 text-xs">
                Tem certeza que deseja remover <strong className="text-slate-200">"{userToDelete.nome}"</strong> ({userToDelete.email})? Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setUserToDelete(null)
                }}
                className="flex-1 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
