---
description: Run test & build verification, validate DoD, and move feature folder to artifacts/archived/<feature-name>.
---

Verify a completed feature and archive it according to PlanKit SOP.

1. Run full test suite (`npm run test`) and production build (`npm run build`).
2. Validate all Definition of Done checklist items in `artifacts/current/<feature-name>/README.md`.
3. Update `README.md` header title to `# Feature: <Feature Name> [ARCHIVED]`.
4. Move `artifacts/current/<feature-name>` directory to `artifacts/archived/<feature-name>`.
5. Present final completion summary report to user.
