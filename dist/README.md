# ngx-task

> **Signal-first controlled asynchronous actions for Angular with cancellation, lifecycle cleanup, and explicit concurrency policies.**

[![Documentation](https://img.shields.io/badge/docs-Starlight-e0234e.svg)](https://MahmoudAdelJR.github.io/ngx-task-suite/)
[![npm version](https://img.shields.io/npm/v/ngx-task.svg)](https://www.npmjs.com/package/ngx-task)
[![npm downloads](https://img.shields.io/npm/dm/ngx-task.svg)](https://www.npmjs.com/package/ngx-task)
[![license](https://img.shields.io/npm/l/ngx-task.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/ngx-task)](https://bundlephobia.com/result?p=ngx-task)
[![Angular](https://img.shields.io/badge/Angular-16%2B-dd0031?logo=angular)](https://angular.io)

Stop rewriting loading flags, cancellation controllers, duplicate submission guards, and queue mechanics for every Angular action. `ngx-task` provides a single reactive primitive that explicitly answers the question:

> **"What should happen when this asynchronous operation is invoked again before it finishes?"**

---

## 📖 Full Interactive Documentation

Explore the complete Astro Starlight documentation site:

👉 **[https://MahmoudAdelJR.github.io/ngx-task-suite/](https://MahmoudAdelJR.github.io/ngx-task-suite/)**

| Section | Links |
| :--- | :--- |
| 🚀 **Getting Started** | [Installation](https://MahmoudAdelJR.github.io/ngx-task-suite/getting-started/installation/) · [Quick Start](https://MahmoudAdelJR.github.io/ngx-task-suite/getting-started/quick-start/) |
| 🧠 **Concepts** | [Architecture](https://MahmoudAdelJR.github.io/ngx-task-suite/concepts/architecture/) · [Task vs Resource / RxJS](https://MahmoudAdelJR.github.io/ngx-task-suite/concepts/task-vs-resource/) |
| 🛠️ **Core API Reference** | [`createTask()`](https://MahmoudAdelJR.github.io/ngx-task-suite/api-reference/create-task/) · [Task Signals](https://MahmoudAdelJR.github.io/ngx-task-suite/api-reference/task-signals/) · [TaskExecution](https://MahmoudAdelJR.github.io/ngx-task-suite/api-reference/task-execution/) · [TaskContext](https://MahmoudAdelJR.github.io/ngx-task-suite/api-reference/task-context/) |
| 🚦 **Concurrency Policies** | [Overview](https://MahmoudAdelJR.github.io/ngx-task-suite/concurrency/overview/) · [`drop`](https://MahmoudAdelJR.github.io/ngx-task-suite/concurrency/drop/) · [`restart`](https://MahmoudAdelJR.github.io/ngx-task-suite/concurrency/restart/) · [`enqueue`](https://MahmoudAdelJR.github.io/ngx-task-suite/concurrency/enqueue/) · [`latest`](https://MahmoudAdelJR.github.io/ngx-task-suite/concurrency/latest/) · [`parallel`](https://MahmoudAdelJR.github.io/ngx-task-suite/concurrency/parallel/) |
| 🔌 **Handlers & Adapters** | [Promise / AbortSignal](https://MahmoudAdelJR.github.io/ngx-task-suite/handlers/promises/) · [RxJS & HttpClient](https://MahmoudAdelJR.github.io/ngx-task-suite/handlers/observables/) |
| ⚡ **Production Features** | [Timeouts](https://MahmoudAdelJR.github.io/ngx-task-suite/advanced/timeouts/) · [Anti-Flicker](https://MahmoudAdelJR.github.io/ngx-task-suite/advanced/anti-flicker/) · [Error Classification](https://MahmoudAdelJR.github.io/ngx-task-suite/advanced/error-handling/) · [Progress & Retries](https://MahmoudAdelJR.github.io/ngx-task-suite/advanced/progress-retries/) · [Lifecycle](https://MahmoudAdelJR.github.io/ngx-task-suite/advanced/lifecycle/) |
| 🎨 **Template Directives** | [Directives Overview](https://MahmoudAdelJR.github.io/ngx-task-suite/directives/overview/) |
| 🧪 **Testing Utilities** | [Testing Guide](https://MahmoudAdelJR.github.io/ngx-task-suite/testing/overview/) |
| 🔬 **Advanced** | [Zoneless Angular](https://MahmoudAdelJR.github.io/ngx-task-suite/advanced/zoneless/) |

---

## 📦 Installation

```bash
npm install ngx-task
```

**Peer dependencies:** `@angular/core >= 16.0.0` · `rxjs >= 7.5.0`

---

## ⚡ Quick Start

```ts
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';
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
      @if (saveProfile.pending()) { Saving… } @else { Save Profile }
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
    async (profile, { signal }) => this.api.saveProfile(profile, { signal }),
    {
      concurrency: 'drop', // Ignore duplicate clicks while running
      timeout: 15_000,     // Auto-abort after 15 s
      pendingDelay: 150,   // No spinner flash for sub-150 ms responses
    },
  );
}
```

---

## 🚦 Concurrency Policies

| Policy | Behavior | Typical Use Case |
| :--- | :--- | :--- |
| **`drop`** | Ignores new invocations while one is running. | Form submit · Login · Payment checkout |
| **`restart`** | Cancels active execution; runs newest immediately. | Live search · Filter inputs · Tab switching |
| **`enqueue`** | Runs invocations sequentially in FIFO order. | Audit logs · Sequential file uploads |
| **`latest`** | Finishes active; keeps only the newest queued invocation. | Autosave · Canvas/Slider sync |
| **`parallel`** | Runs up to `limit` executions simultaneously. | Bulk uploads · Parallel asset preloads |

---

## 🧠 Key Concepts

### Task vs Angular `resource` / `rxResource`
- **`resource`**: Declarative reactive data fetching driven by signal dependencies (reads).
- **`ngx-task`**: Imperative action triggered by user gestures (form submit, click) with explicit concurrency rules (writes/commands).

### Task vs RxJS Flattening Operators
RxJS operators (`exhaustMap`, `switchMap`, `concatMap`, `mergeMap`) transform streams. `ngx-task` surfaces execution handles, signals (`pending`, `running`, `result`, `error`), progress, anti-flicker timing, and `DestroyRef` cleanup as a first-class Angular primitive — no subjects or manual subscriptions required.

### Cooperative Cancellation
`ngx-task` provides an `AbortSignal` for Promise handlers and auto-calls `unsubscribe()` for RxJS Observables. Pass `context.signal` to `fetch()` or `HttpClient` to stop in-flight network I/O on cancel, timeout, or component destroy.

---

## 📂 Package Entry Points

| Import | Contents |
| :--- | :--- |
| `ngx-task` | `createTask`, all signals, schedulers, state machine, and adapters |
| `ngx-task/directives` | `TaskTriggerDirective`, `TaskDisableWhilePendingDirective`, `TaskBusyDirective` |
| `ngx-task/testing` | `createTaskHarness`, `createControlledTaskHandler`, `createDeferred`, `createTaskTestClock` |

---

## ⚖️ License
MIT © [Mahmoud Adel](https://github.com/MahmoudAdelJR)
