# 🚀 Orientações para Deploy em Produção

Este documento contém o passo a passo completo para realizar o deploy em produção da aplicação **Restaurante App - Cardápio Digital & KDS** na plataforma **Vercel** (ou **Netlify**).

---

## 📌 Pré-requisitos
- Repositório Git sincronizado na nuvem (GitHub, GitLab ou Bitbucket).
- Conta cadastrada na [Vercel](https://vercel.com) ou [Netlify](https://netlify.com).
- Credenciais e URL do projeto no **Supabase**.

---

## 🟢 Opção 1: Deploy na Vercel (Recomendado)

### 1️⃣ Enviar alterações para o GitHub
Certifique-se de que todas as alterações foram salvas e enviadas para o seu repositório remoto:
```bash
git push origin master
```

### 2️⃣ Importar Projeto na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique no botão **`[ Add New ]` $\rightarrow$ `Project`**.
3. Selecione o repositório do projeto (`restaurante`).

### 3️⃣ Configurações de Build
A Vercel detectará automaticamente as configurações do Vite:
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 4️⃣ Variáveis de Ambiente (Environment Variables)
No painel de configuração da Vercel, expanda a seção **Environment Variables** e adicione as seguintes chaves do seu arquivo `.env`:

| Nome da Variável | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | URL do seu projeto no Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Chave pública anônima do Supabase |

### 5️⃣ Suporte a Rotas SPA (`vercel.json`)
O arquivo [`vercel.json`](file:///C:/Users/Paty/Desktop/restaurante/vercel.json) já foi criado e configurado na raiz do projeto com o rewrite para `index.html`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 6️⃣ Concluir Deploy
Clique em **`[ Deploy ]`**. Em menos de 1 minuto a aplicação estará publicada com URL pública e HTTPS gratuito (ex: `https://seu-restaurante.vercel.app`).

---

## 🟠 Opção 2: Deploy no Netlify (Alternativa)

O projeto também já possui os arquivos [`netlify.toml`](file:///C:/Users/Paty/Desktop/restaurante/netlify.toml) e [`public/_redirects`](file:///C:/Users/Paty/Desktop/restaurante/public/_redirects) configurados.

1. Acesse [netlify.com](https://netlify.com) e clique em **`Add new site` $\rightarrow$ `Import an existing project`**.
2. Conecte ao GitHub e selecione o repositório.
3. Insira as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) em **Site configuration $\rightarrow$ Environment variables**.
4. Clique em **`Deploy site`**.

---

## 🔐 Configurações Adicionais no Supabase (Após o Deploy)

Após obter a URL pública da Vercel/Netlify (ex: `https://seu-app.vercel.app`):

1. Acesse o painel do [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá em **Authentication $\rightarrow$ URL Configuration**.
3. Adicione a sua URL pública em **Site URL** e em **Redirect URLs**.
4. Vá em **API Settings** e garanta que o seu domínio público está autorizado no CORS se necessário.

---

## 🛠️ Comandos Úteis no Ambiente Local

```bash
# Testar compilação de produção localmente
npm run build

# Pré-visualizar o build de produção localmente
npm run preview
```
