---
title: 'Landing Page de Vendas de Alta Conversão (Single Page SaaS)'
type: 'feature'
created: '2026-08-22T21:58:00-03:00'
status: 'done'
baseline_commit: 'a7409b82091349fa501aaf9801e5615c9df05ba5'
review_loop_iteration: 1
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
- `src/utils/landingPageData.js` -- Configurações, estrutura de dados dos planos/FAQ/módulos e função de cálculo de ROI.
- `src/App.jsx` -- Atualização do roteamento da raiz `/` para utilizar o novo componente `LandingPage` e refinamento do Navbar para harmonizar com a Landing Page e os estados de autenticação.
- `src/index.css` -- Habilitação de `scroll-behavior: smooth` para suporte nativo a rolagem suave das âncoras.
- `test/landingPage.test.js` -- Testes unitários para cálculos de ROI, estruturas de planos, módulos e FAQs.

## Tasks & Acceptance

**Execution:**
- [x] `src/pages/LandingPage.jsx` -- Criar componente de Landing Page de Vendas completa -- Implementa layout moderno com copywriting persuasivo (Hero com chamada de impacto e mockups visuais, seção "O Caos vs A Solução", vitrine dos 4 módulos com ícones e badges, calculadora/métricas de impacto financeiro [+35% ticket médio, -70% tempo de espera], seção passo a passo "Como Funciona", tabela comparativa de planos de assinatura com CTA para contato/teste, depoimentos e FAQ interativo com accordion).
- [x] `src/App.jsx` -- Integrar `LandingPage` na rota `/` e ajustar Navbar -- Substitui o componente inline `Home` pelo novo `LandingPage`, mantendo a barra de navegação com logotipo, links de âncoras para seções da página, botão de login/acesso e tratamento dinâmico de usuário logado (gestor, cozinha, caixa).

### Review Findings
- [x] [Review][Patch] Remover imports não utilizados (`Sparkles`, `ArrowRight`) em `src/App.jsx:12`
- [x] [Review][Patch] Sanitizar entradas negativas em `calculateRoiMetrics` em `src/utils/landingPageData.js:4`

**Acceptance Criteria:**
- Given que um usuário não autenticado acessa a URL raiz `/`, when a página carrega, then uma Landing Page de vendas visualmente rica, moderna e profissional é exibida com todas as seções comerciais e gatilhos de conversão.
- Given que o usuário está na Landing Page, when clica no botão "Entrar no Sistema" no topo da página, then é redirecionado imediatamente para a página de login funcional `/login` sem erros.
- Given que um usuário autenticado (Gestor, Cozinha ou Caixa) acessa `/`, when visualiza o topo da página, then a barra de navegação exibe os botões de acesso rápido ao seu módulo e opção de logout.
- Given que um visitante clica em qualquer item de menu (#recursos, #como-funciona, #planos, #faq), when o clique ocorre, then a página faz a rolagem suave até a seção correspondente.

## Design Notes

- **Design System & Paleta:** Fundo escuro premium (`bg-slate-950`), gradientes sutis em laranja/âmbar (`from-orange-500 to-amber-500`), bordas elegantes com brilho suave (`border-slate-800`, `shadow-orange-500/10`), tipografia nítida e contrastante.
- **Copywriting Framework (PAS + AIDA):**
  - **Atenção:** "Transforme suas mesas em máquinas de vendas automáticas."
  - **Problema & Agitação:** "Pedidos esquecidos, clientes impacientes esperando o garçom e erros manuais que custam caro ao seu negócio."
  - **Solução:** "Uma experiência 100% digital onde o cliente pede pelo celular, a cozinha recebe em segundos no KDS com alerta sonoro e o caixa fecha contas sem estresse."
  - **Ação:** CTAs destacados ("Iniciar Teste Grátis de 14 Dias", "Conhecer os 4 Módulos", "Entrar no Sistema").

## Verification

**Commands:**
- `npm run build` -- expected: Compilação do bundle Vite sem erros de tipagem, JSX ou CSS.
- `npm test` -- expected: Suíte completa de testes passando 100%.

**Manual checks:**
- Acessar `/` no navegador e verificar a renderização de todas as seções (Hero, Recursos, Métricas, Simulador ROI, Como Funciona, Planos, Depoimentos, FAQ, CTA).
- Testar a responsividade em telas mobile e desktop.
- Clicar no botão de login da barra superior e verificar que a rota `/login` carrega perfeitamente.
- Testar a interação do FAQ abrindo e fechando itens.
- Testar os controles interativos da calculadora de ROI e switcher de planos mensal/anual.

---

## Dev Agent Record

### Implementation Plan
1. Criado módulo de dados e lógica `src/utils/landingPageData.js` contendo calculadora de ROI, catálogo dos 4 módulos, planos de assinatura com alternância mensal/anual, FAQs estruturados e depoimentos.
2. Criada suíte de testes unitários automatizados em `test/landingPage.test.js` cobrindo o motor de cálculo de ROI, estruturas de planos e integridade das seções comerciais.
3. Desenvolvido o componente completo `src/pages/LandingPage.jsx` com Hero interativo, vitrine de abas ao vivo dos módulos, simulador financeiro de ROI dinâmico, comparador de dor vs solução (PAS), tabela de preços transparente e sanfona de FAQs (Accordion).
4. Atualizado `src/App.jsx` para integrar `LandingPage` na rota raiz `/` e fallback `*`, removendo o componente preliminar `Home` e configurando a `Navbar` para exibir links de âncoras para visitantes anônimos enquanto preserva integralmente os atalhos e badges RBAC para usuários autenticados.
5. Adicionada regra `html { scroll-behavior: smooth; }` em `src/index.css` para garantir transição suave ao navegar pelas âncoras da página.
6. Validados testes automatizados (71 testes passando, 0 falhas) e compilação do bundle de produção com Vite (`vite build`).

### Completion Notes
- ✅ **AC1:** Ao acessar a raiz `/` como visitante, a Landing Page de vendas completa é renderizada com todas as seções persuasivas (Hero, Stats, Caos vs Solução, Vitrine dos 4 Módulos, Simulador de ROI, Como Funciona, Planos, Depoimentos, FAQ e CTA).
- ✅ **AC2:** O botão "Entrar no Sistema" e links de login no topo redirecionam para a rota `/login` (ou `/admin` se já autenticado) sem qualquer erro.
- ✅ **AC3:** Usuários autenticados (Gestor, Cozinha ou Caixa) que acessam a home continuam visualizando a Navbar operacional correspondente ao seu papel com badges, links para seus módulos (`/cozinha`, `/caixa`, `/admin`) e botão de logout.
- ✅ **AC4:** Links de âncora (`#recursos`, `#problema`, `#calculadora`, `#como-funciona`, `#planos`, `#faq`) funcionam com rolagem suave (`scroll-behavior: smooth`).
- ✅ **Testes e Build:** 71/71 testes aprovados no Node test runner; bundle Vite compilado com sucesso em 4.5s.

### Debug Log
- Isolada a lógica de cálculo de ROI e estrutura de dados em `src/utils/landingPageData.js` para garantir 100% de compatibilidade tanto com o runtime de testes ES module (`node --test`) quanto com o bundle de componentes React do Vite.

---

## File List

- `src/pages/LandingPage.jsx` (Novo)
- `src/utils/landingPageData.js` (Novo)
- `test/landingPage.test.js` (Novo)
- `src/App.jsx` (Modificado)
- `src/index.css` (Modificado)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Modificado)
- `_bmad-output/implementation-artifacts/spec-landing-page-vendas.md` (Modificado)

---

## Change Log

- **2026-08-23**: Implementação completa da Landing Page de Vendas de Alta Conversão (`spec-landing-page-vendas`). Criado layout single-page moderno com copywriting AIDA/PAS, vitrine dinâmica dos 4 módulos, calculadora interativa de ROI, planos de assinatura com desconto anual, FAQ com accordion sanfona, integração da rota raiz no `App.jsx`, links de navegação na Navbar e suíte de testes unitários.
- **2026-08-23**: Code review adversarial executado (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Aplicados os 2 patches de limpeza de imports e sanitização de inputs no cálculo de ROI. Status final atualizado para `done`.

