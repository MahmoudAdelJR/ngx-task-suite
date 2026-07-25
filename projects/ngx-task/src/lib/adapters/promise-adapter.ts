import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { TaskContext } from '../core/task-context.js';
import type { TaskError } from '../core/types.js';

export function defaultClassifyError(error: unknown): TaskError {
  if (error && typeof error === 'object' && 'kind' in error && 'message' in error) {
    return error as TaskError;
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    cause: error,
    kind: 'application',
    message: message || 'An error occurred during task execution',
    retryable: false,
  };
}

export type PromiseTaskHandler<TArgs, TResult> = (
  args: TArgs,
  context: TaskContext,
) => PromiseLike<TResult>;

export class PromiseOperationAdapter<TArgs, TResult> {
  private readonly classifyError: (error: unknown) => TaskError;

  constructor(
    private readonly handler: PromiseTaskHandler<TArgs, TResult>,
    classifyError?: (error: unknown) => TaskError,
  ) {
    this.classifyError = classifyError ?? defaultClassifyError;
  }

  run(execution: ExecutionStateMachine<TArgs, TResult>): void {
    const context = execution.createContext();

    try {
      const resultPromise = this.handler(execution.args, context);
      Promise.resolve(resultPromise).then(
        (value) => {
          execution.succeed(value);
        },
        (error) => {
          if (execution.signal.aborted) {
            execution.cancel(error);
            return;
          }
          const taskError = this.classifyError(error);
          execution.fail(taskError);
        },
      );
    } catch (syncError) {
      if (execution.signal.aborted) {
        execution.cancel(syncError);
        return;
      }
      const taskError = this.classifyError(syncError);
      execution.fail(taskError);
    }
  }
}
