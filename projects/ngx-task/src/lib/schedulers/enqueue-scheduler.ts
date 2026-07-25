import type { TaskScheduler } from './scheduler.interface.js';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { QueueOverflowPolicy } from '../core/types.js';

export interface EnqueueSchedulerOptions {
  maxQueueSize?: number;
  overflowPolicy?: QueueOverflowPolicy;
}

interface QueuedExecution<TArgs, TResult> {
  execution: ExecutionStateMachine<TArgs, TResult>;
  runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void;
}

export class EnqueueScheduler<TArgs, TResult> implements TaskScheduler<TArgs, TResult> {
  private active: ExecutionStateMachine<TArgs, TResult> | null = null;
  private queue: QueuedExecution<TArgs, TResult>[] = [];

  private readonly maxQueueSize: number;
  private readonly overflowPolicy: QueueOverflowPolicy;

  constructor(options: EnqueueSchedulerOptions = {}) {
    this.maxQueueSize = options.maxQueueSize ?? Number.POSITIVE_INFINITY;
    this.overflowPolicy = options.overflowPolicy ?? 'reject-newest';
  }

  get activeExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return (this.active && !this.active.isSettled) ? [this.active] : [];
  }

  get queuedExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return this.queue.map(item => item.execution);
  }

  get runningCount(): number {
    return (this.active && !this.active.isSettled) ? 1 : 0;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  schedule(
    execution: ExecutionStateMachine<TArgs, TResult>,
    runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void,
  ): void {
    if (!this.active || this.active.isSettled) {
      this.runNext(execution, runOperation);
      return;
    }

    if (this.queue.length >= this.maxQueueSize) {
      switch (this.overflowPolicy) {
        case 'reject-newest':
          execution.drop();
          return;
        case 'drop-oldest': {
          const oldest = this.queue.shift();
          oldest?.execution.supersede();
          break;
        }
        case 'throw':
          execution.drop();
          throw new Error(`Queue overflow limit (${this.maxQueueSize}) reached.`);
      }
    }

    execution.queue();
    this.queue.push({ execution, runOperation });
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
          if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            this.runNext(next.execution, next.runOperation);
          }
        }
      },
    });

    runOperation(execution);
  }

  cancelAll(reason?: unknown): void {
    const activeExec = this.active;
    const queuedItems = [...this.queue];

    this.active = null;
    this.queue = [];

    activeExec?.cancel(reason);
    for (const q of queuedItems) {
      q.execution.cancel(reason);
    }
  }

  cancelExecution(id: string, reason?: unknown): void {
    if (this.active && this.active.id === id) {
      const activeExec = this.active;
      this.active = null;
      activeExec.cancel(reason);
      return;
    }

    const index = this.queue.findIndex(item => item.execution.id === id);
    if (index !== -1) {
      const [queuedItem] = this.queue.splice(index, 1);
      queuedItem.execution.cancel(reason);
    }
  }
}
