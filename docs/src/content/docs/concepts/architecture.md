---
title: Architecture Overview
description: Deep dive into the internal design, state machine, and reactive layers of ngx-task.
---

`ngx-task` is architected as a clean, multi-layered system that cleanly decouples state machine execution from Angular signals and UI bindings.

```text
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

## Architecture Layers

### 1. State Machine & Execution Outcomes
At the lowest level, every invocation is managed by a deterministic state machine. An execution moves through states:
- `idle` → `queued` → `running` → `settled` (`resolved` | `rejected` | `cancelled`)

### 2. Schedulers & Concurrency Policies
Schedulers enforce invocation rules based on selected policies (`drop`, `restart`, `enqueue`, `latest`, `parallel`). They decide whether a new execution starts immediately, cancels active ones, queues up, or drops.

### 3. Operation Adapters
`ngx-task` natively handles both Promises (`async/await`) and RxJS `Observable`s via unified adapter contracts:
- **Promise Adapter**: Bridges `AbortController` / `AbortSignal` with `Promise` lifecycle.
- **Observable Adapter**: Manages `Subscription` lifecycle and converts emissions according to `observableResult` policies (`latest`, `first`, `last`).

### 4. Angular Signals Facade
Wraps internal state changes into fine-grained Angular `Signal` objects:
- `status`: Signal of aggregate task state (`'idle' | 'pending' | 'settled'`)
- `pending`: Signal respecting `pendingDelay` & `minimumPendingDuration`
- `running`: Immediate signal of active execution
- `result` & `error`: Signal holders for execution outputs

### 5. Template Directives
Lightweight Angular directives (`[taskTrigger]`, `[taskDisableWhilePending]`, `[taskBusy]`) providing declarative template bindings.

---

## Cooperative Cancellation Contract

Cancellation in `ngx-task` is **cooperative**, meaning tasks are given clean cancellation primitives that integrate with web standards:

1. Every task handler function receives a `TaskContext` containing `signal: AbortSignal`.
2. Network APIs (such as `fetch()` or Angular `HttpClient` via `AbortSignal`) inspect `signal`.
3. When `task.cancel()` or component cleanup triggers:
   - `signal` emits `abort` event.
   - Active RxJS subscriptions call `unsubscribe()`.
   - `context.throwIfCancelled()` throws a `TaskCancelledError`.
