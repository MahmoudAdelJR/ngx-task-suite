import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { TaskContext } from '../core/task-context.js';
import type { TaskError } from '../core/types.js';
export declare function defaultClassifyError(error: unknown): TaskError;
export type PromiseTaskHandler<TArgs, TResult> = (args: TArgs, context: TaskContext) => PromiseLike<TResult>;
export declare class PromiseOperationAdapter<TArgs, TResult> {
    private readonly handler;
    private readonly classifyError;
    constructor(handler: PromiseTaskHandler<TArgs, TResult>, classifyError?: (error: unknown) => TaskError);
    run(execution: ExecutionStateMachine<TArgs, TResult>): void;
}
//# sourceMappingURL=promise-adapter.d.ts.map