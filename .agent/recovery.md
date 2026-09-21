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
