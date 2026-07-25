# `ngx-task` Complete Technical Documentation & Developer Guide

> **Signal-first controlled asynchronous actions for Angular with explicit concurrency policies, cooperative cancellation, anti-flicker timing, and component lifecycle cleanup.**

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Installation & Setup](#2-installation--setup)
3. [Core API Reference](#3-core-api-reference)
   - [`createTask()`](#createtask)
   - [`Task<TArgs, TResult>`](#tasktargs-tresult)
   - [`TaskExecution<TArgs, TResult>`](#taskexecutiontargs-tresult)
   - [`TaskContext`](#taskcontext)
4. [Concurrency Policies (Exhaustive Examples)](#4-concurrency-policies)
   - [`drop`](#41-drop-policy)
   - [`restart`](#42-restart-policy)
   - [`enqueue`](#43-enqueue-policy)
   - [`latest`](#44-latest-policy)
   - [`parallel`](#45-parallel-policy)
5. [Handlers: Promises & RxJS Observables](#5-handlers-promises--rxjs-observables)
   - [Promise Handlers & `AbortSignal`](#51-promise-handlers--abortsignal)
   - [RxJS Observable Handlers & `HttpClient`](#52-rxjs-observable-handlers--httpclient)
   - [Observable Result Policies](#53-observable-result-policies)
6. [Angular Lifecycle & Injection Context](#6-angular-lifecycle--injection-context)
   - [Automatic `DestroyRef` Cleanup](#61-automatic-destroyref-cleanup)
   - [`destroyBehavior` Options](#62-destroybehavior-options)
   - [Explicit `injector` Option](#63-explicit-injector-option)
7. [Advanced Production Features](#7-advanced-production-features)
   - [Explicit Timeouts](#71-explicit-timeouts)
   - [Anti-Flicker Visual Timing](#72-anti-flicker-visual-timing)
   - [Error Classification & Custom `classifyError`](#73-error-classification--custom-classifyerror)
   - [Progress Reporting](#74-progress-reporting)
   - [Manual Retries & Attempt Counter](#75-manual-retries--attempt-counter)
8. [Template Directives (`ngx-task/directives`)](#8-template-directives-ngx-taskdirectives)
   - `[taskTrigger]` & `[taskArgs]`
   - `[taskDisableWhilePending]` (`native` vs `aria`)
   - `[taskBusy]`
9. [Testing Utilities (`ngx-task/testing`)](#9-testing-utilities-ngx-tasktesting)
   - Synchronous Testing with `createControlledTaskHandler()`
   - Fast Component Testing with `createTaskHarness()`
   - Pure Test Primitives (`createDeferred`, `createTaskTestClock`)
10. [Zoneless Angular Integration](#10-zoneless-angular-integration)

---

## 1. Architecture Overview

`ngx-task` solves the recurring challenge in Angular applications: managing complex asynchronous commands (form submissions, searches, file uploads, autosave) with explicit concurrency control, cancellation, visual pending states, and lifecycle safety.

```text
ngx-task Architecture Layers
┌────────────────────────────────────────────────────────┐
│ Angular Template / Directives (ngx-task/directives)    │
├────────────────────────────────────────────────────────┤
│ Angular Signals Facade (createTask / Task Signals)     │
├────────────────────────────────────────────────────────┤
│ Operation Adapters (PromiseAdapter / ObservableAdapter) │
├────────────────────────────────────────────────────────┤
│ Schedulers (Drop, Restart, Enqueue, Latest, Parallel)  │
├────────────────────────────────────────────────────────┤
│ Pure Execution State Machine & Outcomes                │
└────────────────────────────────────────────────────────┘
```

---

## 2. Installation & Setup

```bash
npm install ngx-task
```

### Peer Dependencies
- `@angular/core`: `>=16.0.0`
- `rxjs`: `>=7.5.0`

---

## 3. Core API Reference

### `createTask`

```ts
function createTask<TArgs, TResult>(
  handler: TaskHandler<TArgs, TResult>,
  options?: CreateTaskOptions<TArgs, TResult>,
): Task<TArgs, TResult>;
```

#### `CreateTaskOptions`

```ts
export interface CreateTaskOptions<TArgs, TResult> {
  /** Concurrency policy: 'drop' | 'restart' | 'enqueue' | 'latest' | { mode: 'parallel', limit?: number } */
  concurrency?: ConcurrencyPolicy;
  /** Timeout in ms or configuration object */
  timeout?: number | TaskTimeoutOptions;
  /** Delay in ms before pending signal flips to true (prevents micro-flashes) */
  pendingDelay?: number;
  /** Minimum duration in ms that pending signal remains true once active */
  minimumPendingDuration?: number;
  /** Custom error classification hook */
  classifyError?: (error: unknown) => TaskError;
  /** Lifecycle destroy behavior: 'cancel' | 'detach' | 'allow' (default 'cancel') */
  destroyBehavior?: DestroyBehavior;
  /** Custom Angular Injector instance for detached contexts */
  injector?: Injector;
  /** Maximum queue size for queued schedulers ('enqueue', 'parallel') */
  maxQueueSize?: number;
  /** Overflow policy when queue limit is reached: 'reject-newest' | 'drop-oldest' | 'throw' */
  overflowPolicy?: QueueOverflowPolicy;
  /** Result resolution policy for Observables: 'latest' | 'first' | 'last' | 'forbid-multiple' */
  observableResult?: ObservableResultPolicy;
}
```

---

### `Task<TArgs, TResult>`

```ts
export interface Task<TArgs, TResult> {
  /** Simple aggregate status: 'idle' | 'pending' | 'settled' */
  readonly status: Signal<TaskStatus>;
  /** True when work is running or queued (respects pendingDelay & minimumPendingDuration) */
  readonly pending: Signal<boolean>;
  /** Immediate truth: true if execution is actively executing */
  readonly running: Signal<boolean>;
  /** Most recent successful execution result (persisted until reset) */
  readonly result: Signal<TResult | undefined>;
  /** Most recent execution error */
  readonly error: Signal<TaskError | undefined>;
  /** Most recent execution progress */
  readonly progress: Signal<TaskProgress | undefined>;

  /** Count of actively running executions */
  readonly runningCount: Signal<number>;
  /** Count of queued executions */
  readonly queuedCount: Signal<number>;
  /** Total count of executions triggered */
  readonly executionCount: Signal<number>;

  /** Reference to the latest TaskExecution handle */
  readonly lastExecution: Signal<TaskExecution<TArgs, TResult> | undefined>;

  /** Triggers a new execution with arguments */
  run(args: TArgs): TaskExecution<TArgs, TResult>;

  /** Cancels the active or latest execution */
  cancel(reason?: unknown): void;
  /** Cancels all active and queued executions */
  cancelAll(reason?: unknown): void;
  /** Resets result, error, progress, and status signals back to idle */
  reset(): void;
  /** Re-executes the task with the most recent arguments */
  retryLast(): TaskExecution<TArgs, TResult> | undefined;
}
```

---

### `TaskExecution<TArgs, TResult>`

Representing a specific invocation of a task:

```ts
export interface TaskExecution<TArgs, TResult> {
  readonly id: string;
  readonly args: TArgs;

  readonly status: Signal<TaskExecutionStatus>;
  readonly progress: Signal<TaskProgress | undefined>;
  readonly result: Signal<TResult | undefined>;
  readonly error: Signal<TaskError | undefined>;

  readonly createdAt: number;
  readonly startedAt: Signal<number | undefined>;
  readonly finishedAt: Signal<number | undefined>;

  /** Promise that resolves to the explicit outcome of this execution */
  readonly done: Promise<TaskOutcome<TResult>>;

  /** Cancels this specific execution */
  cancel(reason?: unknown): void;
  /** Promise resolving result or throwing application/cancellation error */
  resultOrThrow(): Promise<TResult>;
}
```

---

### `TaskContext`

Passed to task handler functions:

```ts
export interface TaskContext {
  /** AbortSignal aborted when execution is cancelled, superseded, timed-out, or destroyed */
  readonly signal: AbortSignal;
  /** Unique execution ID string (e.g. 'exec-1') */
  readonly executionId: string;
  /** Attempt counter (1 for initial run, 2+ for retries) */
  readonly attempt: number;
  /** Unique idempotency key for this execution */
  readonly idempotencyKey: string;

  /** Reports progress updates to signals */
  reportProgress(progress: TaskProgress): void;
  /** Throws error if execution signal has been aborted */
  throwIfCancelled(): void;
}
```

---

## 4. Concurrency Policies

### 4.1 `drop` Policy

Ignores new invocations while an execution is running.

```ts
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';

@Component({
  selector: 'app-checkout',
  standalone: true,
  template: `
    <button (click)="submitCheckout.run(cart)" [disabled]="submitCheckout.pending()">
      @if (submitCheckout.pending()) { Processing Payment... } @else { Pay Now }
    </button>
  `,
})
export class CheckoutComponent {
  cart = { items: ['Book'], total: 49.99 };

  readonly submitCheckout = createTask(
    async (cartData, { signal }) => {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData),
        signal,
      });
      return response.json();
    },
    {
      concurrency: 'drop', // Rapid clicks while running are dropped
    },
  );
}
```

---

### 4.2 `restart` Policy

Cancels/supersedes the active execution and runs the newest invocation immediately.

```ts
import { Component } from '@angular/core';
import { createTask } from 'ngx-task';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input (input)="onInput($event)" placeholder="Search products..." />
    @if (searchTask.running()) { Loading suggestions... }
    <ul>
      @for (item of searchTask.result() || []; track item) {
        <li>{{ item }}</li>
      }
    </ul>
  `,
})
export class SearchComponent {
  readonly searchTask = createTask(
    (query: string, { signal }) => {
      // RxJS observable automatically unsubscribes on restart superseding!
      return fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal })
        .then(res => res.json());
    },
    {
      concurrency: 'restart',
    },
  );

  onInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchTask.run(query);
  }
}
```

---

### 4.3 `enqueue` Policy

Executes invocations sequentially in FIFO order with queue overflow controls.

```ts
import { Component } from '@angular/core';
import { createTask } from 'ngx-task';

@Component({
  selector: 'app-audit-logger',
  standalone: true,
  template: `
    <button (click)="logEvent('CLICK_A')">Log A</button>
    <button (click)="logEvent('CLICK_B')">Log B</button>
    <p>Queued items remaining: {{ auditTask.queuedCount() }}</p>
  `,
})
export class AuditLoggerComponent {
  readonly auditTask = createTask(
    async (logEntry: string, { signal }) => {
      await fetch('/api/audit', {
        method: 'POST',
        body: JSON.stringify({ logEntry, timestamp: Date.now() }),
        signal,
      });
    },
    {
      concurrency: 'enqueue',
      maxQueueSize: 20,
      overflowPolicy: 'reject-newest', // Options: 'reject-newest' | 'drop-oldest' | 'throw'
    },
  );

  logEvent(entry: string): void {
    this.auditTask.run(entry);
  }
}
```

---

### 4.4 `latest` Policy

Finishes active execution, but keeps only the newest queued invocation (superseding intermediate queued ones).

```ts
import { Component } from '@angular/core';
import { createTask } from 'ngx-task';

@Component({
  selector: 'app-editor-autosave',
  standalone: true,
  template: `
    <textarea (input)="onTextChange($event)"></textarea>
    <p>Autosave Status: {{ autosaveTask.status() }}</p>
  `,
})
export class EditorAutosaveComponent {
  readonly autosaveTask = createTask(
    async (documentText: string, { signal }) => {
      const res = await fetch('/api/save-draft', {
        method: 'PUT',
        body: JSON.stringify({ content: documentText }),
        signal,
      });
      return res.json();
    },
    {
      concurrency: 'latest',
    },
  );

  onTextChange(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.autosaveTask.run(text);
  }
}
```

---

### 4.5 `parallel` Policy

Executes up to `limit` executions simultaneously, queueing excess requests.

```ts
import { Component } from '@angular/core';
import { createTask } from 'ngx-task';

@Component({
  selector: 'app-batch-uploader',
  standalone: true,
  template: `
    <input type="file" multiple (change)="onFilesSelected($event)" />
    <p>Uploading {{ uploadTask.runningCount() }} files (Queued: {{ uploadTask.queuedCount() }})</p>
  `,
})
export class BatchUploaderComponent {
  readonly uploadTask = createTask(
    async (file: File, { signal, reportProgress }) => {
      const formData = new FormData();
      formData.append('file', file);

      reportProgress({ current: 10, total: 100, message: `Starting ${file.name}` });

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal,
      });

      reportProgress({ current: 100, total: 100, message: `Uploaded ${file.name}` });
      return res.json();
    },
    {
      concurrency: { mode: 'parallel', limit: 3 }, // Maximum 3 concurrent uploads
    },
  );

  onFilesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.uploadTask.run(files[i]);
      }
    }
  }
}
```

---

## 5. Handlers: Promises & RxJS Observables

### 5.1 Promise Handlers & `AbortSignal`

```ts
const saveUser = createTask(
  async (userData: User, { signal }) => {
    const response = await fetch('/api/user', {
      method: 'POST',
      body: JSON.stringify(userData),
      signal, // Pass signal to native fetch
    });
    return response.json();
  },
);
```

---

### 5.2 RxJS Observable Handlers & `HttpClient`

```ts
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createTask } from 'ngx-task';

@Component({
  selector: 'app-http-user',
  standalone: true,
  template: `
    <button (click)="loadUser.run('user-123')">Load User</button>
  `,
})
export class HttpUserComponent {
  private http = inject(HttpClient);

  readonly loadUser = createTask(
    (userId: string) => {
      // Angular HttpClient request is automatically unsubscribed on cancellation/superseding
      return this.http.get<User>(`/api/users/${userId}`);
    },
    {
      concurrency: 'restart',
    },
  );
}
```

---

### 5.3 Observable Result Policies

Set `observableResult` in options:
- `'latest'` (default): Updates result as emissions arrive; final emission on completion settles the task.
- `'first'`: Takes first emission, settles task, and unsubscribes.
- `'forbid-multiple'`: Errors if source emits more than 1 value.

```ts
const singleEmissionTask = createTask(
  (id: string) => this.http.get(`/api/data/${id}`),
  {
    observableResult: 'first',
  },
);
```

---

## 6. Angular Lifecycle & Injection Context

### 6.1 Automatic `DestroyRef` Cleanup

When `createTask()` is called inside an Angular Injection Context (Component / Service constructor or property initializer), `ngx-task` automatically hooks into `DestroyRef.onDestroy()`.

```ts
@Component({...})
export class MyComponent {
  // Automatically bound to component DestroyRef!
  readonly myTask = createTask(async () => fetchLongOperation());
}
```

When the component is destroyed:
1. Active executions are cancelled (triggers `AbortController.abort('Owner destroyed')` and RxJS `unsubscribe()`).
2. Queued items are cleared.
3. Signal listeners are disconnected.

---

### 6.2 `destroyBehavior` Options

```ts
createTask(handler, {
  destroyBehavior: 'cancel', // Default: Aborts active work on component destroy
});

createTask(handler, {
  destroyBehavior: 'detach', // Disconnects signals but allows background job to finish
});

createTask(handler, {
  destroyBehavior: 'allow',  // Root services: leaves executions and signals active
});
```

---

### 6.3 Explicit `injector` Option

When creating tasks dynamically outside constructor execution context:

```ts
@Component({...})
export class DynamicTaskComponent {
  private injector = inject(Injector);

  createDynamicTask() {
    return createTask(
      async () => fetch('/api/dynamic'),
      { injector: this.injector }, // Explicitly pass injector
    );
  }
}
```

---

## 7. Advanced Production Features

### 7.1 Explicit Timeouts

Timer starts when execution transitions to `running` (ignoring time spent queued).

```ts
readonly fetchWithTimeout = createTask(
  async (id: string, { signal }) => {
    return fetch(`/api/data/${id}`, { signal }).then(r => r.json());
  },
  {
    timeout: { milliseconds: 5000, message: 'Request exceeded 5 seconds limit' },
  },
);
```

---

### 7.2 Anti-Flicker Visual Timing

Prevents micro-flashes on fast network requests:

```ts
readonly saveTask = createTask(
  async (data) => this.api.save(data),
  {
    pendingDelay: 150,           // Only set pending() true if operation takes > 150ms
    minimumPendingDuration: 300, // Once pending() is true, keep visible for at least 300ms
  },
);
```

- `task.running()` -> `true` immediately (raw execution truth).
- `task.pending()` -> visual pending state respecting delay and minimum duration.

---

### 7.3 Error Classification & Custom `classifyError`

Standard `TaskError` structure:

```ts
export interface TaskError {
  readonly cause: unknown;
  readonly kind: 'application' | 'network' | 'timeout' | 'cancelled' | 'unknown';
  readonly message: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
}
```

Custom Classifier Hook:

```ts
readonly customErrorTask = createTask(
  async () => this.api.performAction(),
  {
    classifyError: (error): TaskError => {
      if (error instanceof HttpErrorResponse) {
        return {
          cause: error,
          kind: 'network',
          message: error.message,
          retryable: error.status >= 500,
          statusCode: error.status,
        };
      }
      return {
        cause: error,
        kind: 'unknown',
        message: String(error),
        retryable: false,
      };
    },
  },
);
```

---

### 7.4 Progress Reporting

```ts
readonly downloadTask = createTask(
  async (fileId: string, { reportProgress }) => {
    reportProgress({ current: 25, total: 100, message: 'Fetching metadata...' });
    await sleep(500);
    reportProgress({ current: 75, total: 100, message: 'Downloading chunk...' });
    await sleep(500);
    reportProgress({ current: 100, total: 100, message: 'Complete' });
  },
);
```

Template access:
```html
<p>Progress: {{ downloadTask.progress()?.current }}% - {{ downloadTask.progress()?.message }}</p>
```

---

### 7.5 Manual Retries & Attempt Counter

```ts
readonly submitTask = createTask(
  async (payload, { attempt }) => {
    console.log(`Attempt #${attempt}`);
    return this.api.submit(payload);
  },
);

// In component:
function onRetry() {
  submitTask.retryLast(); // Triggers run() with last arguments and attempt = 2
}
```

---

## 8. Template Directives (`ngx-task/directives`)

Import `ngx-task/directives` secondary entry point:

```ts
import { TaskTriggerDirective, TaskDisableWhilePendingDirective, TaskBusyDirective } from 'ngx-task/directives';

@Component({
  standalone: true,
  imports: [TaskTriggerDirective, TaskDisableWhilePendingDirective, TaskBusyDirective],
  template: `
    <div [taskBusy]="saveTask">
      <button
        type="button"
        [taskTrigger]="saveTask"
        [taskArgs]="userPayload"
        taskDisableWhilePending
        taskDisableMode="native"
      >
        Save
      </button>
    </div>
  `,
})
export class DirectiveExampleComponent { ... }
```

### Directives Reference

1. **`[taskTrigger]="task"` & `[taskArgs]="args"`:** Executes task on click with specified arguments.
2. **`[taskDisableWhilePending]="task"`:** Disables element while task is pending.
   - `taskDisableMode="native"` (default): Sets `[disabled]="true"`.
   - `taskDisableMode="aria"`: Sets `[attr.aria-disabled]="true"`.
3. **`[taskBusy]="task"`:** Container binding. Sets `[attr.aria-busy]="true"` and `[attr.data-task-pending]="true"`.

---

## 9. Testing Utilities (`ngx-task/testing`)

Import `ngx-task/testing` secondary entry point:

### 9.1 Synchronous Testing with `createControlledTaskHandler()`

```ts
import { describe, it, expect } from 'vitest';
import { createTask } from 'ngx-task';
import { createControlledTaskHandler } from 'ngx-task/testing';

describe('Component Unit Test', () => {
  it('controls task resolution synchronously', async () => {
    const controller = createControlledTaskHandler<string, number>();
    const task = createTask(controller.handler);

    const exec = task.run('input-data');
    expect(task.pending()).toBe(true);

    // Resolve synchronously in test
    controller.resolveLast(42);
    const outcome = await exec.done;

    expect(outcome).toEqual({ type: 'success', value: 42 });
    expect(task.result()).toBe(42);
    expect(task.pending()).toBe(false);
  });
});
```

---

### 9.2 Fast Component Testing with `createTaskHarness()`

```ts
import { createTaskHarness } from 'ngx-task/testing';

const harness = createTaskHarness(myTask);
expect(harness.lastExecution).toBeUndefined();

myTask.run('test');
expect(harness.lastExecution?.status()).toBe('running');

harness.cancelLast('Cancelled in test');
expect(harness.lastExecution?.status()).toBe('cancelled');
```

---

## 10. Zoneless Angular Integration

`ngx-task` is **Signal-first and Zoneless-safe by design**. It does not depend on `Zone.js`, `NgZone.run()`, or manual `ChangeDetectorRef.markForCheck()`.

### Zoneless Application Bootstrap Example

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
  ],
});
```

All `ngx-task` signals (`status`, `pending`, `running`, `result`, `error`, `progress`) seamlessly trigger zoneless change detection views automatically.
