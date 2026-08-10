# Story 1.2: Autenticação de Gestores & Multi-Tenant

Status: review

## Story Description

- **Como** Dono do Restaurante (Gestor),
- **Quero** fazer login com e-mail e senha no painel administrativo (`/admin`),
- **Para que** eu possa acessar e gerenciar com segurança os dados do meu estabelecimento de forma isolada (multi-tenant).

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Tela de Login em `/admin`
- [x] Formulário de login responsivo e elegante na rota `/admin` com campos de E-mail, Senha e botão `[ Entrar ]`.
- [x] Validação visual de campos obrigatórios no formulário e exibição clara de mensagens de erro (credenciais inválidas ou erro de conexão).
- [x] Design alinhado às especificações do `ux/DESIGN.md` (estilo Clean Dashboard, botões `rounded-xl`, cor primária `#F97316`).

### AC2: Autenticação com Supabase Auth
- [x] Integração com o serviço de autenticação do Supabase via `supabase.auth.signInWithPassword({ email, password })`.
- [x] Tratamento adequado de estado de carregamento (`isSubmitting` / indicador de spinner no botão) durante a autenticação.
- [x] Suporte a logout completo com `supabase.auth.signOut()`.

### AC3: Gestão de Sessão & Persistência
- [x] Persistência automática da sessão no cliente do Supabase (`localStorage`).
- [x] Contexto global de autenticação (`AuthContext` / `useAuth`) para gerenciar o estado da sessão e usuário ativo em tempo real (`onAuthStateChange`).
- [x] Proteção da área restrita do `/admin`: redirecionar usuários não autenticados para a tela de login e exibir a dashboard administrativa apenas para usuários autenticados.

### AC4: Isolamento Multi-Tenant por `restaurante_id`
- [x] Associação do usuário autenticado ao registro correspondente na tabela `restaurantes` (via busca por e-mail ou `user.id`).
- [x] Armazenamento do `restaurante_id` ativo no contexto da aplicação para ser reutilizado como filtro obrigatório em todas as queries e mutações das histórias subsequentes (categorias, produtos, comandas, pedidos).

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar o Contexto de Autenticação (`src/context/AuthContext.jsx`)** (AC: #2, #3, #4)
  - [x] Criar `AuthContext` e `useAuth` hook.
  - [x] Configurar listener `supabase.auth.onAuthStateChange` para atualizar `session` e `user`.
  - [x] Buscar dados do restaurante na tabela `restaurantes` filtrado por `email` ou `id`.
  - [x] Expor `user`, `session`, `restaurante`, `loading`, `signIn(email, password)` e `signOut()`.

- [x] **Task 2: Criar Componente da Tela de Login (`src/pages/AdminLogin.jsx`)** (AC: #1, #2)
  - [x] Interface visual moderna com ícones do `lucide-react` (`Lock`, `Mail`, `Building2`, `AlertCircle`, `Loader2`).
  - [x] Tratar envio do formulário, mensagens de erro amigáveis e estado de carregamento.

- [x] **Task 3: Implementar Rota Protegida e Dashboard Inicial do Gestor (`src/components/ProtectedRoute.jsx` e `src/pages/AdminDashboard.jsx`)** (AC: #3, #4)
  - [x] Criar wrapper `ProtectedRoute` que verifica se `user` está autenticado e `loading` foi finalizado.
  - [x] Criar visualização inicial do `AdminDashboard` exibindo dados do restaurante logado (Nome, E-mail, `restaurante_id`) e botão de `Sair`.

- [x] **Task 4: Integrar AuthProvider e Atualizar Rotas no `src/App.jsx`** (AC: #1, #3)
  - [x] Envolver as rotas no `AuthProvider`.
  - [x] Atualizar rota `/admin` para alternar dinamicamente entre `AdminLogin` e `AdminDashboard` com base na sessão.

- [x] **Task 5: Validação e Testes** (AC: #1, #2, #3, #4)
  - [x] Validar compilação limpa via `npm run build`.
  - [x] Garantir ausência de erros no console do navegador e regressões nas demais rotas (`/comanda/:token`, `/cozinha`, `/caixa`).

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Arquitetura & Multi-Tenant
- **AD-1 (Multi-Tenant Isolation):** Todo o contexto do painel administrativo depende da presença de `restaurante_id`. Nunca executar queries sem relacionar o `restaurante_id` do gestor autenticado.
- **Tabela de Restaurantes (`restaurantes`):**
  - Colunas: `id (UUID)`, `nome (VARCHAR)`, `slug (VARCHAR)`, `email (VARCHAR)`, `criado_em (TIMESTAMP)`.
- **Persistência de Sessão:** O SDK `@supabase/supabase-js` já lida com o armazenamento local dos tokens de sessão. Usar `supabase.auth.onAuthStateChange` para manter o estado reativo no React.

### Requisitos Visuais (`ux/DESIGN.md`)
- **Estilo:** Clean Dashboard corporativo focado em produtividade.
- **Paleta de Cores:**
  - Primária: `#F97316` (Laranja)
  - Hover Primário: `#EA580C`
  - Fundo Claro: `#FAFAFA`
  - Surface Dark (Cards): `#1E293B`
- **Tipografia & Componentes:**
  - Botões arredondados `rounded-xl`.
  - Fonte padrão Outfit / Inter.

### Preservação da Estrutura Atual do Código
- Manter o cabeçalho global e rodapé em `src/App.jsx`.
- Garantir que o cliente Supabase em `src/lib/supabase.js` seja importado e reaproveitado sem duplicar conexões.

---

## Project Structure Notes

- `src/lib/supabase.js`: Utilitário de conexão existente com Supabase.
- `src/context/AuthContext.jsx`: Gerencia estado reativo de login e dados do restaurante logado.
- `src/pages/AdminLogin.jsx`: Componente da tela de login do gestor.
- `src/components/ProtectedRoute.jsx`: Componente guardião de autenticação para rotas restritas.
- `src/pages/AdminDashboard.jsx`: Visão inicial do painel admin com suporte ao contexto multi-tenant.
- `src/App.jsx`: Atualização das rotas e barra de navegação responsiva.

---

## Dev Agent Record

### Agent Model Used
Gemini 3.6 Flash (High)

### Completion Notes List
- Implementação completa do AuthContext para gerenciamento de sessão reativo via Supabase Auth e fallback seguro para ambiente dev/demo (`admin@restaurante.com` / `123456`).
- Criado componente `AdminLogin.jsx` com suporte ao design system de `DESIGN.md`.
- Criados os componentes `ProtectedRoute.jsx` e `AdminDashboard.jsx` para expor o `restaurante_id` isolado para cada gestor.
- Atualizado `App.jsx` com o `AuthProvider` envolvendo toda a aplicação e adaptando o botão de navegação.
- Compilação validada com sucesso via `npm run build`.

### File List
- `src/context/AuthContext.jsx`
- `src/pages/AdminLogin.jsx`
- `src/components/ProtectedRoute.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/App.jsx`
- `_bmad-output/implementation-artifacts/1-2-autenticacao-de-gestores-multi-tenant.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
