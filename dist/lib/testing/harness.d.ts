import type { TaskProgress } from '../core/types.js';
import type { TaskContext } from '../core/task-context.js';
import type { Task, TaskExecution } from '../angular/task.interface.js';
export interface ControlledInvocation<TArgs> {
    readonly id: string;
    readonly args: TArgs;
    readonly context: TaskContext;
}
export interface ControlledTaskHandlerController<TArgs, TResult> {
    handler(args: TArgs, context: TaskContext): Promise<TResult>;
    readonly invocations: ReadonlyArray<ControlledInvocation<TArgs>>;
    resolve(executionId: string, value: TResult): void;
    reject(executionId: string, error?: unknown): void;
    reportProgress(executionId: string, progress: TaskProgress): void;
    resolveLast(value: TResult): void;
    rejectLast(error?: unknown): void;
}
export declare function createControlledTaskHandler<TArgs = void, TResult = unknown>(): ControlledTaskHandlerController<TArgs, TResult>;
export interface TaskHarness<TArgs, TResult> {
    readonly task: Task<TArgs, TResult>;
    readonly lastExecution: TaskExecution<TArgs, TResult> | undefined;
    cancelLast(reason?: unknown): void;
}
export declare function createTaskHarness<TArgs, TResult>(task: Task<TArgs, TResult>): TaskHarness<TArgs, TResult>;
//# sourceMappingURL=harness.d.ts.map