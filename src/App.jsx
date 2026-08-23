import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  ChefHat,
  Receipt,
  ShieldCheck,
  Crown,
  LogOut,
  AlertTriangle,
  X,
  User
} from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import ComandaCliente from './pages/ComandaCliente'
import CozinhaKDS from './pages/CozinhaKDS'
import CaixaPOS from './pages/CaixaPOS'
import LandingPage from './pages/LandingPage'
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

// Sub-componente Navbar adaptado dinamicamente ao visitante ou papel RBAC (AC3, AC4)
function Navbar() {
  const { user, userProfile, role, isAdmin, isCozinha, isCaixa, signOut } = useAuth()
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logotipo e Identidade */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-white hover:opacity-90 transition-opacity">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/25">
            R
          </span>
          <span className="tracking-tight">
            Restaurante<span className="text-orange-500">App</span>
          </span>
        </Link>

        {/* Links de Navegação Filtrados por Papel RBAC ou Visitante */}
        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          {/* Se deslogado: âncoras da landing page + botão de login */}
          {!user && (
            <>
              <div className="hidden md:flex items-center gap-5 text-xs lg:text-sm text-slate-300 font-medium mr-2">
                <a href={isHomePage ? '#recursos' : '/#recursos'} className="hover:text-orange-400 transition-colors">
                  Recursos
                </a>
                <a href={isHomePage ? '#problema' : '/#problema'} className="hidden lg:inline-block hover:text-orange-400 transition-colors">
                  Diferenciais
                </a>
                <a href={isHomePage ? '#calculadora' : '/#calculadora'} className="hover:text-orange-400 transition-colors">
                  Simulador ROI
                </a>
                <a href={isHomePage ? '#como-funciona' : '/#como-funciona'} className="hover:text-orange-400 transition-colors">
                  Como Funciona
                </a>
                <a href={isHomePage ? '#planos' : '/#planos'} className="hover:text-orange-400 transition-colors">
                  Planos
                </a>
                <a href={isHomePage ? '#faq' : '/#faq'} className="hidden lg:inline-block hover:text-orange-400 transition-colors">
                  FAQ
                </a>
              </div>

              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </Link>
            </>
          )}

          {/* Se autenticado como GESTOR: acesso completo a todos os módulos */}
          {user && isAdmin && (
            <>
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
            {/* Rota Raiz: Landing Page de Vendas de Alta Conversão */}
            <Route path="/" element={<LandingPage />} />

            {/* Rotas Públicas de Comanda e Login de Equipe */}
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

            {/* Fallback de rotas desconhecidas: Landing Page */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>

        {/* Commercial Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-400">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <span className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white font-extrabold text-sm">
                  R
                </span>
                <span>Restaurante<span className="text-orange-500">App</span></span>
              </div>
              <p className="max-w-sm text-slate-400">
                Plataforma SaaS integrada para automação de restaurantes: Cardápio Digital QR Code, KDS em tempo real com alerta sonoro e Caixa POS.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-white uppercase tracking-wider text-[11px]">Navegação</h5>
              <ul className="space-y-1.5">
                <li><a href="/#recursos" className="hover:text-orange-400 transition-colors">Módulos & Recursos</a></li>
                <li><a href="/#calculadora" className="hover:text-orange-400 transition-colors">Simulador de ROI</a></li>
                <li><a href="/#como-funciona" className="hover:text-orange-400 transition-colors">Como Funciona</a></li>
                <li><a href="/#planos" className="hover:text-orange-400 transition-colors">Planos & Preços</a></li>
                <li><a href="/#faq" className="hover:text-orange-400 transition-colors">Dúvidas Frequentes</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-white uppercase tracking-wider text-[11px]">Acesso de Equipe</h5>
              <ul className="space-y-1.5">
                <li><Link to="/login" className="hover:text-orange-400 transition-colors">Login Geral</Link></li>
                <li><Link to="/admin" className="hover:text-orange-400 transition-colors">Painel Gestor</Link></li>
                <li><Link to="/cozinha" className="hover:text-orange-400 transition-colors">Monitor KDS</Link></li>
                <li><Link to="/caixa" className="hover:text-orange-400 transition-colors">Terminal POS</Link></li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 text-center text-[11px] text-slate-600 border-t border-slate-900 pt-6">
            &copy; {new Date().getFullYear()} RestauranteApp SaaS &bull; Todos os direitos reservados.
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
