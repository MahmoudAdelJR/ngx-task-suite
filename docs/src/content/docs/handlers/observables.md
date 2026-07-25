---
title: RxJS & HttpClient Handlers
description: Learn how RxJS Observables and HttpClient integrate with ngx-task.
---

In addition to Promises, `ngx-task` accepts RxJS `Observable` streams directly inside handler functions.

```ts
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { createTask } from 'ngx-task';

export class UserListComponent {
  private http = inject(HttpClient);

  readonly loadUsers = createTask((role: string) => {
    return this.http.get<User[]>(`/api/users?role=${role}`);
  });
}
```

---

## Automatic Subscription Cleanup

When a task returning an Observable is cancelled, superseded, or destroyed:
1. `ngx-task` calls `.unsubscribe()` on the active RxJS `Subscription`.
2. Angular's `HttpClient` listens to unsubscription and automatically cancels the underlying XMLHttpRequest / Fetch request.

---

## `observableResult` Resolution Policies

Because Observables can emit multiple values over time, `ngx-task` allows configuring how emissions update the `task.result` signal:

| Policy | Behavior |
| :--- | :--- |
| **`'latest'`** (Default) | Updates `task.result` signal on **every emission**, storing the latest value. |
| **`'first'`** | Captures the **first emission** as the result and ignores subsequent emissions. |
| **`'last'`** | Waits for Observable to **complete** and captures the final emission. |
| **`'forbid-multiple'`** | Throws an error if the Observable emits more than once. |

```ts
const livePriceTask = createTask(
  (symbol: string) => priceStreamService.watchSymbol(symbol),
  {
    observableResult: 'latest', // Signal updates in real-time as stream emits
  },
);
```
