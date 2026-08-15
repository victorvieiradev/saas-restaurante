---
title: "Epics & User Stories - Sistema de Cardápio Digital & Comandas QR Code"
status: "draft"
created: "2026-08-03"
updated: "2026-08-03"
---

# Épicos e Histórias de Usuário (Epics & Stories)

## 📌 Resumo dos Épicos
- **Épico 1:** Setup da Aplicação & Painel Administrativo (Gestor)
- **Épico 2:** Módulo de Gestão de Comandas & QR Codes
- **Épico 3:** Módulo Cliente - Cardápio Digital QR Code & Pedido Sem Cadastro
- **Épico 4:** Módulo Cozinha - KDS em Tempo Real (WebSockets)
- **Épico 5:** Módulo Caixa - POS, Consumo & Fechamento de Comandas
- **Épico 6:** Gestão de Equipe & Controle de Acesso por Perfil (RBAC Multi-Tenant)

---

## 🚀 Épico 1: Setup da Aplicação & Painel Administrativo (Gestor)

### Story 1.1: Setup do Projeto Frontend & Banco de Dados (Supabase)
- **Como** Desenvolvedor,
- **Quero** inicializar a estrutura do projeto React (Vite) + Tailwind CSS + Lucide Icons e configurar o cliente Supabase,
- **Para que** tenhamos a base pronta para os 4 módulos da aplicação.
- **Critérios de Aceitação (ACs):**
  - [ ] Projeto React configurado com suporte a rotas (React Router / Hash Router).
  - [ ] Tailwind CSS configurado com as cores do `DESIGN.md` (`colors.primary` #F97316, `colors.background_dark` #0F172A).
  - [ ] Cliente Supabase inicializado com variáveis de ambiente.
  - [ ] Script DDL SQL executado no Supabase para criação de todas as tabelas (`restaurantes`, `categorias`, `produtos`, `comandas`, `pedidos`, `itens_pedido`).

### Story 1.2: Autenticação de Gestores & Multi-Tenant
- **Como** Dono do Restaurante,
- **Quero** fazer login com e-mail e senha no painel administrativo (`/admin`),
- **Para que** eu possa acessar e gerenciar com segurança os dados do meu estabelecimento.
- **Critérios de Aceitação (ACs):**
  - [ ] Tela de Login com campos de E-mail, Senha e botão `[ Entrar ]`.
  - [ ] Integração com `supabase.auth.signInWithPassword`.
  - [ ] Sessão persistida em localStorage/sessionStorage.
  - [ ] Isolamento de dados por `restaurante_id` ativo na sessão.

### Story 1.3: Gestão de Categorias e Produtos (CRUD de Cardápio)
- **Como** Gestor do Restaurante,
- **Quero** cadastrar, editar, desativar e excluir categorias e pratos do meu cardápio,
- **Para que** meus clientes vejam os preços, fotos e pratos atualizados.
- **Critérios de Aceitação (ACs):**
  - [ ] Listagem de categorias com ordenação drag-and-drop ou numérico.
  - [ ] Formulário de produto: Nome, Descrição, Preço (R$), Categoria e Upload/URL da imagem.
  - [ ] Toggle para alternar produto como "Disponível / Esgotado".
  - [ ] Atualização instantânea refletida na base de dados.

---

## 🪪 Épico 2: Gestão de Comandas & QR Codes

### Story 2.1: Geração Automática de Comandas
- **Como** Gestor do Restaurante,
- **Quero** gerar um lote de comandas com números sequenciais (ex: 001 a 020),
- **Para que** eu possa disponibilizar os cartões físicos de comanda nas mesas.
- **Critérios de Aceitação (ACs):**
  - [ ] Formulário no Admin: "Número inicial" e "Quantidade de comandas a gerar".
  - [ ] Cada comanda recebe um `numero` e um `qr_code_token` único (hash de 12 caracteres).
  - [ ] Tabela no Admin exibindo todas as comandas cadastradas e seus respectivos status (`DISPONIVEL`, `EM_USO`, `ENCERRADA`).

### Story 2.2: Visualização e Impressão de QR Codes
- **Como** Gestor do Restaurante,
- **Quero** visualizar e imprimir os QR Codes de cada comanda,
- **Para que** possa colar ou afixar os códigos nas comanda físicas do restaurante.
- **Critérios de Aceitação (ACs):**
  - [ ] Componente visual renderizando o QR Code com a URL do cliente (`/comanda/:qr_code_token`).
  - [ ] Modal/Página de impressão pronta com layout amigável para corte (card com logotipo + número da comanda + QR Code).

---

## 📲 Épico 3: Cardápio Digital & Envio de Pedidos (Cliente)

### Story 3.1: Validação de Token de Comanda & Acesso Sem Login
- **Como** Cliente do Restaurante,
- **Quero** acessar o cardápio lendo o QR Code da comanda sem precisar criar conta ou digitar senha,
- **Para que** eu possa pedir minha refeição sem qualquer atrito.
- **Critérios de Aceitação (ACs):**
  - [ ] Rota `/comanda/:token` carrega o restaurante e valida a comanda.
  - [ ] Exibição do cabeçalho da loja com o número da comanda em destaque (ex: `Comanda #015`).
  - [ ] Se o token for inválido, exibe mensagem clara: "Comanda não encontrada. Peça ajuda ao garçom."

### Story 3.2: Navegação pelo Cardápio Interativo
- **Como** Cliente do Restaurante,
- **Quero** visualizar o cardápio organizado em abas de categorias com fotos e preços,
- **Para que** eu encontre facilmente os pratos e bebidas desejados.
- **Critérios de Aceitação (ACs):**
  - [ ] Navegação em abas horizontais de categorias (*Bebidas*, *Entradas*, *Pratos Principais*, *Sobremesas*).
  - [ ] Cards de produtos com imagem, título, preço em destaque laranja (`colors.primary`) e botão `+ Adicionar`.
  - [ ] Filtro por busca de texto para localizar itens rapidamente.

### Story 3.3: Gestão de Carrinho & Revisão de Pedido
- **Como** Cliente do Restaurante,
- **Quero** adicionar itens ao carrinho, ajustar quantidades, colocar observações e revisar antes de enviar,
- **Para que** eu garanta que meu pedido está correto.
- **Critérios de Aceitação (ACs):**
  - [ ] Barra inferior flutuante exibindo contador de itens e valor total parcial.
  - [ ] Modal de produto para inclusão de observações (ex: "Sem cebola", "Gelo e limão").
  - [ ] Tela de revisão exibindo a lista detalhada de itens, botão de remoção e botão de confirmação final `[ Enviar Pedido para a Cozinha ]`.

### Story 3.4: Confirmação & Gravação do Pedido
- **Como** Cliente do Restaurante,
- **Quero** clicar em enviar pedido e receber uma confirmação na tela,
- **Para que** eu saiba que a cozinha já está ciente da minha solicitação.
- **Critérios de Aceitação (ACs):**
  - [ ] O pedido é inserido na tabela `pedidos` com status `PENDENTE` atrelado à `comanda_id`.
  - [ ] O status da comanda altera para `EM_USO` (se estivesse `DISPONIVEL`).
  - [ ] Exibição da tela de sucesso: "Pedido #104 enviado para a cozinha!".

---

## 👨‍🍳 Épico 4: Cozinha em Tempo Real (KDS)

### Story 4.1: Kanban KDS Dark Mode
- **Como** Cozinheiro,
- **Quero** visualizar uma tela escura com 3 colunas (*Pendentes*, *Em Preparo*, *Concluídos*),
- **Para que** eu possa gerenciar a fila de pedidos com facilidade e sem cansaço visual.
- **Critérios de Aceitação (ACs):**
  - [ ] Layout em 3 colunas responsivas com fundo escuro `#0F172A`.
  - [ ] Cada card de pedido exibe o número da comanda grande (ex: **#015**), lista de itens com quantidades e observações destacadas em amarelo.
  - [ ] Cronômetro no topo do card mostrando o tempo em minutos desde a criação do pedido.

### Story 4.2: Sincronização WebSockets em Tempo Real
- **Como** Cozinheiro,
- **Quero** que novos pedidos apareçam instantaneamente na coluna de Pendentes com um alerta sonoro,
- **Para que** eu não precise atualizar a página nem perca nenhum pedido.
- **Critérios de Aceitação (ACs):**
  - [ ] Inscrição no canal Supabase Realtime (`postgres_changes` em `pedidos`).
  - [ ] Ao receber um `INSERT` de pedido, insere o card na coluna *Pendentes* em < 1 segundo e toca o som de notificação.

### Story 4.3: Transição de Status de Pedido na Cozinha
- **Como** Cozinheiro,
- **Quero** clicar nos botões de ação do card para mover o pedido entre os estágios,
- **Para que** toda a equipe saiba o progresso de cada prato.
- **Critérios de Aceitação (ACs):**
  - [ ] Botão `[ Iniciar Preparo ]` no card `PENDENTE` $\rightarrow$ altera status para `EM_PREPARO` e move o card de coluna.
  - [ ] Botão `[ Concluir ]` no card `EM_PREPARO` $\rightarrow$ altera status para `CONCLUIDO`.

---

## 💰 Épico 5: Caixa & Fechamento de Comanda (POS)

### Story 5.1: Busca e Detalhamento da Comanda
- **Como** Atendente do Caixa,
- **Quero** digitar o número de uma comanda e consultar todo o histórico de consumo do cliente,
- **Para que** possa conferir a conta antes de receber o pagamento.
- **Critérios de Aceitação (ACs):**
  - [ ] Campo de busca por número da comanda com auto-foco e tecla `Enter`.
  - [ ] Tabela com a lista de todos os pedidos realizados naquela comanda, com horas, itens, quantidades e sub-totais.
  - [ ] Cálculo automático do valor total acumulado.

### Story 5.2: Fechamento de Conta & Liberação de Comanda
- **Como** Atendente do Caixa,
- **Quero** registrar o pagamento da conta e encerrar a comanda,
- **Para que** a comanda fique limpa e pronta para ser entregue ao próximo cliente.
- **Critérios de Aceitação (ACs):**
  - [ ] Botão `[ Confirmar Pagamento & Liberar Comanda ]`.
  - [ ] Altera o status da comanda para `DISPONIVEL`.
  - [ ] O histórico de pedidos daquela sessão permanece gravado no banco de dados para relatórios de vendas.

---

## 👥 Épico 6: Gestão de Equipe & Controle de Acesso por Perfil (RBAC Multi-Tenant)

### Story 6.1: Modelagem de Usuários e Autenticação por Perfil (RBAC)
- **Como** Dono do Restaurante (Gestor),
- **Quero** que os usuários cadastrados na minha equipe possuam papéis definidos (`GESTOR`, `COZINHA`, `CAIXA`) atrelados ao meu estabelecimento,
- **Para que** cada colaborador acerte seu contexto operacional no momento da autenticação.
- **Critérios de Aceitação (ACs):**
  - [ ] Tabela `usuarios_restaurante` criada no Supabase DDL com os campos: `id`, `restaurante_id (FK)`, `email (UNIQUE)`, `nome`, `role ('GESTOR' | 'COZINHA' | 'CAIXA')`, `ativo (BOOLEAN)` e `criado_em`.
  - [ ] `AuthContext.jsx` atualizado para carregar o perfil (`role`), nome e `restaurante_id` ativo no login.
  - [ ] Suporte a credenciais de demonstração rápidas para os 3 perfis no ambiente de teste/mock:
    - Gestor: `admin@restaurante.com` / `123456`
    - Cozinha: `cozinha@restaurante.com` / `123456`
    - Caixa: `caixa@restaurante.com` / `123456`
  - [ ] Validação de isolamento multi-tenant garantindo que o `restaurante_id` seja injetado em todas as requisições do usuário logado.

### Story 6.2: Gestão de Membros de Equipe no Painel do Gestor (`/admin`)
- **Como** Dono do Restaurante (Gestor),
- **Quero** cadastrar, listar, editar e desativar colaboradores da minha equipe na aba "Equipe" do painel administrativo,
- **Para que** eu controle quem tem acesso ao sistema do meu restaurante.
- **Critérios de Aceitação (ACs):**
  - [ ] Nova aba **"Equipe"** no `AdminDashboard.jsx`, visível exclusivamente para usuários com perfil `GESTOR`.
  - [ ] Tabela com a lista de colaboradores exibindo Nome, E-mail, Papel (`Cozinha` ou `Caixa`), Data de Cadastro, Status (`Ativo` / `Inativo`) e Ações.
  - [ ] Modal de Cadastro/Edição de Colaborador com os campos: Nome (obrigatório), E-mail (obrigatório), Senha (mínimo 6 caracteres), Papel (select: `Cozinha` ou `Caixa`) e Status Ativo (toggle).
  - [ ] Botão de alternar status (Ativar/Desativar) com um clique e modal de confirmação para exclusão.
  - [ ] Persistência integrada com Supabase e sincronização no fallback local.

### Story 6.3: Roteamento Inteligente & Proteção Estrita por Perfil
- **Como** Sistema / Operador,
- **Quero** ser redirecionado para a tela correta após o login e ser impedido de acessar áreas não autorizadas,
- **Para que** a operação seja focada e dados confidenciais do restaurante fiquem protegidos contra acessos indevidos.
- **Critérios de Aceitação (ACs):**
  - [ ] `ProtectedRoute.jsx` aprimorado para aceitar a propriedade `allowedRoles` (ex: `['GESTOR', 'COZINHA']`).
  - [ ] Redirecionamento inteligente pós-login:
    - Usuário `COZINHA` $\rightarrow$ Redirecionado diretamente para `/cozinha`.
    - Usuário `CAIXA` $\rightarrow$ Redirecionado diretamente para `/caixa`.
    - Usuário `GESTOR` $\rightarrow$ Redirecionado para `/admin`.
  - [ ] Bloqueio estrito de acesso não autorizado: se um usuário da `COZINHA` tentar navegar para `/admin` ou `/caixa`, o sistema impede o acesso e o redireciona com mensagem informativa para seu painel permitido (`/cozinha`).
  - [ ] Se um usuário do `CAIXA` tentar navegar para `/admin` ou `/cozinha`, o sistema impede o acesso e o redireciona para `/caixa`.
  - [ ] Navbar e cabeçalhos adaptados para exibir o perfil ativo do usuário e botão de logout rápido.
  - [ ] Garantia de que todos os filtros de tempo real do KDS e do Caixa filtrem estritamente pelo `restaurante_id` da sessão ativa.
