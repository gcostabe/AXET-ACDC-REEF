# CURRENT PROJECT STATE

Last Updated: 2026-09-20 22:20:00 -03:00

---

## Current Version
ACDC Platform v2.4 (NTT DATA • MAPFRE BR-INT)

---

## System Summary
Plataforma de Subscrição Dinâmica (DUP) e Motor de Tarifação (RTE - Tronador) para seguros MAPFRE BR-INT. Inclui exploração estruturada do MongoDB, editor visual de fórmulas atuariais com drag-and-drop e validação sintática determinística com IA (Gateway Local), trilha de auditoria PECA com diff visual de alterações, controle de usuários por perfil e chatbot copilot RAG.

---

## Current Architecture
- **Frontend**: React 19 + Vite 8, CSS Vanilla com design system NTT DATA (#0066FF / Dark Navy #070A12), Lucide React.
- **Backend**: Node.js (Express) com conexão ao MongoDB 7.0 (bancos `acdc_dup_br-int` e `acdc_rte_br-int`).
- **AI Gateway Local**: `http://127.0.0.1:8766` (`gpt-5.6-terra-high`, embeddings `text-embedding-3-small`).
- **RAG Engine**: Base de conhecimento vetorial na coleção `KNOWLEDGE_BASE_RAG`.

---

## Relevant Components
- `client/src/App.jsx` — Shell da aplicação com cabeçalho corporativo, logo NTT DATA e abas.
- `client/src/components/RatingEngineTab.jsx` — Motor de tarifação (RTE), editor visual de fórmulas, toolbox de objetos e validação.
- `client/src/components/AuditTab.jsx` — Auditoria e Segurança (PECA) em tabela com modal de diff visual.
- `client/src/components/ChatBotWidget.jsx` — Assistente flutuante global ACDC Copilot com RAG.
- `client/src/components/RiskSelectionTab.jsx` — Regras de subscrição e seleção de risco com auditoria.
- `client/src/components/ProductsTab.jsx` — Catálogo de produtos e coberturas com auditoria.
- `server/src/routes/rte.js` — Endpoints do RTE, validação sintática determinística e bloqueio de fórmulas inválidas.
- `server/src/services/ragService.js` — Recuperação híbrida vetorial + léxica.

---

## Project Operational Context
Sistema operacional e funcional localmente:
- Frontend Vite ativo na porta 5173 (`http://localhost:5173`).
- Backend Express ativo na porta 4000 (`http://localhost:4000`).
- AI Gateway ativo em `http://127.0.0.1:8766`.
- Validação determinística obrigatória ao salvar fórmulas com bloqueio de inconsistências.
- Logo oficial NTT DATA ativo no cabeçalho, login e chatbot.

---

## Known Issues
- Nenhum erro crítico pendente.

---

## Recent Changes
- Validação automática por IA / motor sintático no salvamento de fórmulas atuariais (bloqueia gravação se rejeitada).
- Correção de mensagens contraditórias do validador sintático via analisador determinístico.
- Atualização do logo corporativo para o emblema oficial em loop da NTT DATA.

---

## Open Threads
- Acompanhar desempenho de consultas vetoriais no RAG com inclusão de novas coleções do MongoDB.

IMPORTANT:
Open Threads are contextual information only.
They MUST NOT be executed automatically.

---

## Important Constraints
- Nunca executar tarefas antigas sem autorização explícita na mensagem atual.
- Operadores matemáticos no editor de cálculo devem ser puramente textuais.
- Respostas da IA devem ser em português do Brasil (pt-BR) limpo sem termos estrangeiros.
- Manter o padrão de cores corporativo NTT DATA (#0066FF).
