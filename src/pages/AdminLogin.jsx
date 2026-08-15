import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultPathForRole } from '../utils/rbac'
import { Lock, Mail, ShieldCheck, AlertCircle, Loader2, ChefHat, Receipt, Crown, ArrowRight } from 'lucide-react'

export default function AdminLogin() {
  const { user, role, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDemoRole, setSelectedDemoRole] = useState(null)

  // Redireciona automaticamente se o usuário já estiver logado (AC2)
  useEffect(() => {
    if (!loading && user) {
      const currentRole = role || user?.user_metadata?.role || 'GESTOR'
      const destination = getDefaultPathForRole(currentRole)
      // Se não estiver já no destino pretendido e o destino for válido
      if (destination && location.pathname !== destination) {
        navigate(destination, { replace: true })
      }
    }
  }, [user, role, loading, navigate, location.pathname])

  const handleSubmit = async (e, overrideEmail, overridePassword) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    const submitEmail = overrideEmail || email
    const submitPassword = overridePassword || password

    if (!submitEmail || !submitPassword) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await signIn(submitEmail, submitPassword)
      if (error) {
        setErrorMsg(error.message || 'Credenciais inválidas ou e-mail/senha incorretos.')
        setIsSubmitting(false)
        return
      }

      // Redirecionamento Inteligente Pós-Login baseado no papel RBAC (AC2)
      const userRole = data?.role || data?.userProfile?.role || data?.user?.user_metadata?.role || 'GESTOR'
      const targetPath = getDefaultPathForRole(userRole)
      setIsSubmitting(false)
      navigate(targetPath, { replace: true })
    } catch (err) {
      setErrorMsg('Falha ao conectar com o serviço de autenticação. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  const handleSelectDemoUser = (demoEmail, demoPassword, roleKey) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setSelectedDemoRole(roleKey)
    setErrorMsg('')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        {/* Header da Tela de Login */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto border border-orange-500/20 shadow-lg shadow-orange-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Acesso ao Sistema
          </h2>
          <p className="text-slate-400 text-sm">
            Autenticação unificada para Gestores, Operadores de Cozinha e Caixa.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Atalhos Rápidos de Demonstração RBAC com Acesso Direto */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Perfis de Acesso Rápido:
              </span>
              <span className="text-[11px] text-slate-500">Clique para preencher</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemoUser('admin@restaurante.com', '123456', 'GESTOR')}
                className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  selectedDemoRole === 'GESTOR'
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="Gestor: Acesso completo ao Painel Administrativo (/admin)"
              >
                <div className="flex items-center gap-1 text-blue-400 text-xs font-bold">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Gestor</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate w-full">Painel Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoUser('cozinha@restaurante.com', '123456', 'COZINHA')}
                className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  selectedDemoRole === 'COZINHA'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="Cozinha: Acesso ao Monitor KDS (/cozinha)"
              >
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cozinha</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate w-full">Monitor KDS</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoUser('caixa@restaurante.com', '123456', 'CAIXA')}
                className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  selectedDemoRole === 'CAIXA'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title="Caixa: Acesso ao Terminal POS (/caixa)"
              >
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Caixa</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate w-full">Terminal POS</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-xs uppercase font-medium">ou digite os dados</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo E-mail */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setSelectedDemoRole(null)
                  }}
                  placeholder="usuario@restaurante.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
