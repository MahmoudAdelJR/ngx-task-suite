import type { TaskScheduler } from './scheduler.interface.js';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
export declare class RestartScheduler<TArgs, TResult> implements TaskScheduler<TArgs, TResult> {
    private active;
    get activeExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>>;
    get queuedExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>>;
    get runningCount(): number;
    get queuedCount(): number;
    schedule(execution: ExecutionStateMachine<TArgs, TResult>, runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void): void;
    cancelAll(reason?: unknown): void;
    cancelExecution(id: string, reason?: unknown): void;
}
//# sourceMappingURL=restart-scheduler.d.ts.map