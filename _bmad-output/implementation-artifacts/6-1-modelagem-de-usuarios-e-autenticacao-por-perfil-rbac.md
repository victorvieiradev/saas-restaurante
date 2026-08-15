# Story 6.1: Modelagem de Usuários e Autenticação por Perfil (RBAC Multi-Tenant)

Status: done

## Story Description

- **Como** Dono do Restaurante (Gestor),
- **Quero** que os usuários cadastrados na minha equipe possuam papéis definidos (`GESTOR`, `COZINHA`, `CAIXA`) atrelados ao meu estabelecimento e que a autenticação identifique o perfil e o `restaurante_id` ativo,
- **Para que** os operadores da cozinha e do caixa acessem com segurança seu respectivo contexto operacional sem qualquer risco de vazamento de dados entre estabelecimentos.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Modelagem DDL no Supabase (`supabase/schema.sql`)
- [x] Criação da tabela `usuarios_restaurante` com as seguintes colunas e restrições:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE`
  - `email VARCHAR(255) NOT NULL UNIQUE`
  - `nome VARCHAR(255) NOT NULL`
  - `role VARCHAR(20) NOT NULL CHECK (role IN ('GESTOR', 'COZINHA', 'CAIXA'))`
  - `ativo BOOLEAN NOT NULL DEFAULT TRUE`
  - `criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
- [x] Adição de políticas de segurança RLS (Row Level Security) para a tabela `usuarios_restaurante`.

### AC2: Serviço de Usuários & Integração no `AuthContext.jsx`
- [x] Criação do serviço `src/services/userService.js` com funções para consultar o perfil (`fetchUserProfile(email, restauranteId)`), cadastrar e listar operadores da equipe.
- [x] Atualização do `AuthContext.jsx` para recuperar o perfil (`userProfile`), papel (`role`) e `restaurante_id` associado durante o `signIn` e restauração de sessão.
- [x] Exposição de helpers de autorização no `useAuth()`:
  - `role`: string (`'GESTOR' | 'COZINHA' | 'CAIXA' | null`)
  - `isAdmin`: boolean (`role === 'GESTOR'`)
  - `isCozinha`: boolean (`role === 'COZINHA'`)
  - `isCaixa`: boolean (`role === 'CAIXA'`)
  - `userProfile`: objeto com `{ id, nome, email, role, restaurante_id, ativo }`

### AC3: Suporte a Credenciais de Demonstração Rápidas
- [x] Suporte a 3 perfis mock para desenvolvimento e homologação:
  - 👑 **Gestor:** `admin@restaurante.com` / `123456` $\rightarrow$ `role: 'GESTOR'`, restaurante "Restaurante Sabor & Arte" (`res-demo-001`)
  - 👨‍🍳 **Cozinha (Pedro):** `cozinha@restaurante.com` / `123456` $\rightarrow$ `role: 'COZINHA'`, restaurante "Restaurante Sabor & Arte" (`res-demo-001`)
  - 💰 **Caixa (Maria):** `caixa@restaurante.com` / `123456` $\rightarrow$ `role: 'CAIXA'`, restaurante "Restaurante Sabor & Arte" (`res-demo-001`)
- [x] Atualização da tela de login (`AdminLogin.jsx`) com botões rápidos ou seletores para testar a autenticação com cada um dos 3 perfis.

### AC4: Isolamento Multi-Tenant e Persistência de Sessão
- [x] A sessão de autenticação deve salvar e restaurar do `localStorage` tanto o token quanto o `userProfile` e `restaurante_id` da conta ativa.
- [x] Bloqueio de login para usuários desativados (`ativo === false`) com mensagem informativa de erro.
- [x] Ao deslogar (`signOut`), o contexto limpa todos os dados de sessão do usuário e restaura o estado para desautenticado.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Atualizar DDL SQL do Supabase (`supabase/schema.sql`)** (AC: #1)
  - [x] Adicionar `CREATE TABLE IF NOT EXISTS usuarios_restaurante`.
  - [x] Adicionar índices em `email` e `restaurante_id`.
  - [x] Configurar `ENABLE ROW LEVEL SECURITY` e políticas RLS para `usuarios_restaurante`.

- [x] **Task 2: Criar Serviço de Gestão de Usuários (`src/services/userService.js`)** (AC: #2, #3, #4)
  - [x] Implementar `fetchUserProfile(email, restauranteId)`.
  - [x] Implementar `fetchUsuariosEquipe(restauranteId)`.
  - [x] Implementar `saveUsuarioEquipe(usuario, restauranteId)`.
  - [x] Implementar `toggleUsuarioStatus(id, ativo, restauranteId)` e `deleteUsuario(id, restauranteId)`.
  - [x] Adicionar mock storage em `localStorage` (`restaurante_usuarios_equipe`) com usuários padrão de demonstração (Pedro - Cozinha, Maria - Caixa).

- [x] **Task 3: Atualizar o Contexto de Autenticação (`src/context/AuthContext.jsx`)** (AC: #2, #3, #4)
  - [x] Integrar busca de perfil em `usuarios_restaurante` no fluxo de login e no `onAuthStateChange`.
  - [x] Suportar autenticação mock para os 3 perfis (`admin@restaurante.com`, `cozinha@restaurante.com`, `caixa@restaurante.com`).
  - [x] Expor `role`, `isAdmin`, `isCozinha`, `isCaixa` e `userProfile` no `useAuth()`.

- [x] **Task 4: Atualizar a Interface de Login (`src/pages/AdminLogin.jsx`)** (AC: #3)
  - [x] Adicionar atalhos de preenchimento rápido para testar Gestor, Cozinha e Caixa.
  - [x] Melhorar títulos e mensagens para indicar acesso unificado de operadores.

- [x] **Task 5: Validação e Testes de Regressão** (AC: #1, #2, #3, #4)
  - [x] Validar compilação limpa via `npm run build`.
  - [x] Validar que sessões ativas continuam operando normalmente sem quebrar rotas públicas (`/comanda/:token`).

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Arquitetura & Multi-Tenant (AD-1)
- O `restaurante_id` deve ser obtido exclusivamente da sessão autenticada do usuário.
- O campo `role` define as capacidades do usuário:
  - `GESTOR`: controle total da loja (configurações, cardápio, comandas, equipe, POS, KDS).
  - `COZINHA`: acesso operacional exclusivo ao KDS da cozinha.
  - `CAIXA`: acesso operacional exclusivo ao POS de checkout e comandas.

### Arquivos Envolvidos
- `supabase/schema.sql`: Definição de tabela e RLS.
- `src/services/userService.js`: Camada de serviços de usuários e equipe.
- `src/context/AuthContext.jsx`: Contexto reativo de autenticação RBAC.
- `src/pages/AdminLogin.jsx`: Tela de login com suporte multi-perfil.
