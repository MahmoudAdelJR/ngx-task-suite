import type { Task } from '../angular/task.interface.js';
export declare class TaskBusyDirective {
    task?: Task<any, any>;
    get isPending(): boolean;
    get ariaBusy(): string | null;
    get dataPending(): string | null;
}
//# sourceMappingURL=task-busy.directive.d.ts.map