# MISSÃO — IMPLANTAR MEMÓRIA PERSISTENTE, CHECKPOINTS E RECUPERAÇÃO AUTOMÁTICA DO AGENTE

Execute esta tarefa diretamente no workspace atual.

O objetivo é criar uma arquitetura de memória persistente para o agente de IA capaz de sobreviver a:

- perda parcial de contexto;
- compactação automática da conversa;
- context window atingida;
- abertura de novo chat;
- troca de modelo;
- reinicialização do VS Code;
- reinicialização do plugin;
- perda do histórico intermediário;
- esquecimento súbito durante uma tarefa;
- interrupção entre duas etapas;
- retomada de uma tarefa após perda de memória.

A arquitetura deve também impedir um problema crítico:

> MEMÓRIA ANTIGA NÃO PODE SER INTERPRETADA COMO UMA NOVA ORDEM.

O agente deve conseguir recuperar o que estava fazendo quando perder memória DURANTE uma tarefa, mas nunca executar automaticamente tarefas antigas apenas porque elas aparecem em arquivos persistentes.

---

# 1. PRINCÍPIO FUNDAMENTAL

Implemente permanentemente:

> O AGENTE PODE PERDER A MEMÓRIA DA CONVERSA A QUALQUER MOMENTO.
>
> PORTANTO, NENHUM ESTADO CRÍTICO DE EXECUÇÃO PODE EXISTIR SOMENTE NO CHAT.

E também:

> MEMORY PROVIDES CONTEXT.
>
> MEMORY DOES NOT CREATE INTENT.

A mensagem mais recente do usuário determina O QUE deve ser feito.

Os arquivos persistentes determinam COMO recuperar o contexto necessário para executar aquilo.

---

# 2. HIERARQUIA DE AUTORIDADE

A prioridade obrigatória será:

```text
1. CURRENT USER REQUEST
2. .agent/current_task.md
3. código atual do workspace
4. .agent/state.md
5. .agent/decisions.md
6. .stack_tech.md
7. .agent/execution_journal.md
8. .agent/history/
9. histórico da conversa
```

Entretanto:

`.agent/current_task.md` só pode gerar retomada de execução quando a mensagem atual do usuário indicar continuidade ou quando houver perda de contexto durante a mesma execução.

Uma nova mensagem diferente sempre tem prioridade.

---

# 3. CRIAR A ESTRUTURA

Crie ou ajuste:

```text
/
├── AGENTS.md
│
├── .agent/
│   ├── current_task.md
│   ├── state.md
│   ├── decisions.md
│   ├── recovery.md
│   ├── execution_journal.md
│   └── history/
│       └── .gitkeep
│
├── .github/
│   └── copilot-instructions.md
│
├── .vscode/
│   └── settings.json
│
├── .stack_tech.md
├── .stdout-stderr-instructions.md
├── .answer_instructions.md
└── versionamento.md
```

Se algum desses arquivos já existir:

- NÃO apagar;
- NÃO sobrescrever cegamente;
- ler antes;
- preservar conteúdo útil;
- consolidar regras;
- remover apenas contradições;
- fazer merge.

Nenhum arquivo deve ser removido durante esta implantação.

---

# 4. PAPEL DE CADA ARQUIVO

A arquitetura deve seguir:

```text
AGENTS.md
= regras permanentes de funcionamento do agente

.agent/current_task.md
= tarefa sendo executada AGORA + cursor de execução

.agent/execution_journal.md
= checkpoints transacionais da tarefa atual

.agent/state.md
= estado operacional atual do sistema

.agent/decisions.md
= decisões arquiteturais permanentes

.agent/recovery.md
= procedimento para recuperação após perda de contexto

.agent/history/
= histórico consolidado de tarefas anteriores

.stack_tech.md
= arquitetura, tecnologias e estrutura técnica

source code
= verdade final da implementação
```

---

# 5. REGRA MAIS IMPORTANTE

A mensagem atual do usuário tem prioridade absoluta.

Nunca execute uma atividade simplesmente porque ela aparece como:

```text
ACTIVE
PENDING
TODO
NEXT
NEXT ACTION
NEXT RECOMMENDED ACTION
OPEN THREAD
IN PROGRESS
SUSPENDED
```

em arquivos persistentes.

Informações persistidas são CONTEXTO.

Elas não são automaticamente uma ordem.

---

# 6. CLASSIFICAÇÃO DA MENSAGEM ATUAL

Antes de executar trabalho técnico, classifique internamente a mensagem atual como:

```text
NEW_TASK
CONTINUE_TASK
INFORMATIONAL
```

## NEW_TASK

Uma nova solicitação diferente da tarefa persistida.

Resultado:

```text
old task
→ SUSPENDED

new user request
→ ACTIVE
```

A nova solicitação vence.

---

## CONTINUE_TASK

Mensagens como:

```text
continue
prossiga
continue de onde paramos
retome
pode continuar
termine aquilo
continue a implementação anterior
```

Resultado:

```text
read current_task.md
↓
recover checkpoint
↓
verify source
↓
continue
```

---

## INFORMATIONAL

Perguntas, análises ou solicitações que não significam retomada da tarefa anterior.

Exemplo:

```text
Qual porta esse servidor utiliza?
```

Resultado:

Responder a pergunta.

NÃO retomar tarefa antiga.

---

# 7. NOVA SESSÃO NÃO SIGNIFICA CONTINUE

Uma nova sessão deve operar assim:

```text
NEW CHAT
   ↓
AGENTS.md
   ↓
carregar regras
   ↓
WAIT FOR USER MESSAGE
   ↓
classificar intenção
```

É PROIBIDO fazer:

```text
NEW CHAT
   ↓
ler tarefa antiga
   ↓
executar automaticamente
```

Nova sessão significa recuperar capacidade de entendimento.

Não significa autorização para continuar trabalho antigo.

---

# 8. AGENTS.md

Crie ou ajuste `AGENTS.md` para conter obrigatoriamente as seguintes regras.

```md
# AGENT BOOTSTRAP — PERSISTENT MEMORY AND EXECUTION RECOVERY

## ABSOLUTE PRIORITY

The latest user message is always the authoritative source of current intent.

Persistent memory provides context.

Persistent memory does not create intent.

Never execute a task only because it appears as ACTIVE, PENDING, TODO, NEXT, RECOMMENDED, IN_PROGRESS or SUSPENDED in memory.

---

# INTENT CLASSIFICATION

Before technical execution, classify the latest user message as:

- NEW_TASK
- CONTINUE_TASK
- INFORMATIONAL

If NEW_TASK:
the new request overrides previous tasks.

If CONTINUE_TASK:
recover `.agent/current_task.md`.

If INFORMATIONAL:
answer the current request without resuming previous work.

---

# SESSION BOOTSTRAP

At the beginning of a session:

1. Load these rules.
2. Do not automatically execute old work.
3. Wait for the current user request.
4. Classify current intent.
5. Load only the memory required for that request.

---

# MEMORY LOSS WATCHDOG

Assume conversational memory can disappear at any moment.

No critical execution information may exist only in conversation history.

During long or multi-step work, persist checkpoints in:

`.agent/current_task.md`

and:

`.agent/execution_journal.md`

---

# MEMORY UNCERTAINTY DETECTION

If at any moment you are uncertain about:

- what task is currently being executed;
- which step is active;
- what has already been completed;
- what file was changed;
- why a change was made;
- whether a command already ran;
- what the next safe action is;
- whether you are about to repeat previous work;

STOP.

Do not guess.

Do not repeat previous steps.

Read:

`.agent/current_task.md`

Then inspect:

`.agent/execution_journal.md`

Then reconcile with the actual relevant source files.

Resume only after identifying the last safe checkpoint.

---

# RECOVERY IS NOT AUTHORIZATION

Recovering previous context does not automatically authorize previous work.

A previous task may only be resumed when:

1. the current user request explicitly indicates continuation;

OR

2. context was lost during the currently executing task.

---

# CURRENT USER REQUEST HAS PRIORITY

Always ask internally:

WHAT DID THE USER ASK ME TO DO NOW?

The answer must come from the latest user message.

Never infer current intent from historical memory alone.

---

# CURRENT TASK

`.agent/current_task.md` contains the execution checkpoint for the current or suspended task.

It is not authorization by itself.

---

# CHECKPOINT POLICY

Persist a checkpoint whenever:

- investigation identifies the root cause;
- an important technical decision is made;
- a relevant file is modified;
- a planned step completes;
- validation succeeds or fails;
- execution moves to another subsystem;
- the next safe action changes;
- the model detects memory uncertainty;
- conversation summarization or context loss occurs.

---

# WRITE-AHEAD CHECKPOINT

Before a significant change, persist:

- intended action;
- relevant file;
- reason;
- current state;
- expected next action.

After the change, persist:

- what actually changed;
- result;
- validation;
- next safe action.

---

# SOURCE OF TRUTH

Current user intent:
latest user message.

Current implementation:
actual source files.

Current execution:
`.agent/current_task.md`

Execution checkpoints:
`.agent/execution_journal.md`

Current project state:
`.agent/state.md`

Architecture:
`.stack_tech.md`

Permanent decisions:
`.agent/decisions.md`

History:
`.agent/history/`

---

# CONTEXT EFFICIENCY

Never automatically load:

- the entire repository;
- the entire execution journal;
- all historical files;
- complete Git history;
- all logs.

Retrieve selectively.

---

# CONFLICT RESOLUTION

If memory disagrees with source code:

SOURCE CODE WINS.

Update stale memory after confirming the real implementation.

---

# SAFETY

Never execute destructive permanent actions without explicit authorization.

Prefer atomic commands.

Never occupy the execution channel indefinitely just to watch stdout/stderr.

Follow:

`.stdout-stderr-instructions.md`

---

# BOOTSTRAP TEST

If asked:

bootstrap-status

respond:

BOOTSTRAP_ACTIVE

Then verify:

`.agent/current_task.md`
`.agent/state.md`

and report whether each exists.
```

---

# 9. CURRENT_TASK.MD

Crie:

```text
.agent/current_task.md
```

Este é o arquivo central para recuperação da tarefa em andamento.

Ele deve conter APENAS UMA tarefa.

Formato:

```md
# CURRENT TASK

Task ID:

Created:

Last Updated:

Status:

NONE | ACTIVE | SUSPENDED | COMPLETED | CANCELLED

Resume Authorization:

YES | NO

---

## User Request

Solicitação original do usuário responsável pela criação desta tarefa.

---

## Objective

Objetivo técnico atual.

---

## Execution Cursor

Phase:

PLANNING | INVESTIGATION | IMPLEMENTATION | VALIDATION | COMPLETED

Current Step:

Last Safe Checkpoint:

---

## Completed

- [ ] item

---

## In Progress

- [ ] item

---

## Not Started

- [ ] item

---

## Last Action

File:

Action:

Result:

---

## Next Safe Action

Descrever exatamente a próxima ação segura.

---

## Relevant Files

- arquivo
- arquivo

---

## Important Findings

- descoberta
- descoberta

---

## Constraints

- restrição
- restrição

---

## Resume Procedure

If context is lost during execution:

1. Read this file.
2. Read the latest checkpoint in `.agent/execution_journal.md`.
3. Verify the state of relevant source files.
4. Identify the last safe checkpoint.
5. Resume only from `Next Safe Action`.
6. Do not repeat completed steps.
```

---

# 10. RESUME AUTHORIZATION

Por padrão:

```text
Resume Authorization: NO
```

Quando uma tarefa estiver sendo executada dentro da mesma solicitação e houver perda de contexto:

```text
Resume Authorization: YES
```

Ao terminar:

```text
Status: COMPLETED
Resume Authorization: NO
```

Ao ser substituída por nova solicitação:

```text
Status: SUSPENDED
Resume Authorization: NO
```

Ao ser cancelada:

```text
Status: CANCELLED
Resume Authorization: NO
```

---

# 11. TASK ID

Toda nova tarefa técnica deve possuir ID.

Formato:

```text
TASK-YYYYMMDD-HHMM-SHORT-NAME
```

Exemplo:

```text
TASK-20260919-2255-COCKPIT-SESSIONS
```

A mesma Task ID deve aparecer em:

```text
current_task.md
execution_journal.md
history
```

quando aplicável.

---

# 12. EXECUTION_JOURNAL.MD

Crie:

```text
.agent/execution_journal.md
```

Este arquivo contém os checkpoints transacionais da TAREFA ATUAL.

Estrutura:

```md
# EXECUTION JOURNAL

Current Task ID:

---

## CHECKPOINT-001

Timestamp:

Phase:

State:

BEFORE_ACTION | AFTER_ACTION | VALIDATION | RECOVERY

### Action

O que está prestes a acontecer ou acabou de acontecer.

### Relevant Files

- arquivo

### Finding / Result

Resultado confirmado.

### Validation

Validação realizada, quando aplicável.

### Next Safe Action

Próxima ação técnica segura.

---
```

---

# 13. JOURNAL NÃO É HISTÓRICO ETERNO

O `execution_journal.md` representa somente a tarefa atual.

Quando uma nova tarefa começar:

1. consolidar a tarefa anterior em `.agent/history/YYYY-MM.md` quando relevante;
2. preservar resumo necessário;
3. reinicializar `execution_journal.md`;
4. registrar o novo Task ID.

Não deixar o journal crescer indefinidamente.

---

# 14. CHECKPOINTS OBRIGATÓRIOS

Grave checkpoint sempre que:

## Investigação concluir algo importante

Exemplo:

```text
causa raiz encontrada
```

## Antes de alteração relevante

Exemplo:

```text
vou alterar dashboard/app.js
```

## Depois de alteração relevante

Exemplo:

```text
dashboard/app.js alterado
```

## Validação acontecer

Exemplo:

```text
endpoint validado
```

## Próximo passo mudar

Exemplo:

```text
backend concluído
agora frontend
```

## Memória ficar incerta

Exemplo:

```text
não sei se já fiz esta alteração
```

Nesse caso:

STOP → RECOVERY.

---

# 15. WRITE-AHEAD CHECKPOINT

Antes de uma alteração relevante:

registre algo equivalente a:

```md
## CHECKPOINT-007

State: BEFORE_ACTION

### Action

Modify `dashboard/app.js`.

### Reason

Correct stale session rendering.

### Current State

Backend already validated.

### Next Safe Action

Modify updateSessions().
```

Depois execute.

Após executar:

```md
## CHECKPOINT-008

State: AFTER_ACTION

### Action

Modified `dashboard/app.js`.

### Result

Session rendering logic updated.

### Validation

Pending.

### Next Safe Action

Run frontend validation.
```

---

# 16. RECUPERAÇÃO APÓS PERDA DE MEMÓRIA

Se o agente perceber:

- "não lembro o que estava fazendo";
- "não sei o próximo passo";
- "não sei se já alterei esse arquivo";
- "não sei se este comando já foi executado";
- "não sei por que abri este arquivo";
- "estou prestes a repetir algo";
- conversa foi resumida;
- contexto anterior foi removido;

execute:

```text
STOP
  ↓
READ current_task.md
  ↓
READ latest execution_journal checkpoint
  ↓
INSPECT relevant source files
  ↓
RECONCILE
  ↓
RESUME FROM Next Safe Action
```

Nunca adivinhar.

---

# 17. NÃO REPETIR AÇÕES

Antes de repetir:

- alteração de arquivo;
- execução de migration;
- modificação de configuração;
- comando com efeito colateral;
- geração de artefato;
- commit;
- push;

confirme no:

```text
current_task.md
execution_journal.md
source code
```

se aquilo já aconteceu.

Se estiver marcado como concluído e o código confirmar:

NÃO repetir.

---

# 18. STATE.MD

Crie ou atualize:

```text
.agent/state.md
```

Este arquivo representa o estado geral ATUAL do projeto.

Ele NÃO representa uma tarefa executável.

Estrutura:

```md
# CURRENT PROJECT STATE

Last Updated:

---

## Current Version

---

## System Summary

---

## Current Architecture

---

## Relevant Components

- arquivo — responsabilidade

---

## Project Operational Context

Estado atual do sistema.

---

## Known Issues

- problema

---

## Recent Changes

- mudança

---

## Open Threads

- assunto

IMPORTANT:

Open Threads are contextual information only.

They MUST NOT be executed automatically.

---

## Important Constraints

- restrição
```

---

# 19. REMOVER ACTIVE TASK DO STATE

Caso `state.md` possua:

```text
Active Task
Next Action
Next Recommended Action
Pending Work
```

migre informações de execução realmente atuais para:

```text
.agent/current_task.md
```

e transforme o restante em:

```text
Open Threads
```

explicitamente NÃO executável.

---

# 20. DECISIONS.MD

Crie ou atualize:

```text
.agent/decisions.md
```

Formato:

```md
# ARCHITECTURAL DECISIONS

## ADR-001 — Title

Date:

Status:

Accepted | Superseded | Deprecated

### Context

### Decision

### Rationale

### Consequences

### Related Files
```

Decisões são memória arquitetural.

Nunca são comandos executáveis.

---

# 21. RECOVERY.MD

Crie:

```text
.agent/recovery.md
```

com:

```md
# AGENT CONTEXT RECOVERY PROTOCOL

## FUNDAMENTAL RULE

Recovery is not execution.

Recovering previous context does not automatically authorize previous work.

---

# CASE A — MEMORY LOSS DURING CURRENT EXECUTION

If context is lost while actively executing a user-authorized task:

1. Read `.agent/current_task.md`.
2. Read the latest relevant checkpoint from `.agent/execution_journal.md`.
3. Inspect relevant source files.
4. Determine the last safe checkpoint.
5. Resume from `Next Safe Action`.

Do not repeat completed work.

---

# CASE B — NEW CHAT

A new chat does NOT authorize continuation.

Wait for the user's current message.

Classify it.

If NEW_TASK:
follow the new task.

If CONTINUE_TASK:
recover current_task.

If INFORMATIONAL:
answer only the current request.

---

# CASE C — AMBIGUOUS MEMORY

If uncertain whether work was completed:

1. Check current_task.
2. Check execution journal.
3. Check source code.
4. Prefer implementation evidence.

Never guess.

---

# CASE D — STALE MEMORY

If memory disagrees with implementation:

source code wins.

Correct persistent memory.

---

# RECOVERY ORDER

1. current_task.md
2. latest relevant execution_journal checkpoint
3. relevant source files
4. state.md
5. decisions.md
6. stack_tech.md
7. selective history

---

# ABSOLUTE RULE

Never ask the user to repeat project context before attempting recovery from persistent memory.

Never execute historical work solely because it exists in memory.
```

---

# 22. HISTORY

Crie:

```text
.agent/history/
```

Use arquivos mensais:

```text
.agent/history/2026-09.md
.agent/history/2026-10.md
```

Formato:

```md
## YYYY-MM-DD HH:mm — TASK-ID — Title

### User Request

### Objective

### Result

### Important Decisions

### Validation

### Relevant Files

### Final Status
```

Não copiar código inteiro.

Git é responsável pelo histórico do código.

---

# 23. FINALIZAÇÃO DE TAREFA

Ao terminar uma tarefa:

1. validar;
2. atualizar `current_task.md`;
3. definir:

```text
Status: COMPLETED
Resume Authorization: NO
```

4. atualizar `state.md`;
5. registrar decisões permanentes;
6. consolidar resumo no histórico;
7. preservar resultado no journal até nova tarefa.

---

# 24. NOVA TAREFA

Quando uma nova solicitação técnica chegar:

Se existir tarefa ACTIVE:

```text
old task
→ SUSPENDED
→ Resume Authorization: NO
```

Consolidar checkpoint.

Criar novo:

```text
Task ID
User Request
Objective
Execution Cursor
```

Limpar/inicializar journal para nova Task ID.

---

# 25. TAREFA CANCELADA

Quando o usuário disser:

```text
cancele
pare
não faça mais isso
abandone essa implementação
```

marcar:

```text
Status: CANCELLED
Resume Authorization: NO
```

Nunca retomar automaticamente.

---

# 26. DETECTOR DE ZOMBIE TASK

Defina como ZOMBIE TASK:

> tarefa antiga executada sem autorização da solicitação atual.

Antes de uma ação técnica, verificar internamente:

```text
Esta ação pertence ao CURRENT USER REQUEST ou a uma tarefa explicitamente retomada?
```

Se NÃO:

```text
STOP
```

---

# 27. NÃO PERMITIR TASK DRIFT

Durante execução:

Toda ação deve estar relacionada ao:

```text
CURRENT_TASK_ID
```

Se surgir outro problema interessante mas não necessário para a tarefa:

registrar em:

```text
state.md → Open Threads
```

e NÃO executar.

---

# 28. CONTEXT BUDGET

Nunca carregar automaticamente:

- todo history;
- todo Git log;
- todos os logs;
- todo source;
- journal antigo inteiro.

Use informação seletiva.

Prioridade:

```text
current_task
>
latest checkpoint
>
relevant source
>
state
>
decisions
>
history
```

---

# 29. STACK_TECH

Preserve ou crie:

```text
.stack_tech.md
```

Documente apenas informações confirmadas:

- linguagens;
- runtime;
- frameworks;
- CLIs;
- estrutura;
- integrações;
- serviços;
- endpoints;
- telemetria;
- execução;
- dependências.

Não invente.

---

# 30. STDOUT / STDERR

Preserve ou atualize:

```text
.stdout-stderr-instructions.md
```

Garanta:

```md
# STDOUT / STDERR / PROCESS POLICY

Never use an indefinite foreground process only to watch another command.

Prefer atomic commands.

Avoid:

- endless tail -f
- endless watch
- interactive blocking commands
- unbounded foreground processes

For diagnostics:

- use bounded output;
- inspect logs;
- use grep;
- use short tail;
- verify processes using independent atomic commands.

If execution appears broken:

1. stop issuing duplicate commands;
2. inspect state;
3. inspect logs;
4. recover using atomic operations;
5. preserve task checkpoint.
```

---

# 31. ANSWER INSTRUCTIONS

Preserve ou crie:

```text
.answer_instructions.md
```

Garanta:

```md
# RESPONSE FORMAT

Use readable Markdown.

For technical tasks clearly report:

- current task;
- what was done;
- validation;
- current status;
- next step;
- blockers.

Do not produce large unformatted walls of text.
```

---

# 32. COPILOT INSTRUCTIONS

Crie ou atualize:

```text
.github/copilot-instructions.md
```

com regras equivalentes a:

```md
# Repository AI Instructions

Follow `AGENTS.md`.

The latest user request defines current intent.

Persistent memory provides context only.

For active execution recovery use:

`.agent/current_task.md`

and:

`.agent/execution_journal.md`

Never resume historical work merely because it exists in memory.

If context is lost during active execution, recover from checkpoints before asking the user to repeat context.
```

---

# 33. VSCODE SETTINGS

Se suportado, faça merge em:

```text
.vscode/settings.json
```

com:

```json
{
  "chat.useAgentsMdFile": true,
  "chat.includeApplyingInstructions": true,
  "chat.includeReferencedInstructions": true
}
```

Preserve todas as configurações existentes.

Garanta JSON válido.

---

# 34. MIGRAÇÃO DO SISTEMA ANTIGO

Se existirem:

```text
.agent_memory_rag.md
AGENT_MEMORY_SETUP.md
state.md antigo
ou outras memórias
```

não apagar.

Leia.

Classifique conteúdo:

```text
estado atual
→ state.md

tarefa realmente atual
→ current_task.md

decisões permanentes
→ decisions.md

histórico
→ history/
```

Não execute nenhuma tarefa encontrada durante a migração.

---

# 35. RECONCILIAÇÃO INICIAL

Durante a implantação:

NÃO PRESUMA qual tarefa antiga deve continuar.

Se puder determinar com segurança a tarefa atual e ela corresponder à solicitação atual desta implantação, registre-a.

Caso contrário:

```text
Status: NONE
Resume Authorization: NO
```

Nenhuma tarefa antiga deve ser executada.

---

# 36. PROTOCOLO DURANTE TAREFAS LONGAS

Fluxo:

```text
USER REQUEST
     ↓
CREATE TASK ID
     ↓
WRITE current_task
     ↓
CHECKPOINT
     ↓
ACTION
     ↓
CHECKPOINT
     ↓
ACTION
     ↓
CHECKPOINT
     ↓
VALIDATION
     ↓
CHECKPOINT
     ↓
COMPLETE
```

O agente nunca deve ficar muito à frente do último checkpoint persistido.

---

# 37. CHECKPOINT FREQUENCY

Não registrar cada comando trivial.

Registrar mudanças de estado relevantes.

Checkpoint obrigatório quando:

```text
investigation → root cause found

planning → implementation

file unchanged → modified

implementation → validation

validation → result

backend → frontend

one subsystem → another subsystem

memory stable → memory uncertain
```

---

# 38. RECUPERAÇÃO TRANSACIONAL

Se houver um checkpoint:

```text
BEFORE_ACTION
```

mas não houver:

```text
AFTER_ACTION
```

para a mesma ação:

não presuma que a ação ocorreu.

Verifique o arquivo/estado real.

Depois registre um checkpoint de recuperação:

```md
State: RECOVERY

Expected Previous Action:

Observed Actual State:

Conclusion:

Next Safe Action:
```

---

# 39. TESTE 1 — PERDA NO MEIO

Situação:

```text
Task: corrigir dashboard

Completed:
backend corrigido

In Progress:
frontend

Last Checkpoint:
backend validated

Next Safe Action:
modify dashboard/app.js
```

Contexto desaparece.

Resultado esperado:

```text
read current_task
read latest checkpoint
verify backend
continue frontend
```

Nunca reiniciar do começo.

---

# 40. TESTE 2 — NOVA SOLICITAÇÃO

Memória:

```text
Task:
corrigir stdout
```

Usuário:

```text
agora ajuste o dashboard
```

Resultado:

```text
stdout → SUSPENDED
dashboard → ACTIVE
```

Não continuar stdout.

---

# 41. TESTE 3 — CONTINUE

Memória:

```text
Task:
corrigir stdout

Status:
SUSPENDED
```

Usuário:

```text
continue aquela correção
```

Resultado:

```text
recover current_task
recover journal
verify source
resume
```

---

# 42. TESTE 4 — PERGUNTA

Memória possui tarefa ACTIVE.

Usuário pergunta:

```text
qual versão do Node usamos?
```

Resultado:

responder à pergunta.

Não executar tarefa antiga.

---

# 43. TESTE 5 — CHECKPOINT INCOMPLETO

Journal:

```text
CHECKPOINT-010
BEFORE_ACTION
modify server.js
```

Não existe AFTER_ACTION.

Após perda de contexto:

verificar `server.js`.

Não repetir a alteração sem verificar.

---

# 44. TESTE 6 — TAREFA CONCLUÍDA

Memória:

```text
Status: COMPLETED
Resume Authorization: NO
```

Novo chat.

Nunca executar novamente essa tarefa automaticamente.

---

# 45. BOOTSTRAP STATUS

Adicione suporte a:

```text
bootstrap-status
```

Resultado:

```text
BOOTSTRAP_ACTIVE
.current_task.md: FOUND
.state.md: FOUND
.execution_journal.md: FOUND
```

Use os caminhos completos corretos:

```text
.agent/current_task.md
.agent/state.md
.agent/execution_journal.md
```

---

# 46. RECOVERY STATUS

Adicione também suporte ao comando:

```text
recovery-status
```

Ao receber isso:

NÃO executar a tarefa.

Apenas ler:

```text
current_task.md
último checkpoint
```

e responder:

```text
Task ID:
Status:
Phase:
Current Step:
Last Safe Checkpoint:
Last Action:
Next Safe Action:
Resume Authorization:
```

Isso serve como diagnóstico manual.

---

# 47. CHECKPOINT STATUS

Adicione suporte a:

```text
checkpoint-status
```

Ao receber:

retornar somente:

```text
Task ID:
Latest Checkpoint:
Checkpoint State:
Latest Confirmed Result:
Next Safe Action:
```

Sem executar a próxima ação.

---

# 48. ARQUITETURA FINAL

A arquitetura deve funcionar assim:

```text
                CURRENT USER MESSAGE
                         │
                         ▼
                  INTENT CLASSIFIER
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      NEW_TASK        CONTINUE      INFORMATIONAL
          │              │              │
          ▼              ▼              ▼
    create task     current_task       answer
          │              │
          │              ▼
          │       execution_journal
          │              │
          │              ▼
          └──────────► source code
                         │
                         ▼
                      ACTION
```

Para recuperação:

```text
MEMORY LOSS
     ↓
current_task.md
     ↓
latest checkpoint
     ↓
source verification
     ↓
Next Safe Action
     ↓
RESUME
```

---

# 49. MODELO MENTAL

Considere:

```text
Conversation
= volatile memory

current_task.md
= persistent working memory

execution_journal.md
= transaction log

state.md
= system snapshot

decisions.md
= architectural memory

history/
= long-term memory

source code
= implementation truth
```

---

# 50. REGRA FINAL

Grave permanentemente:

> THE CURRENT USER REQUEST DEFINES WHAT TO DO.
>
> CURRENT_TASK DEFINES WHERE AN AUTHORIZED TASK STOPPED.
>
> EXECUTION_JOURNAL DEFINES WHAT ACTUALLY HAPPENED.
>
> SOURCE CODE CONFIRMS REALITY.
>
> STATE PROVIDES PROJECT CONTEXT.
>
> HISTORY PROVIDES PAST CONTEXT.
>
> MEMORY LOSS MUST TRIGGER RECOVERY, NOT GUESSING.
>
> RECOVERY MUST NOT CREATE NEW INTENT.
>
> NEVER REPEAT COMPLETED WORK WITHOUT VERIFYING ITS REAL STATE.
>
> NEVER EXECUTE HISTORICAL WORK WITHOUT CURRENT AUTHORIZATION.

---

# 51. EXECUTAR AGORA

Implemente esta arquitetura agora.

Não apenas explique.

Crie e atualize os arquivos necessários.

Não execute nenhuma tarefa antiga encontrada durante a migração.

Não faça deploy.

Não faça push.

Não delete arquivos.

Não use comandos destrutivos.

Preserve configurações existentes.

---

# 52. VALIDAÇÃO FINAL

Após implantação, valide a existência de:

```text
AGENTS.md
.agent/current_task.md
.agent/execution_journal.md
.agent/state.md
.agent/decisions.md
.agent/recovery.md
.agent/history/
.github/copilot-instructions.md
.vscode/settings.json
.stack_tech.md
.stdout-stderr-instructions.md
.answer_instructions.md
```

Verifique:

- JSON válido;
- ausência de regras contraditórias;
- nenhuma tarefa antiga executada;
- `current_task.md` consistente;
- journal inicializado;
- recovery configurado;
- checkpoint policy presente;
- prioridade do pedido atual explícita.

---

# 53. RELATÓRIO FINAL

Ao terminar, responda somente com:

## CREATED

Arquivos criados.

## UPDATED

Arquivos alterados.

## MIGRATED

Informações migradas.

## CURRENT TASK

Task ID:

Status:

Resume Authorization:

## CHECKPOINT SYSTEM

Confirme se `execution_journal.md` está ativo.

## RECOVERY SYSTEM

Confirme a lógica:

```text
memory loss
→ current task
→ checkpoint
→ source verification
→ resume
```

## SAFETY AGAINST OLD TASKS

Confirme que:

```text
new user request
>
old persistent task
```

## VALIDATION

Validações realizadas.

## TEST

Instrua o usuário a abrir um novo chat e executar:

```text
bootstrap-status
```

Depois:

```text
recovery-status
```

E depois:

```text
checkpoint-status
```

Não execute nenhuma atividade adicional após esse relatório.