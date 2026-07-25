---
description: Execute Phase N by reading phases/phase-N.md AND all previous outputs, writing outputs/phase-N-output.md, and updating README.md.
---

Execute a feature phase according to PlanKit SOP.

Phase to implement: $ARG

1. Read target phase spec: `artifacts/current/<feature-name>/phases/phase-N-*.md`.
2. **Mandatory Context Load**: Read **ALL** previous output reports: `outputs/phase-1-output.md` through `outputs/phase-(N-1)-output.md`.
3. Execute code and configuration modifications.
4. Run automated tests or build verification commands.
5. Write execution report to `artifacts/current/<feature-name>/outputs/phase-N-output.md`.
6. Update `artifacts/current/<feature-name>/README.md`: mark Phase N as `[x]` and update status matrix.
