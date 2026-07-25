import type { TaskExecutionStatus, TaskError, TaskProgress } from './types.js';
import type { TaskOutcome } from './outcome.js';
import type { TaskContext } from './task-context.js';

export interface ExecutionListener<TArgs, TResult> {
  onStatusChange?: (status: TaskExecutionStatus) => void;
  onProgressChange?: (progress: TaskProgress | undefined) => void;
  onResultChange?: (result: TResult | undefined) => void;
  onErrorChange?: (error: TaskError | undefined) => void;
}

const SETTLED_STATUSES = new Set<TaskExecutionStatus>([
  'succeeded',
  'failed',
  'cancelled',
  'superseded',
  'dropped',
  'timed-out',
]);

export class ExecutionStateMachine<TArgs, TResult> {
  readonly id: string;
  readonly args: TArgs;
  readonly createdAt: number;
  readonly attempt: number;
  readonly idempotencyKey: string;

  private _status: TaskExecutionStatus = 'created';
  private _startedAt?: number;
  private _finishedAt?: number;
  private _progress?: TaskProgress;
  private _result?: TResult;
  private _error?: TaskError;

  readonly abortController: AbortController = new AbortController();
  readonly done: Promise<TaskOutcome<TResult>>;
  private resolveDone!: (outcome: TaskOutcome<TResult>) => void;

  private listeners: Set<ExecutionListener<TArgs, TResult>> = new Set();

  constructor(
    id: string,
    args: TArgs,
    attempt: number = 1,
    idempotencyKey?: string,
  ) {
    this.id = id;
    this.args = args;
    this.createdAt = Date.now();
    this.attempt = attempt;
    this.idempotencyKey = idempotencyKey ?? id;

    this.done = new Promise<TaskOutcome<TResult>>((resolve) => {
      this.resolveDone = resolve;
    });
  }

  get status(): TaskExecutionStatus {
    return this._status;
  }

  get startedAt(): number | undefined {
    return this._startedAt;
  }

  get finishedAt(): number | undefined {
    return this._finishedAt;
  }

  get progress(): TaskProgress | undefined {
    return this._progress;
  }

  get result(): TResult | undefined {
    return this._result;
  }

  get error(): TaskError | undefined {
    return this._error;
  }

  get isSettled(): boolean {
    return SETTLED_STATUSES.has(this._status);
  }

  get isRunning(): boolean {
    return this._status === 'running';
  }

  get isQueued(): boolean {
    return this._status === 'queued';
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  addListener(listener: ExecutionListener<TArgs, TResult>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  createContext(reportProgressOverride?: (p: TaskProgress) => void): TaskContext {
    return {
      signal: this.signal,
      executionId: this.id,
      attempt: this.attempt,
      idempotencyKey: this.idempotencyKey,
      reportProgress: (progress: TaskProgress) => {
        if (reportProgressOverride) {
          reportProgressOverride(progress);
        } else {
          this.reportProgress(progress);
        }
      },
      throwIfCancelled: () => {
        if (this.signal.aborted) {
          throw this.signal.reason ?? new Error(`Task execution ${this.id} was cancelled.`);
        }
      },
    };
  }

  queue(): boolean {
    if (this._status !== 'created') return false;
    this._status = 'queued';
    this.notifyStatus();
    return true;
  }

  start(): boolean {
    if (this._status !== 'created' && this._status !== 'queued') return false;
    this._status = 'running';
    this._startedAt = Date.now();
    this.notifyStatus();
    return true;
  }

  succeed(value: TResult): boolean {
    if (this._status !== 'running') {
      // Late resolution ignored after settlement
      return false;
    }
    this._status = 'succeeded';
    this._result = value;
    this._finishedAt = Date.now();
    this.notifyStatus();
    this.notifyResult();
    this.resolveDone({ type: 'success', value });
    return true;
  }

  fail(error: TaskError): boolean {
    if (this._status !== 'running') {
      // Late rejection ignored after settlement
      return false;
    }
    this._status = 'failed';
    this._error = error;
    this._finishedAt = Date.now();
    this.notifyStatus();
    this.notifyError();
    this.resolveDone({ type: 'failure', error });
    return true;
  }

  cancel(reason?: unknown): boolean {
    if (this.isSettled) return false;
    const wasRunningOrQueued = this._status === 'running' || this._status === 'queued';
    this._status = 'cancelled';
    this._finishedAt = Date.now();
    this.abortController.abort(reason ?? 'cancelled');
    this.notifyStatus();
    this.resolveDone({ type: 'cancelled', reason });
    return wasRunningOrQueued;
  }

  supersede(): boolean {
    if (this.isSettled) return false;
    this._status = 'superseded';
    this._finishedAt = Date.now();
    this.abortController.abort('superseded');
    this.notifyStatus();
    this.resolveDone({ type: 'superseded' });
    return true;
  }

  drop(): boolean {
    if (this._status !== 'created') return false;
    this._status = 'dropped';
    this._finishedAt = Date.now();
    this.notifyStatus();
    this.resolveDone({ type: 'dropped' });
    return true;
  }

  timeOut(error: TaskError): boolean {
    if (this._status !== 'running') return false;
    this._status = 'timed-out';
    this._error = error;
    this._finishedAt = Date.now();
    this.abortController.abort('timed-out');
    this.notifyStatus();
    this.notifyError();
    this.resolveDone({ type: 'timed-out', error });
    return true;
  }

  reportProgress(progress: TaskProgress): void {
    if (this.isSettled) return;
    this._progress = progress;
    for (const listener of this.listeners) {
      listener.onProgressChange?.(progress);
    }
  }

  async resultOrThrow(): Promise<TResult> {
    const outcome = await this.done;
    switch (outcome.type) {
      case 'success':
        return outcome.value;
      case 'failure':
      case 'timed-out':
        throw outcome.error.cause ?? new Error(outcome.error.message);
      case 'cancelled':
        throw outcome.reason ?? new Error(`Task execution ${this.id} was cancelled.`);
      case 'superseded':
        throw new Error(`Task execution ${this.id} was superseded.`);
      case 'dropped':
        throw new Error(`Task execution ${this.id} was dropped.`);
    }
  }

  private notifyStatus(): void {
    for (const listener of this.listeners) {
      listener.onStatusChange?.(this._status);
    }
  }

  private notifyResult(): void {
    for (const listener of this.listeners) {
      listener.onResultChange?.(this._result);
    }
  }

  private notifyError(): void {
    for (const listener of this.listeners) {
      listener.onErrorChange?.(this._error);
    }
  }
}
