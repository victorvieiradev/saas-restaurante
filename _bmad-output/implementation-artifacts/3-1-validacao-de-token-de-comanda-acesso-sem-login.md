# Story 3.1: Validação de Token de Comanda & Acesso Sem Login

Status: done

## Story Description

- **Como** Cliente do Restaurante,
- **Quero** acessar o cardápio lendo o QR Code da comanda (rota `/comanda/:token`) sem precisar criar conta ou digitar senha,
- **Para que** eu possa consultar o menu e pedir minha refeição sem qualquer atrito ou barreira de cadastro.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Rota e Validação de Token de Comanda
- [x] A rota `/comanda/:token` captura o parâmetro `:token` e consulta o serviço `comandaService.fetchComandaByToken(token)`.
- [x] A consulta valida se o token existe no banco Supabase (tabela `comandas`) ou no fallback local (`localStorage`).
- [x] Retorna os dados completos da comanda (ID, número, status, restaurante_id e informações do restaurante associado).

### AC2: Cabeçalho do Estabelecimento e Destaque da Comanda
- [x] Exibe o cabeçalho fixo/destacado com o nome/logotipo do restaurante e o número da comanda em destaque proeminente (ex: **Comanda #015** ou **Mesa / Comanda #002**).
- [x] O número da comanda permanece visível no topo da interface durante toda a experiência de navegação do cliente.
- [x] Exibe indicador de status da comanda (ex: `Em Aberto / Disponível` ou `Em Uso`).

### AC3: Tratamento de Erro para Token Inválido ou Inexistente
- [x] Se o token for inválido, adulterado ou inexistente na base de dados, exibe uma tela de estado de erro amigável.
- [x] Mensagem clara ao usuário: *"Comanda não encontrada ou código inválido. Por favor, peça ajuda ao garçom."*
- [x] Botão de ação visual para tentar recarregar ou entrar em contato com o atendimento.

### AC4: Resiliência Offline & Fallback Local
- [x] O serviço `comandaService.js` deve ser estendido com a função `fetchComandaByToken(token)`.
- [x] Em caso de falha de conexão com Supabase ou se o banco estiver indisponível, realiza a busca nas comandas salvas no `localStorage` (como a comanda demo `cmd_a1b2c3d4e5f6` ou tokens gerados localmente).
- [x] Garantir suporte ao token demo `demo-123` e aos tokens gerados no lote (ex: `cmd_*`), garantindo que o link da Home (`/comanda/demo-123`) funcione perfeitamente.

### AC5: Preservação de Estado & Preparação para o Cardápio
- [x] Se a comanda estiver com status `DISPONIVEL` ou `EM_USO`, permite o acesso ao cardápio digital (Story 3.2).
- [x] Se a comanda estiver `ENCERRADA`, exibe aviso visual informando que a comanda foi encerrada pelo caixa e solicita auxílio do garçom para abrir nova sessão.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Estender `comandaService.js` com `fetchComandaByToken(token)`** (AC: #1, #4)
  - Implementar função `fetchComandaByToken(token)` em `src/services/comandaService.js`.
  - Consultar Supabase `comandas` juntamente com dados da tabela `restaurantes`.
  - Implementar fallback no `localStorage` caso o Supabase falhe ou esteja desconectado.
  - Adicionar suporte a tokens de fallback/demo como `demo-123`.

- [x] **Task 2: Criar Componente de Página `src/pages/ComandaCliente.jsx`** (AC: #1, #2, #3, #5)
  - Extrair o placeholder da rota cliente para um componente de página dedicado `ComandaCliente.jsx`.
  - Gerenciar estados da página: `loading`, `error` (token inválido/encerrada) e `comanda` (válida).
  - Estilizar cabeçalho do restaurante com nome, badge do número da comanda (`Comanda #015`) e badge de status.
  - Implementar visualização de erro quando a comanda não for localizada.

- [x] **Task 3: Atualizar Roteamento e Navegação em `src/App.jsx`** (AC: #1)
  - Importar e conectar `ComandaCliente` da nova página `src/pages/ComandaCliente.jsx`.
  - Garantir que a rota `/comanda/:token` passe o parâmetro via `useParams()`.
  - Verificar funcionamento do link principal da Home (`/comanda/demo-123`).

- [x] **Task 4: Validação & Build** (AC: #1, #2, #3, #4, #5)
  - Testar acessos com tokens válidos, token `demo-123` e tokens inexistentes/inválidos.
  - Executar `npm run build` para validar compilação sem erros de sintaxe ou imports.

### Review Findings (Code Review)
- [x] [Review][Patch] Tratamento resiliente para caso o join de `restaurantes` no Supabase retorne um Array [`src/services/comandaService.js:84`]

---

## Dev Notes & Guardrails de Arquitetura

### Decisões Arquiteturais Relevantes (ADs)
- **AD-2 (Sessão do Cliente Sem Autenticação via Token de Comanda):** A rota `/comanda/:token` não exige login, e-mail ou senha. O token é a chave de acesso à sessão de consumo.
- **AD-1 (Multi-Tenant):** A comanda recuperada traz seu `restaurante_id`, que garantirá a filtragem dos produtos do cardápio correspondente na Story 3.2.

### Diretrizes Visuais & UX (`ux/DESIGN.md` e `ux/EXPERIENCE.md`)
- **Cabeçalho Fixo do Cliente:** Exibir o número da comanda com destaque visual em laranja (`colors.primary` #F97316) ou badge elegante.
- **Não Fazer:** Nunca solicitar cadastro, formulário de e-mail ou login ao cliente final.
- **Cores & Tema:** Fundo limpo e agradável (`bg-slate-950` / `bg-slate-900`), mantendo padrão visual consistente com o aplicativo.

---

## Project Structure Notes

- `src/services/comandaService.js`: Adicionada função `fetchComandaByToken(token)` com suporte resiliente a arrays em joins do Supabase.
- `src/pages/ComandaCliente.jsx`: Nova página do cliente com validação de token, cabeçalho e tratamento de erros.
- `src/App.jsx`: Rota `/comanda/:token` atualizada importando a nova página `ComandaCliente`.

---

## Dev Agent Record

### Agent Model Used
Gemini 3.6 Flash (High)

### Completion Notes List
- Estendido `comandaService.js` com a função `fetchComandaByToken(token)` com consulta ao Supabase e fallback resiliênte ao `localStorage` e token demo `demo-123`.
- Criado componente dedicado [`src/pages/ComandaCliente.jsx`](file:///C:/Users/Paty/Desktop/restaurante/src/pages/ComandaCliente.jsx) com estados de loading, comanda encerrada, token inválido e visualização de sucesso com cabeçalho destacado (`Comanda #015`).
- Atualizado roteamento em [`src/App.jsx`](file:///C:/Users/Paty/Desktop/restaurante/src/App.jsx) substituindo a função placeholder inline pela nova página.
- Aplicado patch de Code Review em `comandaService.js` para garantir resiliência contra arrays em joins relacionais do Supabase.
- Validada compilação de produção com sucesso via `npm run build` (0 erros em 3.84s).

### File List
- `src/services/comandaService.js`
- `src/pages/ComandaCliente.jsx`
- `src/App.jsx`
- `_bmad-output/implementation-artifacts/3-1-validacao-de-token-de-comanda-acesso-sem-login.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
