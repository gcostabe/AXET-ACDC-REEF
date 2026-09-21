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
`.agent/execution_journal.md`

and report whether each exists.
