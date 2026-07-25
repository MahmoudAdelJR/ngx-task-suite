import type { TaskScheduler } from './scheduler.interface.js';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';

export class RestartScheduler<TArgs, TResult> implements TaskScheduler<TArgs, TResult> {
  private active: ExecutionStateMachine<TArgs, TResult> | null = null;

  get activeExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return (this.active && !this.active.isSettled) ? [this.active] : [];
  }

  get queuedExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return [];
  }

  get runningCount(): number {
    return (this.active && !this.active.isSettled) ? 1 : 0;
  }

  get queuedCount(): number {
    return 0;
  }

  schedule(
    execution: ExecutionStateMachine<TArgs, TResult>,
    runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void,
  ): void {
    if (this.active && !this.active.isSettled) {
      const previous = this.active;
      this.active = null;
      previous.supersede();
    }

    this.active = execution;
    execution.start();

    execution.addListener({
      onStatusChange: () => {
        if (execution.isSettled && this.active === execution) {
          this.active = null;
        }
      },
    });

    runOperation(execution);
  }

  cancelAll(reason?: unknown): void {
    if (this.active) {
      const current = this.active;
      this.active = null;
      current.cancel(reason);
    }
  }

  cancelExecution(id: string, reason?: unknown): void {
    if (this.active && this.active.id === id) {
      const current = this.active;
      this.active = null;
      current.cancel(reason);
    }
  }
}
