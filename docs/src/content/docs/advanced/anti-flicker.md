---
title: Anti-Flicker Timing
description: Eliminate UI loading flashes with pendingDelay and minimumPendingDuration.
---

UI flickering occurs when fast operations (50–100ms) show a loading spinner for a split second, creating visual noise.

`ngx-task` provides two timing primitives to solve UI flickering: `pendingDelay` and `minimumPendingDuration`.

---

## 1. `pendingDelay`

`pendingDelay` defers turning `task.pending()` to `true` for a specified duration in milliseconds.

```ts
const quickSearch = createTask(searchHandler, {
  pendingDelay: 150, // Only show spinner if search takes LONGER than 150ms
});
```

- If request completes in **50ms**: `pending()` stays `false` the entire time. No spinner flash!
- If request takes **500ms**: `pending()` flips to `true` after 150ms and remains `true` until complete.

---

## 2. `minimumPendingDuration`

`minimumPendingDuration` guarantees that once `task.pending()` becomes `true`, it stays `true` for at least N milliseconds.

```ts
const saveForm = createTask(saveHandler, {
  minimumPendingDuration: 400, // Spinner stays visible for at least 400ms once shown
});
```

Prevents the spinner from disappearing so fast that the user misses the feedback.

---

## Combined Example

```ts
const smoothTask = createTask(apiHandler, {
  pendingDelay: 150,          // Don't show spinner for sub-150ms responses
  minimumPendingDuration: 300,// Once shown, keep spinner visible for at least 300ms
});
```
