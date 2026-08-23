# 📋 Configurações Pendentes Pós-Deploy (Supabase)

> **Status:** Deploy na Vercel concluído com sucesso! 🎉  
> Siga o checklist abaixo para finalizar a integração completa com o Supabase em produção.

---

## 📌 Checklist de Pendências

### 1. ⚙️ Atualizar URLs no Painel do Supabase
- [ ] Acessar o [Supabase Dashboard](https://supabase.com/dashboard).
- [ ] Selecionar o projeto correspondente.
- [ ] Ir em **Authentication** ➔ **URL Configuration**.
- [ ] Configurar os campos com a URL da sua aplicação na Vercel (ex: `https://seu-projeto.vercel.app`):
  - **Site URL:** `https://seu-projeto.vercel.app`
  - **Redirect URLs:** 
    - `https://seu-projeto.vercel.app`
    - `https://seu-projeto.vercel.app/**`
    - `http://localhost:5173/**` *(para manter o desenvolvimento local funcionando)*

---

### 2. 🔑 Variáveis de Ambiente na Vercel
- [ ] Acessar o painel do seu projeto na [Vercel](https://vercel.com).
- [ ] Ir em **Settings** ➔ **Environment Variables**.
- [ ] Confirmar se as duas variáveis de produção estão cadastradas e marcadas para os ambientes (*Production, Preview, Development*):
  - `VITE_SUPABASE_URL` = `https://<seu-id-supabase>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOi...` *(chave pública anon)*
- [ ] *(Opcional)* Se adicionou ou alterou variáveis após o deploy, faça um **Redeploy** na Vercel para que as novas variáveis tenham efeito na compilação.

---

### 3. 🗄️ Banco de Dados & Schema Inicial
- [ ] Se estiver iniciando um banco Supabase do zero:
  - Ir em **SQL Editor** no painel do Supabase.
  - Copiar e executar o conteúdo do arquivo [`supabase/schema.sql`](file:///supabase/schema.sql).
  - *(Opcional)* Executar o seed de demonstração com [`supabase/seed.sql`](file:///supabase/seed.sql).

---

### 4. ⚡ Habilitar Realtime nas Tabelas
- [ ] No painel do Supabase, ir em **Database** ➔ **Replication** (ou **Publications**).
- [ ] Garantir que o realtime esteja ativado para as tabelas que alimentam o KDS e a Cozinha:
  - `pedidos`
  - `itens_pedido`
  - `comandas`
  - `faturas`

---

### 5. 💳 Edge Functions & Secrets do Asaas (Gestão de Assinaturas)
- [ ] Configurar os Secrets das Edge Functions no Supabase CLI ou Dashboard (**Settings** ➔ **Edge Functions** / Secrets):
  - `ASAAS_API_URL` = `https://sandbox.asaas.com/api/v3` *(ou `https://api.asaas.com/v3` em produção)*
  - `ASAAS_API_KEY` = `$`*(sua chave de API do Asaas)*
  - `ASAAS_WEBHOOK_SECRET` = `$`*(token de autenticação configurado no webhook do Asaas)*
  - `SUPABASE_SERVICE_ROLE_KEY` = `$`*(chave service_role do Supabase)*
- [ ] Fazer o deploy das Edge Functions via Supabase CLI:
  ```bash
  supabase functions deploy create-subscription
  supabase functions deploy cancel-subscription
  supabase functions deploy asaas-webhook
  ```
- [ ] Cadastrar a URL do Webhook no painel do Asaas:
  - **URL:** `https://<seu-id-supabase>.supabase.co/functions/v1/asaas-webhook`
  - **Eventos:** `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_DELETED`
  - **Token de Autenticação:** mesmo valor definido em `ASAAS_WEBHOOK_SECRET`

---

> [!TIP]
> Caso alguma variável ou configuração esteja pendente, o aplicativo continuará funcional no modo de demonstração local (*LocalStorage* / Mocks). Assim que o Supabase estiver 100% configurado, a persistência na nuvem e as Edge Functions passam a operar automaticamente.
