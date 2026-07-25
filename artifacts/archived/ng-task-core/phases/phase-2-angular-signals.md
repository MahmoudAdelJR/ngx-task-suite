# Phase 2 Specification: Angular Signals Facade & Lifecycle Integration

## 🎯 Goal
Bridge the pure core scheduler engine to Angular applications using modern Signal-based reactivity, injection context integration, and automatic component lifecycle cleanup (`DestroyRef`).

---

## 📦 Scope & Key Deliverables

1. **Main Factory Function (`createTask`):**
   - `createTask<TArgs, TResult>(handler, options)` signature.
   - Intelligent Angular Injection Context detection via `inject()` / `assertInInjectionContext()`.

2. **Read-Only Signal Facade:**
   - Expose core reactive signals on `Task<TArgs, TResult>`:
     - `status: Signal<TaskStatus>`
     - `pending: Signal<boolean>`
     - `running: Signal<boolean>`
     - `result: Signal<TResult | undefined>`
     - `error: Signal<TaskError | undefined>`
     - `runningCount: Signal<number>`
     - `queuedCount: Signal<number>`
     - `executionCount: Signal<number>`
     - `lastExecution: Signal<TaskExecution<TArgs, TResult> | undefined>`
   - Implement `TaskExecution<TArgs, TResult>` signals (`status`, `progress`, `result`, `error`, `startedAt`, `finishedAt`).

3. **Angular Lifecycle & DestroyRef Cleanup:**
   - Automatic integration with `DestroyRef` when created within an Angular injection context.
   - Configurable `destroyBehavior`:
     - `'cancel'` (default): Aborts active executions, clears queues, prevents post-destroy signal updates.
     - `'detach'`: Disconnects signal listeners while allowing execution completion.
     - `'allow'`: Allows executions and signals to remain bound (for root services).

4. **Zoneless Support & Verification:**
   - Ensure zero dependency on `NgZone`, manual `ChangeDetectorRef.markForCheck()`, or zone flags.
   - Verify compatibility with Angular 16+ / 17+ / 18+ / 19+ / 20+ zoneless change detection.

---

## 🔍 Definition of Done (DoD)
- `createTask` runs seamlessly in both components and services.
- Destroying an Angular component automatically cancels running executions when `destroyBehavior` is `'cancel'`.
- Signals correctly drive template updates in zoneless mode.
