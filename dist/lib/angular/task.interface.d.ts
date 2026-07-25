import type { Signal, Injector } from '@angular/core';
import type { TaskExecutionStatus, TaskStatus, TaskProgress, TaskError, ConcurrencyPolicy, QueueOverflowPolicy } from '../core/types.js';
import type { TaskOutcome } from '../core/outcome.js';
import type { TaskContext } from '../core/task-context.js';
import type { ObservableResultPolicy } from '../adapters/observable-adapter.js';
export type TaskHandler<TArgs, TResult> = (args: TArgs, context: TaskContext) => PromiseLike<TResult> | any;
export type DestroyBehavior = 'cancel' | 'detach' | 'allow';
export interface TaskTimeoutOptions {
    readonly milliseconds: number;
    readonly message?: string;
}
export interface CreateTaskOptions<TArgs, TResult> {
    concurrency?: ConcurrencyPolicy;
    timeout?: number | TaskTimeoutOptions;
    pendingDelay?: number;
    minimumPendingDuration?: number;
    classifyError?: (error: unknown) => TaskError;
    destroyBehavior?: DestroyBehavior;
    injector?: Injector;
    maxQueueSize?: number;
    overflowPolicy?: QueueOverflowPolicy;
    observableResult?: ObservableResultPolicy;
}
export interface TaskExecution<TArgs, TResult> {
    readonly id: string;
    readonly args: TArgs;
    readonly status: Signal<TaskExecutionStatus>;
    readonly progress: Signal<TaskProgress | undefined>;
    readonly result: Signal<TResult | undefined>;
    readonly error: Signal<TaskError | undefined>;
    readonly createdAt: number;
    readonly startedAt: Signal<number | undefined>;
    readonly finishedAt: Signal<number | undefined>;
    readonly done: Promise<TaskOutcome<TResult>>;
    cancel(reason?: unknown): void;
    resultOrThrow(): Promise<TResult>;
}
export interface Task<TArgs, TResult> {
    readonly status: Signal<TaskStatus>;
    readonly pending: Signal<boolean>;
    readonly running: Signal<boolean>;
    readonly result: Signal<TResult | undefined>;
    readonly error: Signal<TaskError | undefined>;
    readonly progress: Signal<TaskProgress | undefined>;
    readonly runningCount: Signal<number>;
    readonly queuedCount: Signal<number>;
    readonly executionCount: Signal<number>;
    readonly lastExecution: Signal<TaskExecution<TArgs, TResult> | undefined>;
    run(args: TArgs): TaskExecution<TArgs, TResult>;
    cancel(reason?: unknown): void;
    cancelAll(reason?: unknown): void;
    reset(): void;
    retryLast(): TaskExecution<TArgs, TResult> | undefined;
}
//# sourceMappingURL=task.interface.d.ts.map