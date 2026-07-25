import type { TaskScheduler } from './scheduler.interface.js';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';

interface QueuedExecution<TArgs, TResult> {
  execution: ExecutionStateMachine<TArgs, TResult>;
  runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void;
}

export class LatestScheduler<TArgs, TResult> implements TaskScheduler<TArgs, TResult> {
  private active: ExecutionStateMachine<TArgs, TResult> | null = null;
  private queued: QueuedExecution<TArgs, TResult> | null = null;

  get activeExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return (this.active && !this.active.isSettled) ? [this.active] : [];
  }

  get queuedExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return this.queued ? [this.queued.execution] : [];
  }

  get runningCount(): number {
    return (this.active && !this.active.isSettled) ? 1 : 0;
  }

  get queuedCount(): number {
    return this.queued ? 1 : 0;
  }

  schedule(
    execution: ExecutionStateMachine<TArgs, TResult>,
    runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void,
  ): void {
    if (!this.active || this.active.isSettled) {
      this.runNext(execution, runOperation);
      return;
    }

    if (this.queued) {
      const oldQueued = this.queued;
      this.queued = null;
      oldQueued.execution.supersede();
    }

    this.queued = { execution, runOperation };
    execution.queue();
  }

  private runNext(
    execution: ExecutionStateMachine<TArgs, TResult>,
    runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void,
  ): void {
    this.active = execution;
    execution.start();

    execution.addListener({
      onStatusChange: () => {
        if (execution.isSettled && this.active === execution) {
          this.active = null;
          if (this.queued) {
            const next = this.queued;
            this.queued = null;
            this.runNext(next.execution, next.runOperation);
          }
        }
      },
    });

    runOperation(execution);
  }

  cancelAll(reason?: unknown): void {
    const activeExec = this.active;
    const queuedExec = this.queued;

    this.active = null;
    this.queued = null;

    activeExec?.cancel(reason);
    queuedExec?.execution.cancel(reason);
  }

  cancelExecution(id: string, reason?: unknown): void {
    if (this.active && this.active.id === id) {
      const activeExec = this.active;
      this.active = null;
      activeExec.cancel(reason);
      return;
    }

    if (this.queued && this.queued.execution.id === id) {
      const queuedExec = this.queued;
      this.queued = null;
      queuedExec.execution.cancel(reason);
    }
  }
}
