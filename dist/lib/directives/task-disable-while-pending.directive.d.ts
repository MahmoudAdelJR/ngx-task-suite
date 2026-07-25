import type { Task } from '../angular/task.interface.js';
import { TaskTriggerDirective } from './task-trigger.directive.js';
export type TaskDisableMode = 'native' | 'aria';
export declare class TaskDisableWhilePendingDirective {
    private readonly triggerDirective?;
    explicitTask?: Task<any, any>;
    taskDisableMode: TaskDisableMode;
    constructor(triggerDirective?: TaskTriggerDirective | undefined);
    private get targetTask();
    get isPending(): boolean;
    get nativeDisabled(): boolean | null;
    get ariaDisabled(): string | null;
}
//# sourceMappingURL=task-disable-while-pending.directive.d.ts.map