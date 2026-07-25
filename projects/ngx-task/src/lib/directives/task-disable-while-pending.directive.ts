import { Directive, Optional, Self } from '@angular/core';
import type { Task } from '../angular/task.interface.js';
import { TaskTriggerDirective } from './task-trigger.directive.js';

export type TaskDisableMode = 'native' | 'aria';

@Directive({
  selector: '[taskDisableWhilePending]',
  standalone: true,
  inputs: ['explicitTask: taskDisableWhilePending', 'taskDisableMode'],
  host: {
    '[disabled]': 'nativeDisabled',
    '[attr.aria-disabled]': 'ariaDisabled',
  },
})
export class TaskDisableWhilePendingDirective {
  explicitTask?: Task<any, any>;
  taskDisableMode: TaskDisableMode = 'native';

  constructor(
    @Optional() @Self() private readonly triggerDirective?: TaskTriggerDirective,
  ) {}

  private get targetTask(): Task<any, any> | undefined {
    return this.explicitTask || this.triggerDirective?.task;
  }

  get isPending(): boolean {
    return this.targetTask?.pending() ?? false;
  }

  get nativeDisabled(): boolean | null {
    if (this.taskDisableMode === 'native' && this.isPending) {
      return true;
    }
    return null;
  }

  get ariaDisabled(): string | null {
    if (this.taskDisableMode === 'aria' && this.isPending) {
      return 'true';
    }
    return null;
  }
}
