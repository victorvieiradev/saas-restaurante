---
title: 'Landing Page de Vendas de Alta Conversão (Single Page SaaS)'
type: 'feature'
created: '2026-08-22T21:58:00-03:00'
status: 'ready-for-dev'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A página inicial atual exibe apenas um grid técnico básico com links para os módulos do sistema, sem persuasão comercial, proposta de valor clara ou apelo para potenciais clientes e proprietários de restaurantes.

**Approach:** Criar uma Landing Page de Vendas completa no estilo single page, moderna e responsiva, estruturada com técnicas de copywriting (AIDA / PAS), gatilhos emocionais (redução de perdas, agilidade, aumento de ticket médio, fim do caos no salão) e prova social, mantendo intactos a navegação com botão de login no topo e todos os fluxos e rotas funcionais existentes do sistema.

## Boundaries & Constraints

**Always:**
- Manter o botão "Entrar no Sistema" / "Acessar Login" na barra superior (Navbar) redirecionando para a rota `/login` (ou `/admin` se já autenticado).
- Preservar integralmente todas as rotas existentes (`/login`, `/admin`, `/cozinha`, `/caixa`, `/comanda/:token`), seus componentes e suas regras de controle de acesso (RBAC).
- Manter compatibilidade total com Tailwind CSS v4, React 19 e ícones do `lucide-react`.
- Garantir responsividade completa (Mobile, Tablet e Desktop).

**Ask First:**
- Alterações em esquemas de cores globais ou criação de novas dependências externas de UI/animação.

**Never:**
- Alterar a lógica de autenticação do `AuthContext` ou modificar serviços de banco de dados (`supabase.js`, `comandaService`, `pedidoService`, etc.).
- Remover ou quebrar o banner de alerta de acesso não autorizado (`UnauthorizedAlertBanner`).
- Substituir ou sobrescrever arquivos de módulos internos (`AdminDashboard`, `CozinhaKDS`, `CaixaPOS`, `ComandaCliente`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Visitante anônimo acessa `/` | Usuário não autenticado | Renderiza a Landing Page de Vendas completa com Hero, Dores/Soluções, Módulos, Métricas/Gatilhos, Como Funciona, Planos, Depoimentos, FAQ e CTA final. Navbar exibe botão "Entrar". | N/A (Renderização pura de UI estática/interativa) |
| Visitante clica em "Entrar no Sistema" ou "Login" | Clique no botão da Navbar ou CTAs de Login | Navegação para `/login` (ou `/admin`) exibindo o formulário de login de equipe existente. | Rota padrão do React Router DOM |
| Usuário já autenticado acessa `/` | Usuário com sessão ativa no `AuthContext` | Landing Page continua acessível, mas a Navbar exibe o badge do perfil (ex: Gestor, Cozinha, Caixa) e atalhos diretos para os módulos autorizados e botão de "Sair". | Redirecionamento e badges gerenciados pelo AuthContext |
| Visitante clica em links de âncora da Landing Page | Clique em #recursos, #como-funciona, #beneficios, #planos, #faq | Scroll suave (smooth scrolling) até a respectiva seção na mesma página. | Fallback para salto de âncora padrão |
| Interação com FAQ sanfona (Accordion) | Clique em uma pergunta do FAQ | Expande a resposta da pergunta selecionada e recolhe as outras caso configurado, mantendo boa acessibilidade. | Alternância simples de estado React |

</frozen-after-approval>

## Code Map

- `src/pages/LandingPage.jsx` -- Nova página/componente modular contendo toda a estrutura da Landing Page de Vendas (Hero, Problema/Solução, Módulos KDS/POS/QR, Gatilhos & Números, Demonstração, Planos, FAQ, CTA final).
- `src/App.jsx` -- Atualização do roteamento da raiz `/` para utilizar o novo componente `LandingPage` e refinamento do Navbar para harmonizar com a Landing Page e os estados de autenticação.

## Tasks & Acceptance

**Execution:**
- [ ] `src/pages/LandingPage.jsx` -- Criar componente de Landing Page de Vendas completa -- Implementa layout moderno com copywriting persuasivo (Hero com chamada de impacto e mockups visuais, seção "O Caos vs A Solução", vitrine dos 4 módulos com ícones e badges, calculadora/métricas de impacto financeiro [+35% ticket médio, -70% tempo de espera], seção passo a passo "Como Funciona", tabela comparativa de planos de assinatura com CTA para contato/teste, depoimentos e FAQ interativo com accordion).
- [ ] `src/App.jsx` -- Integrar `LandingPage` na rota `/` e ajustar Navbar -- Substitui o componente inline `Home` pelo novo `LandingPage`, mantendo a barra de navegação com logotipo, links de âncoras para seções da página, botão de login/acesso e tratamento dinâmico de usuário logado (gestor, cozinha, caixa).

**Acceptance Criteria:**
- Given que um usuário não autenticado acessa a URL raiz `/`, when a página carrega, then uma Landing Page de vendas visualmente rica, moderna e profissional é exibida com todas as seções comerciais e gatilhos de conversão.
- Given que o usuário está na Landing Page, when clica no botão "Entrar no Sistema" no topo da página, then é redirecionado imediatamente para a página de login funcional `/login` sem erros.
- Given que um usuário autenticado (Gestor, Cozinha ou Caixa) acessa `/`, when visualiza o topo da página, then a barra de navegação exibe os botões de acesso rápido ao seu módulo e opção de logout.
- Given que um visitante clica em qualquer item de menu (#recursos, #como-funciona, #planos, #faq), when o clique ocorre, then a página faz a rolagem suave até a seção correspondente.

## Design Notes

- **Design System & Paleta:** Fundo escuro premium (`bg-slate-950`), gradientes sutis em laranja/âmbar (`from-orange-500 to-amber-500`), bordas elegantes com brilho suave (`border-slate-800`, `shadow-orange-500/10`), tipografia nítida e contrastante.
- **Copywriting Framework (PAS + AIDA):**
  - **Atenção:** "Modernize seu Restaurante: Cardápios QR Code Inteligentes, KDS em Tempo Real e Fim das Filas no Caixa."
  - **Problema & Agitação:** "Pedidos esquecidos, clientes impacientes esperando o garçom e erros manuais que custam caro ao seu negócio."
  - **Solução:** "Uma experiência 100% digital onde o cliente pede pelo celular, a cozinha recebe em segundos no KDS e o caixa fecha contas sem estresse."
  - **Ação:** CTAs destacados ("Começar Agora", "Ver Demonstração", "Falar com Especialista").

## Verification

**Commands:**
- `npm run build` -- expected: Compilação do bundle Vite sem erros de tipagem, JSX ou CSS.

**Manual checks (if no CLI):**
- Acessar `/` no navegador e verificar a renderização de todas as seções (Hero, Recursos, Métricas, Planos, FAQ, CTA).
- Testar a responsividade em telas mobile e desktop.
- Clicar no botão de login da barra superior e verificar que a rota `/login` carrega perfeitamente.
- Testar a interação do FAQ abrindo e fechando itens.
