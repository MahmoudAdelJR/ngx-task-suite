---
title: Timeouts
description: Configure execution timeouts in ngx-task to prevent hanging requests.
---

Network slowdowns or server hangs can lock user interfaces indefinitely. `ngx-task` provides built-in timeout options.

---

## Simple Timeout (ms)

Pass a number in milliseconds to `timeout`:

```ts
const fetchOrder = createTask(
  async (orderId: string, { signal }) => {
    return api.getOrder(orderId, { signal });
  },
  {
    timeout: 10_000, // Automatically aborts if execution exceeds 10 seconds
  },
);
```

When a timeout occurs:
1. `context.signal` is aborted with a `TaskTimeoutError`.
2. `task.error()` is updated with `code: 'TASK_TIMEOUT'`.
3. The execution Promise rejects with `TaskTimeoutError`.

---

## Detailed Timeout Options

You can pass a `TaskTimeoutOptions` object for granular control:

```ts
const uploadTask = createTask(uploadHandler, {
  timeout: {
    duration: 30_000, // 30 seconds limit
    reason: 'File upload timed out after 30 seconds',
  },
});
```
