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
