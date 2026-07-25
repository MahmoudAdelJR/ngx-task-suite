import type { TaskScheduler } from './scheduler.interface.js';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { QueueOverflowPolicy } from '../core/types.js';
export interface EnqueueSchedulerOptions {
    maxQueueSize?: number;
    overflowPolicy?: QueueOverflowPolicy;
}
export declare class EnqueueScheduler<TArgs, TResult> implements TaskScheduler<TArgs, TResult> {
    private active;
    private queue;
    private readonly maxQueueSize;
    private readonly overflowPolicy;
    constructor(options?: EnqueueSchedulerOptions);
    get activeExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>>;
    get queuedExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>>;
    get runningCount(): number;
    get queuedCount(): number;
    schedule(execution: ExecutionStateMachine<TArgs, TResult>, runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void): void;
    private runNext;
    cancelAll(reason?: unknown): void;
    cancelExecution(id: string, reason?: unknown): void;
}
//# sourceMappingURL=enqueue-scheduler.d.ts.map