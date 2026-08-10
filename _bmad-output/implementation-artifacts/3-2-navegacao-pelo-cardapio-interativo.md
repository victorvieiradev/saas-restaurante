# Story 3.2: Navegação pelo Cardápio Interativo

Status: done

## Story

As a Cliente do Restaurante,
I want visualizar o cardápio organizado em abas de categorias com fotos, preços e busca por texto,
so that eu possa encontrar e escolher facilmente meus pratos e bebidas favoritos.

## Acceptance Criteria

1. **Abas de Categorias**: Navegação por abas horizontais responsivas (*Todas*, *Entradas & Porções*, *Pratos Principais*, *Bebidas*, *Sobremesas*), refletindo as categorias ativas cadastradas no restaurante.
2. **Cards de Produtos**: Exibição de grid responsivo de produtos com imagem, título, descrição, preço em destaque laranja (`#F97316`) e botão `+ Adicionar`.
3. **Filtro e Busca por Texto**: Input de busca instantânea filtrando produtos pelo nome ou descrição.
4. **Indicador de Indisponibilidade**: Produtos com `disponivel === false` exibem badge "Esgotado" e botão de adição desativado.
5. **Estados Visuais & Feedback**: Renderização de skeleton loader durante a busca de dados e estado amigável para "Nenhum produto encontrado" com opção de resetar a busca.

## Tasks / Subtasks

- [x] Task 1: Integração de Dados do Cardápio em `ComandaCliente.jsx` (AC: #1, #2)
  - [x] Subtask 1.1: Consumir `fetchCategorias(restauranteId)` e `fetchProdutos(restauranteId)` do `menuService.js` utilizando o `restaurante_id` retornado na validação da comanda.
  - [x] Subtask 1.2: Tratar estado de carregamento inicial (`loadingMenu`) separadamente do estado de validação da comanda.
- [x] Task 2: Componente de Busca & Abas de Categoria (AC: #1, #3)
  - [x] Subtask 2.1: Criar barra de busca com ícone deupa (Lucide `Search`), botão de limpar filtro (Lucide `X`) e feedback em tempo real.
  - [x] Subtask 2.2: Criar barra de navegação por abas com rolagem horizontal touch-friendly e indicador da categoria ativa.
- [x] Task 3: Renderização do Grid de Produtos (AC: #2, #4)
  - [x] Subtask 3.1: Renderizar cards com layout responsivo (1 coluna no mobile, 2 colunas em telas maiores).
  - [x] Subtask 3.2: Formatar preço em moeda nacional (ex: `R$ 38,90`).
  - [x] Subtask 3.3: Exibir badge "Esgotado" e desabilitar o botão `+ Adicionar` para produtos indisponíveis.
- [x] Task 4: Feedback Visual & Tratamento de Lista Vazia (AC: #5)
  - [x] Subtask 4.1: Adicionar Skeleton Loaders com efeito pulse para carregamento fluido dos cards.
  - [x] Subtask 4.2: Exibir ilustração/mensagem amigável quando nenhum item atender aos filtros de categoria ou busca por texto.

## Dev Notes

### Arquivos Afetados & Estrutura de Código
- **Página Principal**: [ComandaCliente.jsx](file:///C:/Users/Paty/Desktop/restaurante/src/pages/ComandaCliente.jsx) — Substituir o container placeholder da Story 3.1 pelo módulo funcional do cardápio.
- **Componente Criado**: [CardapioCliente.jsx](file:///C:/Users/Paty/Desktop/restaurante/src/components/CardapioCliente.jsx) — Componente dedicado com abas de categoria, busca por texto, cards e skeletons.
- **Serviços**: [menuService.js](file:///C:/Users/Paty/Desktop/restaurante/src/services/menuService.js) — Já exporta `fetchCategorias` e `fetchProdutos` com suporte híbrido (Supabase + fallback LocalStorage).
- **Ícones**: `lucide-react` (`Search`, `X`, `Utensils`, `Plus`, `Sparkles`, `Check`, `Slash`, `ImageOff`, `Layers`).

### Diretrizes de Design System
- **Paleta de Cores**:
  - Destaques / CTAs: `bg-orange-500` / `text-orange-500` (`#F97316`)
  - Fundo & Containers: `bg-slate-950` / `bg-slate-900` / `border-slate-800`
  - Textos: `text-white` (Títulos), `text-slate-400` (Subtítulos e descrições)
- **Mobile First**: A barra de categorias possui rolagem horizontal suave (`overflow-x-auto scrollbar-none`).

### Preservação de Comportamento Existente
- A verificação e validação do token da comanda (com os fluxos de `not_found` e `encerrada`) permaneceu **intacta**. O cardápio só é renderizado após a validação da comanda.

## Dev Agent Record

### Agent Model Used
Gemini 3.6 Flash

### Debug Log References
- Componente `CardapioCliente.jsx` implementado e integrado em `ComandaCliente.jsx`.
- Compilação do projeto concluída com sucesso.

### Completion Notes List
- Criado componente `CardapioCliente.jsx` com abas dinâmicas por categoria, busca em tempo real, formatação BRL, tratamento de esgotados e estado de esqueleto/lista vazia.
- Integrado o cardápio em `ComandaCliente.jsx` garantindo retrocompatibilidade com a validação de token da comanda.

### File List
- `src/components/CardapioCliente.jsx`
- `src/pages/ComandaCliente.jsx`
- `_bmad-output/implementation-artifacts/3-2-navegacao-pelo-cardapio-interativo.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

