---
title: "Product Brief - Sistema de Cardápio Digital & Comandas Inteligentes QR Code"
status: "draft"
created: "2026-08-03"
updated: "2026-08-03"
---

# Product Brief: Sistema de Cardápio Digital & Comandas QR Code

## 1. Visão Geral do Produto
Um sistema web intuitivo e sem atrito para gestão de pedidos em restaurantes, bares e estabelecimentos gastronômicos. O produto resolve o gargalo de atendimento ao permitir que os clientes façam pedidos diretamente da mesa lendo um **QR Code impresso na comanda**, enviando as solicitações em tempo real para a cozinha (KDS) e centralizando o consumo na comanda para pagamento no caixa.

---

## 2. Problema & Oportunidade
- **Demora no Atendimento:** Garçons ocupados geram filas e desistências nos horários de pico.
- **Atrito no Acesso:** Aplicativos que exigem cadastro/login afastam clientes que desejam apenas fazer um pedido rápido.
- **Erros em Pedidos:** Anotações manuais geram pratos errados e desperdício.
- **Solução:** Um cardápio web responsivo, acessível via QR Code sem cadastro, atrelado a um identificador único de comanda, integrado ao painel da cozinha e ao sistema de caixa do atendente.

---

## 3. Personas & Perfis de Usuário

1. **Cliente do Restaurante**
   - *Objetivo:* Fazer pedidos rapidamente sem esperar o garçom, consultar preços/fotos e revisar a conta parcial.
   - *Experiência:* Lê o QR Code da comanda $\rightarrow$ visualiza o cardápio interativo $\rightarrow$ escolhe itens $\rightarrow$ revisa o carrinho $\rightarrow$ conclui o pedido. Zero cadastro.

2. **Cozinheiro / Operação de Cozinha (KDS)**
   - *Objetivo:* Receber pedidos instantaneamente de forma organizada e controlar o fluxo de preparo.
   - *Experiência:* Painel com colunas/abas (*Pendentes*, *Em Preparo*, *Concluídos*). Aprova pedidos, altera status para *Em Preparo* e marca como *Concluído* ao finalizar a preparação.

3. **Atendente / Caixa**
   - *Objetivo:* Receber o pagamento do cliente de forma rápida e segura, liberando a comanda para novos usos.
   - *Experiência:* Digita ou escaneia o número da comanda $\rightarrow$ visualiza o extrato completo de consumo daquela comanda $\rightarrow$ fecha o pedido $\rightarrow$ comanda é resetada e liberada para reuso.

4. **Dono / Gestor do Restaurante**
   - *Objetivo:* Configurar a operação, manter o cardápio atualizado e controlar as comandas ativas.
   - *Experiência:* Realiza login no painel administrativo $\rightarrow$ cadastra/edita categorias (ex: Bebidas, Entradas, Pratos Principais, Sobremesas) e pratos $\rightarrow$ cadastra comandas (geração automática de IDs e QR Codes) $\rightarrow$ obtém link público exclusivo do restaurante.

---

## 4. Requisitos Principais & Funcionalidades Chave

### 📲 Módulo Cliente (Cardápio Digital QR Code)
- **Acesso por Link / QR Code:** URL dinâmica no formato `app.restaurante.com/[slug-restaurante]/comanda/[numero_comanda]`.
- **Cardápio Interativo:** Navegação por categorias, fotos dos pratos, preços e descrições.
- **Carrinho Flexível:** Adição, alteração de quantidade e observações nos itens.
- **Tela de Revisão:** Confirmação dos itens e valor total antes do envio à cozinha.
- **Vínculo com Comanda:** Todo pedido finalizado grava o consumo diretamente no ID da comanda atual.

### 👨‍🍳 Módulo Cozinha (KDS - Kitchen Display System)
- **Visualização em Tempo Real:** Atualização automática de novos pedidos (Notificação visual/sonora).
- **Gestão de Status do Pedido:**
  - `Pendente`: Pedido recém-chegado aguardando aprovação/início.
  - `Em Preparo`: Cozinheiro aceitou o pedido e iniciou o preparo.
  - `Concluído`: Prato pronto para ser entregue à mesa do cliente.

### 💰 Módulo Atendente / Caixa (POS)
- **Busca por Comanda:** Consulta pelo número da comanda física.
- **Detalhamento do Consumo:** Lista de todos os itens consumidos no ciclo atual da comanda, com hora e valor.
- **Fechamento & Checkout:** Encerramento do consumo, registro do pagamento e limpeza/liberação automática da comanda.

### ⚙️ Módulo Administrativo (Gestor)
- **Autenticação:** Login seguro para proprietários/gerentes.
- **Gestão de Cardápio:** CRUD de Categorias (Bebidas, Entradas, Pratos Principais, Sobremesas, etc.) e Itens do Menu (nome, preço, foto, descrição, disponibilidade).
- **Gerador de Comandas & QR Codes:** Cadastro de comandas com atribuição automática de número e geração de QR Code pronto para impressão.
- **Link Único do Restaurante:** URL dedicada e personalizável para o estabelecimento.

---

## 5. Arquitetura & Premissas Técnicas

- **Plataforma Web Responsiva (PWA):** Otimizado para smartphones (clientes) e monitores/tablets (cozinha e caixa).
- **Comunicação em Tempo Real:** WebSockets (Socket.IO / Supabase Realtime) ou polling eficiente para atualização instantânea na cozinha e no caixa.
- **Sem Autenticação para Clientes:** O token/número da comanda é o identificador temporário de sessão de consumo.

---

## 6. Próximos Passos na Metodologia BMad

1. **Revisão e Validação:** Confirmar com o usuário se o escopo deste Product Brief atende 100% às expectativas.
2. **Criação do PRD (`bmad-prd`):** Detalhar as histórias de usuário, requisitos não-funcionais, regras de negócio e esquemas de dados.
3. **Desenvolvimento do UX/UI (`bmad-ux`):** Desenhar as telas e protótipos para o Cardápio, KDS e Painel do Caixa.
4. **Arquitetura Técnica (`bmad-architecture`):** Definir stack (Node.js/React, Next.js, Supabase, PostgreSQL, TailwindCSS, WebSockets).
