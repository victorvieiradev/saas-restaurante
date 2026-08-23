import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ChefHat,
  Receipt,
  Crown,
  QrCode,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
  ShieldCheck,
  DollarSign,
  Flame,
  Star,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
  Volume2,
  CheckCheck
} from 'lucide-react'
import {
  calculateRoiMetrics,
  STATS_DATA,
  PAIN_POINTS,
  BENEFITS_DATA,
  MODULES_SHOWCASE,
  PRICING_PLANS,
  FAQ_ITEMS,
  TESTIMONIALS
} from '../utils/landingPageData.js'

// Map of icons for dynamic rendering
const ICON_MAP = {
  QrCode,
  ChefHat,
  Receipt,
  Crown
}

export default function LandingPage() {
  const [activeModuleTab, setActiveModuleTab] = useState('cliente')
  const [isAnnualBilling, setIsAnnualBilling] = useState(true)
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  // Estados da Calculadora ROI
  const [mesasInput, setMesasInput] = useState(25)
  const [ticketMedioInput, setTicketMedioInput] = useState(85)
  const [girosDiaInput, setGirosDiaInput] = useState(2.5)

  const roiMetrics = calculateRoiMetrics({
    mesas: mesasInput,
    ticketMedio: ticketMedioInput,
    girosDia: girosDiaInput
  })

  const currentModule = MODULES_SHOWCASE.find(m => m.id === activeModuleTab) || MODULES_SHOWCASE[0]

  return (
    <div className="w-full bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="inicio" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Background Gradients Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs sm:text-sm font-semibold animate-pulse shadow-sm shadow-orange-500/10">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>SaaS Completo para Restaurantes, Bares e Hamburguerias</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Transforme suas mesas em{' '}
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                máquinas de vendas
              </span>{' '}
              automáticas.
            </h1>

            {/* Persuasive Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Elimine a espera pelo garçom, acabe com erros de comandas e aumente seu ticket médio em até{' '}
              <strong className="text-white font-bold underline decoration-orange-500 decoration-2 underline-offset-4">
                35%
              </strong>{' '}
              com Cardápio QR Code, KDS em tempo real com alerta sonoro e POS integrado.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/onboarding"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Iniciar Teste Grátis de 14 Dias</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#recursos"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-base hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-5 h-5 text-orange-400" />
                <span>Conhecer os 4 Módulos</span>
              </a>
            </div>

            {/* Trust Proof Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>R$ 0,00 cobrado hoje (14 dias grátis)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Cancele quando quiser com 1 clique</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sem necessidade de aplicativo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Suporte no WhatsApp</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE DEMO SHOWCASE CARD IN HERO */}
          {/* ========================================================================= */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 p-3 sm:p-6 shadow-2xl shadow-black/80 backdrop-blur-sm">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 sm:pb-0 scrollbar-none border-b border-slate-800/80 mb-6">
              {MODULES_SHOWCASE.map(mod => {
                const IconComponent = ICON_MAP[mod.iconName] || QrCode
                const isActive = activeModuleTab === mod.id
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleTab(mod.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{mod.title}</span>
                  </button>
                )
              })}
            </div>

            {/* Showcase Body */}
            <div className={`p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${currentModule.previewBg} border border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center`}>
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentModule.badgeColor}`}>
                    {currentModule.tag}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Tempo Real
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{currentModule.title}</h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{currentModule.description}</p>

                {/* Bullets */}
                <ul className="space-y-2.5 pt-2">
                  {currentModule.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <Link
                    to="/onboarding"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition-colors shadow-md"
                  >
                    <span>Começar Teste com {currentModule.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Visual Mockup Card */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="text-xs font-mono text-slate-400 ml-2">restauranteapp.com/{activeModuleTab}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Online & Sincronizado
                    </span>
                  </div>

                  {/* Mockup Dynamic Content */}
                  {activeModuleTab === 'cliente' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                            🍔
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Double Smash Bacon Gourmet</h4>
                            <p className="text-xs text-slate-400">Pão brioche, 2x smash 90g, cheddar inglês, bacon crispy</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-orange-400">R$ 38,90</span>
                          <span className="block text-[10px] text-emerald-400 font-semibold">+ 2 Adicionais</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                            🍹
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Soda Italiana de Frutas Vermelhas</h4>
                            <p className="text-xs text-slate-400">Xarope artesanal, água com gás e hortelã fresca</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-orange-400">R$ 16,90</span>
                      </div>
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between text-xs">
                        <span className="text-orange-300 font-semibold">Total do Pedido na Mesa 04:</span>
                        <span className="text-base font-extrabold text-white">R$ 55,80</span>
                      </div>
                    </div>
                  )}

                  {activeModuleTab === 'cozinha' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-amber-300">Mesa 04 &bull; Comanda #104</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">03:45</span>
                          </div>
                          <p className="text-xs text-white font-medium">1x Double Smash Bacon</p>
                          <p className="text-[10px] text-slate-400">Obs: Sem cebola, ponto da carne ao ponto</p>
                          <span className="mt-2 inline-block px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
                            EM PREPARO
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-300">Mesa 09 &bull; Comanda #109</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">01:10</span>
                          </div>
                          <p className="text-xs text-white font-medium">2x Soda Frutas Vermelhas</p>
                          <p className="text-[10px] text-slate-400">Obs: Bastante gelo e limão</p>
                          <span className="mt-2 inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                            PRONTO
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Volume2 className="w-4 h-4 animate-bounce" /> Alerta sonoro ativo para novos pedidos
                        </span>
                        <span className="font-mono text-emerald-400">4 pedidos ativos</span>
                      </div>
                    </div>
                  )}

                  {activeModuleTab === 'caixa' && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">Comanda Selecionada:</span>
                          <h4 className="text-sm font-bold text-white">Mesa 04 - Token #9F82A</h4>
                        </div>
                        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
                          Aguardando Fechamento
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>Subtotal dos itens (4 pedidos):</span>
                          <span className="font-semibold text-white">R$ 142,50</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>Taxa de serviço opcional (10%):</span>
                          <span className="font-semibold text-white">R$ 14,25</span>
                        </div>
                        <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-1 border-t border-emerald-500/20">
                          <span>Total da Comanda:</span>
                          <span>R$ 156,75</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-center text-xs shadow-md">
                        Fechamento & Liberar Mesa com 1 Clique
                      </div>
                    </div>
                  )}

                  {activeModuleTab === 'gestor' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Vendas Hoje</span>
                          <p className="text-xs sm:text-sm font-extrabold text-emerald-400">R$ 3.840,00</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Comandas Ativas</span>
                          <p className="text-xs sm:text-sm font-extrabold text-orange-400">18 Mesas</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Equipe Online</span>
                          <p className="text-xs sm:text-sm font-extrabold text-blue-400">6 Operadores</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
                        <span className="text-blue-300 font-medium">Controle de Acesso RBAC Ativo</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500 text-white font-bold text-[10px]">GESTOR</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATS & PROOF BAR */}
      {/* ========================================================================= */}
      <section className="py-12 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {STATS_DATA.map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 hover:border-orange-500/30 transition-colors">
                <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  {stat.value}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">{stat.label}</h4>
                <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PAIN VS SOLUTION (PAS FRAMEWORK) */}
      {/* ========================================================================= */}
      <section id="problema" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400">
              O Caos Tradicional vs O Novo Padrão
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Por que restaurantes tradicionais perdem clientes todos os dias?
            </h3>
            <p className="text-slate-400 text-base">
              A diferença entre um restaurante lucrativo e um restaurante estressante está na automação do salão e da cozinha.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* O Modelo Tradicional (Caos) */}
            <div className="p-8 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-red-200">O Modelo Tradicional</h4>
                  <p className="text-xs text-red-300/80">Lento, sujeito a falhas e causador de prejuízos</p>
                </div>
              </div>

              <div className="space-y-4">
                {PAIN_POINTS.map((pain, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-red-500/10">
                    <span className="text-red-400 text-base mt-0.5">❌</span>
                    <div>
                      <h5 className="text-sm font-bold text-white">{pain.title}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{pain.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* A Solução Digital SaaS */}
            <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-emerald-200">Com o Nosso SaaS Integrado</h4>
                  <p className="text-xs text-emerald-300/80">Veloz, automatizado e com máxima lucratividade</p>
                </div>
              </div>

              <div className="space-y-4">
                {BENEFITS_DATA.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/10">
                    <span className="text-emerald-400 text-base mt-0.5">✅</span>
                    <div>
                      <h5 className="text-sm font-bold text-white">{benefit.title}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MODULES SHOWCASE GRID */}
      {/* ========================================================================= */}
      <section id="recursos" className="py-20 md:py-28 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400">
              Arquitetura Modular Integrada
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Tudo o que seu restaurante precisa em uma única plataforma
            </h3>
            <p className="text-slate-400 text-base">
              Do pedido feito na mesa até a entrega pelo chef e fechamento no caixa, cada etapa funciona em perfeita harmonia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MODULES_SHOWCASE.map((mod) => {
              const IconComp = ICON_MAP[mod.iconName] || QrCode
              return (
                <div
                  key={mod.id}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-orange-500/5 group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${mod.badgeColor}`}>
                        {mod.tag}
                      </span>
                      <h4 className="text-xl font-bold text-white">{mod.title}</h4>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{mod.description}</p>
                    <ul className="space-y-2 pt-2 border-t border-slate-800/80">
                      {mod.highlights.slice(0, 3).map((hl, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      to="/onboarding"
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Testar {mod.title} Grátis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE ROI & PROFIT CALCULATOR */}
      {/* ========================================================================= */}
      <section id="calculadora" className="py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>Simulador de Lucro e Retorno (ROI)</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Calcule o quanto seu restaurante vai faturar a mais
              </h3>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Ajuste os controles abaixo de acordo com a realidade do seu estabelecimento e veja o impacto financeiro projetado.
              </p>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Slider Mesas */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Mesas no Salão:</span>
                  <span className="font-bold text-orange-400 text-sm">{mesasInput} mesas</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={mesasInput}
                  onChange={(e) => setMesasInput(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>5 mesas</span>
                  <span>100 mesas</span>
                </div>
              </div>

              {/* Slider Ticket Médio */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Ticket Médio Atual:</span>
                  <span className="font-bold text-emerald-400 text-sm">R$ {ticketMedioInput}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={ticketMedioInput}
                  onChange={(e) => setTicketMedioInput(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>R$ 20</span>
                  <span>R$ 300</span>
                </div>
              </div>

              {/* Slider Giros/Dia */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Giros de Mesa / Dia:</span>
                  <span className="font-bold text-blue-400 text-sm">{girosDiaInput}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={girosDiaInput}
                  onChange={(e) => setGirosDiaInput(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1x (Calmo)</span>
                  <span>5x (Muito Alto)</span>
                </div>
              </div>
            </div>

            {/* Results Display Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-950 to-slate-950 border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Faturamento Atual Estimado:</span>
                <span className="text-lg sm:text-xl font-bold text-slate-300">
                  R$ {roiMetrics.faturamentoMensalAtual.toLocaleString('pt-BR')}
                  <span className="text-xs text-slate-500 font-normal"> /mês</span>
                </span>
              </div>
              <div className="sm:border-x border-slate-800">
                <span className="text-xs text-emerald-400 font-semibold block mb-1">Ganho Adicional Projetado:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  + R$ {roiMetrics.ganhoMensalEstimado.toLocaleString('pt-BR')}
                  <span className="text-xs text-emerald-500 font-normal"> /mês</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-blue-400 font-semibold block mb-1">Tempo Economizado pela Equipe:</span>
                <span className="text-lg sm:text-xl font-bold text-blue-400">
                  ~{roiMetrics.horasEconomizadasMes} horas
                  <span className="text-xs text-slate-500 font-normal"> /mês</span>
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                <span>Quero Aumentar Meu Faturamento Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW IT WORKS (3 STEPS) */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="py-20 md:py-28 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400">
              Simples & Rápido de Implementar
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Como funciona na prática em 3 passos
            </h3>
            <p className="text-slate-400 text-base">
              Seu restaurante operando no formato digital em menos de 15 minutos, sem complicações técnicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 font-extrabold text-xl flex items-center justify-center border border-orange-500/20">
                1
              </div>
              <h4 className="text-xl font-bold text-white">Cadastre seu Cardápio & Imprima os QR Codes</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Adicione seus pratos, fotos e preços no Painel do Gestor. Gere e imprima os QR Codes prontos com o gerador integrado e posicione nas mesas.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 font-extrabold text-xl flex items-center justify-center border border-amber-500/20">
                2
              </div>
              <h4 className="text-xl font-bold text-white">Clientes Escaneiam e Pedem em Segundos</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                O cliente senta, escaneia o QR Code com a câmera do celular, navega pelo cardápio com fotos, escolhe adicionais e confirma o pedido.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 font-extrabold text-xl flex items-center justify-center border border-emerald-500/20">
                3
              </div>
              <h4 className="text-xl font-bold text-white">A Cozinha Prepara e o Caixa Fecha com 1 Clique</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                A cozinha recebe o pedido na tela KDS com aviso sonoro. Na hora de ir embora, o operador do caixa localiza a mesa e finaliza a conta instantaneamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PRICING PLANS */}
      {/* ========================================================================= */}
      <section id="planos" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400">
              Planos Claros & Transparentes
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Escolha o plano ideal para o tamanho do seu negócio
            </h3>
            <p className="text-slate-400 text-base">
              Todos os planos incluem 14 dias de teste grátis com R$ 0,00 cobrado hoje e cancelamento a qualquer momento com 1 clique.
            </p>

            {/* Toggle Mensal / Anual */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!isAnnualBilling ? 'text-white' : 'text-slate-400'}`}>
                Mensal
              </span>
              <button
                onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                className="w-14 h-7 rounded-full bg-slate-800 p-1 border border-slate-700 relative transition-colors cursor-pointer"
                aria-label="Alternar ciclo de faturamento"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-orange-500 transition-transform ${
                    isAnnualBilling ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium ${isAnnualBilling ? 'text-white' : 'text-slate-400'}`}>
                  Anual
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Economize 20%
                </span>
              </div>
            </div>
          </div>

          {/* Cards de Planos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {PRICING_PLANS.map((plan) => {
              const price = isAnnualBilling ? plan.priceAnnual : plan.priceMonthly
              return (
                <div
                  key={plan.id}
                  className={`p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 relative ${
                    plan.highlight
                      ? 'bg-slate-900 border-2 border-orange-500 shadow-2xl shadow-orange-500/10 scale-105 z-10'
                      : 'bg-slate-950 border border-slate-800'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-md">
                      {plan.badge}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-2xl font-bold text-white">{plan.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.subtitle}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-slate-400 font-medium">R$</span>
                      <span className="text-4xl sm:text-5xl font-extrabold text-white">{price}</span>
                      <span className="text-xs text-slate-400 font-medium">/mês</span>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        O que está incluído:
                      </span>
                      <ul className="space-y-2.5">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                            <CheckCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Link
                      to={plan.ctaLink}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        plan.highlight
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TESTIMONIALS & SOCIAL PROOF */}
      {/* ========================================================================= */}
      <section id="depoimentos" className="py-20 md:py-28 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400">
              Depoimentos Reais
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Quem usa, aprova e recomenda todos os dias
            </h3>
            <p className="text-slate-400 text-base">
              Veja a experiência de donos de restaurantes que transformaram o atendimento e aumentaram seu faturamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.stars }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <h5 className="text-sm font-bold text-white">{t.name}</h5>
                    <p className="text-xs text-slate-400">{t.role} &bull; {t.restaurant}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400">
              Dúvidas Frequentes
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Perguntas e Respostas
            </h3>
            <p className="text-slate-400 text-base">
              Tudo o que você precisa saber antes de começar o seu teste gratuito.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-white text-sm sm:text-base hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-800/80 pt-3 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL HIGH CONVERSION CTA */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-br from-orange-500/20 via-slate-950 to-slate-950 border-t border-slate-800 relative">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            <Flame className="w-4 h-4" />
            <span>Comece hoje mesmo a transformar sua operação</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
            Pronto para dobrar a eficiência do seu restaurante e encantar seus clientes?
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Junte-se a centenas de proprietários de bares e restaurantes que modernizaram seu atendimento. Teste gratuitamente por 14 dias sem compromisso.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/onboarding"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-orange-500 text-white font-bold text-base hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Criar Minha Conta Grátis</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-base hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Acessar Login de Equipe</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
