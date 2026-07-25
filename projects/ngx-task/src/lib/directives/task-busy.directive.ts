import { Directive } from '@angular/core';
import type { Task } from '../angular/task.interface.js';

@Directive({
  selector: '[taskBusy]',
  standalone: true,
  inputs: ['task: taskBusy'],
  host: {
    '[attr.aria-busy]': 'ariaBusy',
    '[attr.data-task-pending]': 'dataPending',
  },
})
export class TaskBusyDirective {
  task?: Task<any, any>;

  get isPending(): boolean {
    return this.task?.pending() ?? false;
  }

  get ariaBusy(): string | null {
    return this.isPending ? 'true' : null;
  }

  get dataPending(): string | null {
    return this.isPending ? 'true' : null;
  }
}
