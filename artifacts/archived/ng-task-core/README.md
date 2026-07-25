# Feature: `ngx-task` Core Library Implementation Plan

> **Goal:** Build `ngx-task`, a signal-first controlled asynchronous action library for Angular featuring explicit concurrency policies (`drop`, `restart`, `enqueue`, `latest`, `parallel`), cooperative cancellation, lifecycle cleanup, and framework-independent pure TypeScript scheduling.

---

## 📊 Progress Matrix

| Phase | Description | Status | Spec File | Output File |
| :--- | :--- | :---: | :--- | :--- |
| **Phase 1** | Pure TypeScript Core Engine & Schedulers | ✅ Completed | [`phases/phase-1-core-engine.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/phases/phase-1-core-engine.md) | [`outputs/phase-1-output.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/outputs/phase-1-output.md) |
| **Phase 2** | Angular Signals Facade & Lifecycle Integration | ✅ Completed | [`phases/phase-2-angular-signals.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/phases/phase-2-angular-signals.md) | [`outputs/phase-2-output.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/outputs/phase-2-output.md) |
| **Phase 3** | RxJS Observable Adapter & HttpClient Support | ✅ Completed | [`phases/phase-3-observable-support.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/phases/phase-3-observable-support.md) | [`outputs/phase-3-output.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/outputs/phase-3-output.md) |
| **Phase 4** | Advanced Features (Timeouts, Retry, Progress, Anti-flicker) | ✅ Completed | [`phases/phase-4-production-features.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/phases/phase-4-production-features.md) | [`outputs/phase-4-output.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/outputs/phase-4-output.md) |
| **Phase 5** | Secondary Directives & Test Harness | ✅ Completed | [`phases/phase-5-directives.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/phases/phase-5-directives.md) | [`outputs/phase-5-output.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/outputs/phase-5-output.md) |
| **Phase 6** | Documentation, Demos, Bundling & CI/CD Release | ✅ Completed | [`phases/phase-6-docs-and-release.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/phases/phase-6-docs-and-release.md) | [`outputs/phase-6-output.md`](file:///G:/Study/ngx-task/artifacts/current/ng-task-core/outputs/phase-6-output.md) |

---

## 🎯 Architecture & Clarified Design Decisions

1. **Framework-Free Pure Core:** Core scheduling, state machines, and concurrency policies (`Drop`, `Restart`, `Enqueue`, `Latest`, `Parallel`) have zero dependence on Angular or RxJS.
2. **Explicit Concurrency First:** Every action must state its behavior when re-triggered while active.
3. **Signal-First State Representation:** All reactive properties (`pending`, `running`, `result`, `error`, `status`, counts) are exposed as read-only signals.
4. **Cooperative Cancellation:** `AbortSignal` for Promises and unsubscription for Observables.
5. **No Swallowing Errors:** Clear distinction between `succeeded`, `failed`, `cancelled`, `superseded`, `dropped`, and `timed-out`.
6. **Package Naming:** Primary package target is `ngx-task`.
7. **Injection Context & Lifecycle:** `createTask()` requires an Angular injection context by default for automatic `DestroyRef` cleanup, with an explicit `injector` option available for detached/service scenarios.
8. **RxJS Observable Integration:** Native RxJS Observable support (e.g. `HttpClient` operations) is built alongside Promises in the core release.


---

## 📁 Repository Strategy

```text
projects/ng-task/
├── src/
│   ├── lib/
│   │   ├── core/           # State machine, models, context
│   │   ├── schedulers/     # Drop, Restart, Enqueue, Latest, Parallel
│   │   ├── adapters/       # Promise, Observable adapters
│   │   ├── angular/        # createTask(), signals facade, DestroyRef
│   │   ├── directives/     # taskTrigger, taskDisableWhilePending, taskBusy
│   │   └── testing/        # Harness, fake clock, deferred helpers
│   └── public-api.ts
```
