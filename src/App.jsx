import React from 'react'
import { Routes, Route, Link, useParams } from 'react-router-dom'
import { Utensils, ChefHat, Receipt, ShieldCheck, QrCode, Sparkles, Database, CheckCircle2, User } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import ComandaCliente from './pages/ComandaCliente'
import CozinhaKDS from './pages/CozinhaKDS'

// Sub-componente Navbar com detecção de estado de login
function Navbar() {
  const { user } = useAuth()

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <span className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/20">
            R
          </span>
          <span>Restaurante<span className="text-orange-500">App</span></span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/comanda/demo-123" className="text-slate-400 hover:text-orange-400 transition-colors">Cliente</Link>
          <Link to="/cozinha" className="text-slate-400 hover:text-amber-400 transition-colors">Cozinha</Link>
          <Link to="/caixa" className="text-slate-400 hover:text-emerald-400 transition-colors">Caixa</Link>
          
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 flex items-center gap-1.5"
          >
            {user ? (
              <>
                <User className="w-4 h-4" />
                <span>Meu Painel</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Gestor Login</span>
              </>
            )}
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Home() {
  const { user } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Sistema de Cardápio Digital & Comandas QR Code</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Base da Aplicação Pronta
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
          Selecione um dos 4 módulos abaixo para navegar pela estrutura inicial configurada no React + Vite + Tailwind + Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Módulo Cliente */}
        <Link to="/comanda/demo-123" className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all duration-300 shadow-lg hover:shadow-orange-500/10">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Módulo Cliente</h3>
          <p className="text-slate-400 text-sm mb-4">Cardápio digital acessado via QR Code na comanda sem necessidade de cadastro.</p>
          <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider group-hover:underline">Acessar Demo &rarr;</span>
        </Link>

        {/* Módulo Cozinha KDS */}
        <Link to="/cozinha" className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all duration-300 shadow-lg hover:shadow-amber-500/10">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ChefHat className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Módulo Cozinha</h3>
          <p className="text-slate-400 text-sm mb-4">Kanban KDS em tempo real com status de preparo e notificações WebSockets.</p>
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider group-hover:underline">Acessar KDS &rarr;</span>
        </Link>

        {/* Módulo Caixa POS */}
        <Link to="/caixa" className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Módulo Caixa</h3>
          <p className="text-slate-400 text-sm mb-4">Terminal POS para consulta de consumo, fechamento e liberação de comandas.</p>
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider group-hover:underline">Acessar POS &rarr;</span>
        </Link>

        {/* Módulo Gestor Admin */}
        <Link to="/admin" className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 shadow-lg hover:shadow-blue-500/10">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Painel Gestor</h3>
          <p className="text-slate-400 text-sm mb-4">
            {user ? 'Acessar área administrativa ativa' : 'Autenticação multi-tenant, gestão de produtos e comandas.'}
          </p>
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider group-hover:underline">
            {user ? 'Acessar Painel &rarr;' : 'Acessar Admin &rarr;'}
          </span>
        </Link>
      </div>

      {/* Card Status do Banco Supabase */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Banco de Dados & DDL SQL</h4>
            <p className="text-slate-400 text-sm">Esquema PostgreSQL configurado em <code className="text-orange-400">supabase/schema.sql</code> (Tabelas: restaurantes, comandas, produtos, categorias, pedidos, itens_pedido).</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configurado</span>
        </div>
      </div>
    </div>
  )
}



function CaixaPOS() {
  return (
    <div className="max-w-xl mx-auto p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
        <Receipt className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold">Módulo Caixa - POS</h2>
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300">
        Rota pronta para o Épico 5 (Busca de comandas, Fechamento de Conta & Liberação).
      </div>
      <Link to="/" className="inline-block text-sm text-emerald-400 hover:underline">&larr; Voltar para Home</Link>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Top Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/comanda/:token" element={<ComandaCliente />} />
            <Route path="/cozinha" element={<CozinhaKDS />} />
            <Route path="/caixa" element={<CaixaPOS />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          Restaurante App &bull; BMad Method &bull; React + Vite + Tailwind CSS + Supabase
        </footer>
      </div>
    </AuthProvider>
  )
}
