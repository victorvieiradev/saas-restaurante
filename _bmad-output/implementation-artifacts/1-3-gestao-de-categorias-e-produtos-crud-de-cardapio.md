# Story 1.3: Gestão de Categorias e Produtos (CRUD de Cardápio)

Status: done

## Story Description

- **Como** Gestor do Restaurante (Admin),
- **Quero** cadastrar, editar, reordenar, desativar e excluir categorias e produtos do meu cardápio no painel administrativo (`/admin`),
- **Para que** os meus clientes vejam os preços, fotos, descrições e itens atualizados em tempo real no cardápio digital.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Interface Tabbed/Seccionada no Painel Admin (`/admin`)
- [x] Navegação fluida no `AdminDashboard.jsx` permitindo alternar entre as abas: **"Visão Geral"**, **"Categorias"** e **"Produtos / Cardápio"**.
- [x] Visualização limpa em estilo *Clean Dashboard* com uso da paleta de cores corporativa (`#F97316` Laranja primário, `#FAFAFA` Fundo claro, `#FFFFFF` / `#1E293B` Surface).
- [x] Feedback visual instantâneo para ações de sucesso (toast/badge) e tratamento gracioso de erros de rede ou validação.

### AC2: CRUD Completo de Categorias (`categorias`)
- [x] **Listagem de Categorias:** Tabela exibindo Nome, Ordem de Exibição, Status (`Ativa` / `Inativa`) e quantidade de produtos vinculados.
- [x] **Criação & Edição de Categoria:** Modal/Formulário com os campos: `Nome` (obrigatório), `Ordem` (número inteiro para ordenação no cardápio) e `Ativo` (toggle boolean).
- [x] **Alternar Status (Toggle Ativo/Inativo):** Alterar o estado de visibilidade de uma categoria com um único clique.
- [x] **Exclusão de Categoria:** Confirmação prévia de exclusão com alerta se houver produtos atrelados à categoria.
- [x] **Isolamento Multi-Tenant:** Todas as operações (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) filtram estritamente pelo `restaurante_id` ativo da sessão.

### AC3: CRUD Completo de Produtos (`produtos`)
- [x] **Listagem de Produtos:** Grid filtrável por Categoria e busca textual, contendo Thumbnail da foto, Nome, Descrição curta, Preço (R$), Categoria vinculada e Status de Disponibilidade (`Disponível` / `Esgotado`).
- [x] **Criação & Edição de Produto:** Modal/Formulário com os campos: `Nome` (obrigatório), `Descrição` (textarea), `Preço` (decimal formatado R$), `Categoria` (select dropdown carregado dinamicamente das categorias ativas) e `URL da Imagem`.
- [x] **Toggle de Disponibilidade (Pausar Item):** Botão rápido no card do produto para alterar instantaneamente `disponivel: true/false` (ex: produto esgotado no dia).
- [x] **Exclusão de Produto:** Modal de confirmação antes de remover o item.
- [x] **Isolamento Multi-Tenant:** Todas as queries em `produtos` utilizam o `restaurante_id` do gestor autenticado.

### AC4: Integração com Supabase Client & Fallback Dev Mock
- [x] Operações CRUD via `@supabase/supabase-js` diretamente nas tabelas `categorias` e `produtos`.
- [x] Suporte a estado local reativo / mock no `menuService.js` com persistência em localStorage em modo de demonstração.
- [x] Ordenação automática das categorias pelo campo `ordem ASC` e dos produtos por `nome ASC`.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Serviço API / Client de Cardápio (`src/services/menuService.js`)** (AC: #2, #3, #4)
  - [x] Implementar `fetchCategorias(restauranteId)` e `saveCategoria(categoria, restauranteId)`.
  - [x] Implementar `toggleCategoriaStatus(id, ativo)` e `deleteCategoria(id)`.
  - [x] Implementar `fetchProdutos(restauranteId)` e `saveProduto(produto, restauranteId)`.
  - [x] Implementar `toggleProdutoDisponibilidade(id, disponivel)` e `deleteProduto(id)`.
  - [x] Adicionar suporte a dados mock de fallback para garantir pleno funcionamento em modo de demonstração.

- [x] **Task 2: Criar Componente de Gestão de Categorias (`src/components/admin/CategoryManager.jsx`)** (AC: #1, #2)
  - [x] Desenvolver tabela/lista com ordenação visual e ações (Editar, Toggle Ativo, Excluir).
  - [x] Form/Modal para adicionar e editar categorias com validação do campo `nome`.
  - [x] Feedback visual de salvar e confirmação de exclusão.

- [x] **Task 3: Criar Componente de Gestão de Produtos (`src/components/admin/ProductManager.jsx`)** (AC: #1, #3)
  - [x] Desenvolver grid de produtos com badge de status (`Disponível` / `Esgotado`) e seletor de filtro por categoria.
  - [x] Form/Modal de produto com preview da imagem (URL/Placeholder), máscara de preço em R$, e seleção de categoria.
  - [x] Botão de toggle rápido para alterar disponibilidade com feedback instantâneo na interface.

- [x] **Task 4: Integrar Gestão de Cardápio no `AdminDashboard.jsx`** (AC: #1)
  - [x] Criar abas de navegação no topo do `AdminDashboard`: `[ Visão Geral ]`, `[ Categorias ]`, `[ Produtos ]`.
  - [x] Renderizar condicionalmente os gerenciadores `CategoryManager` e `ProductManager`.
  - [x] Atualizar contador de produtos/categorias no resumo do dashboard.

- [x] **Task 5: Validação e Testes de Regressão** (AC: #1, #2, #3, #4)
  - [x] Validar compilação limpa via `npm run build`.
  - [x] Verificar ausência de erros no console do navegador e integridade das demais rotas.

### Review Findings
- Clean review — all layers passed (Blind Hunter, Edge Case Hunter, Acceptance Auditor). CRUD completo de categorias e produtos validado e operacional.

---

## Dev Notes & Guardrails de Arquitetura

### Completion Notes
- Implementação realizada com sucesso. Todos os módulos de categorias e produtos criados com interface reativa, feedback por toasts, tratamento de erros e suporte a modo mock/Supabase real.
- Compilação do projeto validada via `npm run build`.

---

## Estrutura de Arquivos Criados/Modificados

- `src/services/menuService.js`
- `src/components/admin/CategoryManager.jsx`
- `src/components/admin/ProductManager.jsx`
- `src/pages/AdminDashboard.jsx`
- `_bmad-output/implementation-artifacts/1-3-gestao-de-categorias-e-produtos-crud-de-cardapio.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
