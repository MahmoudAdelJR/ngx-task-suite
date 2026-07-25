# Phase 5 Specification: Secondary Directives & Test Harness

## 🎯 Goal
Provide optional Angular template directives in a tree-shakable secondary entry point (`@your-scope/ng-task/directives` / `./directives`) and developer testing utilities (`@your-scope/ng-task/testing` / `./testing`).

---

## 📦 Scope & Key Deliverables

1. **Template Directives (`/directives` Entry Point):**
   - **`[taskTrigger]` Directive:**
     - Bindable to buttons/elements to execute task on click/event with `[taskArgs]`.
   - **`[taskDisableWhilePending]` Directive:**
     - Disables form controls/buttons during task pending state.
     - Supports `mode`: `'native'` (HTML disabled) or `'aria'` (`aria-disabled="true"`).
   - **`[taskBusy]` Directive:**
     - Binds `aria-busy="true"` and `data-task-pending="true"` to containers while task is pending.

2. **Testing Harness Utilities (`/testing` Entry Point):**
   - **`createTaskHarness(task)`:**
     - Mock harness for controlling execution resolution/rejection synchronously in tests.
     - API: `harness.resolve(id, result)`, `harness.reject(id, error)`, `harness.reportProgress(id, progress)`.
   - **`createControlledTaskHandler()`:**
     - Handler function wrapper for fine-grained assertion of invocation counts and abort signals.

---

## 🔍 Definition of Done (DoD)
- Directives are isolated in secondary entry points, keeping the core library tree-shakable and lean.
- Directives support accessibility standards (`aria-disabled`, `aria-busy`).
- Test harness enables fast unit testing of components consuming `ng-task` without async timing issues.
