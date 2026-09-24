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
- `client/src/components/AdminTab.jsx` — Área Administrativa agregando gestão de usuários, ambientes MongoDB e Gateway de IA & Okta.
- `client/src/components/AiGatewayManagementTab.jsx` — Painel de governança do Local AI Gateway, saúde do token Okta e teste de inferência LLM.
- `client/src/components/EnvironmentsManagementTab.jsx` — Gestão, teste em tempo real e alternância dinâmica de instâncias MongoDB.
- `client/src/components/UsersManagementTab.jsx` — Painel de liberação e edição de permissões RBAC de usuários.
- `gateway/` — Local AI Gateway corporativo embarcado na porta 8766 (Python 3.11, AXET / Okta SSO).
- `server/src/routes/aiGateway.js` — Rotas REST de monitoramento de IA e teste de inferência.
- `server/src/routes/environments.js` — Endpoints REST para gerenciamento de ambientes MongoDB e teste de conectividade.
- `server/src/services/environmentService.js` — Persistência e mascaramento de credenciais de ambientes MongoDB.
- `server/src/db.js` — Ciclo de vida dinâmico do MongoClient, reconexão em runtime e fallback automático.
- `server/src/routes/rte.js` — Endpoints do RTE, validação sintática determinística e bloqueio de fórmulas inválidas.
- `server/src/services/ragService.js` — Recuperação híbrida vetorial + léxica.

---

## Project Operational Context
Sistema operacional e funcional localmente:
- Frontend Vite ativo na porta 5173 (`http://localhost:5173`).
- Backend Express ativo na porta 4000 (`http://localhost:4000`).
- Local AI Gateway embarcado ativo na porta 8766 (`http://127.0.0.1:8766`).
- Validação determinística obrigatória ao salvar fórmulas com bloqueio de inconsistências.
- Logo oficial NTT DATA ativo no cabeçalho, login e chatbot.
- Área Administrativa unificada com Usuários, Ambientes MongoDB e Gateway de IA & Okta.

---

## Known Issues
- Nenhum erro crítico pendente.

---

## Recent Changes
- Disponibilização do processo de instalação e execução rápida One-Click para Windows (`instalar_windows.bat`, `iniciar_windows.bat`) e macOS (`setup_mac.sh`, `iniciar_mac.command`), com atalho automático `Iniciar Cockpit NTT DATA` na Área de Trabalho/Mesa.
- Criação do `README.md` oficial com visão geral, arquitetura e passos de execução diária.
- Incorporação (embedding) completa do Local AI Gateway (AXET / Okta SSO) ao repositório ACDC com docker-compose e scripts.
- Criação da tela de governança de IA na Área Administrativa com teste de inferência atuarial em tempo real.
- Criação da Área Administrativa unificada com sub-abas para Usuários, Ambientes MongoDB e Gateway de IA & Okta.
- Gestão e cadastro de múltiplos ambientes MongoDB diretamente pela interface web sem arquivo `.env`.
- Teste de conectividade com medição de latência em tempo real e alternância em runtime com fallback de segurança.
- Validação automática por IA / motor sintático no salvamento de fórmulas atuariais (bloqueia gravação se rejeitada).

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
