import { signal, inject, DestroyRef, type Signal, type WritableSignal } from '@angular/core';
import type { TaskExecutionStatus, TaskStatus, TaskProgress, TaskError } from '../core/types.js';
import type { TaskOutcome } from '../core/outcome.js';
import { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { Observable } from 'rxjs';
import { PromiseOperationAdapter, defaultClassifyError } from '../adapters/promise-adapter.js';
import { ObservableOperationAdapter, isObservable } from '../adapters/observable-adapter.js';
import type { TaskScheduler } from '../schedulers/scheduler.interface.js';
import { DropScheduler } from '../schedulers/drop-scheduler.js';
import { RestartScheduler } from '../schedulers/restart-scheduler.js';
import { EnqueueScheduler } from '../schedulers/enqueue-scheduler.js';
import { LatestScheduler } from '../schedulers/latest-scheduler.js';
import { ParallelScheduler } from '../schedulers/parallel-scheduler.js';
import type {
  Task,
  TaskExecution,
  TaskHandler,
  CreateTaskOptions,
} from './task.interface.js';

class TaskExecutionImpl<TArgs, TResult> implements TaskExecution<TArgs, TResult> {
  readonly id: string;
  readonly args: TArgs;
  readonly createdAt: number;

  private readonly statusSig: WritableSignal<TaskExecutionStatus>;
  private readonly progressSig: WritableSignal<TaskProgress | undefined>;
  private readonly resultSig: WritableSignal<TResult | undefined>;
  private readonly errorSig: WritableSignal<TaskError | undefined>;
  private readonly startedAtSig: WritableSignal<number | undefined>;
  private readonly finishedAtSig: WritableSignal<number | undefined>;

  readonly status: Signal<TaskExecutionStatus>;
  readonly progress: Signal<TaskProgress | undefined>;
  readonly result: Signal<TResult | undefined>;
  readonly error: Signal<TaskError | undefined>;
  readonly startedAt: Signal<number | undefined>;
  readonly finishedAt: Signal<number | undefined>;

  readonly done: Promise<TaskOutcome<TResult>>;

  constructor(private readonly stateMachine: ExecutionStateMachine<TArgs, TResult>) {
    this.id = stateMachine.id;
    this.args = stateMachine.args;
    this.createdAt = stateMachine.createdAt;
    this.done = stateMachine.done;

    this.statusSig = signal(stateMachine.status);
    this.progressSig = signal(stateMachine.progress);
    this.resultSig = signal(stateMachine.result);
    this.errorSig = signal(stateMachine.error);
    this.startedAtSig = signal(stateMachine.startedAt);
    this.finishedAtSig = signal(stateMachine.finishedAt);

    this.status = this.statusSig.asReadonly();
    this.progress = this.progressSig.asReadonly();
    this.result = this.resultSig.asReadonly();
    this.error = this.errorSig.asReadonly();
    this.startedAt = this.startedAtSig.asReadonly();
    this.finishedAt = this.finishedAtSig.asReadonly();

    stateMachine.addListener({
      onStatusChange: (status) => {
        this.statusSig.set(status);
        this.startedAtSig.set(stateMachine.startedAt);
        this.finishedAtSig.set(stateMachine.finishedAt);
      },
      onProgressChange: (p) => this.progressSig.set(p),
      onResultChange: (r) => this.resultSig.set(r),
      onErrorChange: (e) => this.errorSig.set(e),
    });
  }

  cancel(reason?: unknown): void {
    this.stateMachine.cancel(reason);
  }

  resultOrThrow(): Promise<TResult> {
    return this.stateMachine.resultOrThrow();
  }
}

class TaskImpl<TArgs, TResult> implements Task<TArgs, TResult> {
  private readonly statusSig: WritableSignal<TaskStatus> = signal('idle');
  private readonly pendingSig: WritableSignal<boolean> = signal(false);
  private readonly runningSig: WritableSignal<boolean> = signal(false);
  private readonly resultSig: WritableSignal<TResult | undefined> = signal(undefined);
  private readonly errorSig: WritableSignal<TaskError | undefined> = signal(undefined);
  private readonly progressSig: WritableSignal<TaskProgress | undefined> = signal(undefined);

  private readonly runningCountSig: WritableSignal<number> = signal(0);
  private readonly queuedCountSig: WritableSignal<number> = signal(0);
  private readonly executionCountSig: WritableSignal<number> = signal(0);

  private readonly lastExecutionSig: WritableSignal<TaskExecution<TArgs, TResult> | undefined> = signal(undefined);

  readonly status: Signal<TaskStatus> = this.statusSig.asReadonly();
  readonly pending: Signal<boolean> = this.pendingSig.asReadonly();
  readonly running: Signal<boolean> = this.runningSig.asReadonly();
  readonly result: Signal<TResult | undefined> = this.resultSig.asReadonly();
  readonly error: Signal<TaskError | undefined> = this.errorSig.asReadonly();
  readonly progress: Signal<TaskProgress | undefined> = this.progressSig.asReadonly();

  readonly runningCount: Signal<number> = this.runningCountSig.asReadonly();
  readonly queuedCount: Signal<number> = this.queuedCountSig.asReadonly();
  readonly executionCount: Signal<number> = this.executionCountSig.asReadonly();

  readonly lastExecution: Signal<TaskExecution<TArgs, TResult> | undefined> = this.lastExecutionSig.asReadonly();

  private readonly scheduler: TaskScheduler<TArgs, TResult>;
  private readonly classifyError: (error: unknown) => TaskError;
  private lastArgs?: TArgs;
  private seq = 0;

  private pendingTimer?: any;
  private pendingActiveTime?: number;

  constructor(
    private readonly handler: TaskHandler<TArgs, TResult>,
    private readonly options?: CreateTaskOptions<TArgs, TResult>,
  ) {
    this.classifyError = options?.classifyError ?? defaultClassifyError;
    this.scheduler = this.initScheduler(options);
    this.initDestroyRef(options);
  }

  run(args: TArgs): TaskExecution<TArgs, TResult> {
    this.seq++;
    this.lastArgs = args;
    const executionId = `exec-${this.seq}`;

    const stateMachine = new ExecutionStateMachine<TArgs, TResult>(
      executionId,
      args,
      this.seq,
    );

    const taskExecution = new TaskExecutionImpl<TArgs, TResult>(stateMachine);

    this.executionCountSig.update(c => c + 1);
    this.lastExecutionSig.set(taskExecution);

    // Timeout logic setup
    const timeoutOpt = this.options?.timeout;
    const timeoutMs = typeof timeoutOpt === 'number' ? timeoutOpt : timeoutOpt?.milliseconds;
    const timeoutMsg = typeof timeoutOpt === 'object' ? timeoutOpt.message : undefined;
    let timeoutTimer: any = undefined;

    stateMachine.addListener({
      onStatusChange: (status) => {
        if (status === 'running' && timeoutMs && timeoutMs > 0) {
          timeoutTimer = setTimeout(() => {
            const timeoutError: TaskError = {
              cause: new Error(timeoutMsg ?? `Task execution ${executionId} timed out after ${timeoutMs}ms`),
              kind: 'timeout',
              message: timeoutMsg ?? `Task execution ${executionId} timed out after ${timeoutMs}ms`,
              retryable: true,
            };
            stateMachine.timeOut(timeoutError);
          }, timeoutMs);
        } else if (stateMachine.isSettled && timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = undefined;
        }

        this.syncCountsAndStatus();
      },
      onProgressChange: (p) => this.progressSig.set(p),
      onResultChange: (res) => {
        if (res !== undefined) {
          this.resultSig.set(res);
          this.errorSig.set(undefined);
        }
      },
      onErrorChange: (err) => {
        if (err !== undefined) {
          this.errorSig.set(err);
        }
      },
    });

    stateMachine.done.finally(() => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = undefined;
      }
      queueMicrotask(() => this.syncCountsAndStatus());
    });

    this.scheduler.schedule(stateMachine, (exec) => {
      const context = exec.createContext();
      try {
        const handlerResult = this.handler(exec.args, context);
        if (isObservable(handlerResult)) {
          const obs = handlerResult as unknown as Observable<TResult>;
          const obsAdapter = new ObservableOperationAdapter<TArgs, TResult>(
            () => obs,
            {
              observableResult: this.options?.observableResult,
              classifyError: this.classifyError,
            },
          );
          obsAdapter.runWithObservable(exec, obs);
        } else {
          const promiseAdapter = new PromiseOperationAdapter<TArgs, TResult>(
            async () => handlerResult,
            this.classifyError,
          );
          promiseAdapter.run(exec);
        }
      } catch (err) {
        const taskErr = this.classifyError(err);
        exec.fail(taskErr);
      }
    });

    this.syncCountsAndStatus();

    return taskExecution;
  }

  cancel(reason?: unknown): void {
    const last = this.lastExecutionSig();
    last?.cancel(reason);
  }

  cancelAll(reason?: unknown): void {
    this.scheduler.cancelAll(reason);
    this.syncCountsAndStatus();
  }

  reset(): void {
    this.resultSig.set(undefined);
    this.errorSig.set(undefined);
    this.progressSig.set(undefined);
    this.statusSig.set('idle');
  }

  retryLast(): TaskExecution<TArgs, TResult> | undefined {
    if (this.lastArgs !== undefined) {
      return this.run(this.lastArgs);
    }
    return undefined;
  }

  private syncCountsAndStatus(): void {
    const rCount = this.scheduler.runningCount;
    const qCount = this.scheduler.queuedCount;

    this.runningCountSig.set(rCount);
    this.queuedCountSig.set(qCount);

    const isWorkActive = rCount > 0 || qCount > 0;
    this.runningSig.set(rCount > 0);

    this.updatePendingState(isWorkActive);

    if (isWorkActive) {
      this.statusSig.set('pending');
    } else if (this.executionCountSig() > 0) {
      this.statusSig.set('settled');
    } else {
      this.statusSig.set('idle');
    }
  }

  private updatePendingState(isWorkActive: boolean): void {
    const delay = this.options?.pendingDelay ?? 0;
    const minDuration = this.options?.minimumPendingDuration ?? 0;

    if (isWorkActive) {
      if (this.pendingSig()) {
        return;
      }

      if (delay > 0) {
        if (!this.pendingTimer) {
          this.pendingTimer = setTimeout(() => {
            this.pendingTimer = undefined;
            if (this.scheduler.runningCount > 0 || this.scheduler.queuedCount > 0) {
              this.pendingActiveTime = Date.now();
              this.pendingSig.set(true);
            }
          }, delay);
        }
      } else {
        this.pendingActiveTime = Date.now();
        this.pendingSig.set(true);
      }
    } else {
      if (this.pendingTimer) {
        clearTimeout(this.pendingTimer);
        this.pendingTimer = undefined;
      }

      if (this.pendingSig()) {
        const elapsed = this.pendingActiveTime ? Date.now() - this.pendingActiveTime : minDuration;
        const remaining = minDuration - elapsed;

        if (remaining > 0) {
          setTimeout(() => {
            if (this.scheduler.runningCount === 0 && this.scheduler.queuedCount === 0) {
              this.pendingSig.set(false);
              this.pendingActiveTime = undefined;
            }
          }, remaining);
        } else {
          this.pendingSig.set(false);
          this.pendingActiveTime = undefined;
        }
      }
    }
  }

  private initScheduler(options?: CreateTaskOptions<TArgs, TResult>): TaskScheduler<TArgs, TResult> {
    const policy = options?.concurrency ?? 'drop';
    if (typeof policy === 'object' && policy.mode === 'parallel') {
      return new ParallelScheduler<TArgs, TResult>({
        limit: policy.limit,
        maxQueueSize: options?.maxQueueSize,
        overflowPolicy: options?.overflowPolicy,
      });
    }
    switch (policy) {
      case 'restart':
        return new RestartScheduler<TArgs, TResult>();
      case 'enqueue':
        return new EnqueueScheduler<TArgs, TResult>({
          maxQueueSize: options?.maxQueueSize,
          overflowPolicy: options?.overflowPolicy,
        });
      case 'latest':
        return new LatestScheduler<TArgs, TResult>();
      case 'drop':
      default:
        return new DropScheduler<TArgs, TResult>();
    }
  }

  private initDestroyRef(options?: CreateTaskOptions<TArgs, TResult>): void {
    let destroyRef: DestroyRef | null = null;
    if (options?.injector) {
      destroyRef = options.injector.get(DestroyRef, null);
    } else {
      try {
        destroyRef = inject(DestroyRef, { optional: true });
      } catch {
        // Ignored outside DI context
      }
    }

    const destroyBehavior = options?.destroyBehavior ?? 'cancel';
    if (destroyRef && destroyBehavior === 'cancel') {
      destroyRef.onDestroy(() => {
        this.cancelAll('Owner destroyed');
      });
    }
  }
}

export function createTask<TArgs, TResult>(
  handler: TaskHandler<TArgs, TResult>,
  options?: CreateTaskOptions<TArgs, TResult>,
): Task<TArgs, TResult> {
  return new TaskImpl<TArgs, TResult>(handler, options);
}
