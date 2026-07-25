---
title: Enqueue Policy
description: In-depth guide and usage examples for the enqueue concurrency policy in ngx-task.
---

The `enqueue` policy guarantees sequential, FIFO (First-In, First-Out) execution. New invocations wait in line until preceding executions finish.

```text
Invocation 1: ───[ Execution 1 ]───► Settled
Invocation 2:                     └───[ Execution 2 ]───► Settled
Invocation 3:                                         └───[ Execution 3 ]───► Settled
```

---

## When to Use `enqueue`

Use `enqueue` when tasks must run in **strict sequential order** without dropping or missing any invocation:
- Sequential file uploads
- Audit logging or telemetry tracking
- Step-by-step database migrations or batch operations

---

## Code Example

```ts title="audit-logger.component.ts"
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';
import { AuditService, AuditLog } from './audit.service';

@Component({
  selector: 'app-audit-logger',
  standalone: true,
  template: `
    <button (click)="logEvent('BUTTON_CLICKED')">Log Click</button>

    <p>Queued Logs: {{ logTask.queuedCount() }}</p>
    <p>Running: {{ logTask.running() }}</p>
  `,
})
export class AuditLoggerComponent {
  private auditService = inject(AuditService);

  readonly logTask = createTask(
    async (log: AuditLog, { signal }) => {
      return this.auditService.send(log, { signal });
    },
    {
      concurrency: 'enqueue', // Guarantees logs hit backend in exact sequence
      maxQueueSize: 50,       // Optional limit on queue size
      overflowPolicy: 'reject-newest',
    },
  );

  logEvent(action: string): void {
    this.logTask.run({ action, timestamp: Date.now() });
  }
}
```
