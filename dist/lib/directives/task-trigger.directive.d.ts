import type { Task } from '../angular/task.interface.js';
export declare class TaskTriggerDirective<TArgs = any, TResult = any> {
    task?: Task<TArgs, TResult>;
    taskArgs?: TArgs;
    onClick(event: Event): void;
}
//# sourceMappingURL=task-trigger.directive.d.ts.map