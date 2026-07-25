# Phase 4 Specification: Build & Verification

## 🎯 Goal
Verify that the Astro Starlight site builds cleanly without errors, validate all documentation routes and sidebar entries, verify root workspace integration scripts, check DoD, and archive the feature.

## 📜 Work Items
1. Add package.json workspace build scripts in root `package.json`: `"docs:dev"` and `"docs:build"`.
2. Run `npm run build` in `docs/` and capture output.
3. Fix any syntax or link issues found during compilation.
4. Verify all DoD criteria.
5. Move feature folder to `artifacts/archived/astro-starlight-docs/`.

## 🏁 Phase Deliverable
Verified Astro Starlight documentation build output in `docs/dist/` and feature archived.
