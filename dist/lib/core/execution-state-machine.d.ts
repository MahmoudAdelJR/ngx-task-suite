import type { TaskExecutionStatus, TaskError, TaskProgress } from './types.js';
import type { TaskOutcome } from './outcome.js';
import type { TaskContext } from './task-context.js';
export interface ExecutionListener<TArgs, TResult> {
    onStatusChange?: (status: TaskExecutionStatus) => void;
    onProgressChange?: (progress: TaskProgress | undefined) => void;
    onResultChange?: (result: TResult | undefined) => void;
    onErrorChange?: (error: TaskError | undefined) => void;
}
export declare class ExecutionStateMachine<TArgs, TResult> {
    readonly id: string;
    readonly args: TArgs;
    readonly createdAt: number;
    readonly attempt: number;
    readonly idempotencyKey: string;
    private _status;
    private _startedAt?;
    private _finishedAt?;
    private _progress?;
    private _result?;
    private _error?;
    readonly abortController: AbortController;
    readonly done: Promise<TaskOutcome<TResult>>;
    private resolveDone;
    private listeners;
    constructor(id: string, args: TArgs, attempt?: number, idempotencyKey?: string);
    get status(): TaskExecutionStatus;
    get startedAt(): number | undefined;
    get finishedAt(): number | undefined;
    get progress(): TaskProgress | undefined;
    get result(): TResult | undefined;
    get error(): TaskError | undefined;
    get isSettled(): boolean;
    get isRunning(): boolean;
    get isQueued(): boolean;
    get signal(): AbortSignal;
    addListener(listener: ExecutionListener<TArgs, TResult>): () => void;
    createContext(reportProgressOverride?: (p: TaskProgress) => void): TaskContext;
    queue(): boolean;
    start(): boolean;
    succeed(value: TResult): boolean;
    fail(error: TaskError): boolean;
    cancel(reason?: unknown): boolean;
    supersede(): boolean;
    drop(): boolean;
    timeOut(error: TaskError): boolean;
    reportProgress(progress: TaskProgress): void;
    resultOrThrow(): Promise<TResult>;
    private notifyStatus;
    private notifyResult;
    private notifyError;
}
//# sourceMappingURL=execution-state-machine.d.ts.map