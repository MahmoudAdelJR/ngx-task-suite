import type { Observable } from 'rxjs';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { TaskContext } from '../core/task-context.js';
import type { TaskError } from '../core/types.js';
export type ObservableResultPolicy = 'latest' | 'first' | 'last' | 'forbid-multiple';
export declare function isObservable(value: unknown): value is Observable<unknown>;
export interface ObservableAdapterOptions {
    observableResult?: ObservableResultPolicy;
    classifyError?: (error: unknown) => TaskError;
}
export type ObservableTaskHandler<TArgs, TResult> = (args: TArgs, context: TaskContext) => Observable<TResult>;
export declare class ObservableOperationAdapter<TArgs, TResult> {
    private readonly handler;
    private readonly policy;
    private readonly classifyError;
    constructor(handler: ObservableTaskHandler<TArgs, TResult>, options?: ObservableAdapterOptions);
    runWithObservable(execution: ExecutionStateMachine<TArgs, TResult>, observable: Observable<TResult>): void;
    run(execution: ExecutionStateMachine<TArgs, TResult>): void;
}
//# sourceMappingURL=observable-adapter.d.ts.map