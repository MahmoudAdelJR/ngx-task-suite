---
title: Concurrency Policies Overview
description: Detailed comparison of drop, restart, enqueue, latest, and parallel concurrency strategies in ngx-task.
---

When building interactive applications, user interactions often happen faster than backend APIs can respond. `ngx-task` solves this with explicit **concurrency policies**.

---

## The 5 Concurrency Policies

```text
┌───────────┬────────────────────────────────────────────────────────────────────────┐
│ Policy    │ Action on New Invocation while Active                                  │
├───────────┼────────────────────────────────────────────────────────────────────────┤
│ drop      │ Ignore new invocation completely                                       │
│ restart   │ Cancel active execution immediately and start new invocation           │
│ enqueue   │ Queue new invocation and run sequentially in FIFO order                │
│ latest    │ Finish active execution, but keep only the newest invocation in queue  │
│ parallel  │ Run up to N invocations simultaneously, queueing excess                │
└───────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Policy Matrix

| Policy | Active Execution | New Invocation | Visual / UI Use Case |
| :--- | :--- | :--- | :--- |
| **`drop`** | Continues uninterrupted | **Dropped / Ignored** | Form submission, Login, Payment checkout |
| **`restart`** | **Cancelled immediately** | Executes immediately | Live search autocomplete, Filter inputs, Tab switching |
| **`enqueue`** | Continues | **Queued in FIFO order** | Audit log items, Sequential file processing |
| **`latest`** | Continues | **Queued (Supersedes previous queued)** | Document autosave, Slider/Canvas state sync |
| **`parallel`** | Continues up to limit | **Runs in parallel (or queues excess)** | Bulk image uploads, Parallel data preloading |

---

## How to Set a Concurrency Policy

Set the policy via the `concurrency` option in `createTask()`:

```ts
// 1. Drop
const saveTask = createTask(saveHandler, { concurrency: 'drop' });

// 2. Restart
const searchTask = createTask(searchHandler, { concurrency: 'restart' });

// 3. Enqueue
const logTask = createTask(logHandler, { concurrency: 'enqueue' });

// 4. Latest
const autoSaveTask = createTask(autoSaveHandler, { concurrency: 'latest' });

// 5. Parallel (with optional limit)
const uploadTask = createTask(uploadHandler, {
  concurrency: { mode: 'parallel', limit: 3 },
});
```
