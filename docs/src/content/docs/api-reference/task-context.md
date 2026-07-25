---
title: TaskContext
description: API reference for the execution context object passed into task handlers.
---

The `TaskContext` object is supplied as the second argument to task handlers when an execution begins.

```ts
export interface TaskContext {
  readonly signal: AbortSignal;
  readonly executionId: string;
  readonly attempt: number;
  readonly idempotencyKey: string;

  reportProgress(progress: TaskProgress): void;
  throwIfCancelled(): void;
}
```

---

## Properties & Methods

### `signal: AbortSignal`
Standard web `AbortSignal` triggered when the execution is cancelled, superseded by a concurrency policy, timed out, or destroyed by component lifecycle. Pass this to `fetch()` or `HttpClient` request options.

### `executionId: string`
Unique identifier for this specific execution attempt.

### `attempt: number`
Execution counter (1 for initial run, 2+ for retries via `task.retryLast()`).

### `idempotencyKey: string`
Deterministic key generated for this execution to support safe idempotency in API calls.

### `reportProgress(progress: TaskProgress): void`
Emits progress payload (`{ loaded?: number, total?: number, percentage?: number, statusText?: string }`) to `task.progress` and `execution.progress` signals.

### `throwIfCancelled(): void`
Helper method that throws a `TaskCancelledError` if `signal.aborted` is true. Useful inside long-running CPU loops or step-by-step logic.

---

## Example Usage

```ts
const uploadTask = createTask(
  async (files: File[], context: TaskContext) => {
    for (let i = 0; i < files.length; i++) {
      // Check cancellation before processing each file
      context.throwIfCancelled();

      context.reportProgress({
        loaded: i,
        total: files.length,
        percentage: Math.round((i / files.length) * 100),
        statusText: `Uploading file ${i + 1} of ${files.length}`,
      });

      await uploadFile(files[i], { signal: context.signal });
    }
  }
);
```
