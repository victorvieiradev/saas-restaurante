# Story 2.1: Geração Automática de Comandas

Status: done

## Story Description

- **Como** Gestor do Restaurante (Admin),
- **Quero** gerar um lote de comandas com números sequenciais (ex: 001 a 020),
- **Para que** eu possa disponibilizar os cartões físicos de comanda com QR Code nas mesas do meu estabelecimento.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Aba "Comandas" no Painel Admin (`/admin`)
- [x] Nova aba **"Comandas & QR Codes"** integrada no `AdminDashboard.jsx`.
- [x] Visualização limpa com estatísticas de comandas (Total, Disponíveis, Em Uso, Encerradas).
- [x] Filtro rápido de busca por número de comanda e status.

### AC2: Formulário de Geração em Lote de Comandas
- [x] Formulário com os campos: `Número Inicial` (ex: 1 ou 001) e `Quantidade de Comandas a Gerar` (ex: 10 ou 20).
- [x] Validação: Impede geração com quantidade <= 0 ou números de comanda duplicados para o mesmo restaurante.
- [x] Cada comanda criada é gravada com:
  - `restaurante_id`: ID do restaurante da sessão ativa.
  - `numero`: String formatada (ex: "001", "002").
  - `qr_code_token`: Hash único de 12 caracteres (ex: `cmd_a1b2c3d4e5f6`).
  - `status`: `'DISPONIVEL'`.
- [x] Feedback visual claro (toast/alerta) indicando quantas comandas foram geradas com sucesso.

### AC3: Listagem & Gestão de Comandas (`comandas`)
- [x] Tabela/Grid listando todas as comandas cadastradas.
- [x] Badges coloridos por status:
  - `DISPONIVEL` (Verde/Emerald)
  - `EM_USO` (Laranja/Amber)
  - `ENCERRADA` (Cinza/Slate)
- [x] Ação de excluir comanda (se estiver em status `DISPONIVEL` ou `ENCERRADA`).
- [x] Botão de resetar/alternar status de comanda individual.

### AC4: Serviço API / Client (`src/services/comandaService.js`)
- [x] Função `fetchComandas(restauranteId)` buscando comandas via Supabase.
- [x] Função `gerarLoteComandas(restauranteId, numeroInicial, quantidade)` para inserção em lote.
- [x] Função `deleteComanda(id)` para remover comanda.
- [x] Suporte a fallback Mock/localStorage para demonstração em dev sem Supabase conectado.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Criar Serviço API `comandaService.js` (`src/services/comandaService.js`)** (AC: #2, #3, #4)
  - Implementar geração de token hash único de 12 caracteres.
  - Implementar `fetchComandas`, `gerarLoteComandas`, `deleteComanda`.
  - Adicionar suporte a mock/localStorage.

- [x] **Task 2: Criar Componente `ComandaManager.jsx` (`src/components/admin/ComandaManager.jsx`)** (AC: #1, #2, #3)
  - Desenvolver estatísticas topo (Total, Disponíveis, Em Uso).
  - Desenvolver modal/card de formulário para geração em lote.
  - Desenvolver tabela com busca, badges de status e ações.

- [x] **Task 3: Integrar no `AdminDashboard.jsx`** (AC: #1)
  - Adicionar aba "Comandas" com ícone `QrCode` no menu do dashboard.
  - Atualizar contadores do overview.
