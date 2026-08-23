import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  Phone,
  FileText,
  Building2,
  Globe,
  MapPin,
  CreditCard,
  Calendar,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  Flame,
  Shield,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  validateCPF,
  validateCNPJ,
  validateDocument,
  maskCPF,
  maskCNPJ,
  maskDocument,
  maskPhone,
  maskCEP,
  maskCardNumber,
  maskCardExpiry,
  validateCardExpiry,
  detectCardBrand,
  generateSlug,
  calculateTrialEndDate,
  fetchAddressByCEP
} from '../utils/validators'
import { createRestaurante } from '../services/restaurantService'
import { createSubscription, PLANS_CONFIG } from '../services/subscriptionService'

export default function OnboardingCheckout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUpGestor } = useAuth()

  // Passo atual: 1 (Titular), 2 (Restaurante), 3 (Plano & Cartão)
  const [currentStep, setCurrentStep] = useState(1)

  // Estado do formulário - Passo 1: Titular
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [telefone, setTelefone] = useState('')
  const [docTipo, setDocTipo] = useState('cpf') // 'cpf' ou 'cnpj'
  const [documento, setDocumento] = useState('')

  // Estado do formulário - Passo 2: Restaurante & Endereço
  const [nomeRestaurante, setNomeRestaurante] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugManual, setIsSlugManual] = useState(false)
  const [cep, setCep] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')

  // Estado do formulário - Passo 3: Plano & Cartão
  const initialPlan = searchParams.get('plan') || 'pro'
  const [selectedPlan, setSelectedPlan] = useState(
    ['starter', 'pro', 'scale'].includes(initialPlan.toLowerCase()) ? initialPlan.toLowerCase() : 'pro'
  )
  const [isAnnual, setIsAnnual] = useState(true)

  const [cartaoNumero, setCartaoNumero] = useState('')
  const [cartaoNome, setCartaoNome] = useState('')
  const [cartaoValidade, setCartaoValidade] = useState('')
  const [cartaoCvv, setCartaoCvv] = useState('')

  // Estados de controle geral
  const [stepError, setStepError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-geração do slug quando o nome do restaurante é digitado
  const handleNomeRestauranteChange = (e) => {
    const val = e.target.value
    setNomeRestaurante(val)
    if (!isSlugManual) {
      setSlug(generateSlug(val))
    }
  }

  // Consulta automática de CEP
  const handleCepChange = async (e) => {
    const rawVal = e.target.value
    const masked = maskCEP(rawVal)
    setCep(masked)
    setCepError('')

    const cleanDigits = masked.replace(/\D/g, '')
    if (cleanDigits.length === 8) {
      setLoadingCep(true)
      const res = await fetchAddressByCEP(cleanDigits)
      setLoadingCep(false)
      if (res.data) {
        setLogradouro(res.data.logradouro || '')
        setBairro(res.data.bairro || '')
        setCidade(res.data.cidade || '')
        setUf(res.data.uf || '')
      } else if (res.error) {
        setCepError(res.error)
      }
    }
  }

  // Cálculo de indicador de força de senha
  const getPasswordStrength = () => {
    if (!senha) return { score: 0, label: '', color: '' }
    let score = 0
    if (senha.length >= 6) score++
    if (senha.length >= 8) score++
    if (/[A-Z]/.test(senha) && /[0-9]/.test(senha)) score++
    if (/[^A-Za-z0-9]/.test(senha)) score++

    if (score <= 1) return { score: 1, label: 'Fraca (mínimo 6 dígitos)', color: 'bg-red-500 text-red-400' }
    if (score === 2) return { score: 2, label: 'Média', color: 'bg-amber-500 text-amber-400' }
    return { score: 3, label: 'Forte & Segura', color: 'bg-emerald-500 text-emerald-400' }
  }

  const passwordStrength = getPasswordStrength()
  const detectedBrand = detectCardBrand(cartaoNumero)
  const trialInfo = calculateTrialEndDate(14)

  // Preços e Planos configurados
  const plansData = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal para cafés, lanchonetes e pequenos bistrôs que querem começar.',
      priceMonthly: 119,
      priceAnnual: 95,
      pedidos: 'Até 300 pedidos/mês',
      features: [
        'Até 300 pedidos processados/mês',
        'Até 15 mesas / comandas ativas',
        'Cardápio Digital QR Code ilimitado',
        '1 Tela de Cozinha KDS & 1 Caixa POS'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'O mais completo para restaurantes, bares e hamburguerias em crescimento.',
      priceMonthly: 229,
      priceAnnual: 183,
      pedidos: 'Até 1.200 pedidos/mês',
      isPopular: true,
      features: [
        'Até 1.200 pedidos processados/mês',
        'Mesas e comandas ilimitadas',
        'Múltiplas telas KDS com Alerta Sonoro',
        'Gestão de Equipe RBAC (Cozinha e Caixa)',
        'Suporte Prioritário 24/7 via WhatsApp'
      ]
    },
    {
      id: 'scale',
      name: 'Scale',
      description: 'Projetado para operações de alta escala, franquias e redes.',
      priceMonthly: 399,
      priceAnnual: 319,
      pedidos: 'Até 3.500 pedidos/mês',
      features: [
        'Até 3.500 pedidos processados/mês',
        'Múltiplas unidades e filiais centralizadas',
        'Tudo do Plano Pro sem limites',
        'Onboarding VIP com Gerente de Conta'
      ]
    }
  ]

  const currentSelectedPlanObj = plansData.find((p) => p.id === selectedPlan) || plansData[1]
  const currentPlanPrice = isAnnual ? currentSelectedPlanObj.priceAnnual : currentSelectedPlanObj.priceMonthly

  // Validação do Passo 1
  const validateStep1 = () => {
    setStepError('')
    if (!nome.trim() || nome.trim().length < 3) {
      setStepError('Por favor, informe seu nome completo (mínimo de 3 caracteres).')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setStepError('Por favor, informe um endereço de e-mail válido.')
      return false
    }
    if (!senha || senha.length < 6) {
      setStepError('A senha deve ter no mínimo 6 caracteres.')
      return false
    }
    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setStepError('Por favor, informe um número de telefone com DDD válido.')
      return false
    }
    const isDocValid = validateDocument(documento, docTipo)
    if (!isDocValid) {
      setStepError(`O ${docTipo.toUpperCase()} informado possui dígitos verificadores inválidos.`)
      return false
    }
    return true
  }

  // Validação do Passo 2
  const validateStep2 = () => {
    setStepError('')
    if (!nomeRestaurante.trim() || nomeRestaurante.trim().length < 2) {
      setStepError('Informe o nome fantasia do seu restaurante.')
      return false
    }
    if (!slug.trim() || slug.trim().length < 2) {
      setStepError('O slug da URL do restaurante é obrigatório.')
      return false
    }
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      setStepError('Informe um CEP válido com 8 dígitos.')
      return false
    }
    if (!logradouro.trim()) {
      setStepError('O endereço (logradouro) é obrigatório.')
      return false
    }
    if (!numero.trim()) {
      setStepError('O número do endereço é obrigatório.')
      return false
    }
    if (!bairro.trim() || !cidade.trim() || !uf.trim()) {
      setStepError('Preencha os campos de Bairro, Cidade e UF.')
      return false
    }
    return true
  }

  // Validação do Passo 3
  const validateStep3 = () => {
    setStepError('')
    const cleanCard = cartaoNumero.replace(/\D/g, '')
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      setStepError('Informe um número de cartão de crédito válido.')
      return false
    }
    if (!cartaoNome.trim() || cartaoNome.trim().length < 3) {
      setStepError('Informe o nome impresso no cartão de crédito.')
      return false
    }
    if (!validateCardExpiry(cartaoValidade)) {
      setStepError('A validade do cartão deve ser uma data futura válida (formato MM/AA).')
      return false
    }
    const cleanCvv = cartaoCvv.replace(/\D/g, '')
    if (cleanCvv.length < 3 || cleanCvv.length > 4) {
      setStepError('O código de segurança (CVV) deve conter 3 ou 4 dígitos.')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2)
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3)
    }
  }

  const handleBack = () => {
    setStepError('')
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Finalização do Onboarding & Checkout
  const handleFinalize = async (e) => {
    if (e) e.preventDefault()
    if (!validateStep3()) return

    setIsSubmitting(true)
    setStepError('')

    try {
      const enderecoCompleto = {
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        cep: cep.trim()
      }

      // 1. Cria ou inicializa o restaurante
      const restPayload = {
        nome: nomeRestaurante.trim(),
        email: email.trim().toLowerCase(),
        slug: slug.trim().toLowerCase(),
        telefone: telefone.trim(),
        cpf_cnpj: documento.trim(),
        endereco_completo: enderecoCompleto,
        plano: selectedPlan
      }

      const restRes = await createRestaurante(restPayload)
      if (restRes.error) {
        throw new Error(restRes.error.message || 'Falha ao cadastrar o restaurante.')
      }

      const createdRestaurant = restRes.data

      // 2. Extrai mês e ano do cartão
      const cleanExpiry = cartaoValidade.replace(/\D/g, '')
      const expiryMonth = cleanExpiry.slice(0, 2)
      let expiryYear = cleanExpiry.slice(2)
      if (expiryYear.length === 2) expiryYear = `20${expiryYear}`

      // 3. Comunica com o serviço de assinatura e Asaas
      const subPayload = {
        cliente: {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          cpfCnpj: documento.trim(),
          telefone: telefone.trim(),
          senha: senha
        },
        cartao: {
          number: cartaoNumero.replace(/\D/g, ''),
          holderName: cartaoNome.trim().toUpperCase(),
          expiryMonth,
          expiryYear,
          ccv: cartaoCvv.replace(/\D/g, '')
        },
        endereco: enderecoCompleto,
        plano: selectedPlan,
        ciclo: isAnnual ? 'YEARLY' : 'MONTHLY',
        restauranteId: createdRestaurant.id,
        restaurante: createdRestaurant
      }

      const subRes = await createSubscription(subPayload)
      if (subRes.error) {
        throw new Error(subRes.error.message || 'Falha ao validar assinatura do cartão.')
      }

      // 4. Cadastra ou autentica a sessão do Gestor no AuthContext
      await signUpGestor({
        email: email.trim().toLowerCase(),
        password: senha,
        nome: nome.trim(),
        restaurante: createdRestaurant
      })

      setIsSubmitting(false)

      // 5. Redireciona para o Painel Gestor com notificação de boas-vindas
      navigate('/admin', {
        replace: true,
        state: {
          welcomeTrial: true,
          plano: selectedPlan,
          nomeRestaurante: createdRestaurant.nome,
          dataFimTrial: trialInfo.formattedDate
        }
      })
    } catch (err) {
      console.warn('Erro ao finalizar checkout:', err)
      setStepError(err.message || 'Ocorreu um erro ao processar seu cadastro. Verifique os dados e tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Container Principal */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header do Onboarding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Teste Gratuito de 14 Dias &bull; Cancele quando quiser</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Criar Conta no Restaurante<span className="text-orange-500">App</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Configuração rápida em 3 passos para colocar seu cardápio digital, KDS e POS para funcionar hoje mesmo.
          </p>
        </div>

        {/* Stepper / Indicador de Progresso (AC1) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm font-semibold">
            {/* Passo 1 */}
            <div
              className={`flex items-center justify-center gap-2 p-2 rounded-xl transition-all ${
                currentStep === 1
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : currentStep > 1
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-slate-500'
              }`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-current">
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span className="hidden sm:inline">1. Titular</span>
            </div>

            {/* Passo 2 */}
            <div
              className={`flex items-center justify-center gap-2 p-2 rounded-xl transition-all ${
                currentStep === 2
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : currentStep > 2
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-slate-500'
              }`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-current">
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span className="hidden sm:inline">2. Restaurante</span>
            </div>

            {/* Passo 3 */}
            <div
              className={`flex items-center justify-center gap-2 p-2 rounded-xl transition-all ${
                currentStep === 3
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-500'
              }`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-current">
                3
              </div>
              <span className="hidden sm:inline">3. Plano & Cartão</span>
            </div>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Alerta de Erro */}
        {stepError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 animate-fade-in shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{stepError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 1: DADOS DO TITULAR & IDENTIFICAÇÃO (AC2) */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                <span>Passo 1: Identificação do Titular da Conta</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Estes dados serão usados para acessar o Painel do Gestor e receber avisos da conta.
              </p>
            </div>

            <div className="space-y-4">
              {/* Nome Completo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nome Completo <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* E-mail de Acesso */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  E-mail de Acesso <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@restaurante.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Senha com Indicador de Força */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Senha de Acesso <span className="text-orange-500">*</span>
                  </label>
                  {senha && (
                    <span className={`text-[11px] font-semibold ${passwordStrength.color.split(' ')[1]}`}>
                      Força: {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Barrinhas de força */}
                {senha && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div className={`h-1 rounded-full ${passwordStrength.score >= 1 ? 'bg-red-500' : 'bg-slate-800'}`} />
                    <div className={`h-1 rounded-full ${passwordStrength.score >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                    <div className={`h-1 rounded-full ${passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  </div>
                )}
              </div>

              {/* WhatsApp / Celular com DDD */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  WhatsApp / Celular com DDD <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(maskPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Tipo de Documento e Número com Validação Matemática */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Tipo Documento
                  </label>
                  <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDocTipo('cpf')
                        setDocumento('')
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        docTipo === 'cpf' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      CPF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocTipo('cnpj')
                        setDocumento('')
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        docTipo === 'cnpj' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      CNPJ
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Número do {docTipo.toUpperCase()} <span className="text-orange-500">*</span>
                    </label>
                    {documento && (
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                        validateDocument(documento, docTipo) ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {validateDocument(documento, docTipo) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Válido
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" /> Dígitos Inválidos
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <FileText className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={documento}
                      onChange={(e) => setDocumento(maskDocument(e.target.value, docTipo))}
                      placeholder={docTipo === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                      maxLength={docTipo === 'cpf' ? 14 : 18}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none text-sm transition-colors ${
                        documento && validateDocument(documento, docTipo)
                          ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                          : documento
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          : 'border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ações do Passo 1 */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <Link
                to="/login"
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                Já possui conta? Fazer Login
              </Link>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Avançar para Restaurante</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: DADOS DO RESTAURANTE & ENDEREÇO (AC3) */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                <span>Passo 2: Dados do Restaurante & Endereço</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Configure a identidade visual do seu cardápio digital e o endereço de faturamento.
              </p>
            </div>

            <div className="space-y-4">
              {/* Nome Fantasia do Restaurante */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nome do Restaurante / Estabelecimento <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={nomeRestaurante}
                    onChange={handleNomeRestauranteChange}
                    placeholder="Ex: Cantina do Chef & Pizzaria"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Slug da URL do Cardápio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Slug da URL do Cardápio <span className="text-orange-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Personalizado para QR Codes</span>
                </div>
                <div className="relative">
                  <Globe className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManual(true)
                      setSlug(generateSlug(e.target.value))
                    }}
                    placeholder="cantina-do-chef"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Link de acesso: <code className="text-orange-400 font-mono">restauranteapp.com/cardapio/{slug || 'seu-slug'}</code>
                </p>
              </div>

              {/* Endereço com Busca Automática ViaCEP */}
              <div className="pt-2 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Endereço do Estabelecimento</h3>
                </div>

                {/* CEP e Logradouro */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      CEP <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                      />
                      {loadingCep && (
                        <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-orange-500" />
                      )}
                    </div>
                    {cepError && <span className="text-[10px] text-red-400">{cepError}</span>}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Logradouro / Rua <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="Av. Paulista, Rua das Flores..."
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                {/* Número e Complemento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Número <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Complemento (Opcional)
                    </label>
                    <input
                      type="text"
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      placeholder="Loja 02, Bloco A, Sala 10..."
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                {/* Bairro, Cidade e UF */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Bairro <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Cidade <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      UF <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm uppercase text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ações do Passo 2 */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Avançar para Escolha do Plano</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: PLANO & CARTÃO COM TRIAL 14 DIAS (AC4, AC5) */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <span>Passo 3: Plano & Cartão de Crédito</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  14 Dias de Teste Gratuito. Cancele com 1 clique a qualquer momento.
                </p>
              </div>

              {/* Alternador de Ciclo Mensal vs Anual */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isAnnual ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isAnnual ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Anual</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    20% OFF
                  </span>
                </button>
              </div>
            </div>

            {/* Cards de Seleção de Planos (AC4) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plansData.map((plan) => {
                const isSelected = selectedPlan === plan.id
                const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                        <Flame className="w-3 h-3 fill-white" />
                        <span>MAIS ESCOLHIDO</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-white">{plan.name}</h4>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-slate-400 font-medium">R$</span>
                          <span className="text-2xl font-extrabold text-white">{price}</span>
                          <span className="text-xs text-slate-400 font-medium">/mês</span>
                        </div>
                        <span className="text-[11px] font-semibold text-orange-400 block mt-0.5">
                          {plan.pedidos}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">{plan.description}</p>
                    </div>

                    <ul className="space-y-1.5 pt-3 border-t border-slate-800/80 mt-3 text-[11px] text-slate-300">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* Visualizador Interativo de Cartão & Formulário */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 border-t border-slate-800">
              {/* Visualizador de Cartão de Crédito */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[320px] aspect-[1.586/1] rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 p-5 text-white shadow-2xl border border-slate-700/60 relative overflow-hidden flex flex-col justify-between">
                  {/* Detalhes de reflexo de cartão */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Topo: Chip dourado e Bandeira */}
                  <div className="flex items-center justify-between">
                    {/* Chip simulado */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-300 to-yellow-500 border border-yellow-200/50 shadow-inner flex items-center justify-center opacity-90">
                      <div className="w-6 h-4 border-t border-b border-yellow-700/40" />
                    </div>

                    {/* Bandeira */}
                    <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 font-extrabold text-[10px] tracking-wider uppercase text-amber-300">
                      {detectedBrand !== 'UNKNOWN' ? detectedBrand : 'CARTÃO'}
                    </span>
                  </div>

                  {/* Número do Cartão */}
                  <div className="font-mono text-sm sm:text-base tracking-widest text-slate-100 font-semibold text-center drop-shadow-sm">
                    {cartaoNumero || '•••• •••• •••• ••••'}
                  </div>

                  {/* Rodapé do Cartão: Nome do Titular e Validade */}
                  <div className="flex items-end justify-between text-[10px] uppercase font-mono tracking-wider text-slate-300">
                    <div className="max-w-[170px] truncate">
                      <span className="text-[8px] text-slate-400 block tracking-normal">Nome Impresso</span>
                      <span className="font-semibold text-white">{cartaoNome || 'NOME DO TITULAR'}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 block tracking-normal">Validade</span>
                      <span className="font-semibold text-white">{cartaoValidade || 'MM/AA'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulário de Cartão */}
              <div className="lg:col-span-7 space-y-4">
                {/* Número do Cartão */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Número do Cartão <span className="text-orange-500">*</span>
                    </label>
                    {detectedBrand !== 'UNKNOWN' && (
                      <span className="text-[11px] font-bold text-orange-400 uppercase">
                        Bandeira: {detectedBrand}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <CreditCard className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={cartaoNumero}
                      onChange={(e) => setCartaoNumero(maskCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={23}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Nome Impresso */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Nome Impresso no Cartão <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cartaoNome}
                    onChange={(e) => setCartaoNome(e.target.value.toUpperCase())}
                    placeholder="COMO GRAVADO NO CARTÃO"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm uppercase"
                  />
                </div>

                {/* Validade e CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Validade (MM/AA) <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={cartaoValidade}
                        onChange={(e) => setCartaoValidade(maskCardExpiry(e.target.value))}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        CVV <span className="text-orange-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500">3 ou 4 dígitos</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={cartaoCvv}
                        onChange={(e) => setCartaoCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selo de Transparência & Garantia de 14 Dias (AC4) */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>Garantia de 14 Dias Grátis &bull; Risco Zero</span>
                </h4>
                <p className="leading-relaxed">
                  Total cobrado hoje: <strong className="text-white font-extrabold text-sm">R$ 0,00</strong>. A primeira mensalidade de{' '}
                  <strong className="text-white font-bold">R$ {currentPlanPrice},00</strong> ocorrerá apenas em{' '}
                  <strong className="text-emerald-400 font-bold underline decoration-emerald-500/40">{trialInfo.formattedDate}</strong>.
                  Você pode cancelar a qualquer momento no painel antes dessa data com 1 clique e nenhum centavo será cobrado.
                </p>
              </div>
            </div>

            {/* Ações do Passo 3 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={handleFinalize}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:from-orange-700 text-white font-extrabold text-base shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Configurando seu Restaurante...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Iniciar Teste Grátis de 14 Dias</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
