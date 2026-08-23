# Story 7.3: Frontend: Wizard de Onboarding & Checkout com Cartão de Crédito (`OnboardingCheckout.jsx`)

Status: ready-for-dev

## Story Description

- **Como** Novo Dono de Restaurante,
- **Quero** passar por um fluxo de cadastro e checkout intuitivo em 3 etapas progressivas (Identificação $\rightarrow$ Restaurante/Endereço $\rightarrow$ Plano/Cartão com Trial de 14 Dias),
- **Para que** eu crie minha conta no SaaS de forma transparente, sabendo exatamente que nada será cobrado hoje (R$ 0,00) e que posso cancelar sem custos a qualquer momento.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Wizard em 3 Etapas com Barra de Progresso Visual
- [ ] Rota pública `/onboarding` ou `/checkout` com visual moderno, responsivo e indicador de passos (1: Titular, 2: Restaurante, 3: Plano & Cartão).
- [ ] Possibilidade de avançar e retroceder entre etapas preservando os dados já preenchidos.

### AC2: Passo 1 - Dados de Acesso & Identificação do Titular
- [ ] Campos:
  - **Nome Completo** (validação: min 3 caracteres)
  - **E-mail de Acesso** (validação de formato)
  - **Senha** (mínimo de 6 caracteres com indicador de força)
  - **WhatsApp / Celular com DDD** (máscara dinâmica `(XX) XXXXX-XXXX`)
  - **Tipo de Documento:** Seleção entre `CPF (Pessoa Física)` e `CNPJ (Pessoa Jurídica)`
  - **Número do Documento:** Máscara dinâmica (`000.000.000-00` ou `00.000.000/0000-00`) com **validação matemática de dígitos verificadores** (impede avanço com documento inválido).

### AC3: Passo 2 - Dados do Restaurante & Endereço de Faturamento
- [ ] Campos:
  - **Nome Fantasia do Restaurante** (ex: *"Cantina do Chef"*)
  - **Slug da URL** (auto-gerado a partir do nome, ex: `cantina-do-chef`, editável)
  - **CEP** (máscara `00000-000`): ao digitar os 8 dígitos, busca automaticamente na API **ViaCEP** (`https://viacep.com.br/ws/{cep}/json/`) e preenche Logradouro, Bairro, Cidade e UF.
  - **Número** (obrigatório) e **Complemento** (opcional).

### AC4: Passo 3 - Seleção do Plano & Dados do Cartão de Crédito
- [ ] **Seletor de Planos & Ciclo:**
  - Alternador de Ciclo: **Mensal** vs **Anual (20% OFF)**.
  - Cards de Planos:
    - **Starter:** R$ 119/mês (ou R$ 95/mês no anual) - Até 300 pedidos/mês.
    - **Pro (Destaque / Mais Escolhido):** R$ 229/mês (ou R$ 183/mês no anual) - Até 1.200 pedidos/mês.
    - **Scale:** R$ 399/mês (ou R$ 319/mês no anual) - Até 3.500 pedidos/mês.
- [ ] **Formulário de Cartão de Crédito:**
  - Número do Cartão (máscara `0000 0000 0000 0000` com detecção visual da bandeira: Visa, Mastercard, Elo, Hipercard, Amex).
  - Nome Impresso no Cartão.
  - Validade (MM/AA) com validação de data futura.
  - Código de Segurança (CVV - 3 ou 4 dígitos).
- [ ] **Selo de Transparência & Garantia de 14 Dias:**
  - Card em destaque com ícone de escudo verde:
    > 🛡️ **Garantia de 14 Dias Grátis:**  
    > *"Total cobrado hoje: **R$ 0,00**. A primeira mensalidade de R$ [Valor] ocorrerá apenas em [Data D+14]. Você pode cancelar a qualquer momento no painel antes dessa data com 1 clique e nenhum centavo será cobrado."*

### AC5: Finalização e Redirecionamento
- [ ] Botão `[ Iniciar Teste Grátis de 14 Dias ]` com estado de loading animado.
- [ ] Envio dos dados para `subscriptionService.createSubscription()`.
- [ ] Tratamento de erros amigável (cartão recusado, e-mail já em uso, etc.).
- [ ] Em caso de sucesso, efetua login automático da sessão e redireciona para `/admin` com notificação de boas-vindas e status de trial.

---

## Tasks / Subtasks de Implementação

- [ ] **Task 1: Criar Componente e Rota de Onboarding (`src/pages/OnboardingCheckout.jsx`)** (AC: #1, #5)
  - [ ] Criar arquivo de página e registrar rota no `App.jsx`.
  - [ ] Implementar estado do formulário multi-etapas com stepper visual.

- [ ] **Task 2: Implementar Utilitários de Validação e Formatação (`src/utils/validators.js`)** (AC: #2, #3, #4)
  - [ ] Funções de validação matemática de CPF e CNPJ.
  - [ ] Máscaras de CPF, CNPJ, Telefone, CEP e Cartão de Crédito.
  - [ ] Função de detecção de bandeira de cartão por regex de BIN.

- [ ] **Task 3: Implementar Busca de CEP via API ViaCEP** (AC: #3)
  - [ ] Hook/função assíncrona para consulta de CEP com feedback de carregamento.

- [ ] **Task 4: Implementar Visualizador Interativo de Cartão de Crédito e Selo de 14 Dias** (AC: #4)
  - [ ] Componente visual de cartão com efeito dinâmico exibindo bandeira, últimos dígitos e nome.
  - [ ] Cálculo dinâmico da data `D+14` formatada (ex: *"06 de Setembro de 2026"*).

- [ ] **Task 5: Integrar com Serviço de Assinatura e Autenticação** (AC: #5)
  - [ ] Conectar submissão ao `subscriptionService.js` e atualizar `AuthContext`.
  - [ ] Redirecionar com feedback visual no `AdminDashboard`.

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
