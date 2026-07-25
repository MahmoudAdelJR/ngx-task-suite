import type { ExecutionStateMachine } from '../core/execution-state-machine.js';

export interface TaskScheduler<TArgs, TResult> {
  schedule(
    execution: ExecutionStateMachine<TArgs, TResult>,
    runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void,
  ): void;

  cancelAll(reason?: unknown): void;
  cancelExecution(id: string, reason?: unknown): void;

  readonly activeExecutions: ReadonlyArray<ExecutionStateMachine<TArgs, TResult>>;
  readonly queuedExecutions: ReadonlyArray<ExecutionStateMachine<TArgs, TResult>>;
  readonly runningCount: number;
  readonly queuedCount: number;
}
