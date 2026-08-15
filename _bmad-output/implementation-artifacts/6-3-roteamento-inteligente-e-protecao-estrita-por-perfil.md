# Story 6.3: Roteamento Inteligente & Proteção Estrita por Perfil (RBAC)

Status: ready-for-dev

## Story Description

- **Como** Sistema / Operador,
- **Quero** ser redirecionado para a tela correta após o login e ser impedido de acessar áreas não autorizadas do restaurante,
- **Para que** a operação seja focada no meu papel (Cozinha KDS ou Caixa POS) e os dados confidenciais e configurações do estabelecimento fiquem estritamente protegidos.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Aprimoramento do `ProtectedRoute.jsx` com Suporte a `allowedRoles`
- [ ] O componente `ProtectedRoute.jsx` aceita a propriedade opcional `allowedRoles` (array de strings, ex: `['GESTOR']`, `['GESTOR', 'COZINHA']`, `['GESTOR', 'CAIXA']`).
- [ ] Caso o usuário esteja autenticado, mas seu papel (`role`) **não** esteja incluído em `allowedRoles`:
  - O acesso à rota solicitada é imediatamente bloqueado.
  - O usuário é redirecionado automaticamente para o painel correspondente ao seu perfil:
    - Se `role === 'COZINHA'` $\rightarrow$ redireciona para `/cozinha`.
    - Se `role === 'CAIXA'` $\rightarrow$ redireciona para `/caixa`.
    - Se `role === 'GESTOR'` $\rightarrow$ redireciona para `/admin`.
  - Exibição de aviso/alerta temporário informando que a rota acessada requer privilégios diferentes.

### AC2: Redirecionamento Inteligente Pós-Login (`AdminLogin.jsx` & `AuthContext.jsx`)
- [ ] Após autenticação bem-sucedida na tela de login (`/admin` / `AdminLogin.jsx`):
  - Usuário `COZINHA` $\rightarrow$ Redirecionado diretamente para a rota `/cozinha` (Monitor KDS).
  - Usuário `CAIXA` $\rightarrow$ Redirecionado diretamente para a rota `/caixa` (Terminal POS).
  - Usuário `GESTOR` $\rightarrow$ Redirecionado para a rota `/admin` (Painel Administrativo).
- [ ] Se um usuário autenticado já possuir sessão ativa e navegar para a tela de login (`/admin` em estado não autenticado), o sistema redireciona automaticamente para sua tela de trabalho sem exigir novo login.

### AC3: Bloqueio Estrito de Rotas nas Configurações do `App.jsx`
- [ ] Aplicação dos guardas de rota restritivos:
  - **Rota `/admin` (Painel do Gestor):** `allowedRoles={['GESTOR']}`. Bloqueia operadores de Caixa e Cozinha.
  - **Rota `/admin/comandas/impressao`:** `allowedRoles={['GESTOR']}`.
  - **Rota `/cozinha` (KDS):** `allowedRoles={['GESTOR', 'COZINHA']}`. Bloqueia operadores de Caixa.
  - **Rota `/caixa` (POS):** `allowedRoles={['GESTOR', 'CAIXA']}`. Bloqueia operadores de Cozinha.
- [ ] Rotas públicas dos clientes (`/comanda/:token` e cardápio interativo) permanecem públicas e 100% acessíveis sem exigência de autenticação de equipe.

### AC4: Adaptação da Barra de Navegação (Navbar) ao Perfil RBAC
- [ ] A barra de navegação global adapta seus links de acordo com o papel autenticado:
  - Usuário `GESTOR`: visualiza links de *Admin*, *Cozinha*, *Caixa* e botão de Logout.
  - Usuário `COZINHA`: visualiza exclusivamente o acesso à *Cozinha (KDS)*, badge visual identificador (👨‍🍳 Cozinha) e botão de Logout rápido.
  - Usuário `CAIXA`: visualiza exclusivamente o acesso ao *Caixa (POS)*, badge visual identificador (💰 Caixa) e botão de Logout rápido.
  - Usuário Deslogado: visualiza links públicos institucionais e botão de *Acesso Restrito / Login*.
- [ ] Exibição de badge com cor distintiva para o perfil ativo no cabeçalho.

### AC5: Isolamento Multi-Tenant Estrito e Validação em Tempo Real (AD-1, AD-6)
- [ ] O `restaurante_id` ativo da sessão deve ser propagado e utilizado como chave de filtro obrigatória no KDS da Cozinha, no POS do Caixa e nas subscrições Supabase Realtime WebSocket.
- [ ] Operadores de um restaurante jamais visualizam pedidos ou comandas de outros restaurantes.

---

## Tasks / Subtasks de Implementação

- [ ] **Task 1: Atualizar `ProtectedRoute.jsx` para RBAC com `allowedRoles`** (AC: #1, #3)
  - [ ] Implementar verificação de `allowedRoles` no componente.
  - [ ] Implementar lógica de redirecionamento de fallback inteligente (`getDefaultPathForRole`).
  - [ ] Exibir notificação / feedback de acesso não autorizado quando houver tentativa de invasão de rota.

- [ ] **Task 2: Configurar Proteção das Rotas no `src/App.jsx`** (AC: #3)
  - [ ] Envolver rota `/admin` com `allowedRoles={['GESTOR']}`.
  - [ ] Envolver rota `/cozinha` com `allowedRoles={['GESTOR', 'COZINHA']}`.
  - [ ] Envolver rota `/caixa` com `allowedRoles={['GESTOR', 'CAIXA']}`.

- [ ] **Task 3: Atualizar `src/pages/AdminLogin.jsx` com Redirecionamento Inteligente** (AC: #2)
  - [ ] No `handleSubmit`, redirecionar para a rota correspondente ao `userProfile.role` após login bem-sucedido.
  - [ ] Validar redirecionamento automático caso o usuário já esteja logado ao acessar `/admin`.

- [ ] **Task 4: Atualizar Navbar e Header Global no `src/App.jsx`** (AC: #4)
  - [ ] Renderizar condicionalmente os links de navegação baseado no `role` (`isAdmin`, `isCozinha`, `isCaixa`).
  - [ ] Exibir badge do operador (`GESTOR`, `COZINHA`, `CAIXA`) e botão de logout visível e acessível.

- [ ] **Task 5: Validação do Build e Testes de Permissões** (AC: #1, #2, #3, #4, #5)
  - [ ] Testar login com usuário `CAIXA` e validar que é redirecionado para `/caixa`.
  - [ ] Tentar acessar `/admin` ou `/cozinha` como `CAIXA` e validar bloqueio automático.
  - [ ] Testar login com usuário `COZINHA` e validar que é redirecionado para `/cozinha`.
  - [ ] Tentar acessar `/admin` ou `/caixa` como `COZINHA` e validar bloqueio automático.
  - [ ] Testar login com usuário `GESTOR` e validar acesso irrestrito a todos os módulos.
  - [ ] Executar `npm run build` e validar compilação sem erros.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Arquitetura & Multi-Tenant (AD-1 & AD-6)
- O papel do usuário (`role`) e o `restaurante_id` devem ser consumidos via `useAuth()`.
- O acesso a rotas sensíveis é validado tanto no carregamento inicial quanto em tentativas de navegação direta pela barra de endereços do navegador (URL).
- Redirecionamentos devem ser suaves e não causar loops infinitos de navegação.

### Arquivos Envolvidos
- `src/components/auth/ProtectedRoute.jsx`: Lógica de verificação de permissões RBAC.
- `src/App.jsx`: Definição de rotas protegidas e Navbar responsiva adaptada.
- `src/pages/AdminLogin.jsx`: Fluxo de autenticação e redirecionamento dinâmico.
- `src/context/AuthContext.jsx`: Estado e helpers de autenticação.
