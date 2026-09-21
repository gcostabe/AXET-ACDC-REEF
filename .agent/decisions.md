# ARCHITECTURAL DECISIONS

## ADR-001 — Adoção de Memória Persistente e Protocolo de Recuperação

Date: 2026-09-20

Status: Accepted

### Context
Sessões de agentes de IA sofrem compactação periódica, perda de contexto em conversas longas e esquecimento ao abrir novos chats ou reiniciar o editor.

### Decision
Implantar arquitetura de memória persistente composta por `AGENTS.md`, `.agent/current_task.md`, `.agent/execution_journal.md`, `.agent/state.md`, `.agent/decisions.md`, `.agent/recovery.md` e histórico mensal.

### Rationale
Garantir que a intenção venha sempre da mensagem mais recente do usuário, enquanto o estado de execução e histórico de decisões ficam preservados em disco com checkpoints transacionais.

### Consequences
O agente é capaz de se recuperar instantaneamente de perdas de contexto sem repetir tarefas concluídas e sem executar tarefas zumbi.

### Related Files
- `AGENTS.md`
- `.agent/current_task.md`
- `.agent/execution_journal.md`
- `.agent/recovery.md`

---

## ADR-002 — Validação Sintática Determinística com Prioridade sobre LLM

Date: 2026-09-20

Status: Accepted

### Context
Modelos de linguagem generativa possuem taxa de alucinação na contagem de parênteses e delimitadores em expressões matemáticas longas, podendo gerar aprovações indevidas ou mensagens contraditórias.

### Decision
Implementar o motor de verificação de sintaxe e parênteses de forma 100% determinística no backend (`checkFormulaSyntax`). O resultado determinístico tem precedência absoluta sobre qualquer resposta do LLM. Se houver falha de parênteses ou delimitadores, a fórmula é rejeitada imediatamente com detalhamento exato.

### Rationale
Eliminar contradições e garantir integridade matemática inviolável no salvamento de fórmulas do Motor Tronador RTE.

### Consequences
Zero alucinação em balanceamento de delimitadores; bloqueio imediato de salvamento de fórmulas inválidas.

### Related Files
- `server/src/routes/rte.js`
- `client/src/components/RatingEngineTab.jsx`

---

## ADR-003 — Padrão de Design Corporativo NTT DATA (#0066FF)

Date: 2026-09-20

Status: Accepted

### Context
A plataforma ACDC necessitava de alinhamento visual com a identidade visual corporativa da NTT DATA.

### Decision
Adotar o azul elétrico `#0066FF` como cor primária, fundo Dark Navy `#070A12`, bordas sutis `#182338` e o logotipo em loop circular da NTT DATA.

### Rationale
Consistência institucional e experiência de usuário premium corporativa.

### Consequences
Aparência limpa, moderna e alinhada às diretrizes da organização.

### Related Files
- `client/src/index.css`
- `client/src/App.jsx`
- `client/src/components/LoginModal.jsx`
- `client/src/components/ChatBotWidget.jsx`
