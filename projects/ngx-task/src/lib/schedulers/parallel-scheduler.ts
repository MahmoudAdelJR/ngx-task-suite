import type { TaskScheduler } from './scheduler.interface.js';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { QueueOverflowPolicy } from '../core/types.js';

export interface ParallelSchedulerOptions {
  limit?: number;
  maxQueueSize?: number;
  overflowPolicy?: QueueOverflowPolicy;
}

interface QueuedExecution<TArgs, TResult> {
  execution: ExecutionStateMachine<TArgs, TResult>;
  runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void;
}

export class ParallelScheduler<TArgs, TResult> implements TaskScheduler<TArgs, TResult> {
  private active: Map<string, ExecutionStateMachine<TArgs, TResult>> = new Map();
  private queue: QueuedExecution<TArgs, TResult>[] = [];

  private readonly limit: number;
  private readonly maxQueueSize: number;
  private readonly overflowPolicy: QueueOverflowPolicy;

  constructor(options: ParallelSchedulerOptions = {}) {
    this.limit = options.limit ?? Number.POSITIVE_INFINITY;
    this.maxQueueSize = options.maxQueueSize ?? Number.POSITIVE_INFINITY;
    this.overflowPolicy = options.overflowPolicy ?? 'reject-newest';
  }

  get activeExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return Array.from(this.active.values()).filter(e => !e.isSettled);
  }

  get queuedExecutions(): ReadonlyArray<ExecutionStateMachine<TArgs, TResult>> {
    return this.queue.map(item => item.execution);
  }

  get runningCount(): number {
    return Array.from(this.active.values()).filter(e => !e.isSettled).length;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  schedule(
    execution: ExecutionStateMachine<TArgs, TResult>,
    runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void,
  ): void {
    if (this.runningCount < this.limit) {
      this.runExecution(execution, runOperation);
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
          throw new Error(`Parallel queue limit (${this.maxQueueSize}) reached.`);
      }
    }

    execution.queue();
    this.queue.push({ execution, runOperation });
  }

  private runExecution(
    execution: ExecutionStateMachine<TArgs, TResult>,
    runOperation: (execution: ExecutionStateMachine<TArgs, TResult>) => void,
  ): void {
    this.active.set(execution.id, execution);
    execution.start();

    execution.addListener({
      onStatusChange: () => {
        if (execution.isSettled && this.active.has(execution.id)) {
          this.active.delete(execution.id);
          if (this.queue.length > 0 && this.runningCount < this.limit) {
            const next = this.queue.shift()!;
            this.runExecution(next.execution, next.runOperation);
          }
        }
      },
    });

    runOperation(execution);
  }

  cancelAll(reason?: unknown): void {
    const activeExecs = Array.from(this.active.values());
    const queuedItems = [...this.queue];

    this.active.clear();
    this.queue = [];

    for (const exec of activeExecs) {
      exec.cancel(reason);
    }
    for (const exec of queuedItems) {
      exec.execution.cancel(reason);
    }
  }

  cancelExecution(id: string, reason?: unknown): void {
    const activeExec = this.active.get(id);
    if (activeExec) {
      this.active.delete(id);
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
