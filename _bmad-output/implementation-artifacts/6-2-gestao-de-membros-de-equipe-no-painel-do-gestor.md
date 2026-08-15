# Story 6.2: Gestão de Membros de Equipe no Painel do Gestor (`/admin`)

Status: done

## Story Description

- **Como** Dono do Restaurante (Gestor),
- **Quero** cadastrar, listar, editar e desativar colaboradores da minha equipe na aba "Equipe" do painel administrativo,
- **Para que** eu tenha controle total de quem acessa as funções operacionais (KDS da Cozinha e POS do Caixa) do meu estabelecimento.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Nova Aba "Equipe" no `AdminDashboard.jsx`
- [x] Inclusão da aba **"Equipe"** na barra de navegação de abas do `AdminDashboard.jsx`.
- [x] Exibição do contador dinâmico de membros cadastrados no título da aba (ex: `Equipe (3)`).
- [x] A aba deve ser acessível e exibida para usuários autenticados com perfil de `GESTOR` (`isAdmin`).

### AC2: Listagem de Colaboradores (`TeamManager.jsx`)
- [x] Criação do componente `src/components/admin/TeamManager.jsx` integrado ao `userService.js`.
- [x] Tabela responsiva com design moderno e escuro exibindo as seguintes colunas:
  - **Membro / Operador:** Nome completo e E-mail.
  - **Função / Papel:** Badge visual diferenciado (👑 *Gestor* em azul, 👨‍🍳 *Cozinha* em âmbar, 💰 *Caixa* em esmeralda).
  - **Data de Cadastro:** Data formatada no padrão brasileiro (`DD/MM/AAAA`).
  - **Status:** Badge com indicador de cor (*Ativo* em verde esmeralda, *Inativo* em cinza/vermelho).
  - **Ações:** Botão de alternar status rápido (Ativar/Desativar), Botão de Edição e Botão de Exclusão.
- [x] Estado de carregamento com *skeleton/spinner* e mensagem amigável para lista vazia com botão de ação rápida "Novo Colaborador".

### AC3: Modal de Cadastro e Edição de Membro da Equipe
- [x] Modal intuitivo com backdrop escuro e animação suave para inclusão e edição de operadores.
- [x] Campos do formulário:
  - **Nome Completo** (texto, obrigatório).
  - **E-mail de Acesso** (e-mail, obrigatório, validação de formato e unicidade no restaurante).
  - **Senha de Acesso** (mínimo 6 dígitos, com toggle de visibilidade e suporte a preservação na edição).
  - **Função / Papel** (seletor: `Cozinha` ou `Caixa`).
  - **Status** (toggle: *Ativo / Inativo*).
- [x] Validações visuais com mensagens de erro claras em caso de campos vazios, e-mail inválido ou senha com menos de 6 caracteres.

### AC4: Ações Rápidas de Status e Confirmação de Exclusão
- [x] Alternância instantânea de status (*Ativar / Desativar*) com um clique no botão de status da tabela.
- [x] Modal de confirmação seguro antes de realizar a exclusão de um membro da equipe para prevenir deleções acidentais.
- [x] Feedback visual via toast ou banner de notificação temporário após qualquer operação (criação, edição, alteração de status e exclusão).

### AC5: Persistência Multi-Tenant e Sincronização Supabase/Local
- [x] Todas as chamadas integradas às funções do `userService.js` (`fetchUsuariosEquipe`, `saveUsuarioEquipe`, `toggleUsuarioStatus`, `deleteUsuario`).
- [x] Garantia de que todos os operadores estejam estritamente atrelados ao `restaurante_id` da sessão ativa.
- [x] Fallback automático para `localStorage` (`restaurante_usuarios_equipe_${restauranteId}`) mantendo os dados persistidos mesmo sem conexão ativa ao Supabase.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Componente `src/components/admin/TeamManager.jsx`** (AC: #2, #3, #4, #5)
  - [x] Implementar a listagem de operadores com badges coloridos por função e status.
  - [x] Implementar o modal de cadastro e edição de colaboradores com validação.
  - [x] Implementar o modal de confirmação para exclusão e alternância de status rápido com 1 clique.
  - [x] Integrar notificações visuais de sucesso/erro.

- [x] **Task 2: Integrar a Aba "Equipe" no `src/pages/AdminDashboard.jsx`** (AC: #1)
  - [x] Adicionar botão de navegação da aba "Equipe" com ícone (`Users`) e contador dinâmico de colaboradores.
  - [x] Renderizar `<TeamManager restauranteId={restaurante.id} />` quando a aba ativa for `'team'`.
  - [x] Atualizar o carregamento de estatísticas (`stats`) para incluir `teamCount`.

- [x] **Task 3: Testes de Integração e Persistência** (AC: #3, #4, #5)
  - [x] Testar adição de novo membro da equipe (ex: "Carlos Cozinheiro").
  - [x] Testar edição de nome/função de membro existente.
  - [x] Testar alternância de status ativo/inativo e verificar reflexo no login do operador.
  - [x] Testar exclusão com modal de confirmação.

- [x] **Task 4: Validação do Build e Regressão** (AC: #1, #2, #3, #4, #5)
  - [x] Executar `npm run build` para garantir zero erros de compilação ou TypeScript/JSX.
  - [x] Garantir que as outras abas (Visão Geral, Categorias, Produtos, Comandas) permaneçam 100% funcionais.

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Arquitetura & Multi-Tenant (AD-1)
- O `restaurante_id` deve ser injetado em todas as operações de membros da equipe.
- O gestor (`role: 'GESTOR'`) é o único que possui permissão de gerenciar e visualizar a aba "Equipe".
- As funções disponíveis para cadastro de operadores operacionais são estritamente `COZINHA` e `CAIXA`.

### Arquivos Envolvidos
- `src/components/admin/TeamManager.jsx`: Novo componente de gestão de equipe.
- `src/pages/AdminDashboard.jsx`: Integração da aba "Equipe" e contagem de colaboradores.
- `src/services/userService.js`: Serviço de comunicação com o backend e mock storage.
