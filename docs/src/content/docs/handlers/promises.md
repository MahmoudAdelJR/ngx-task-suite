---
title: Promise Handlers & AbortSignal
description: Learn how async/await Promise handlers integrate with AbortSignal in ngx-task.
---

`ngx-task` provides first-class support for `async/await` Promise functions.

```ts
const fetchTask = createTask(async (id: string, context: TaskContext) => {
  const response = await fetch(`/api/items/${id}`, {
    signal: context.signal, // Connect AbortSignal to native fetch
  });
  return response.json();
});
```

---

## How `AbortSignal` Works

When an execution is cancelled, superseded by a concurrency policy (such as `restart`), or destroyed via component unmount:
1. `context.signal.aborted` becomes `true`.
2. Native browser APIs (`fetch()`, `AbortController`) automatically abort ongoing network sockets.
3. `context.throwIfCancelled()` can be invoked in loops to interrupt CPU processing.

---

## Handling Fetch & Axios

### Native `fetch()`

```ts
const task = createTask(async (url: string, { signal }) => {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
});
```

### Axios

```ts
import axios from 'axios';

const task = createTask(async (userId: string, { signal }) => {
  const res = await axios.get(`/api/users/${userId}`, { signal });
  return res.data;
});
```
