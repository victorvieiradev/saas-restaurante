# Story 1.1: Setup do Projeto Frontend & Banco de Dados (Supabase)

Status: done

## Story Description
- **Como** Desenvolvedor,
- **Quero** inicializar a estrutura do projeto React (Vite) + Tailwind CSS + Lucide Icons e configurar o cliente Supabase,
- **Para que** tenhamos a base pronta para os 4 módulos da aplicação (Cliente, Cozinha/KDS, Caixa/POS, Gestor/Admin).

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Inicialização do Projeto Frontend
- [x] Projeto React + Vite configurado e operacional.
- [x] Roteamento configurado (React Router DOM / Hash Router) para suportar os módulos `/comanda/:token`, `/cozinha`, `/caixa`, `/admin`.

### AC2: Configuração de Estilos e Tema
- [x] Tailwind CSS configurado integrando o tema definido em `DESIGN.md`.
- [x] Cores principais registradas no `tailwind.config.js` / CSS variables:
  - `colors.primary`: `#F97316` (Laranja vibrante)
  - `colors.background_dark`: `#0F172A` (Slate escuro para KDS)

### AC3: Cliente Supabase & Conexão
- [x] Pacote `@supabase/supabase-js` instalado e utilitário `src/lib/supabase.js` criado.
- [x] Leitura segura de variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) com fallback seguro.

### AC4: Esquema do Banco de Dados & Scripts DDL
- [x] Script SQL DDL criado em `supabase/schema.sql` contendo todos os tipos enum e tabelas:
  - Enums: `status_comanda` (`DISPONIVEL`, `EM_USO`, `ENCERRADA`), `status_pedido` (`PENDENTE`, `EM_PREPARO`, `CONCLUIDO`, `CANCELADO`)
  - Tabelas: `restaurantes`, `categorias`, `produtos`, `comandas`, `pedidos`, `itens_pedido`
  - Relacionamentos com `ON DELETE CASCADE` e chaves estrangeiras apropriadas.

---

## Developer Context & Technical Requirements

### Guardrails de Arquitetura & Invariantes
- **Multi-tenant isolation:** Todas as tabelas principais (`categorias`, `produtos`, `comandas`, `pedidos`) possuem `restaurante_id (UUID)`.
- **Estatutos de Pedido:** Respeitar o enum `status_pedido` (`PENDENTE`, `EM_PREPARO`, `CONCLUIDO`, `CANCELADO`).
- **Estatutos de Comanda:** Respeitar o enum `status_comanda` (`DISPONIVEL`, `EM_USO`, `ENCERRADA`).

### Estrutura de Arquivos Criados
- `package.json`
- `vite.config.js`
- `index.html`
- `.env` / `.env.example`
- `src/index.css`
- `src/main.jsx`
- `src/App.jsx`
- `src/lib/supabase.js`
- `supabase/schema.sql`

---

## Task List / Passos de Implementação
- [x] Validar dependências no `package.json` (`@supabase/supabase-js`, `lucide-react`, `react-router-dom`, `tailwindcss`).
- [x] Configurar cliente Supabase em `src/lib/supabase.js`.
- [x] Criar o arquivo `supabase/schema.sql` com o DDL completo fornecido no `ARCHITECTURE-SPINE.md`.
- [x] Testar renderização e rotas iniciais da aplicação (`npm run build` e servidor local Vite operacionais).

### Review Findings
- [x] [Review][Patch] Definir políticas explícitas de CREATE POLICY (RLS) para leitura pública do cardápio e registro de pedidos [supabase/schema.sql:91-100]
