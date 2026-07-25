---
title: TaskExecution Handle
description: API reference for individual TaskExecution handles returned when running tasks.
---

When calling `task.run(args)`, a `TaskExecution<TArgs, TResult>` object is returned representing that single invocation instance.

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

  readonly done: Promise<TaskOutcome<TResult>>;

  cancel(reason?: unknown): void;
  resultOrThrow(): Promise<TResult>;
}
```

---

## Key Properties

- **`id`**: Unique string identifier assigned to this execution (e.g. `'exec-1'`).
- **`args`**: The exact arguments passed when triggering `.run(args)`.
- **`done`**: A Promise resolving to a discriminated union `TaskOutcome<TResult>`:
  - `{ kind: 'resolved', value: TResult }`
  - `{ kind: 'rejected', error: TaskError }`
  - `{ kind: 'cancelled', reason?: unknown }`

---

## Key Methods

### `cancel(reason?: unknown): void`
Cancels this specific execution instance without affecting other queued or running executions.

### `resultOrThrow(): Promise<TResult>`
Returns a Promise that resolves directly to `TResult` on success, or throws the `TaskError` / cancellation error on failure.

---

## Example Usage

```ts
const execution = myTask.run({ query: 'angular' });

// Wait for completion programmatically
const outcome = await execution.done;
if (outcome.kind === 'resolved') {
  console.log('Results:', outcome.value);
} else if (outcome.kind === 'cancelled') {
  console.warn('Execution was cancelled:', outcome.reason);
}
```
