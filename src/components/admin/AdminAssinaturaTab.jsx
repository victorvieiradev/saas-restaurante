import React, { useState, useEffect, useRef } from 'react'
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Download,
  ExternalLink,
  RefreshCw,
  X,
  AlertCircle,
  Receipt,
  Calendar,
  Lock,
  ChevronRight,
  Zap,
  ArrowUpRight
} from 'lucide-react'
import {
  fetchSubscriptionStatus,
  fetchFaturas,
  cancelSubscription,
  updateCreditCard,
  reactivateSubscription,
  PLANS_CONFIG
} from '../../services/subscriptionService'
import {
  detectCardBrand,
  validateCardExpiry,
  maskCardNumber,
  maskCardExpiry,
  validateDocument,
  maskDocument
} from '../../utils/validators'
import OrderUsageBar from './OrderUsageBar'
import UpgradePlanModal from './UpgradePlanModal'

export default function AdminAssinaturaTab({ restauranteId }) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [subStatus, setSubStatus] = useState(null)
  const [faturas, setFaturas] = useState([])
  const [toastMessage, setToastMessage] = useState(null)
  const toastTimeoutRef = useRef(null)

  // Modais
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('')

  const [showCardModal, setShowCardModal] = useState(false)
  const [updatingCard, setUpdatingCard] = useState(false)
  const [cardForm, setCardForm] = useState({
    numero: '',
    nomeTitular: '',
    validade: '',
    cvv: '',
    cpfCnpj: ''
  })
  const [cardErrors, setCardErrors] = useState({})

  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const [selectedFaturaModal, setSelectedFaturaModal] = useState(null)

  const showToast = (msg, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToastMessage({ text: msg, type })
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 5000)
  }

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const loadData = async (isSilent = false) => {
    if (!restauranteId) {
      setLoading(false)
      return
    }
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const [statusRes, faturasRes] = await Promise.all([
        fetchSubscriptionStatus(restauranteId),
        fetchFaturas(restauranteId)
      ])
      setSubStatus(statusRes)
      setFaturas(faturasRes.data || [])
    } catch (err) {
      console.warn('Erro ao carregar dados de assinatura:', err)
      showToast('Erro ao carregar informações da assinatura.', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [restauranteId])

  // Helpers de Formatação e Cálculos
  const planoKey = (subStatus?.plano || 'starter').toLowerCase()
  const planoInfo = PLANS_CONFIG[planoKey] || PLANS_CONFIG.starter
  const diasRestantesTrial = subStatus?.dias_restantes_trial ?? 14
  const statusAssinatura = subStatus?.status_assinatura || 'trialing'
  const isTrial = (subStatus?.is_trial ?? (statusAssinatura === 'trialing')) && diasRestantesTrial > 0
  const isTrialExpired = statusAssinatura === 'trialing' && diasRestantesTrial <= 0
  const isCanceled = statusAssinatura === 'canceled'
  const isActive = statusAssinatura === 'active'

  // Cálculo do dia atual do trial (ex: Dia 4 de 14)
  const diaAtualTrial = Math.min(14, Math.max(1, 14 - diasRestantesTrial + 1))

  const formatData = (isoStr) => {
    if (!isoStr) return '-'
    try {
      const str = String(isoStr)
      const d = str.includes('T') ? new Date(str) : new Date(str + 'T00:00:00')
      if (isNaN(d.getTime())) return isoStr
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return isoStr
    }
  }

  const formatValor = (v) => {
    if (v === null || v === undefined) return 'R$ 0,00'
    const num = Number(v)
    if (!Number.isFinite(num)) return 'R$ 0,00'
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const dataFimTrialFormatted = formatData(subStatus?.data_fim_trial)

  // Ação de Cancelamento
  const handleConfirmCancel = async () => {
    setCanceling(true)
    try {
      const res = await cancelSubscription(restauranteId, cancelMotivo)
      if (res.error) {
        showToast(res.error.message || 'Erro ao cancelar assinatura.', 'error')
      } else {
        showToast(
          isTrial
            ? 'Assinatura cancelada com sucesso! R$ 0,00 foi cobrado do seu cartão.'
            : 'Assinatura cancelada com sucesso.',
          'success'
        )
        setShowCancelModal(false)
        await loadData(true)
      }
    } catch (err) {
      showToast('Falha na comunicação ao cancelar assinatura.', 'error')
    } finally {
      setCanceling(false)
    }
  }

  // Ação de Atualização de Cartão
  const handleCardInputChange = (field, value) => {
    let formatted = value
    if (field === 'numero') formatted = maskCardNumber(value)
    if (field === 'validade') formatted = maskCardExpiry(value)
    if (field === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 4)
    if (field === 'cpfCnpj') formatted = maskDocument(value)

    setCardForm(prev => ({ ...prev, [field]: formatted }))
    if (cardErrors[field]) {
      setCardErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleSaveCard = async (e) => {
    e.preventDefault()
    const errors = {}
    const rawNumber = cardForm.numero.replace(/\D/g, '')

    if (rawNumber.length < 13 || rawNumber.length > 19) {
      errors.numero = 'Número do cartão inválido.'
    }
    if (!cardForm.nomeTitular || cardForm.nomeTitular.trim().length < 3) {
      errors.nomeTitular = 'Nome do titular obrigatório.'
    }
    if (!validateCardExpiry(cardForm.validade)) {
      errors.validade = 'Data de validade inválida ou vencida.'
    }
    if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      errors.cvv = 'CVV inválido.'
    }
    if (cardForm.cpfCnpj && !validateDocument(cardForm.cpfCnpj)) {
      errors.cpfCnpj = 'CPF ou CNPJ inválido.'
    }

    if (Object.keys(errors).length > 0) {
      setCardErrors(errors)
      return
    }

    setUpdatingCard(true)
    try {
      const res = await updateCreditCard(restauranteId, cardForm)
      if (res.error) {
        showToast(res.error.message || 'Erro ao atualizar dados do cartão.', 'error')
      } else {
        showToast('Cartão de crédito atualizado com sucesso!', 'success')
        setShowCardModal(false)
        setCardForm({ numero: '', nomeTitular: '', validade: '', cvv: '', cpfCnpj: '' })
        await loadData(true)
      }
    } catch (err) {
      showToast('Erro inesperado ao salvar cartão.', 'error')
    } finally {
      setUpdatingCard(false)
    }
  }

  // Ação de Reativação de Assinatura
  const handleReactivate = async () => {
    setReactivating(true)
    try {
      const res = await reactivateSubscription(restauranteId, { plano: selectedPlan })
      if (res.error) {
        showToast(res.error.message || 'Erro ao reativar assinatura.', 'error')
      } else {
        showToast('🎉 Assinatura reativada com sucesso! Seu plano está ativo.', 'success')
        setShowReactivateModal(false)
        await loadData(true)
      }
    } catch (err) {
      showToast('Erro ao reativar assinatura.', 'error')
    } finally {
      setReactivating(false)
    }
  }

  const detectedBrand = detectCardBrand(cardForm.numero)

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Carregando painel de assinatura e faturas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-lg ${
            toastMessage.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header com Botão de Atualizar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-orange-500" />
            <span>Plano, Assinatura & Faturamento</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie sua assinatura, consulte comprovantes fiscais e configure os dados de pagamento.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
          <span>{refreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </button>
      </div>

      {/* Widget de Consumo de Pedidos no Painel (AC1) */}
      {subStatus && (
        <OrderUsageBar
          subStatus={subStatus}
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />
      )}

      {/* Grid de Cards Principais: Status / Plano / Cartão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Status & Contagem Regressiva do Trial / Assinatura (AC2) */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
          {/* Fundo sutil com gradiente */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Badges de Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isTrial && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider shadow-sm shadow-purple-500/10">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Em Período de Testes (Trial de 14 Dias)</span>
                </span>
              )}

              {isTrialExpired && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm shadow-amber-500/10">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Período de Testes Encerrado</span>
                </span>
              )}

              {isActive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Assinatura Ativa & Regular</span>
                </span>
              )}

              {isCanceled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Assinatura Cancelada</span>
                </span>
              )}

              {statusAssinatura === 'past_due' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fatura Pendente / Vencida</span>
                </span>
              )}
            </div>

            <span className="text-xs font-mono text-slate-500">Ciclo Mensal</span>
          </div>

          {/* Destaque do Plano */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Plano Contratado</span>
                {planoKey !== 'enterprise' && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fazer Upgrade de Plano</span>
                  </button>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2">
                <span>Plano {planoInfo.nome}</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {planoInfo.limite_pedidos ? `${planoInfo.limite_pedidos} pedidos/mês` : 'Ilimitado'}
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{planoInfo.descricao}</p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {formatValor(planoInfo.preco_mensal)}
                <span className="text-xs sm:text-sm text-slate-400 font-normal"> /mês</span>
              </div>
              <p className="text-[11px] text-slate-500">Sem taxas de setup ou fidelidade</p>
            </div>
          </div>

          {/* Informações Condicionais de Cobrança / Contagem do Trial */}
          {isTrial && (
            <div className="space-y-3 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Você está no <strong>dia {diaAtualTrial}</strong> do seu teste gratuito</span>
                </span>
                <span className="font-bold text-purple-400">
                  Restam {diasRestantesTrial} {diasRestantesTrial === 1 ? 'dia' : 'dias'} até {dataFimTrialFormatted}
                </span>
              </div>

              {/* Barra de Progresso do Trial */}
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((diaAtualTrial / 14) * 100))}%` }}
                />
              </div>

              <div className="text-xs text-slate-300 flex items-start gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Transparência total:</strong> Primeira cobrança automática de{' '}
                  <strong className="text-white">{formatValor(planoInfo.preco_mensal)}</strong> agendada para{' '}
                  <strong className="text-white">{dataFimTrialFormatted}</strong>. Você pode cancelar antes desta data sem pagar nada (R$ 0,00).
                </span>
              </div>
            </div>
          )}

          {isTrialExpired && (
            <div className="space-y-3 p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
              <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Seu período de testes de 14 dias foi concluído</span>
              </div>
              <p className="text-xs text-slate-300">
                Para manter seu cardápio digital, recebimento de pedidos e KDS ativos, confirme seu plano ou atualize seu cartão de crédito.
              </p>
              <button
                onClick={() => setShowReactivateModal(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Ativar Assinatura Definitiva</span>
              </button>
            </div>
          )}

          {isActive && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm text-slate-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Assinatura em dia</span>
              </div>
              <p className="text-xs text-slate-400">
                Sua próxima renovação ocorrerá automaticamente com débito no cartão cadastrado no valor de{' '}
                <strong className="text-white">{formatValor(planoInfo.preco_mensal)}</strong>.
              </p>
            </div>
          )}

          {isCanceled && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-rose-300 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Sua assinatura está inativa</span>
              </div>
              <p className="text-xs text-slate-300">
                O acesso aos pedidos e geração de comandas pode ser limitado. Reative a qualquer momento para continuar aproveitando todos os recursos.
              </p>
              <button
                onClick={() => setShowReactivateModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Reativar Assinatura Agora</span>
              </button>
            </div>
          )}

          {/* Rodapé do Card com Ações Secundárias */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Ambiente seguro criptografado de ponta a ponta</span>
            </div>

            {!isCanceled && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-xs text-slate-500 hover:text-red-400 underline decoration-slate-700 hover:decoration-red-500/40 transition-colors cursor-pointer"
              >
                Cancelar Assinatura
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Dados do Cartão de Crédito Cadastrado (AC4) */}
        <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Forma de Pagamento</span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            {/* Cartão Estilizado */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-950 border border-slate-700/60 shadow-lg space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 tracking-wider uppercase font-bold">
                  {subStatus?.cartao_bandeira || 'CARTÃO DE CRÉDITO'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ATIVO
                </span>
              </div>

              <div className="py-2">
                <div className="font-mono text-base sm:text-lg text-slate-200 tracking-widest flex items-center gap-2">
                  <span>••••</span>
                  <span>••••</span>
                  <span>••••</span>
                  <span className="text-white font-bold">{subStatus?.cartao_ultimos_digitos || '4829'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cartão de Crédito final •••• {subStatus?.cartao_ultimos_digitos || '4829'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2">
                <span>Cobrança Recorrente</span>
                <span>Asaas Gateway</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCardModal(true)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5 text-orange-400" />
            <span>Alterar Cartão de Crédito</span>
          </button>
        </div>
      </div>

      {/* Seção 2: Histórico de Faturas & Comprovantes (AC5) */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-500" />
              <span>Histórico de Faturas & Recibos</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Visualize faturas geradas, datas de pagamento e faça download de comprovantes.
            </p>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {faturas.length} {faturas.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {faturas.length === 0 ? (
          /* Estado Vazio Elegante para Início de Trial */
          <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Nenhuma fatura emitida ainda</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Seu período de testes de 14 dias é 100% gratuito (R$ 0,00 cobrado hoje). Suas faturas e comprovantes aparecerão aqui automaticamente a partir da primeira renovação.
            </p>
          </div>
        ) : (
          /* Tabela de Faturas */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {faturas.map((fat) => {
                  const st = (fat.status || '').toUpperCase()
                  const isPaga = st === 'CONFIRMED' || st === 'RECEIVED' || st === 'PAGA'
                  const isPendente = st === 'PENDING' || st === 'PENDENTE'
                  const isVencida = st === 'OVERDUE' || st === 'VENCIDA'

                  return (
                    <tr key={fat.id || fat.asaas_payment_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                        {fat.asaas_payment_id || `FAT-${fat.id?.slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formatData(fat.data_vencimento)}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {fat.data_pagamento ? formatData(fat.data_pagamento) : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{formatValor(fat.valor)}</td>
                      <td className="py-3.5 px-4">
                        {isPaga && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paga</span>
                          </span>
                        )}
                        {isPendente && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>Pendente</span>
                          </span>
                        )}
                        {isVencida && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vencida</span>
                          </span>
                        )}
                        {!isPaga && !isPendente && !isVencida && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                            {fat.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedFaturaModal({ ...fat, tipo: 'fatura' })}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver Fatura</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                          </button>

                          {isPaga && (
                            <button
                              onClick={() => setSelectedFaturaModal({ ...fat, tipo: 'comprovante' })}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Comprovante</span>
                            </button>
                          )}
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

      {/* Modal 1: Cancelamento de Assinatura (AC3) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">
                Tem certeza que deseja cancelar sua assinatura?
              </h3>
              {isTrial ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs sm:text-sm text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Garantia de Teste 100% Gratuito</span>
                  </div>
                  <p>
                    Como você está dentro dos 14 dias de teste,{' '}
                    <strong className="text-white underline">absolutamente nenhum valor (R$ 0,00) será cobrado do seu cartão</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-400">
                  Ao confirmar, sua assinatura será encerrada e você não terá novas cobranças recorrentes.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Motivo do cancelamento (opcional):
              </label>
              <textarea
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                placeholder="Conte-nos o motivo do cancelamento para podermos melhorar..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none text-xs text-white placeholder:text-slate-600 resize-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Manter Minha Assinatura
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={canceling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {canceling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{canceling ? 'Cancelando...' : 'Confirmar Cancelamento Imediato'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Alteração de Cartão de Crédito (AC4) */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Alterar Cartão de Crédito</h3>
                  <p className="text-xs text-slate-400">Atualize o cartão para cobranças futuras</p>
                </div>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              {/* Número do Cartão */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número do Cartão
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardForm.numero}
                    onChange={(e) => handleCardInputChange('numero', e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className={`w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-950 border font-mono text-sm text-white focus:outline-none ${
                      cardErrors.numero ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                    }`}
                  />
                  {detectedBrand && (
                    <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-orange-400 border border-slate-700">
                      {detectedBrand}
                    </span>
                  )}
                </div>
                {cardErrors.numero && <p className="text-[11px] text-red-400 mt-1">{cardErrors.numero}</p>}
              </div>

              {/* Nome do Titular */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Impresso no Cartão
                </label>
                <input
                  type="text"
                  value={cardForm.nomeTitular}
                  onChange={(e) => handleCardInputChange('nomeTitular', e.target.value.toUpperCase())}
                  placeholder="NOME COMO NO CARTÃO"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-xs text-white focus:outline-none uppercase ${
                    cardErrors.nomeTitular ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {cardErrors.nomeTitular && <p className="text-[11px] text-red-400 mt-1">{cardErrors.nomeTitular}</p>}
              </div>

              {/* Validade e CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Validade (MM/AA)
                  </label>
                  <input
                    type="text"
                    value={cardForm.validade}
                    onChange={(e) => handleCardInputChange('validade', e.target.value)}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border font-mono text-xs text-white focus:outline-none ${
                      cardErrors.validade ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                    }`}
                  />
                  {cardErrors.validade && <p className="text-[11px] text-red-400 mt-1">{cardErrors.validade}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    value={cardForm.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border font-mono text-xs text-white focus:outline-none ${
                      cardErrors.cvv ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                    }`}
                  />
                  {cardErrors.cvv && <p className="text-[11px] text-red-400 mt-1">{cardErrors.cvv}</p>}
                </div>
              </div>

              {/* CPF / CNPJ do Titular */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CPF ou CNPJ do Titular (opcional)
                </label>
                <input
                  type="text"
                  value={cardForm.cpfCnpj}
                  onChange={(e) => handleCardInputChange('cpfCnpj', e.target.value)}
                  placeholder="000.000.000-00"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border font-mono text-xs text-white focus:outline-none ${
                    cardErrors.cpfCnpj ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {cardErrors.cpfCnpj && <p className="text-[11px] text-red-400 mt-1">{cardErrors.cpfCnpj}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={updatingCard}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updatingCard ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{updatingCard ? 'Salvando...' : 'Salvar Novo Cartão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reativação de Assinatura (AC2) */}
      {showReactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reativar Assinatura SaaS</h3>
                  <p className="text-xs text-slate-400">Escolha o plano para reativar seu acesso</p>
                </div>
              </div>
              <button
                onClick={() => setShowReactivateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {['starter', 'pro', 'scale'].map((key) => {
                const plan = PLANS_CONFIG[key]
                const isSelected = selectedPlan === key
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Plano {plan.nome}</span>
                        {key === 'pro' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-orange-500 text-white">
                            Mais Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.limite_pedidos} pedidos/mês &bull; Suporte total</p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-white">{formatValor(plan.preco_mensal)}</div>
                      <span className="text-[10px] text-slate-500">/mês</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowReactivateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleReactivate}
                disabled={reactivating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {reactivating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{reactivating ? 'Reativando...' : 'Confirmar Reativação'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Visualizador de Fatura / Comprovante (AC5) */}
      {selectedFaturaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedFaturaModal.tipo === 'comprovante' ? 'Comprovante de Pagamento' : 'Detalhamento da Fatura'}
                  </h3>
                  <p className="font-mono text-xs text-slate-400">
                    ID: {selectedFaturaModal.asaas_payment_id || selectedFaturaModal.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFaturaModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Serviço:</span>
                  <span className="font-semibold text-white">Assinatura Mensal Plataforma RestauranteApp</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vencimento:</span>
                  <span className="font-mono text-slate-200">{formatData(selectedFaturaModal.data_vencimento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data de Liquidação:</span>
                  <span className="font-mono text-slate-200">
                    {selectedFaturaModal.data_pagamento ? formatData(selectedFaturaModal.data_pagamento) : 'Pendente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma de Pagamento:</span>
                  <span className="text-slate-200">{selectedFaturaModal.forma_pagamento || 'Cartão de Crédito'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
                  <span className="text-white">Total Faturado:</span>
                  <span className="text-orange-400">{formatValor(selectedFaturaModal.valor)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Documento fiscal e recibo autenticado via gateway Asaas.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFaturaModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>

              {(() => {
                const targetUrl = selectedFaturaModal.tipo === 'comprovante'
                  ? (selectedFaturaModal.url_comprovante || selectedFaturaModal.url_fatura)
                  : selectedFaturaModal.url_fatura
                const isSafe = targetUrl && /^https?:\/\//i.test(targetUrl)
                if (!isSafe) return null
                return (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
                  >
                    <span>{selectedFaturaModal.tipo === 'comprovante' ? 'Baixar Comprovante' : 'Abrir Link Oficial'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Upgrade de Plano com 1 Clique (AC4) */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        restauranteId={restauranteId}
        subStatus={subStatus}
        onSuccess={async () => {
          showToast('🎉 Plano atualizado com sucesso! Novos limites ativos.', 'success')
          await loadData(true)
        }}
      />
    </div>
  )
}
