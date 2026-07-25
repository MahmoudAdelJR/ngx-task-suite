import { Component } from '@angular/core';
import { createTask } from '../angular/create-task.js';

@Component({
  selector: 'app-sequential-audit-log-demo',
  standalone: true,
  template: `
    <button (click)="logEvent('ACTION_1')">Log 1</button>
    <button (click)="logEvent('ACTION_2')">Log 2</button>
    <span>Queued: {{ auditTask.queuedCount() }}</span>
  `,
})
export class SequentialAuditLogDemoComponent {
  readonly auditTask = createTask(
    async (action: string) => {
      await new Promise(resolve => setTimeout(resolve, 30));
      return { action, processedAt: Date.now() };
    },
    {
      concurrency: 'enqueue',
      maxQueueSize: 10,
      overflowPolicy: 'reject-newest',
    },
  );

  logEvent(action: string): void {
    this.auditTask.run(action);
  }
}
