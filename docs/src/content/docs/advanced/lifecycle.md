---
title: Angular Lifecycle & DestroyRef
description: Learn how ngx-task handles component destruction and custom injection contexts.
---

In Angular single-page applications, components are created and destroyed dynamically. Ongoing network requests from unmounted components can lead to memory leaks, state pollution, or runtime errors.

`ngx-task` automatically captures the current Angular injection context (`DestroyRef`) upon task creation.

---

## Automatic `DestroyRef` Cleanup

When a component containing a `createTask()` instance is destroyed:
1. The task automatically triggers cancellation.
2. `context.signal` emits an `abort` event.
3. Active RxJS subscriptions call `.unsubscribe()`.
4. The task status transitions safely to settled/cancelled.

```ts title="user-profile.component.ts"
@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: `...`,
})
export class UserProfileComponent {
  // Automatically acquires DestroyRef from current injection context
  readonly loadUser = createTask(async (id: string, { signal }) => {
    return fetch(`/api/users/${id}`, { signal }).then((r) => r.json());
  });
}
```

---

## `destroyBehavior` Options

You can customize how a task reacts to component destruction via `destroyBehavior`:

| Option | Behavior |
| :--- | :--- |
| **`'cancel'`** (Default) | Cancels active & queued executions immediately upon component destroy. |
| **`'detach'`** | Allows in-flight execution to complete in the background, but detaches signals so destroyed component won't re-render. |
| **`'allow'`** | Unregisters `DestroyRef` listener completely; execution and signals continue normally. |

```ts
const backgroundTask = createTask(saveAnalyticsHandler, {
  destroyBehavior: 'detach', // Let save finish in background when component unmounts
});
```

---

## Explicit `injector` Option

If you create a task outside of an injection context (for example, inside an asynchronous callback, static method, or external class), pass an explicit `Injector`:

```ts
import { Injector, inject } from '@angular/core';
import { createTask } from 'ngx-task';

export function createCustomTask(injector: Injector) {
  return createTask(myHandler, { injector });
}
```
