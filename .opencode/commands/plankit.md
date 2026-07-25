---
description: PlanKit Command Suite master command. Evaluate sub-action (plan, clarify, implement, review).
---

PlanKit Command Suite master command.

Sub-action / Arguments: $ARG

Evaluate the sub-action:
- `plan`: Initialize feature under `artifacts/current/<feature-name>/`, create `README.md` matrix, and write `phases/phase-N-*.md` specs.
- `clarify`: Inspect codebase and specs, then ask structured clarifying questions before implementing code.
- `implement`: Read target spec AND all previous outputs (`outputs/phase-1..N-1-output.md`), execute changes, write `outputs/phase-N-output.md`, and update `README.md`.
- `review`: Run `npm run test` & `npm run build`, validate DoD checklist, and archive completed feature to `artifacts/archived/<feature-name>`.
