# Antigravity Workspace Rules — PlanKit Integration

Whenever working in this workspace, strictly adhere to the **PlanKit Command Suite** defined in `artifacts/PLANKIT.md`.

## Recognized PlanKit Commands

### 1. `plankit.plan` [feature-description]
- Create `artifacts/current/<feature-name>/`.
- Create `README.md` with overview, progress table, and `[ ]` checkboxes.
- Create phase specs in `phases/phase-N-*.md`.
- Present Phase 1 implementation plan.

### 2. `plankit.clarify`
- Read `artifacts/current/<feature-name>/README.md` and target spec in `phases/`.
- Inspect codebase and present structured clarifying questions to user before modifying code.

### 3. `plankit.implement` [Phase N]
- Read `phases/phase-N-*.md` **AND all previous outputs** (`outputs/phase-1..N-1-output.md`).
- Execute changes, run tests, write `outputs/phase-N-output.md`, and update `README.md` (`[x]`).

### 4. `plankit.review`
- Run `npm run test` and `npm run build`.
- Validate DoD checklist.
- Move completed feature folder from `artifacts/current/<feature-name>` to `artifacts/archived/<feature-name>`.
