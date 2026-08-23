---
baseline_commit: 1ad32f69bb59048df79dc8963a61382d7f35b9a1
---

# Story 7.3: Frontend: Wizard de Onboarding & Checkout com Cartão de Crédito (`OnboardingCheckout.jsx`)

Status: done

## Story Description

- **Como** Novo Dono de Restaurante,
- **Quero** passar por um fluxo de cadastro e checkout intuitivo em 3 etapas progressivas (Identificação $\rightarrow$ Restaurante/Endereço $\rightarrow$ Plano/Cartão com Trial de 14 Dias),
- **Para que** eu crie minha conta no SaaS de forma transparente, sabendo exatamente que nada será cobrado hoje (R$ 0,00) e que posso cancelar sem custos a qualquer momento.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Wizard em 3 Etapas com Barra de Progresso Visual
- [x] Rota pública `/onboarding` ou `/checkout` com visual moderno, responsivo e indicador de passos (1: Titular, 2: Restaurante, 3: Plano & Cartão).
- [x] Possibilidade de avançar e retroceder entre etapas preservando os dados já preenchidos.

### AC2: Passo 1 - Dados de Acesso & Identificação do Titular
- [x] Campos:
  - **Nome Completo** (validação: min 3 caracteres)
  - **E-mail de Acesso** (validação de formato)
  - **Senha** (mínimo de 6 caracteres com indicador de força)
  - **WhatsApp / Celular com DDD** (máscara dinâmica `(XX) XXXXX-XXXX`)
  - **Tipo de Documento:** Seleção entre `CPF (Pessoa Física)` e `CNPJ (Pessoa Jurídica)`
  - **Número do Documento:** Máscara dinâmica (`000.000.000-00` ou `00.000.000/0000-00`) com **validação matemática de dígitos verificadores** (impede avanço com documento inválido).

### AC3: Passo 2 - Dados do Restaurante & Endereço de Faturamento
- [x] Campos:
  - **Nome Fantasia do Restaurante** (ex: *"Cantina do Chef"*)
  - **Slug da URL** (auto-gerado a partir do nome, ex: `cantina-do-chef`, editável)
  - **CEP** (máscara `00000-000`): ao digitar os 8 dígitos, busca automaticamente na API **ViaCEP** (`https://viacep.com.br/ws/{cep}/json/`) e preenche Logradouro, Bairro, Cidade e UF.
  - **Número** (obrigatório) e **Complemento** (opcional).

### AC4: Passo 3 - Seleção do Plano & Dados do Cartão de Crédito
- [x] **Seletor de Planos & Ciclo:**
  - Alternador de Ciclo: **Mensal** vs **Anual (20% OFF)**.
  - Cards de Planos:
    - **Starter:** R$ 119/mês (ou R$ 95/mês no anual) - Até 300 pedidos/mês.
    - **Pro (Destaque / Mais Escolhido):** R$ 229/mês (ou R$ 183/mês no anual) - Até 1.200 pedidos/mês.
    - **Scale:** R$ 399/mês (ou R$ 319/mês no anual) - Até 3.500 pedidos/mês.
- [x] **Formulário de Cartão de Crédito:**
  - Número do Cartão (máscara `0000 0000 0000 0000` com detecção visual da bandeira: Visa, Mastercard, Elo, Hipercard, Amex).
  - Nome Impresso no Cartão.
  - Validade (MM/AA) com validação de data futura.
  - Código de Segurança (CVV - 3 ou 4 dígitos).
- [x] **Selo de Transparência & Garantia de 14 Dias:**
  - Card em destaque com ícone de escudo verde:
    > 🛡️ **Garantia de 14 Dias Grátis:**  
    > *"Total cobrado hoje: **R$ 0,00**. A primeira mensalidade de R$ [Valor] ocorrerá apenas em [Data D+14]. Você pode cancelar a qualquer momento no painel antes dessa data com 1 clique e nenhum centavo será cobrado."*

### AC5: Finalização e Redirecionamento
- [x] Botão `[ Iniciar Teste Grátis de 14 Dias ]` com estado de loading animado.
- [x] Envio dos dados para `subscriptionService.createSubscription()`.
- [x] Tratamento de erros amigável (cartão recusado, e-mail já em uso, etc.).
- [x] Em caso de sucesso, efetua login automático da sessão e redireciona para `/admin` com notificação de boas-vindas e status de trial.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Componente e Rota de Onboarding (`src/pages/OnboardingCheckout.jsx`)** (AC: #1, #5)
  - [x] Criar arquivo de página e registrar rota no `App.jsx`.
  - [x] Implementar estado do formulário multi-etapas com stepper visual.

- [x] **Task 2: Implementar Utilitários de Validação e Formatação (`src/utils/validators.js`)** (AC: #2, #3, #4)
  - [x] Funções de validação matemática de CPF e CNPJ.
  - [x] Máscaras de CPF, CNPJ, Telefone, CEP e Cartão de Crédito.
  - [x] Função de detecção de bandeira de cartão por regex de BIN.

- [x] **Task 3: Implementar Busca de CEP via API ViaCEP** (AC: #3)
  - [x] Hook/função assíncrona para consulta de CEP com feedback de carregamento.

- [x] **Task 4: Implementar Visualizador Interativo de Cartão de Crédito e Selo de 14 Dias** (AC: #4)
  - [x] Componente visual de cartão com efeito dinâmico exibindo bandeira, últimos dígitos e nome.
  - [x] Cálculo dinâmico da data `D+14` formatada (ex: *"06 de Setembro de 2026"*).

- [x] **Task 5: Integrar com Serviço de Assinatura e Autenticação** (AC: #5)
  - [x] Conectar submissão ao `subscriptionService.js` e atualizar `AuthContext`.
  - [x] Redirecionar com feedback visual no `AdminDashboard`.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de UX & Compliance
- O valor cobrado hoje deve sempre exibir expressamente **R$ 0,00**.
- A data de término do trial deve ser calculada e exibida com clareza.
- Nenhuma validação deve permitir o avanço sem que o CPF/CNPJ e o Cartão estejam formalmente válidos.

### Arquivos Envolvidos
- `src/pages/OnboardingCheckout.jsx`: Página completa do Wizard.
- `src/utils/validators.js`: Validadores matemáticos e máscaras.
- `src/services/subscriptionService.js`: Integração de criação de conta e assinatura.
- `src/App.jsx`: Registro da nova rota `/onboarding` e `/checkout`.

---

## Dev Agent Record

### Debug Log
- Criada suíte de testes unitários em `test/validators.test.js` e `test/onboarding.test.js`.
- Implementado módulo `src/utils/validators.js` com validação matemática estrita de CPF/CNPJ (dígitos verificadores e rejeição de sequências repetidas).
- Implementadas máscaras para CPF, CNPJ, Telefone celular/fixo com DDD, CEP, Número de Cartão de Crédito e Validade MM/AA.
- Implementada detecção de bandeiras de cartão por BIN regex (Visa, Mastercard, Elo, Hipercard, Amex).
- Implementada busca assíncrona de endereço via API ViaCEP com loading feedback.
- Criado componente `src/pages/OnboardingCheckout.jsx` em 3 passos progressivos com stepper visual e preservação de estado entre avanços e recuos.
- Adicionado visualizador interativo em tempo real do cartão de crédito com chip dourado, bandeira dinâmica, nome e validade.
- Adicionado selo de transparência de 14 dias de teste com D+14 calculado dinamicamente e valor cobrado hoje de R$ 0,00.
- Integrada criação de restaurante em `restaurantService.js`, chamada ao `subscriptionService.createSubscription` e login imediato via `signUpGestor` no `AuthContext`.
- Adicionado banner de boas-vindas com notificação de trial no `AdminDashboard.jsx`.
- Registradas rotas públicas `/onboarding` e `/checkout` no `App.jsx`, atualizados botões na Navbar, Footer, `AdminLogin.jsx` e `LandingPage.jsx`.
- Todos os 144 testes unitários automatizados executados com 100% de aprovação.
- Build de produção via Vite (`npm run build`) validado com sucesso sem erros.

### Completion Notes
- Wizard de Onboarding & Checkout implementado em conformidade total com todos os critérios de aceitação AC1 a AC5.
- Validações matemáticas, UX responsiva e moderna no padrão Tailwind CSS dark mode.
- Integração robusta com fallbacks defensivos e testes abrangentes.

---

## File List
- `src/utils/validators.js` (novo)
- `src/pages/OnboardingCheckout.jsx` (novo)
- `src/services/restaurantService.js` (modificado)
- `src/context/AuthContext.jsx` (modificado)
- `src/pages/AdminDashboard.jsx` (modificado)
- `src/pages/AdminLogin.jsx` (modificado)
- `src/App.jsx` (modificado)
- `src/utils/landingPageData.js` (modificado)
- `test/validators.test.js` (novo)
- `test/onboarding.test.js` (novo)
- `test/restaurantService.test.js` (modificado)

---

## Change Log
- 2026-08-23: Implementação completa do Wizard de Onboarding & Checkout com Cartão de Crédito (Story 7.3), utilitários de validação matemática, integração ViaCEP, visualizador de cartão e testes unitários.
- 2026-08-23: Code Review realizado com aprovação total (Blind Hunter, Edge Case Hunter e Acceptance Auditor aprovados sem pendências).

---

## Senior Developer Review (AI)

- **Review Date:** 2026-08-23
- **Review Outcome:** Approve
- **Review Layers:**
  - Blind Hunter: Pass (Zero vulnerabilidades de segurança; conformidade PCI sem armazenamento de dados sensíveis; validação rigorosa de formulários)
  - Edge Case Hunter: Pass (Tratamento defensivo de API ViaCEP offline/erros; validação matemática de dígitos verificadores CPF/CNPJ; detecção dinâmica de bandeiras de cartão)
  - Acceptance Auditor: Pass (100% de conformidade com os critérios de aceitação AC1, AC2, AC3, AC4 e AC5)
- **Action Items:** 0 remaining
- **Summary:** Código elegante, modular, totalmente testado (144 testes passando) e pronto para produção.

