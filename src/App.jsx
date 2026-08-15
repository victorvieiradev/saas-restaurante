import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  ChefHat,
  Receipt,
  ShieldCheck,
  QrCode,
  Sparkles,
  CheckCircle2,
  Crown,
  LogOut,
  AlertTriangle,
  X,
  Lock,
  ArrowRight,
  User
} from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import ComandaCliente from './pages/ComandaCliente'
import CozinhaKDS from './pages/CozinhaKDS'
import CaixaPOS from './pages/CaixaPOS'
import { ROLES } from './utils/rbac'

// Banner de Notificação de Acesso Negado / Redirecionamento RBAC (AC1)
function UnauthorizedAlertBanner() {
  const location = useLocation()
  const [alertInfo, setAlertInfo] = useState(null)

  useEffect(() => {
    if (location.state?.unauthorizedAlert) {
      setAlertInfo({
        attemptedPath: location.state.attemptedPath || 'área restrita',
        userRole: location.state.userRole || 'Operador',
        allowedRoles: location.state.allowedRoles || []
      })
    }
  }, [location])

  if (!alertInfo) return null

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-3 text-sm flex items-center justify-between animate-fade-in shadow-md">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <span className="font-semibold text-white">Acesso Restrito: </span>
            <span>
              O seu perfil atual (<strong>{alertInfo.userRole}</strong>) não tem permissão para acessar{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-xs text-amber-400">
                {alertInfo.attemptedPath}
              </code>
              . Você foi redirecionado para o seu módulo autorizado de trabalho.
            </span>
          </div>
        </div>
        <button
          onClick={() => setAlertInfo(null)}
          className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-200 transition-colors flex-shrink-0 cursor-pointer"
          title="Dispensar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Sub-componente Navbar adaptado dinamicamente ao papel RBAC (AC4)
function Navbar() {
  const { user, userProfile, role, isAdmin, isCozinha, isCaixa, signOut } = useAuth()
  const location = useLocation()

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logotipo e Identidade */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white hover:opacity-90 transition-opacity">
          <span className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/20">
            R
          </span>
          <span>Restaurante<span className="text-orange-500">App</span></span>
        </Link>

        {/* Links de Navegação Filtrados por Papel RBAC */}
        <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
          {/* Se deslogado: exibe link demo do cliente e botão de login */}
          {!user && (
            <>
              <Link
                to="/comanda/demo-token-015"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-slate-800/60 transition-colors"
              >
                Cardápio Demo
              </Link>
              <Link
                to="/admin"
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar</span>
              </Link>
            </>
          )}

          {/* Se autenticado como GESTOR: acesso completo a todos os módulos */}
          {user && isAdmin && (
            <>
              <Link
                to="/comanda/demo-token-015"
                className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-slate-800/60 transition-colors text-xs"
              >
                Cliente
              </Link>
              <Link
                to="/cozinha"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  location.pathname === '/cozinha'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Cozinha</span>
              </Link>
              <Link
                to="/caixa"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  location.pathname === '/caixa'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Caixa</span>
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  location.pathname === '/admin'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/60'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Painel Gestor</span>
              </Link>

              {/* Badge Gestor */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Crown className="w-3.5 h-3.5 text-blue-400" />
                <span className="max-w-[100px] truncate">{userProfile?.nome ? userProfile.nome.split(' ')[0] : 'Gestor'}</span>
              </div>

              {/* Botão Sair */}
              <button
                onClick={signOut}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all text-xs flex items-center gap-1 cursor-pointer"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          )}

          {/* Se autenticado como COZINHA: foco estrito no KDS */}
          {user && isCozinha && (
            <>
              <Link
                to="/cozinha"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm shadow-amber-500/10"
              >
                <ChefHat className="w-4 h-4" />
                <span>Monitor KDS</span>
              </Link>

              {/* Badge Cozinha */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <span>👨‍🍳</span>
                <span className="max-w-[120px] truncate">{userProfile?.nome || 'Cozinheiro'}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Cozinha</span>
              </div>

              {/* Botão Sair */}
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                title="Encerrar turno e sair"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </>
          )}

          {/* Se autenticado como CAIXA: foco estrito no POS */}
          {user && isCaixa && (
            <>
              <Link
                to="/caixa"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
              >
                <Receipt className="w-4 h-4" />
                <span>Terminal POS</span>
              </Link>

              {/* Badge Caixa */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span>💰</span>
                <span className="max-w-[120px] truncate">{userProfile?.nome || 'Operador de Caixa'}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Caixa</span>
              </div>

              {/* Botão Sair */}
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                title="Encerrar turno e sair"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </>
          )}

          {/* Fallback de usuário logado com papel genérico/não padrão */}
          {user && !isAdmin && !isCozinha && !isCaixa && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{userProfile?.nome || user.email}</span>
                {role && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">{role}</span>}
              </div>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

function Home() {
  const { user, userProfile, role, isAdmin, isCozinha, isCaixa } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Sistema de Cardápio Digital & Comandas QR Code</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Controle Operacional & RBAC
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
          {user ? (
            <span>
              Você está autenticado como <strong className="text-white">{userProfile?.nome || user.email}</strong> com perfil{' '}
              <strong className="text-orange-400">{role || 'GESTOR'}</strong>.
            </span>
          ) : (
            'Selecione um dos módulos abaixo para acessar o cardápio digital ou realizar o login de equipe com controle de acesso estrito.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Módulo Cliente (Público) */}
        <Link
          to="/comanda/demo-token-015"
          className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all duration-300 shadow-lg hover:shadow-orange-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Módulo Cliente</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">Público</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">Cardápio digital acessado via QR Code na comanda sem necessidade de cadastro.</p>
          </div>
          <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider group-hover:underline flex items-center gap-1">
            <span>Acessar Cardápio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Módulo Cozinha KDS (Permitido para GESTOR e COZINHA) */}
        <Link
          to="/cozinha"
          className={`group p-6 rounded-2xl bg-slate-900 border transition-all duration-300 shadow-lg flex flex-col justify-between ${
            !user || isAdmin || isCozinha
              ? 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 hover:shadow-amber-500/10'
              : 'border-slate-800/50 opacity-60 hover:opacity-80'
          }`}
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Módulo Cozinha</h3>
              {user && isCaixa ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">KDS</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-4">Kanban KDS em tempo real com status de preparo e notificações WebSockets.</p>
          </div>
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider group-hover:underline flex items-center gap-1">
            <span>Acessar KDS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Módulo Caixa POS (Permitido para GESTOR e CAIXA) */}
        <Link
          to="/caixa"
          className={`group p-6 rounded-2xl bg-slate-900 border transition-all duration-300 shadow-lg flex flex-col justify-between ${
            !user || isAdmin || isCaixa
              ? 'border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 hover:shadow-emerald-500/10'
              : 'border-slate-800/50 opacity-60 hover:opacity-80'
          }`}
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Módulo Caixa</h3>
              {user && isCozinha ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">POS</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-4">Terminal POS para consulta de consumo, fechamento e liberação de comandas.</p>
          </div>
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider group-hover:underline flex items-center gap-1">
            <span>Acessar POS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Módulo Gestor Admin (Exclusivo GESTOR) */}
        <Link
          to="/admin"
          className={`group p-6 rounded-2xl bg-slate-900 border transition-all duration-300 shadow-lg flex flex-col justify-between ${
            !user || isAdmin
              ? 'border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-blue-500/10'
              : 'border-slate-800/50 opacity-60 hover:opacity-80'
          }`}
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Painel Gestor</h3>
              {user && !isAdmin ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Restrito
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Gestão</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {user && isAdmin
                ? 'Painel administrativo completo: cardápio, comandas e gestão de equipe.'
                : 'Área restrita aos administradores e proprietários do restaurante.'}
            </p>
          </div>
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider group-hover:underline flex items-center gap-1">
            <span>{user ? (isAdmin ? 'Acessar Painel' : 'Área Restrita') : 'Acessar Login'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Card Status do Banco Supabase e RBAC */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Segurança & Permissões RBAC Ativas</h4>
            <p className="text-slate-400 text-sm">
              Proteção de rotas no cliente, isolamento multi-tenant e validação de papéis (<code className="text-orange-400">GESTOR</code>, <code className="text-amber-400">COZINHA</code>, <code className="text-emerald-400">CAIXA</code>).
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4" />
          <span>RBAC Ativo</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Top Navbar */}
        <Navbar />

        {/* Banner de Aviso de Acesso Negado / Redirecionamento */}
        <UnauthorizedAlertBanner />

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/comanda/:token" element={<ComandaCliente />} />
            <Route path="/login" element={<AdminLogin />} />

            {/* Rota Cozinha KDS (Permitido para GESTOR e COZINHA) - AC3 */}
            <Route
              path="/cozinha"
              element={
                <ProtectedRoute allowedRoles={[ROLES.GESTOR, ROLES.COZINHA]}>
                  <CozinhaKDS />
                </ProtectedRoute>
              }
            />

            {/* Rota Caixa POS (Permitido para GESTOR e CAIXA) - AC3 */}
            <Route
              path="/caixa"
              element={
                <ProtectedRoute allowedRoles={[ROLES.GESTOR, ROLES.CAIXA]}>
                  <CaixaPOS />
                </ProtectedRoute>
              }
            />

            {/* Rota Painel do Gestor (Estritamente GESTOR) - AC3 */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={[ROLES.GESTOR]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Sub-rotas administrativas protegidas com GESTOR */}
            <Route
              path="/admin/comandas/impressao"
              element={
                <ProtectedRoute allowedRoles={[ROLES.GESTOR]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback de rotas desconhecidas */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          Restaurante App &bull; BMad Method &bull; React + Vite + Tailwind CSS + Supabase RBAC
        </footer>
      </div>
    </AuthProvider>
  )
}
