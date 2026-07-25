# PlanKit Command Suite Specification

> [!IMPORTANT]
> **PlanKit Standard**: PlanKit is a standardized, tool-agnostic command framework for AI coding assistants. It organizes multi-phase feature development into distinct, predictable steps with context-aware execution and automated progress tracking.

---

## The 4 Core Commands

### 1. `plankit.plan` [feature-name] [requirements]
- **Purpose**: Initializes a new feature task.
- **Actions**:
  1. Creates feature directory: `artifacts/current/<feature-name>/`.
  2. Creates master overview & status tracking table in `artifacts/current/<feature-name>/README.md`.
  3. Creates phase specification files: `artifacts/current/<feature-name>/phases/phase-1-<name>.md`, `phase-2-<name>.md`, etc.
  4. Generates initial Phase 1 implementation plan artifact and requests user approval.

### 2. `plankit.clarify`
- **Purpose**: Conducts a structured design alignment and requirements interview.

### 3. `plankit.implement` [Phase N]
- **Purpose**: Executes a single phase with context continuity. Reads `phases/phase-N.md` AND all previous outputs (`outputs/phase-1..N-1-output.md`).

### 4. `plankit.review`
- **Purpose**: Verifies Definition of Done (DoD) and archives completed features to `artifacts/archived/`.
