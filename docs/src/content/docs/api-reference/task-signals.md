---
title: Task Signals & Interface
description: Complete API reference for Task signals, state properties, and control methods.
---

The `Task<TArgs, TResult>` interface returned by `createTask()` provides reactive signals and imperative methods to trigger, cancel, retry, or reset operations.

```ts
export interface Task<TArgs, TResult> {
  // Signals
  readonly status: Signal<TaskStatus>;
  readonly pending: Signal<boolean>;
  readonly running: Signal<boolean>;
  readonly result: Signal<TResult | undefined>;
  readonly error: Signal<TaskError | undefined>;
  readonly progress: Signal<TaskProgress | undefined>;

  // Metric Signals
  readonly runningCount: Signal<number>;
  readonly queuedCount: Signal<number>;
  readonly executionCount: Signal<number>;

  // Execution Handle
  readonly lastExecution: Signal<TaskExecution<TArgs, TResult> | undefined>;

  // Methods
  run(args: TArgs): TaskExecution<TArgs, TResult>;
  cancel(reason?: unknown): void;
  cancelAll(reason?: unknown): void;
  reset(): void;
  retryLast(): TaskExecution<TArgs, TResult> | undefined;
}
```

---

## Signal Reference

### `status: Signal<TaskStatus>`
Aggregated status of the task:
- `'idle'`: Initial state or after `.reset()`.
- `'pending'`: Task is currently running or queued.
- `'settled'`: Task completed execution (either resolved or rejected).

### `pending: Signal<boolean>`
Returns `true` when work is actively executing or queued. Respects `pendingDelay` and `minimumPendingDuration` options to eliminate visual UI flicker.

### `running: Signal<boolean>`
Returns `true` immediately when at least one execution is actively running (ignoring delay timers).

### `result: Signal<TResult | undefined>`
Contains the most recent successfully resolved output. Retains previous value until a new successful execution resolves or `.reset()` is called.

### `error: Signal<TaskError | undefined>`
Contains the standardized `TaskError` of the most recent failed execution.

### `progress: Signal<TaskProgress | undefined>`
Contains the latest progress payload emitted by `context.reportProgress()`.

---

## Metric Signals

- **`runningCount`**: Number of currently active executions.
- **`queuedCount`**: Number of executions currently waiting in queue.
- **`executionCount`**: Total cumulative number of executions triggered since initialization.

---

## Methods

### `run(args: TArgs): TaskExecution<TArgs, TResult>`
Triggers a new execution with the provided arguments. Returns a `TaskExecution` handle.

### `cancel(reason?: unknown): void`
Cancels the currently active or latest execution with an optional reason.

### `cancelAll(reason?: unknown): void`
Cancels all active and queued executions immediately.

### `reset(): void`
Resets task state signals (`result`, `error`, `progress`, `status`) back to `'idle'` and clears stored results.

### `retryLast(): TaskExecution<TArgs, TResult> | undefined`
Re-runs the task using the most recent arguments. Returns `undefined` if the task was never executed.
