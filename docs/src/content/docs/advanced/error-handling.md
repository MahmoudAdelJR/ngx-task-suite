---
title: Error Classification & Handling
description: Standardization of errors into TaskError and custom error classifier hooks.
---

In JavaScript and Angular apps, thrown errors can be strings, HTTP error objects, `DOMException` aborts, or custom domain errors.

`ngx-task` wraps all thrown exceptions into a unified, type-safe `TaskError` object accessible via `task.error()`.

---

## The `TaskError` Interface

```ts
export interface TaskError {
  /** Error classification code */
  readonly code: TaskErrorCode | string;
  /** Human-readable error message */
  readonly message: string;
  /** Original caught error object */
  readonly raw: unknown;
  /** Timestamp when error occurred */
  readonly timestamp: number;
}
```

Standard built-in error codes:
- `'TASK_CANCELLED'`: Execution was cancelled by user, lifecycle, or policy.
- `'TASK_TIMEOUT'`: Execution exceeded configured timeout duration.
- `'QUEUE_OVERFLOW'`: Execution was rejected due to queue size limits.
- `'TASK_EXECUTION_ERROR'`: Application/network error thrown by handler function.

---

## Custom Error Classifier (`classifyError`)

Customize error categorization by passing `classifyError`:

```ts
import { HttpErrorResponse } from '@angular/common/http';
import { createTask, TaskError } from 'ngx-task';

const checkoutTask = createTask(checkoutHandler, {
  classifyError: (rawError: unknown): TaskError => {
    if (rawError instanceof HttpErrorResponse) {
      if (rawError.status === 401) {
        return {
          code: 'UNAUTHORIZED',
          message: 'Your session has expired. Please log in again.',
          raw: rawError,
          timestamp: Date.now(),
        };
      }
    }
    return {
      code: 'CHECKOUT_FAILED',
      message: (rawError as Error)?.message ?? 'An unknown error occurred',
      raw: rawError,
      timestamp: Date.now(),
    };
  },
});
```
