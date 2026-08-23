// Configurações, Estrutura de Dados e Lógica de Negócio da Landing Page SaaS

export function calculateRoiMetrics({ mesas = 20, ticketMedio = 80, girosDia = 2.5 } = {}) {
  const m = Math.max(0, Number(mesas) || 0)
  const tm = Math.max(0, Number(ticketMedio) || 0)
  const gd = Math.max(0, Number(girosDia) || 0)

  const pedidosDia = Math.round(m * gd)
  const faturamentoMensalAtual = Math.round(pedidosDia * tm * 30)

  // Estimativa baseada em métricas de cardápio digital: +25% ticket médio e +15% de giro
  const ticketMedioProjetado = tm * 1.25
  const pedidosDiaProjetado = pedidosDia * 1.15
  const faturamentoMensalProjetado = Math.round(pedidosDiaProjetado * ticketMedioProjetado * 30)
  const ganhoMensalEstimado = Math.max(0, faturamentoMensalProjetado - faturamentoMensalAtual)

  // Economia estimada de ~15 minutos por atendimento
  const horasEconomizadasMes = Math.round((pedidosDia * 30 * 15) / 60)
  
  // Custo base de referência do plano Pro (R$ 299)
  const roiMultiplier = faturamentoMensalAtual > 0 ? Math.round((ganhoMensalEstimado / 299) * 10) / 10 : 0

  return {
    pedidosDia,
    faturamentoMensalAtual,
    faturamentoMensalProjetado,
    ganhoMensalEstimado,
    horasEconomizadasMes,
    roiMultiplier
  }
}

export const STATS_DATA = [
  {
    value: '+35%',
    label: 'Aumento no Ticket Médio',
    description: 'Com fotos atrativas, adicionais e sugestões automáticas no cardápio digital.'
  },
  {
    value: '-70%',
    label: 'Tempo de Espera',
    description: 'Clientes pedem direto da mesa e a cozinha recebe os pedidos instantaneamente.'
  },
  {
    value: '0 Erros',
    label: 'Na Anotação de Pedidos',
    description: 'Elimine comandas ilegíveis de papel e retrabalho na cozinha.'
  },
  {
    value: '350+',
    label: 'Restaurantes & Bares',
    description: 'Operações transformadas em todo o Brasil com alta disponibilidade.'
  }
]

export const PAIN_POINTS = [
  {
    title: 'Garçons sobrecarregados no salão',
    description: 'Clientes acenando desesperados para pedir ou pagar, gerando insatisfação e perda de novos pedidos.'
  },
  {
    title: 'Comandas de papel ilegíveis e cancelamentos',
    description: 'Erros na anotação manual geram pratos errados, desperdício de insumos e atritos entre garçom e cozinha.'
  },
  {
    title: 'Filas no caixa nos horários de pico',
    description: 'A demora para somar comandas, calcular taxas e liberar mesas trava o giro do salão.'
  },
  {
    title: 'Falta de controle e segurança de dados',
    description: 'Sem controle por perfil de equipe, qualquer um acessa relatórios financeiros ou altera produtos.'
  }
]

export const BENEFITS_DATA = [
  {
    title: 'Autoatendimento QR Code Instantâneo',
    description: 'O cliente senta, aponta a câmera do celular e pede em segundos. Sem baixar aplicativo e sem fricção.'
  },
  {
    title: 'KDS Inteligente com Alerta Sonoro',
    description: 'Pedidos caem instantaneamente na tela da cozinha via WebSockets com aviso sonoro e cronômetro de preparo.'
  },
  {
    title: 'Fechamento de Conta POS em 1 Clique',
    description: 'Consulta do total consumido em tempo real, fechamento veloz e liberação automática da comanda para a próxima mesa.'
  },
  {
    title: 'Controle de Acesso RBAC & Multi-Tenant',
    description: 'Acesso estrito e isolado para Gestor, Cozinha e Caixa, garantindo integridade e conformidade na operação.'
  }
]

export const MODULES_SHOWCASE = [
  {
    id: 'cliente',
    title: 'Cardápio Digital & QR Code',
    tag: 'Módulo Salão',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Experiência fluida direto no celular do cliente. Fotos em alta resolução, carrinho interativo e confirmação imediata.',
    iconName: 'QrCode',
    highlights: [
      'Acesso 100% web sem necessidade de download ou login do cliente',
      'Categorias dinâmicas com fotos, descrições e controle de disponibilidade',
      'Seleção de adicionais e observações personalizadas por item',
      'Acompanhamento do status do pedido em tempo real'
    ],
    previewBg: 'from-orange-500/10 to-amber-500/5',
    ctaText: 'Ver Cardápio'
  },
  {
    id: 'cozinha',
    title: 'Monitor KDS em Tempo Real',
    tag: 'Módulo Cozinha',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'Kanban digital para a equipe da cozinha gerenciar a fila de preparo com máxima agilidade e sem perda de comandas.',
    iconName: 'ChefHat',
    highlights: [
      'Sincronização WebSockets instantânea com novos pedidos',
      'Sintetizador de alerta sonoro integrado para chamar a atenção da equipe',
      'Transição de status ágil: Pendente, Em Preparo e Concluído',
      'Cronômetro de tempo decorrido para controle de SLA de entrega'
    ],
    previewBg: 'from-amber-500/10 to-orange-500/5',
    ctaText: 'Acessar KDS'
  },
  {
    id: 'caixa',
    title: 'Terminal Caixa POS Ágil',
    tag: 'Módulo Caixa',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Fechamento ágil de contas com cálculo detalhado dos itens consumidos, controle de status de pagamento e liberação de mesas.',
    iconName: 'Receipt',
    highlights: [
      'Busca instantânea por número de comanda ou mesa',
      'Detalhamento consolidado de todos os pedidos realizados',
      'Fechamento e quitação em 1 clique com feedback visual imediato',
      'Liberação instantânea da comanda para a próxima rotação de clientes'
    ],
    previewBg: 'from-emerald-500/10 to-teal-500/5',
    ctaText: 'Acessar POS'
  },
  {
    id: 'gestor',
    title: 'Painel Gestor & Equipe RBAC',
    tag: 'Módulo Administrativo',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Controle total da operação: CRUD de cardápio, gerador de QR Codes em lote para impressão e gestão segura de equipe.',
    iconName: 'Crown',
    highlights: [
      'Cadastro e edição de produtos com upload de imagens e precificação',
      'Gerador e impressor de QR Codes para mesas e comandas físicas',
      'Gestão de membros da equipe com papéis estritos (Gestor, Cozinha, Caixa)',
      'Segurança multi-tenant com banco Supabase isolado'
    ],
    previewBg: 'from-blue-500/10 to-indigo-500/5',
    ctaText: 'Acessar Painel'
  }
]

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Ideal para cafés, lanchonetes e pequenos bistrôs que querem começar.',
    priceMonthly: 119,
    priceAnnual: 95,
    highlight: false,
    badge: null,
    features: [
      'Até 15 mesas / comandas ativas simultâneas',
      'Cardápio Digital QR Code ilimitado',
      '1 Tela de Cozinha KDS em tempo real',
      '1 Terminal de Caixa POS',
      'Gerador de QR Code para impressão',
      'Suporte via WhatsApp em horário comercial'
    ],
    ctaText: 'Iniciar Teste de 14 Dias',
    ctaLink: '/onboarding?plan=starter'
  },
  {
    id: 'pro',
    name: 'Profissional',
    subtitle: 'O mais completo para restaurantes, bares e hamburguerias em crescimento.',
    priceMonthly: 229,
    priceAnnual: 183,
    highlight: true,
    badge: 'Mais Escolhido 🔥',
    features: [
      'Mesas e comandas ilimitadas',
      'Cardápio Digital com fotos em alta definição',
      'Múltiplas telas KDS com Alerta Sonoro WebSockets',
      'Múltiplos operadores de Caixa POS',
      'Gestão de Equipe com Controle de Acesso RBAC',
      'Impressão de QR Codes em lote com logo',
      'Suporte prioritário 24/7 via WhatsApp e chamada'
    ],
    ctaText: 'Testar Plano Pro Grátis',
    ctaLink: '/onboarding?plan=pro'
  },
  {
    id: 'enterprise',
    name: 'Scale / Redes',
    subtitle: 'Para franquias, redes de restaurantes e operações de alta escala.',
    priceMonthly: 399,
    priceAnnual: 319,
    highlight: false,
    badge: 'Grandes Operações',
    features: [
      'Múltiplas unidades e filiais centralizadas',
      'Tudo do Plano Pro sem limites',
      'Onboarding VIP com treinamento de equipe',
      'Integrações personalizadas de ERP e fiscais',
      'Gerente de conta exclusivo',
      'SLA garantido de 99.9% com suporte dedicado'
    ],
    ctaText: 'Testar Plano Scale',
    ctaLink: '/onboarding?plan=scale'
  }
]

export const FAQ_ITEMS = [
  {
    question: 'O cliente precisa baixar algum aplicativo no celular?',
    answer:
      'Não! O cliente só precisa apontar a câmera do celular para o QR Code da mesa. O cardápio digital abre instantaneamente no navegador padrão do aparelho (Chrome, Safari, etc.), sem necessidade de cadastro demorado ou download na loja de apps.'
  },
  {
    question: 'Preciso comprar equipamentos caros ou específicos para a cozinha e caixa?',
    answer:
      'Absolutamente não! O sistema é 100% baseado na web. Você pode usar qualquer tablet, notebook, computador desktop, celular ou até Smart TV que você já possua no seu restaurante.'
  },
  {
    question: 'Como funciona a sincronização entre salão, cozinha e caixa?',
    answer:
      'Utilizamos tecnologia WebSockets em tempo real (Supabase Realtime). No exato milissegundo em que o cliente clica em "Confirmar Pedido", a comanda aparece no KDS da cozinha com notificação sonora e entra no extrato do Caixa POS sem que ninguém precise recarregar a página.'
  },
  {
    question: 'Como funciona a segurança e as permissões de acesso da minha equipe?',
    answer:
      'O sistema possui controle RBAC (Role-Based Access Control) nativo. Você cria usuários com perfis específicos: o Cozinheiro acessa apenas a tela KDS de preparo, o Operador de Caixa acessa o terminal de pagamentos e somente o Gestor tem permissão total para alterar preços, cardápio e relatórios.'
  },
  {
    question: 'Como funciona o teste gratuito de 14 dias?',
    answer:
      'Você tem 14 dias para usar o sistema completo no seu restaurante, cadastrar seu cardápio, gerar QR Codes e testar todas as telas sem nenhum compromisso. Não exigimos cartão de crédito prévio para começar.'
  },
  {
    question: 'Posso alterar os itens e preços do cardápio a qualquer momento?',
    answer:
      'Sim! Pelo Painel do Gestor você adiciona pratos, fotos, descrições, adicionais e altera preços em segundos. A atualização é instantânea para todos os clientes conectados.'
  }
]

export const TESTIMONIALS = [
  {
    name: 'Carlos Mendes',
    role: 'Proprietário',
    restaurant: 'Burger & Co. Smokehouse (SP)',
    stars: 5,
    quote:
      'No primeiro fim de semana com o cardápio QR Code e o KDS na chapa, nosso tempo de atendimento caiu pela metade e o ticket médio subiu 32% só com os adicionais que os clientes escolhem direto na tela.',
    avatar: '🍔'
  },
  {
    name: 'Mariana Silveira',
    role: 'Gerente Geral',
    restaurant: 'Trattoria Bella Notte (RJ)',
    stars: 5,
    quote:
      'Acabamos de vez com as comandas de papel ilegíveis e pratos voltando para a cozinha. O aviso sonoro no KDS mantém a equipe atenta e o fechamento no caixa ficou extremamente veloz.',
    avatar: '🍝'
  },
  {
    name: 'Rodrigo Alencar',
    role: 'Sócio Fundador',
    restaurant: 'Boteco da Vila (MG)',
    stars: 5,
    quote:
      'A gestão de equipe com permissões RBAC trouxe a segurança que eu precisava. O garçom não se preocupa mais com pedidos errados e eu acompanho tudo do meu celular.',
    avatar: '🍻'
  }
]
