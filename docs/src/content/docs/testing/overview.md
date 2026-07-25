---
title: Testing Utilities (`ngx-task/testing`)
description: Test tasks synchronously, harness component behaviors, and control test clocks.
---

Testing asynchronous code with timers, network calls, and cancellation usually requires complex `fakeAsync`, `tick()`, or flush logic.

`ngx-task/testing` provides testing utilities designed for clean unit and component tests.

```ts
import {
  createControlledTaskHandler,
  createTaskHarness,
  createDeferred,
  createTaskTestClock
} from 'ngx-task/testing';
```

---

## 1. `createControlledTaskHandler()`

Creates a handler function where you manually control when promises resolve or reject:

```ts title="task.spec.ts"
import { createTask } from 'ngx-task';
import { createControlledTaskHandler } from 'ngx-task/testing';

describe('Profile Task', () => {
  it('updates pending signal synchronously when controlled', async () => {
    const controlled = createControlledTaskHandler<string, { id: string }>();
    const task = createTask(controlled.handler, { injector: TestBed.inject(Injector) });

    expect(task.pending()).toBe(false);

    const execution = task.run('user-1');
    expect(task.pending()).toBe(true);

    // Resolve manually
    controlled.resolve({ id: 'user-1' });
    await execution.done;

    expect(task.pending()).toBe(false);
    expect(task.result()).toEqual({ id: 'user-1' });
  });
});
```

---

## 2. `createTaskHarness()`

Provides assertions and helper methods for testing `Task` instances in Angular component tests:

```ts
const harness = createTaskHarness(component.saveTask);

expect(harness.isIdle()).toBe(true);
component.clickSave();
expect(harness.isPending()).toBe(true);
```

---

## 3. Pure Test Primitives

- **`createDeferred<T>()`**: Creates a deferred object `{ promise, resolve, reject }`.
- **`createTaskTestClock()`**: Virtual clock for testing `pendingDelay` and `minimumPendingDuration` without waiting real clock time.
