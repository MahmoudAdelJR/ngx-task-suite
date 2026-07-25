# Phase 2 Specification: Core Documentation Pages

## 🎯 Goal
Write comprehensive documentation pages covering Getting Started, Core Architecture & Concepts, API Reference, Concurrency Policies, and Async Handlers.

## 📜 Work Items
1. **Getting Started (`getting-started/installation.md` & `getting-started/quick-start.md`)**:
   - Installation via npm, peer dependencies.
   - First `createTask` component example with button loading state and error handling.
2. **Concepts & Architecture (`concepts/architecture.md`)**:
   - `ngx-task` vs Angular `Resource` / `rxResource`.
   - `ngx-task` vs RxJS Flattening Operators (`exhaustMap`, `switchMap`, `concatMap`, `mergeMap`).
   - State machine architecture & cooperative cancellation.
3. **Core API Reference (`api-reference/create-task.md`, `api-reference/task-signals.md`, `api-reference/task-execution.md`, `api-reference/task-context.md`)**:
   - `createTask(handler, options)` complete options reference.
   - Signal properties: `status`, `pending`, `running`, `result`, `error`, `progress`, counters.
   - `TaskExecution` handle methods & signals (`done`, `cancel()`, `resultOrThrow()`).
   - `TaskContext` methods & properties (`signal`, `executionId`, `attempt`, `reportProgress()`).
4. **Concurrency Policies (`concurrency/overview.md`, `concurrency/drop.md`, `concurrency/restart.md`, `concurrency/enqueue.md`, `concurrency/latest.md`, `concurrency/parallel.md`)**:
   - Exhaustive explanations, sequence diagrams / flow visualizers, code examples for form submission, live search, audit log queueing, autosave, and bulk operations.
5. **Handlers & Adapters (`handlers/promises.md`, `handlers/observables.md`)**:
   - Promises & `AbortSignal` cooperative cancellation contract.
   - RxJS Observables, `HttpClient`, and `observableResult` policies.

## 🏁 Phase Deliverable
Complete set of core documentation Markdown/MDX files in `docs/src/content/docs/`.
