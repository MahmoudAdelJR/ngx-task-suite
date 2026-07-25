# Phase 3 Specification: Advanced Features, Directives, Testing & Zoneless

## 🎯 Goal
Write documentation pages for Advanced Production Features, Angular Component Lifecycle, Directives, Testing Utilities, and Zoneless Angular.

## 📜 Work Items
1. **Lifecycle & Injection Context (`advanced/lifecycle.md`)**:
   - `DestroyRef` automatic cancellation.
   - `destroyBehavior` options: `'cancel'`, `'detach'`, `'allow'`.
   - Explicit `injector` passing for services/functions created outside injection context.
2. **Production Features (`advanced/production-features.md`)**:
   - Explicit Timeouts (`timeout` option).
   - Anti-Flicker Timing (`pendingDelay`, `minimumPendingDuration`).
   - Custom `classifyError` hook & error categorization.
   - Progress Reporting (`context.reportProgress()`).
   - Retries & Attempt Counter (`task.retryLast()`, `context.attempt`).
3. **Template Directives (`directives/overview.md`)**:
   - `[taskTrigger]` & `[taskArgs]`.
   - `[taskDisableWhilePending]` with `native` vs `aria` mode.
   - `[taskBusy]` for loading overlays.
4. **Testing Utilities (`testing/overview.md`)**:
   - Unit testing tasks with `createControlledTaskHandler()`.
   - Component testing with `createTaskHarness()`.
   - Fast isolated tests with `createDeferred` and `createTaskTestClock`.
5. **Zoneless Angular (`advanced/zoneless.md`)**:
   - Using `ngx-task` in Zoneless Angular apps with fine-grained signal reactivity.

## 🏁 Phase Deliverable
Complete advanced & utility documentation files in `docs/src/content/docs/`.
