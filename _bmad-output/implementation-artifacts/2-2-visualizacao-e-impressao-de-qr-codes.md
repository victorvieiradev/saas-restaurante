# Story 2.2: Visualização e Impressão de QR Codes

Status: done

## Story Description

- **Como** Gestor do Restaurante (Admin),
- **Quero** visualizar e imprimir os QR Codes de cada comanda cadastrada,
- **Para que** possa colar ou afixar os códigos nos cartões e mesas físicas do meu estabelecimento.

---

## Critérios de Aceitação (Acceptance Criteria)

### AC1: Renderização Visual de QR Code Individual
- [x] Componente visual dinâmico renderizando o QR Code que aponta diretamente para a URL do cliente (`/comanda/:qr_code_token` ou `${origin}/#/comanda/${qr_code_token}`).
- [x] O QR Code deve ter alta legibilidade (dimensão mínima adequada e alto contraste preto/branco) para fácil leitura via câmera de smartphone.
- [x] Exibição do número da comanda (ex: `#001`) e do token associado junto ao QR Code.

### AC2: Modal de Visualização & Ações Individuais (`QRCodeModal.jsx`)
- [x] Modal acionado ao clicar em "Ver QR Code" em qualquer linha da tabela de comandas.
- [x] Exibe o QR Code ampliado, nome do restaurante e número da comanda em destaque.
- [x] Botão para **Copiar Link** da comanda para a área de transferência.
- [x] Botão para **Baixar Imagem** (PNG/SVG) do QR Code individual.
- [x] Botão para **Imprimir Comanda Individual** diretamente.

### AC3: Impressão em Lote com Layout Amigável para Corte (`PrintComandasModal.jsx`)
- [x] Botão principal no topo da tela do `ComandaManager`: `[ Imprimir QR Codes ]`.
- [x] Modal/Visualização de prévia de impressão exibindo todas as comandas (ou comandas filtradas/selecionadas) em uma grade flexível (grid 2x3 ou 3x4 por folha A4).
- [x] Cada cartão impresso contém:
  - Cabeçalho com Nome/Logotipo do Restaurante.
  - Número da Comanda em fonte grande e destacada (ex: **Comanda #005**).
  - Imagem nítida do QR Code gerado.
  - Instrução simples para o cliente (ex: *"Aponte a câmera do seu celular para fazer seu pedido"*).
  - Linhas/Marcas de corte pontilhadas para facilitar o recorte manual com tesoura ou estilete.

### AC4: Suporte a Estilos de Impressão (`@media print`)
- [x] Regras CSS `@media print` dedicadas garantindo que apenas a grade de cartões de comandas seja enviada para a impressora/PDF.
- [x] Ocultamento automático de elementos de UI do admin durante a impressão (menus laterais, cabeçalhos, botões, modais de overlay e backgrounds escuros).
- [x] Garantia de fundo branco (`#FFFFFF`) e texto escuro (`#0F172A`) na impressão, economizando tinta e aumentando a precisão de leitura do scanner.

---

## Tasks / Subtasks de Implementação

- [x] **Task 1: Instalar / Integrar Biblioteca de QR Code (`qrcode.react`)** (AC: #1)
  - Instalar `qrcode.react` via `npm install qrcode.react`.
  - Configurar `QRCodeSVG` e `QRCodeCanvas` para renderização vetorial e exportação de imagem.

- [x] **Task 2: Criar Componente `QRCodeModal.jsx` (`src/components/admin/QRCodeModal.jsx`)** (AC: #1, #2)
  - Criar modal de visualização individual com QR Code em destaque.
  - Implementar ação de cópia de URL com feedback visual (toast / ícone de check).
  - Implementar download em PNG via conversão de canvas para data URL.
  - Implementar disparo de impressão da comanda individual (`window.print()`).

- [x] **Task 3: Criar Componente `PrintComandasModal.jsx` (`src/components/admin/PrintComandasModal.jsx`)** (AC: #3, #4)
  - Criar grade de impressão de cartões em lote.
  - Formatar cartões de mesa com nome do restaurante, número `#XXX`, QR Code e marcas de corte pontilhadas.
  - Oferecer opções de filtro/seleção de comandas a imprimir (*Todas*, *Apenas Disponíveis*, *Em Uso*, e seleção manual).

- [x] **Task 4: Integrar no `ComandaManager.jsx` (`src/components/admin/ComandaManager.jsx`)** (AC: #2, #3)
  - Adicionar botão `[ Imprimir QR Codes ]` no cabeçalho do `ComandaManager`.
  - Adicionar ação `[ Ver QR ]` / ícone `QrCode` em cada linha da tabela de comandas.
  - Conectar os estados de modal `selectedComandaForQR` e `showPrintModal`.

- [x] **Task 5: Adicionar Regras CSS para Impressão em `src/index.css`** (AC: #4)
  - Criar bloco `@media print` refinado.
  - Forçar exibição exclusiva do container de impressão (`.print-area`).
  - Ocultar `.no-print`, sidebars, navbars, botões e elementos de layout da web.

- [x] **Task 6: Validação e Testes Visuais** (AC: #1, #2, #3, #4)
  - Testar acionamento da janela de impressão do navegador (`window.print()`).
  - Validar compilação limpa via `npm run build`.

### Review Findings (Code Review)
- [x] [Review][Patch] Garantir renderização do canvas de QR Code trocando `className="hidden"` por `className="absolute opacity-0 pointer-events-none -z-50"` [`src/components/admin/QRCodeModal.jsx:136`]

---

## Dev Notes & Guardrails de Arquitetura

### Invariantes de Arquitetura & Alvo do QR Code
- **AD-2 (Sessão por Token de Comanda):** O link embutido no QR Code segue o padrão `/comanda/:qr_code_token` (`${window.location.origin}/#/comanda/${qr_code_token}`).
- **Sem Autenticação Exigida para o Cliente:** O QR Code leva o cliente direto para o cardápio sem solicitar login.

### Requisitos Visuais & Design (`ux/DESIGN.md`)
- **Tela do Admin (Modo Escuro):** Padrão do projeto (`bg-slate-900`, bordas `slate-800`, destaques em `orange-500` / `colors.primary`).
- **Modo de Impressão (Print Layout):** Fundo branco, texto escuro, bordas pontilhadas de corte, otimizado para cartões de mesa A4.

---

## Project Structure Notes

- `src/components/admin/QRCodeModal.jsx`: Modal para visualização, cópia, download em PNG e impressão de QR Code individual.
- `src/components/admin/PrintComandasModal.jsx`: Modal/Visão de impressão em lote com cartões estilizados para folha A4 e guias de corte.
- `src/components/admin/ComandaManager.jsx`: Gestão principal de comandas atualizada com botões de ação e modais integrados.
- `src/index.css`: Estilos globais e regras CSS para `@media print`.

---

## Dev Agent Record

### Agent Model Used
Gemini 3.6 Flash (High)

### Completion Notes List
- Instalada biblioteca `qrcode.react`.
- Desenvolvido componente `QRCodeModal.jsx` com suporte a visualização, cópia de URL com toast, download em PNG e impressão individual.
- Desenvolvido componente `PrintComandasModal.jsx` com seleção manual de comandas, filtros por status e layout A4 com linhas pontilhadas de corte.
- Integrados modais no `ComandaManager.jsx` com botão "Imprimir QR Codes" no topo e "Ver QR" em cada linha da tabela.
- Adicionadas regras `@media print` no `index.css` garantindo impressão limpa sem elementos da interface do admin.
- Validada compilação com sucesso via `npm run build` (0 erros).

### File List
- `src/components/admin/QRCodeModal.jsx`
- `src/components/admin/PrintComandasModal.jsx`
- `src/components/admin/ComandaManager.jsx`
- `src/index.css`
- `package.json`
- `_bmad-output/implementation-artifacts/2-2-visualizacao-e-impressao-de-qr-codes.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
