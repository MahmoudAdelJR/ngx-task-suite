---
title: Task vs Resource & RxJS
description: Learn when to use ngx-task versus Angular Resource/rxResource or RxJS operators.
---

Choosing the right reactive primitive is essential for clean Angular architecture.

## 1. `Task` vs `Resource` / `rxResource`

Angular 19+ introduces `resource()` and `rxResource()` for declarative data loading. Here is how `ngx-task` compares:

| Feature / Intent | `Resource` (`resource` / `rxResource`) | `Task` (`ngx-task`) |
| :--- | :--- | :--- |
| **Primary Intent** | **Declarative Data Fetching** (Read) | **Imperative Action / Command** (Write/Execute) |
| **Trigger Mechanism** | Reactive signal dependency changes | User gesture (`click`, `submit`, explicit `.run()`) |
| **Typical Use Cases** | Fetching user profile by `userId()`, loading page data | Form submission, Login, Payment checkout, File upload, Autosave |
| **Concurrency Policies** | Automatic restart on signal change | Explicit policies: `drop`, `restart`, `enqueue`, `latest`, `parallel` |
| **Visual Timing Controls**| None | Built-in `pendingDelay` & `minimumPendingDuration` anti-flicker |
| **Progress Reporting** | Not supported | Built-in progress tracking via `context.reportProgress()` |
| **Retries & Attempt Counter**| Manual reload | `retryLast()` and `context.attempt` counter |

---

## 2. `Task` vs RxJS Flattening Operators

In traditional Angular applications, developers use RxJS Subject streams combined with flattening operators (`exhaustMap`, `switchMap`, `concatMap`, `mergeMap`) to control concurrency.

Here is how `ngx-task` policies map to RxJS operators:

| `ngx-task` Policy | Equivalent RxJS Operator | Key Advantage of `ngx-task` |
| :--- | :--- | :--- |
| **`drop`** | `exhaustMap` | Exposes signals (`pending`, `running`), anti-flicker, automatic component cleanup |
| **`restart`** | `switchMap` | Automatic `AbortSignal` cancellation for Promises & Observables |
| **`enqueue`** | `concatMap` | Queue limit & overflow policy controls (`maxQueueSize`, `overflowPolicy`) |
| **`latest`** | Custom `buffer(1)` / `switchMap` | Skips intermediate queued items, keeping only newest |
| **`parallel`** | `mergeMap(..., limit)` | Concurrent execution limit signals & individual `TaskExecution` handles |

### Why use `ngx-task` instead of manual RxJS subjects?

1. **No Manual Subject Boilerplate**: No need to create `Subject`, pipe operators, subscribe, or manage subscriptions.
2. **First-Class Signal API**: Direct consumption in Angular templates without `toSignal()` or `async` pipe.
3. **Comprehensive Lifecycle & State**: Exposes running counts, queue counts, progress, attempt counters, and execution handles out of the box.
