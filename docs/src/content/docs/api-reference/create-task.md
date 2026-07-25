---
title: createTask()
description: API reference for creating task instances with options.
---

The `createTask()` function is the primary entry point for defining controlled asynchronous actions in `ngx-task`.

```ts
function createTask<TArgs, TResult>(
  handler: TaskHandler<TArgs, TResult>,
  options?: CreateTaskOptions<TArgs, TResult>,
): Task<TArgs, TResult>;
```

---

## Handler Function

The handler function receives arguments passed to `.run(args)` and a `TaskContext` object:

```ts
type TaskHandler<TArgs, TResult> = (
  args: TArgs,
  context: TaskContext,
) => Promise<TResult> | Observable<TResult>;
```

---

## Options (`CreateTaskOptions`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`concurrency`** | `ConcurrencyPolicy` | `'drop'` | Concurrency strategy: `'drop'`, `'restart'`, `'enqueue'`, `'latest'`, or `{ mode: 'parallel', limit?: number }`. |
| **`timeout`** | `number \| TaskTimeoutOptions` | `undefined` | Execution timeout in milliseconds (or object configuration). |
| **`pendingDelay`** | `number` | `0` | Delay in ms before `pending` signal becomes `true`. Prevents micro-flashes for fast operations. |
| **`minimumPendingDuration`** | `number` | `0` | Minimum time in ms `pending` signal remains `true` once activated. |
| **`classifyError`** | `(err: unknown) => TaskError` | Default classifier | Custom function to wrap and standardize thrown errors into `TaskError`. |
| **`destroyBehavior`** | `'cancel' \| 'detach' \| 'allow'` | `'cancel'` | Behavior when component containing task is destroyed. |
| **`injector`** | `Injector` | Current context | Custom Angular `Injector` for tasks instantiated outside injection context. |
| **`maxQueueSize`** | `number` | `Infinity` | Maximum queue size for queued policies (`enqueue`, `parallel`). |
| **`overflowPolicy`** | `QueueOverflowPolicy` | `'reject-newest'` | Overflow handling when queue is full (`'reject-newest'`, `'drop-oldest'`, `'throw'`). |
| **`observableResult`** | `ObservableResultPolicy` | `'latest'` | Result resolution strategy for Observable handlers (`'latest'`, `'first'`, `'last'`, `'forbid-multiple'`). |

---

## Example Usage

```ts
const userTask = createTask(
  async (userId: string, { signal, reportProgress }) => {
    reportProgress({ loaded: 0, total: 100, percentage: 0 });
    const user = await fetchUser(userId, { signal });
    reportProgress({ loaded: 100, total: 100, percentage: 100 });
    return user;
  },
  {
    concurrency: 'restart',
    timeout: 5000,
    pendingDelay: 200,
    minimumPendingDuration: 500,
  },
);
```
