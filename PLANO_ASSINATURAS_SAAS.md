# 🚀 ESPECIFICAÇÃO COMPLETA: SISTEMA DE ASSINATURA RECORRENTE SAAS (VOLUME DE PEDIDOS)
## 💳 MODELO: TRIAL DE 14 DIAS COM CARTÃO PRÉ-CADASTRADO (CARD-UPFRONT FREE TRIAL)

> **Documento de Contexto e Arquitetura para Planejamento e Implementação por IA / Desenvolvedor**  
> **Projeto:** RestauranteApp SaaS (Multi-Tenant)  
> **Tecnologias Base:** React 19 + Tailwind CSS + Supabase (PostgreSQL + Realtime + Edge Functions) + Gateway Asaas  
> **Data de Atualização:** 2026-08-23  

---

## 📌 1. Visão Geral do Modelo de Negócio & Fluxo de Cobrança

### 1.1 Proposta de Valor e Precificação por Volume de Pedidos
O sistema opera como um **SaaS B2B com Assinatura Recorrente Mensal/Anual**, precificado com base no **Volume Mensal de Pedidos Processados** pelo restaurante.

### 1.2 Regra de Ouro do Trial de 14 Dias (Card-Upfront Free Trial)
1. **Cadastro com Cartão Obrigatório no Início:** No momento da criação da conta, o cliente preenche seus dados cadastrais (CPF/CNPJ e Endereço) e **insere obrigatoriamente os dados do seu cartão de crédito**.
2. **Cobrança R$ 0,00 no Momento do Cadastro:** No ato do registro, o sistema apenas tokeniza e valida o cartão no gateway. **Nenhum valor é cobrado no dia 0**.
3. **14 Dias de Acesso Total e Gratuito:** O restaurante ganha acesso completo a todos os módulos do sistema (Cardápio QR Code, Cozinha KDS, Caixa POS e Painel Gestor) durante 14 dias corridos.
4. **Cancelamento Livre e Sem Custos (R$ 0,00):** Se o cliente clicar em *"Cancelar Assinatura"* no painel a qualquer momento durante os 14 dias de teste, a assinatura é cancelada imediatamente no Asaas e **absolutamente nenhum valor é debitado do cartão**.
5. **Cobrança Automática no 14º Dia (D+14):** Caso o cliente **não cancele** a assinatura até o término dos 14 dias, o gateway processa automaticamente a primeira mensalidade no cartão salvo no 14º dia (`nextDueDate = D+14`).
6. **Recorrência Pura SEM Ocupar o Limite Total do Cartão:** A cobrança é lançada mês a mês (ex: R$ 119,00 ou R$ 229,00). O cliente **não** sofre parcelamento de 12x que trava R$ 1.500+ do limite dele — consome apenas a parcela do mês vigente.

---

## 🏆 2. Escolha da Ferramenta de Pagamento (Análise de Mercado)

### 🥇 Ferramenta Escolhida: **ASAAS (asaas.com)**
Para o mercado brasileiro de SaaS e food service, o **Asaas** é a ferramenta ideal e mais simples de implementar:

1. **Tokenização Segura de Cartão:** Permite salvar e tokenizar o cartão do cliente sem tocar em dados sensíveis de PCI no Supabase (`creditCardToken`).
2. **Assinatura com Primeiro Vencimento Futuro (`nextDueDate`):** Suporta nativamente criar a assinatura informando a data da primeira cobrança para 14 dias no futuro (`D+14`), sem cobrar nada no ato.
3. **Cancelamento Instantâneo via API:** Endpoint simples (`DELETE /v3/subscriptions/{id}`) que invalida a cobrança agendada caso o cliente cancele durante o trial.
4. **Ambiente Sandbox Imediato:** Conta de testes pronta em 2 minutos em `sandbox.asaas.com` sem exigência prévia de documentos.
5. **Suporte a CPF (Autônomo/Iniciante) e CNPJ (Empresa Estabelecida).**
6. **Automação Financeira Gratuita:** Avisos de fatura e recibos enviados por E-mail e WhatsApp.

---

## 📈 3. Estrutura dos Planos por Volume de Pedidos (Benchmark de Mercado)

| Plano | Faixa de Pedidos / Mês | Valor Mensal (após 14 dias) | Valor Anual (-20%) | Recursos Incluídos |
|---|---|---|---|---|
| **Starter (Iniciante)** | Até **300 pedidos/mês** (~10 pedidos/dia) | **R$ 119,00/mês** | **R$ 95,00/mês** | Cardápio QR Code, 1 Tela KDS, 1 Caixa POS, Suporte WhatsApp |
| **Pro (Mais Escolhido)** | Até **1.200 pedidos/mês** (~40 pedidos/dia) | **R$ 229,00/mês** | **R$ 183,00/mês** | Mesas ilimitadas, KDS ilimitado com Alerta Sonoro, Múltiplos operadores RBAC, Gestão de Equipe, Impressão em lote |
| **Scale (Alto Volume)** | Até **3.500 pedidos/mês** (~115 pedidos/dia) | **R$ 399,00/mês** | **R$ 319,00/mês** | Tudo do Pro + Suporte Prioritário 24/7 + Alerta de limite + Relatórios Avançados |
| **Enterprise / Redes** | **Acima de 3.500 pedidos** ou Ilimitado | **Sob Consulta** | Customizado | Multi-unidades centralizadas, Onboarding VIP, SLA dedicado |

### 3.1 Gestão do Limite Mensal de Pedidos (Fair Use Policy)
- **Atingiu 80% do limite:** O painel exibe aviso educativo: *"Você consumiu 80% do volume de pedidos do mês. Faça o upgrade com 1 clique para continuar vendendo sem travas."*
- **Atingiu 100% do limite:** O sistema nunca interrompe pedidos em andamento na cozinha ou salão, mas solicita a confirmação de upgrade para o próximo nível.

---

## 📝 4. Dados Coletados no Fluxo de Onboarding / Checkout

O fluxo de cadastro do cliente é dividido em **3 etapas progressivas** com design moderno e feedback de validação em tempo real:

### 🔹 Etapa 1: Dados de Acesso & Identificação do Titular
- **Nome Completo**
- **E-mail de Acesso** (usado no login e envio de comprovantes)
- **Senha** (mínimo de 6 caracteres, armazenada via Supabase Auth)
- **Celular / WhatsApp com DDD**
- **Tipo de Documento:** Seleção entre `Pessoa Física (CPF)` ou `Pessoa Jurídica (CNPJ)`
- **Número do Documento** (com máscara dinâmica e validação matemática de dígitos verificadores de CPF/CNPJ)

### 🔹 Etapa 2: Dados do Restaurante & Endereço de Faturamento
- **Nome Fantasia do Restaurante** (ex: *"Cantina do Chef"*)
- **Slug / Identificador da URL** (ex: `cantina-do-chef` -> gera os links das comandas)
- **CEP** (com preenchimento automático de Rua, Bairro, Cidade e Estado via API ViaCEP)
- **Logradouro (Rua / Avenida)**
- **Número**
- **Complemento** (Opcional)
- **Bairro, Cidade e UF**

### 🔹 Etapa 3: Seleção do Plano & Dados do Cartão de Crédito (Trial Ativo)
- **Seleção do Plano Desejado:** Starter (R$ 119/mês), Pro (R$ 229/mês) ou Scale (R$ 399/mês) e ciclo (Mensal ou Anual com 20% OFF).
- **Número do Cartão de Crédito** (com detecção visual automática da bandeira: Visa, Mastercard, Elo, Hipercard, Amex).
- **Nome do Titular Impresso no Cartão**
- **Data de Validade (MM/AA)**
- **Código de Segurança (CVV)**
- **Aviso de Transparência em Destaque:**
  > 🛡️ **Garantia de 14 Dias Grátis:**  
  > *"Seu cartão **não será cobrado hoje** (Total: **R$ 0,00**). A primeira cobrança de R$ [Valor] ocorrerá apenas em [Data D+14]. Você pode cancelar a qualquer momento no painel antes dessa data com 1 clique e nenhum centavo será cobrado."*

---

## 🔑 5. Guia para o Administrador do SaaS: Configuração da Conta Asaas

Siga este passo a passo para gerar as credenciais de desenvolvimento e produção:

### Passo 1: Criar Conta de Testes (Sandbox)
1. Acesse: **[https://sandbox.asaas.com](https://sandbox.asaas.com)**
2. Crie uma conta gratuita com seu e-mail. No sandbox, você não precisa enviar documentos reais.

### Passo 2: Gerar a Chave de API (API Key)
1. No painel do Asaas Sandbox, vá em **Configurações da Conta (Engrenagem no canto superior)** > **Integrações**.
2. Clique na aba **Chaves de API** > **Gerar nova chave de API**.
3. Copie o token gerado (`$aact_YTU5Y...`) e adicione à variável `ASAAS_API_KEY`.

### Passo 3: Configurar o Webhook de Retorno
1. Na mesma tela de **Integrações**, clique na aba **Webhooks**.
2. Ative **Webhook para Cobranças**.
3. Insira a URL da Edge Function do Supabase:
   `https://<SEU-PROJETO-SUPABASE>.supabase.co/functions/v1/asaas-webhook`
4. Crie uma senha no campo **Token de Autenticação** (ex: `whsec_restaurante_secret_2026`) e guarde para o `.env`.
5. Selecione os eventos a monitorar:
   - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` (Primeira cobrança aprovada no D+14 e renovações mensais)
   - `PAYMENT_OVERDUE` (Tentativa de cobrança recusada no D+14 por falta de limite/cartão bloqueado)
   - `SUBSCRIPTION_DELETED` (Assinatura cancelada)

---

## 🛠️ 6. Arquitetura Técnica e Passo a Passo de Implementação para a IA

```
┌────────────────────────────────────────────────────────────────────────┐
│               FLUXO ARQUITETURAL: TRIAL COM CARTÃO SALVO               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [1. Frontend: OnboardingCheckout.jsx]                                 │
│         │                                                              │
│         ├─► Valida CPF/CNPJ + Endereço via CEP                         │
│         ├─► Coleta dados do Cartão de Crédito                          │
│         ▼                                                              │
│  [2. Supabase Edge Function: create-subscription]                      │
│         │                                                              │
│         ├─► A) Cria usuário no Supabase Auth + Restaurante             │
│         ├─► B) POST /v3/customers (Cadastra cliente no Asaas)          │
│         ├─► C) POST /v3/subscriptions:                                 │
│         │       - billingType: 'CREDIT_CARD'                           │
│         │       - value: 119.00                                        │
│         │       - nextDueDate: Data em D+14 (HOJE + 14 DIAS)           │
│         │       - creditCard: { holderName, number, expiry, ccv }      │
│         │       - creditCardHolderInfo: { name, email, cpfCnpj, ... }  │
│         │                                                              │
│         └─► D) Salva no Supabase: status_assinatura = 'trialing'       │
│                data_fim_trial = D+14, asaas_subscription_id = sub_xxx  │
│                                                                        │
│  [3. Cenário A: Cliente Cancela Durante os 14 Dias]                    │
│         │                                                              │
│         ├─► Painel Gestor -> Botão "Cancelar Assinatura"               │
│         ├─► Chama Edge Function cancel-subscription                    │
│         ├─► DELETE /v3/subscriptions/{id} no Asaas                     │
│         └─► RESULTADO: Cobrança cancelada, R$ 0,00 cobrado.            │
│                                                                        │
│  [4. Cenário B: Cliente Não Cancela e Chega no 14º Dia]                │
│         │                                                              │
│         ├─► Asaas debita automaticamente a primeira mensalidade        │
│         ├─► Webhook PAYMENT_CONFIRMED é disparado para o Supabase      │
│         └─► Atualiza status_assinatura = 'active' e libera novo ciclo. │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Passo 1: Migrations SQL no Supabase

```sql
-- 1. Campos de controle de assinatura, trial e limites no restaurante
ALTER TABLE restaurantes 
ADD COLUMN IF NOT EXISTS plano VARCHAR(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS status_assinatura VARCHAR(30) DEFAULT 'trialing', -- trialing, active, past_due, canceled
ADD COLUMN IF NOT EXISTS limite_pedidos_mes INT DEFAULT 300,
ADD COLUMN IF NOT EXISTS pedidos_consumidos_mes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_inicio_ciclo TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS data_fim_trial TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS cartao_ultimos_digitos VARCHAR(4),
ADD COLUMN IF NOT EXISTS cartao_bandeira VARCHAR(30),
ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20),
ADD COLUMN IF NOT EXISTS endereco_completo JSONB;

-- 2. Tabela de histórico de faturas
CREATE TABLE IF NOT EXISTS faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  asaas_payment_id VARCHAR(100) UNIQUE,
  valor NUMERIC(10,2) NOT NULL,
  forma_pagamento VARCHAR(50) DEFAULT 'CREDIT_CARD',
  status VARCHAR(30) NOT NULL, -- PENDING, RECEIVED, CONFIRMED, OVERDUE
  url_fatura TEXT,
  url_comprovante TEXT,
  data_vencimento DATE,
  data_pagamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trigger automático para contar volume de pedidos do restaurante
CREATE OR REPLACE FUNCTION incrementar_pedidos_restaurante()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE restaurantes
  SET pedidos_consumidos_mes = pedidos_consumidos_mes + 1
  WHERE id = NEW.restaurante_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_incrementa_pedido ON pedidos;
CREATE TRIGGER trigger_incrementa_pedido
AFTER INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION incrementar_pedidos_restaurante();
```

---

### Passo 2: Edge Function `create-subscription` (com Trial de 14 Dias)

Arquivo: `supabase/functions/create-subscription/index.ts`

```typescript
// Lógica essencial para agendar a primeira cobrança para D+14 com cartão salvo
const hoje = new Date();
const dataPrimeiraCobranca = new Date(hoje.getTime() + 14 * 24 * 60 * 60 * 1000);
const nextDueDate = dataPrimeiraCobranca.toISOString().split('T')[0]; // Formato YYYY-MM-DD

// Payload enviado para a API do Asaas:
const subscriptionPayload = {
  customer: asaasCustomerId,
  billingType: 'CREDIT_CARD',
  value: valorPlano, // ex: 119.00
  nextDueDate: nextDueDate, // 14 DIAS NO FUTURO
  cycle: ciclo === 'ANUAL' ? 'YEARLY' : 'MONTHLY',
  description: `Assinatura RestauranteApp - Plano ${planoNome} (Trial 14 Dias)`,
  creditCard: {
    holderName: cartao.nomeTitular,
    number: cartao.numero.replace(/\s/g, ''),
    expiryMonth: cartao.mesValidade,
    expiryYear: cartao.anoValidade,
    ccv: cartao.cvv
  },
  creditCardHolderInfo: {
    name: cliente.nome,
    email: cliente.email,
    cpfCnpj: cliente.cpfCnpj.replace(/\D/g, ''),
    postalCode: endereco.cep.replace(/\D/g, ''),
    addressNumber: endereco.numero,
    addressComplement: endereco.complemento || '',
    phone: cliente.telefone.replace(/\D/g, ''),
    mobilePhone: cliente.telefone.replace(/\D/g, '')
  }
};
```

---

### Passo 3: Edge Function `cancel-subscription` (Cancelamento sem Cobrança)

Arquivo: `supabase/functions/cancel-subscription/index.ts`

1. Autentica o usuário solicitante via JWT do Supabase (apenas `GESTOR` pode cancelar).
2. Recupera o `asaas_subscription_id` do restaurante.
3. Executa `DELETE https://sandbox.asaas.com/api/v3/subscriptions/{asaas_subscription_id}`.
4. O Asaas remove a assinatura e cancela a fatura agendada para o dia 14.
5. Atualiza o banco Supabase: `status_assinatura = 'canceled'`.
6. Retorna confirmação de sucesso com garantia de R$ 0,00 cobrado.

---

### Passo 4: Edge Function `asaas-webhook` (Processador de Pagamento)

Arquivo: `supabase/functions/asaas-webhook/index.ts`

- Ao receber `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` (disparado quando o 14º dia chega ou nas renovações mensais):
  - Atualiza `status_assinatura = 'active'`.
  - Atualiza `data_inicio_ciclo = NOW()`.
  - Reseta `pedidos_consumidos_mes = 0`.
  - Registra a fatura paga na tabela `faturas`.
- Ao receber `PAYMENT_OVERDUE` (falha na cobrança do 14º dia):
  - Atualiza `status_assinatura = 'past_due'`.
  - Notifica o gestor no painel para atualizar o cartão de crédito.

---

### Passo 5: Telas no Frontend (React 19)

1. **`src/pages/OnboardingCheckout.jsx`:**
   - Wizard intuitivo em 3 passos com indicador de progresso:
     - **Passo 1:** Dados do Titular (Nome, E-mail, Senha, WhatsApp, CPF/CNPJ).
     - **Passo 2:** Dados do Restaurante e Endereço com busca automática de CEP.
     - **Passo 3:** Dados do Cartão com visualização interativa do cartão e selo de segurança *"Trial de 14 Dias - R$ 0,00 Cobrado Hoje"*.
2. **`src/pages/AdminAssinatura.jsx` (Gestão de Assinatura no Painel do Gestor):**
   - Card de Status: *"Você está no 4º dia do período de testes gratuito (restam 10 dias)"*.
   - Botão em destaque: **"Cancelar Assinatura a Qualquer Momento"** com modal de confirmação claro.
   - Detalhes do cartão cadastrado (ex: `Mastercard final 4829`) com opção de alterar cartão.
   - Gráfico de consumo de pedidos do mês vs limite do plano.
   - Histórico de faturas com download de recibos.

---

## 🔒 7. Variáveis de Ambiente Necessárias (.env)

```env
# Gateway de Pagamentos Asaas
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=$aact_sua_chave_de_api_sandbox...
ASAAS_WEBHOOK_SECRET=whsec_restaurante_secret_2026

# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

---

## 📋 8. Checklist de Validação Final para a IA

- [ ] Validado que no momento do cadastro o cartão é validado e **R$ 0,00** é debitado imediatamente.
- [ ] Validado que a assinatura no Asaas é criada com `nextDueDate` exatamente 14 dias após o cadastro.
- [ ] Validado que se o cliente clicar em "Cancelar Assinatura" durante o trial, a assinatura é deletada no Asaas e **nenhuma cobrança futura é realizada**.
- [ ] Validado que caso o cliente não cancele, a cobrança do 1º mês é processada automaticamente no 14º dia.
- [ ] Validado que o débito mensal **não consome o limite anual** do cartão do cliente.
- [ ] Validado formulário com máscara de CPF/CNPJ, validação de dígitos e busca de endereço por CEP.
- [ ] Validado que o contador de pedidos do mês é monitorado em tempo real contra o limite do plano.
