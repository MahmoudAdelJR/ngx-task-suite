# ngx-task

> **Signal-first controlled asynchronous actions for Angular with cancellation, lifecycle cleanup, and explicit concurrency policies.**

[![npm version](https://img.shields.io/npm/v/ngx-task.svg)](https://www.npmjs.com/package/ngx-task)
[![license](https://img.shields.io/npm/l/ngx-task.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/ngx-task)](https://bundlephobia.com/result?p=ngx-task)

Stop rewriting loading flags, cancellation controllers, duplicate submission guards, and queue mechanics for every Angular action. `ngx-task` provides a single reactive primitive that explicitly answers the question:

> **"What should happen when this asynchronous operation is invoked again before it finishes?"**

---

## ⚡ Quick Start

```ts
import { Component, inject } from '@angular/core';
import { createTask, TaskTriggerDirective, TaskDisableWhilePendingDirective } from 'ngx-task';
import { TaskTriggerDirective, TaskDisableWhilePendingDirective } from 'ngx-task/directives';

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [TaskTriggerDirective, TaskDisableWhilePendingDirective],
  template: `
    <button
      type="button"
      [taskTrigger]="saveProfile"
      [taskArgs]="userForm"
      taskDisableWhilePending
    >
      @if (saveProfile.pending()) {
        Saving…
      } @else {
        Save Profile
      }
    </button>

    @if (saveProfile.error(); as err) {
      <p class="error">{{ err.message }}</p>
    }
  `,
})
export class ProfileEditorComponent {
  private api = inject(ProfileApiService);
  readonly userForm = { name: 'Alice', email: 'alice@example.com' };

  readonly saveProfile = createTask(
    async (profile, { signal }) => {
      return this.api.saveProfile(profile, { signal });
    },
    {
      concurrency: 'drop', // Prevent duplicate submissions while active
      timeout: 15_000,     // 15 seconds timeout
      pendingDelay: 150,   // Prevent visual flicker on fast requests
    },
  );
}
```

---

## 🚦 Concurrency Policies Comparison

| Policy | Behavior | Typical Use Case |
| :--- | :--- | :--- |
| **`drop`** | Ignores new invocations while an execution is running. | Form submission, Login, Payment checkout, Destructive actions |
| **`restart`** | Supersedes active execution and runs the newest invocation immediately. | Search suggestions, Live form validation, Tab switching |
| **`enqueue`** | Executes invocations sequentially in FIFO order. | Ordered audit logs, Sequential file uploads, Document patches |
| **`latest`** | Finishes active execution, but keeps only the newest queued invocation (superseding intermediate ones). | Autosave document, Canvas/Slider sync, Editor autosave |
| **`parallel`** | Runs up to `limit` executions simultaneously, queueing excess invocations. | Bulk file uploads, Preloading independent assets, Batch jobs |

---

## 🧠 Conceptual Reference

### 1. Task vs Resource
- **`Resource` (e.g. `rxResource` / `resource`):** Reactive value loading bound to dependency signals (declarative data fetching).
- **`Task` (`ngx-task`):** Explicit command triggered imperatively by user interaction (form submit, button click, file upload) with explicit concurrency rules.

### 2. Task vs RxJS Flattening Operators
RxJS flattening operators (`exhaustMap`, `switchMap`, `concatMap`, `mergeMap`) operate on stream transformations. `ngx-task` exposes execution handles, signals (`pending`, `running`, `result`, `error`), progress, anti-flicker timing, and component `DestroyRef` cleanup as a high-level Angular primitive.

### 3. Cooperative Cancellation Contract
`ngx-task` provides an `AbortSignal` for Promise handlers and automatically calls `unsubscribe()` for RxJS Observables. Handlers must observe `context.signal` (or pass it to `fetch` / `HttpClient`) to stop ongoing network I/O.

---

## 📦 Package Entry Points

- `ngx-task` — Core `createTask`, signals, schedulers, state machines, and adapters.
- `ngx-task/directives` — Optional template directives (`[taskTrigger]`, `[taskDisableWhilePending]`, `[taskBusy]`).
- `ngx-task/testing` — Test utilities (`createTaskHarness`, `createControlledTaskHandler`, `createDeferred`, `createTaskTestClock`).

---

## ⚖️ License
MIT © Antigravity Team
