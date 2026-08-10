import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CategoryManager from '../components/admin/CategoryManager'
import ProductManager from '../components/admin/ProductManager'
import ComandaManager from '../components/admin/ComandaManager'
import { fetchCategorias, fetchProdutos } from '../services/menuService'
import { fetchComandas } from '../services/comandaService'
import {
  Building2,
  LogOut,
  Utensils,
  QrCode,
  ShieldCheck,
  FolderPlus,
  Package,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, restaurante, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'categories', 'products', 'comandas'

  const [stats, setStats] = useState({ categoriesCount: 0, productsCount: 0, availableProductsCount: 0, comandasCount: 0 })

  const loadStats = async () => {
    if (!restaurante?.id) return
    try {
      const [cats, prods, cmds] = await Promise.all([
        fetchCategorias(restaurante.id),
        fetchProdutos(restaurante.id),
        fetchComandas(restaurante.id)
      ])
      setStats({
        categoriesCount: cats.length,
        productsCount: prods.length,
        availableProductsCount: prods.filter(p => p.disponivel).length,
        comandasCount: cmds.length
      })
    } catch (e) {
      console.warn('Erro ao carregar estatísticas:', e)
    }
  }

  useEffect(() => {
    loadStats()
  }, [restaurante?.id, activeTab])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner do Estabelecimento Autenticado */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/10">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sessão Multi-Tenant Ativa</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {restaurante?.nome || 'Restaurante Gestor'}
            </h1>
            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1 flex-wrap">
              <span>Gestor: <strong className="text-slate-200">{user?.email}</strong></span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="font-mono text-xs text-slate-500">ID: {restaurante?.id}</span>
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Navegação por Abas do Painel */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Categorias ({stats.categoriesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos & Cardápio ({stats.productsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('comandas')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'comandas'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Comandas ({stats.comandasCount})</span>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => setActiveTab('categories')}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categorias</span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.categoriesCount}</div>
              <p className="text-xs text-slate-500">Seções ativas no cardápio</p>
            </div>

            <div
              onClick={() => setActiveTab('products')}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Produtos</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.productsCount}</div>
              <p className="text-xs text-slate-500">Pratos e bebidas cadastrados</p>
            </div>

            <div
              onClick={() => setActiveTab('products')}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pratos Disponíveis</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">{stats.availableProductsCount}</div>
              <p className="text-xs text-slate-500">Prontos para pedido no cardápio</p>
            </div>

            <div
              onClick={() => setActiveTab('comandas')}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comandas Cadastradas</span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.comandasCount}</div>
              <p className="text-xs text-slate-500">Cartões de mesa com QR Code</p>
            </div>
          </div>

          {/* Seções Principais do Sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Card: Gestão de Cardápio */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>História 1.3 Concluída</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Gestão de Cardápio Ativa</h3>
                <p className="text-slate-400 text-sm">
                  Gerencie categorias, pratos, bebidas, preços, descrições e status de disponibilidade em tempo real.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('categories')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Gerenciar Categorias &rarr;
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Gerenciar Cardápio &rarr;
                </button>
              </div>
            </div>

            {/* Card: Comandas QR Code (História 2.1) */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold mb-2 border border-orange-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>História 2.1 Em Desenvolvimento</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Geração de Comandas & QR Code</h3>
                <p className="text-slate-400 text-sm">
                  Gere lotes sequenciais de comandas com tokens de 12 caracteres únicos para os cartões de mesa.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('comandas')}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Gerenciar Comandas &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <CategoryManager restauranteId={restaurante?.id} />
      )}

      {activeTab === 'products' && (
        <ProductManager restauranteId={restaurante?.id} />
      )}

      {activeTab === 'comandas' && (
        <ComandaManager restauranteId={restaurante?.id} />
      )}
    </div>
  )
}
