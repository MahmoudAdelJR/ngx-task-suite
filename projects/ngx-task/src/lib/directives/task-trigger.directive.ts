import { Directive } from '@angular/core';
import type { Task } from '../angular/task.interface.js';

@Directive({
  selector: '[taskTrigger]',
  standalone: true,
  inputs: ['task: taskTrigger', 'taskArgs'],
  host: {
    '(click)': 'onClick($event)',
  },
})
export class TaskTriggerDirective<TArgs = any, TResult = any> {
  task?: Task<TArgs, TResult>;
  taskArgs?: TArgs;

  onClick(event: Event): void {
    if (this.task) {
      this.task.run(this.taskArgs as TArgs);
    }
  }
}
