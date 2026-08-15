---
baseline_commit: 662f1dceffcfe6ec0625b2365c32119fb42adf5f
---

# Story 6.3: Roteamento Inteligente & Proteção Estrita por Perfil (RBAC)

Status: done

## Story Description

- **Como** Sistema / Operador,
- **Quero** ser redirecionado para a tela correta após o login e ser impedido de acessar áreas não autorizadas do restaurante,
- **Para que** a operação seja focada no meu papel (Cozinha KDS ou Caixa POS) e os dados confidenciais e configurações do estabelecimento fiquem estritamente protegidos.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Aprimoramento do `ProtectedRoute.jsx` com Suporte a `allowedRoles`
- [x] O componente `ProtectedRoute.jsx` aceita a propriedade opcional `allowedRoles` (array de strings, ex: `['GESTOR']`, `['GESTOR', 'COZINHA']`, `['GESTOR', 'CAIXA']`).
- [x] Caso o usuário esteja autenticado, mas seu papel (`role`) **não** esteja incluído em `allowedRoles`:
  - O acesso à rota solicitada é imediatamente bloqueado.
  - O usuário é redirecionado automaticamente para o painel correspondente ao seu perfil:
    - Se `role === 'COZINHA'` $\rightarrow$ redireciona para `/cozinha`.
    - Se `role === 'CAIXA'` $\rightarrow$ redireciona para `/caixa`.
    - Se `role === 'GESTOR'` $\rightarrow$ redireciona para `/admin`.
  - Exibição de aviso/alerta temporário informando que a rota acessada requer privilégios diferentes.

### AC2: Redirecionamento Inteligente Pós-Login (`AdminLogin.jsx` & `AuthContext.jsx`)
- [x] Após autenticação bem-sucedida na tela de login (`/admin` / `AdminLogin.jsx`):
  - Usuário `COZINHA` $\rightarrow$ Redirecionado diretamente para a rota `/cozinha` (Monitor KDS).
  - Usuário `CAIXA` $\rightarrow$ Redirecionado diretamente para a rota `/caixa` (Terminal POS).
  - Usuário `GESTOR` $\rightarrow$ Redirecionado para a rota `/admin` (Painel Administrativo).
- [x] Se um usuário autenticado já possuir sessão ativa e navegar para a tela de login (`/admin` em estado não autenticado), o sistema redireciona automaticamente para sua tela de trabalho sem exigir novo login.

### AC3: Bloqueio Estrito de Rotas nas Configurações do `App.jsx`
- [x] Aplicação dos guardas de rota restritivos:
  - **Rota `/admin` (Painel do Gestor):** `allowedRoles={['GESTOR']}`. Bloqueia operadores de Caixa e Cozinha.
  - **Rota `/admin/comandas/impressao`:** `allowedRoles={['GESTOR']}`.
  - **Rota `/cozinha` (KDS):** `allowedRoles={['GESTOR', 'COZINHA']}`. Bloqueia operadores de Caixa.
  - **Rota `/caixa` (POS):** `allowedRoles={['GESTOR', 'CAIXA']}`. Bloqueia operadores de Cozinha.
- [x] Rotas públicas dos clientes (`/comanda/:token` e cardápio interativo) permanecem públicas e 100% acessíveis sem exigência de autenticação de equipe.

### AC4: Adaptação da Barra de Navegação (Navbar) ao Perfil RBAC
- [x] A barra de navegação global adapta seus links de acordo com o papel autenticado:
  - Usuário `GESTOR`: visualiza links de *Admin*, *Cozinha*, *Caixa* e botão de Logout.
  - Usuário `COZINHA`: visualiza exclusivamente o acesso à *Cozinha (KDS)*, badge visual identificador (👨‍🍳 Cozinha) e botão de Logout rápido.
  - Usuário `CAIXA`: visualiza exclusivamente o acesso ao *Caixa (POS)*, badge visual identificador (💰 Caixa) e botão de Logout rápido.
  - Usuário Deslogado: visualiza links públicos institucionais e botão de *Acesso Restrito / Login*.
- [x] Exibição de badge com cor distintiva para o perfil ativo no cabeçalho.

### AC5: Isolamento Multi-Tenant Estrito e Validação em Tempo Real (AD-1, AD-6)
- [x] O `restaurante_id` ativo da sessão deve ser propagado e utilizado como chave de filtro obrigatória no KDS da Cozinha, no POS do Caixa e nas subscrições Supabase Realtime WebSocket.
- [x] Operadores de um restaurante jamais visualizam pedidos ou comandas de outros restaurantes.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Atualizar `ProtectedRoute.jsx` para RBAC com `allowedRoles`** (AC: #1, #3)
  - [x] Implementar verificação de `allowedRoles` no componente.
  - [x] Implementar lógica de redirecionamento de fallback inteligente (`getDefaultPathForRole`).
  - [x] Exibir notificação / feedback de acesso não autorizado quando houver tentativa de invasão de rota.

- [x] **Task 2: Configurar Proteção das Rotas no `src/App.jsx`** (AC: #3)
  - [x] Envolver rota `/admin` com `allowedRoles={['GESTOR']}`.
  - [x] Envolver rota `/cozinha` com `allowedRoles={['GESTOR', 'COZINHA']}`.
  - [x] Envolver rota `/caixa` com `allowedRoles={['GESTOR', 'CAIXA']}`.

- [x] **Task 3: Atualizar `src/pages/AdminLogin.jsx` com Redirecionamento Inteligente** (AC: #2)
  - [x] No `handleSubmit`, redirecionar para a rota correspondente ao `userProfile.role` após login bem-sucedido.
  - [x] Validar redirecionamento automático caso o usuário já esteja logado ao acessar `/admin`.

- [x] **Task 4: Atualizar Navbar e Header Global no `src/App.jsx`** (AC: #4)
  - [x] Renderizar condicionalmente os links de navegação baseado no `role` (`isAdmin`, `isCozinha`, `isCaixa`).
  - [x] Exibir badge do operador (`GESTOR`, `COZINHA`, `CAIXA`) e botão de logout visível e acessível.

- [x] **Task 5: Validação do Build e Testes de Permissões** (AC: #1, #2, #3, #4, #5)
  - [x] Testar login com usuário `CAIXA` e validar que é redirecionado para `/caixa`.
  - [x] Tentar acessar `/admin` ou `/cozinha` como `CAIXA` e validar bloqueio automático.
  - [x] Testar login com usuário `COZINHA` e validar que é redirecionado para `/cozinha`.
  - [x] Tentar acessar `/admin` ou `/caixa` como `COZINHA` e validar bloqueio automático.
  - [x] Testar login com usuário `GESTOR` e validar acesso irrestrito a todos os módulos.
  - [x] Executar `npm run build` e validar compilação sem erros.

### Review Findings
- [x] [Review][Patch] Invert profile/tenant lookup order to prevent staff privilege escalation and multi-tenant ID mismatch [`src/context/AuthContext.jsx:25-59`]
- [x] [Review][Patch] Prevent infinite redirect loop on unmapped roles by defaulting fallback to '/' and normalizing case [`src/utils/rbac.js:16-26`, `src/components/ProtectedRoute.jsx:38-44`]
- [x] [Review][Patch] Enforce least-privilege defaults and ensure async profile loads before unsetting loading state [`src/components/ProtectedRoute.jsx:34`, `src/context/AuthContext.jsx:118-120`]
- [x] [Review][Patch] Avoid direct window.history.replaceState to preserve React Router internal state [`src/App.jsx:42`]
- [x] [Review][Patch] Add defensive optional chaining on currentUser.email and userFound.role [`src/context/AuthContext.jsx:53,187`]
- [x] [Review][Patch] Reset isSubmitting loading flag in AdminLogin on completion [`src/pages/AdminLogin.jsx:54-55`]

---

## Senior Developer Review (AI)

- **Data do Review:** 2026-08-15
- **Resultado:** Aprovado (Approved)
- **Camadas de Revisão Executadas:** Blind Hunter, Edge Case Hunter, Acceptance Auditor
- **Total de Itens Auditados:** 6 itens identificados e 100% corrigidos via patch.
- **Validação de Testes:** 15 testes automatizados aprovados sem regressões.

---

## Dev Agent Record

### Implementation Plan
1. Criado módulo auxiliar `src/utils/rbac.js` com constantes de perfil (`GESTOR`, `COZINHA`, `CAIXA`), função `getDefaultPathForRole`, validador de acesso `isRoleAllowed` e metadados de badges visuais.
2. Atualizado `src/components/ProtectedRoute.jsx` para receber `allowedRoles`. Se o usuário autenticado não possuir o perfil necessário, bloqueia o acesso e redireciona via `<Navigate to={getDefaultPathForRole(role)} replace state={{ unauthorizedAlert: true, ... }} />`.
3. Atualizado `src/pages/AdminLogin.jsx` com verificação de sessão ativa no `useEffect` (redirecionando para a rota do perfil) e redirecionamento imediato pós-login baseado no `role` retornado.
4. Atualizado `src/context/AuthContext.jsx` para propagar o `role` resolvido nas operações de login e sessão ativa, invertendo a busca para evitar escalonamento indevido.
5. Atualizado `src/App.jsx` com proteção estrita em todas as rotas operacionais (`/admin`, `/cozinha`, `/caixa`), banner de aviso contextual de acesso negado e adaptação dinâmica dos links da Navbar e badges por perfil.
6. Criada suíte de testes unitários automatizados em `test/rbac.test.js` com 15 testes passando (100% de sucesso) e script de teste configurado no `package.json`.
7. Build de produção validado com Vite.

### Completion Notes
- ✅ **AC1:** `ProtectedRoute.jsx` valida estritamente `allowedRoles`. Operadores que tentam acessar rotas restritas são redirecionados automaticamente para seus módulos autorizados com banner de aviso.
- ✅ **AC2:** Redirecionamento dinâmico pós-login implementado no `AdminLogin.jsx`. Cozinha vai para `/cozinha`, Caixa para `/caixa` e Gestor para `/admin`. Sessões já autenticadas são redirecionadas diretamente sem looping.
- ✅ **AC3:** Rotas `/admin`, `/cozinha` e `/caixa` com guardas estritos no `App.jsx`. Rotas de clientes (`/comanda/:token` e cardápio) permanecem 100% públicas.
- ✅ **AC4:** Navbar adaptada: Gestor vê todos os módulos e badge azul; Cozinha vê apenas KDS e badge âmbar; Caixa vê apenas POS e badge esmeralda. Botão de logout rápido e visível.
- ✅ **AC5:** Isolamento multi-tenant garantido via `restaurante_id` propagado pelo `useAuth()`.
- ✅ **Code Review & Patches:** 6 patches aplicados com sucesso (correção de busca de perfil/tenant, prevenção de loops, encadeamento opcional e preservação do histórico do React Router).
- ✅ **Testes:** 15 testes automatizados em `test/rbac.test.js` passando com 0 falhas; compilação `npm run build` executada com sucesso.

### Debug Log
- Ajustado acesso a `import.meta.env` no `src/lib/supabase.js` para suportar execução suave tanto no ambiente Vite quanto no executor de testes nativo do Node.js (`node --test`).
- Corrigida ordem de lookup de perfil/restaurante no `AuthContext.jsx` para suportar contas de equipe no Supabase Auth.

---

## File List

- `src/utils/rbac.js` (Novo)
- `src/components/ProtectedRoute.jsx` (Modificado)
- `src/pages/AdminLogin.jsx` (Modificado)
- `src/context/AuthContext.jsx` (Modificado)
- `src/App.jsx` (Modificado)
- `src/lib/supabase.js` (Modificado)
- `src/services/userService.js` (Modificado)
- `package.json` (Modificado)
- `test/rbac.test.js` (Novo)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Modificado)
- `_bmad-output/implementation-artifacts/6-3-roteamento-inteligente-e-protecao-estrita-por-perfil.md` (Modificado)

---

## Change Log

- **2026-08-15**: Implementação completa da Story 6.3 - Roteamento Inteligente & Proteção Estrita por Perfil (RBAC). Proteção de rotas, redirecionamento automático por perfil, Navbar adaptada, alertas de acesso negado e suíte de testes unitários.
- **2026-08-15**: Aplicação dos 6 patches de segurança e robustez identificados no Code Review adversarial. Status atualizado para `done`.
