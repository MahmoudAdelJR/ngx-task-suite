import { Component } from '@angular/core';
import { createTask } from '../angular/create-task.js';
import { TaskTriggerDirective } from '../directives/task-trigger.directive.js';
import { TaskDisableWhilePendingDirective } from '../directives/task-disable-while-pending.directive.js';

@Component({
  selector: 'app-form-submit-demo',
  standalone: true,
  imports: [TaskTriggerDirective, TaskDisableWhilePendingDirective],
  template: `
    <button
      type="button"
      [taskTrigger]="saveTask"
      [taskArgs]="formData"
      taskDisableWhilePending
    >
      @if (saveTask.pending()) { Saving... } @else { Save Form }
    </button>
  `,
})
export class FormSubmitDemoComponent {
  formData = { title: 'New Item' };

  readonly saveTask = createTask(
    async (data: { title: string }, { signal }) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { success: true, savedTitle: data.title };
    },
    {
      concurrency: 'drop',
      pendingDelay: 20,
    },
  );
}
