import { createDeferred, type Deferred } from './deferred.js';
import type { TaskProgress, TaskError } from '../core/types.js';
import type { TaskContext } from '../core/task-context.js';
import type { Task, TaskExecution } from '../angular/task.interface.js';

export interface ControlledInvocation<TArgs> {
  readonly id: string;
  readonly args: TArgs;
  readonly context: TaskContext;
}

export interface ControlledTaskHandlerController<TArgs, TResult> {
  handler(args: TArgs, context: TaskContext): Promise<TResult>;
  readonly invocations: ReadonlyArray<ControlledInvocation<TArgs>>;
  resolve(executionId: string, value: TResult): void;
  reject(executionId: string, error?: unknown): void;
  reportProgress(executionId: string, progress: TaskProgress): void;
  resolveLast(value: TResult): void;
  rejectLast(error?: unknown): void;
}

export function createControlledTaskHandler<TArgs = void, TResult = unknown>(): ControlledTaskHandlerController<TArgs, TResult> {
  const invocations: ControlledInvocation<TArgs>[] = [];
  const deferredMap = new Map<string, Deferred<TResult>>();

  const handler = (args: TArgs, context: TaskContext): Promise<TResult> => {
    const deferred = createDeferred<TResult>();
    deferredMap.set(context.executionId, deferred);
    invocations.push({ id: context.executionId, args, context });
    return deferred.promise;
  };

  const resolve = (executionId: string, value: TResult) => {
    const deferred = deferredMap.get(executionId);
    if (deferred) {
      deferred.resolve(value);
    }
  };

  const reject = (executionId: string, error?: unknown) => {
    const deferred = deferredMap.get(executionId);
    if (deferred) {
      deferred.reject(error);
    }
  };

  const reportProgress = (executionId: string, progress: TaskProgress) => {
    const inv = invocations.find(i => i.id === executionId);
    if (inv) {
      inv.context.reportProgress(progress);
    }
  };

  const resolveLast = (value: TResult) => {
    const last = invocations[invocations.length - 1];
    if (last) {
      resolve(last.id, value);
    }
  };

  const rejectLast = (error?: unknown) => {
    const last = invocations[invocations.length - 1];
    if (last) {
      reject(last.id, error);
    }
  };

  return {
    handler,
    invocations,
    resolve,
    reject,
    reportProgress,
    resolveLast,
    rejectLast,
  };
}

export interface TaskHarness<TArgs, TResult> {
  readonly task: Task<TArgs, TResult>;
  readonly lastExecution: TaskExecution<TArgs, TResult> | undefined;
  cancelLast(reason?: unknown): void;
}

export function createTaskHarness<TArgs, TResult>(task: Task<TArgs, TResult>): TaskHarness<TArgs, TResult> {
  return {
    task,
    get lastExecution() {
      return task.lastExecution();
    },
    cancelLast(reason?: unknown) {
      task.cancel(reason);
    },
  };
}
