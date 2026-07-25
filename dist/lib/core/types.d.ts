export type TaskExecutionStatus = 'created' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'superseded' | 'dropped' | 'timed-out';
export type TaskStatus = 'idle' | 'pending' | 'settled';
export interface TaskProgress {
    readonly current: number;
    readonly total?: number;
    readonly unit?: string;
    readonly message?: string;
}
export interface TaskError {
    readonly cause: unknown;
    readonly kind: 'application' | 'network' | 'timeout' | 'cancelled' | 'unknown';
    readonly message: string;
    readonly retryable: boolean;
    readonly statusCode?: number;
}
export type QueueOverflowPolicy = 'reject-newest' | 'drop-oldest' | 'throw';
export type ConcurrencyPolicy = 'drop' | 'restart' | 'enqueue' | 'latest' | {
    readonly mode: 'parallel';
    readonly limit?: number;
};
//# sourceMappingURL=types.d.ts.map