# AGENTS.md — PlanKit Command Suite for AI Agents

All AI coding assistants (Codex, Claude Code, OpenCode, Antigravity, Cursor) interacting with this codebase must follow the **PlanKit Command Suite**:

## Commands

1. `plankit.plan` (or `/plankit-plan`): Initialize feature under `artifacts/current/<feature-name>/`, create `README.md` progress matrix, and write `phases/phase-N-*.md` specs.
2. `plankit.clarify` (or `/plankit-clarify`): Analyze requirements and ask targeted clarifying questions before executing code edits.
3. `plankit.implement` (or `/plankit-implement`): Execute Phase N by reading `phases/phase-N.md` **AND all previous outputs** (`outputs/phase-1..N-1-output.md`), writing `outputs/phase-N-output.md`, and updating `README.md`.
4. `plankit.review` (or `/plankit-review`): Run test & build verification, validate DoD, and move feature folder to `artifacts/archived/<feature-name>`.

Canonical Specification: `artifacts/PLANKIT.md`
