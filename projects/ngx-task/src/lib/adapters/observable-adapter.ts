import type { Observable, Subscription } from 'rxjs';
import type { ExecutionStateMachine } from '../core/execution-state-machine.js';
import type { TaskContext } from '../core/task-context.js';
import type { TaskError } from '../core/types.js';
import { defaultClassifyError } from './promise-adapter.js';

export type ObservableResultPolicy = 'latest' | 'first' | 'last' | 'forbid-multiple';

export function isObservable(value: unknown): value is Observable<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as any).subscribe === 'function'
  );
}

export interface ObservableAdapterOptions {
  observableResult?: ObservableResultPolicy;
  classifyError?: (error: unknown) => TaskError;
}

export type ObservableTaskHandler<TArgs, TResult> = (
  args: TArgs,
  context: TaskContext,
) => Observable<TResult>;

export class ObservableOperationAdapter<TArgs, TResult> {
  private readonly policy: ObservableResultPolicy;
  private readonly classifyError: (error: unknown) => TaskError;

  constructor(
    private readonly handler: ObservableTaskHandler<TArgs, TResult>,
    options?: ObservableAdapterOptions,
  ) {
    this.policy = options?.observableResult ?? 'latest';
    this.classifyError = options?.classifyError ?? defaultClassifyError;
  }

  runWithObservable(
    execution: ExecutionStateMachine<TArgs, TResult>,
    observable: Observable<TResult>,
  ): void {
    const context = execution.createContext();
    let subscription: Subscription | null = null;
    let lastValue: TResult | undefined;
    let emissionCount = 0;

    const onAbort = () => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
      }
    };

    if (execution.signal.aborted) {
      execution.cancel(execution.signal.reason);
      return;
    }

    execution.signal.addEventListener('abort', onAbort, { once: true });

    try {
      subscription = observable.subscribe({
        next: (value) => {
          if (execution.isSettled || execution.signal.aborted) return;
          emissionCount++;

          if (this.policy === 'first') {
            if (emissionCount === 1) {
              lastValue = value;
              execution.succeed(value);
              subscription?.unsubscribe();
            }
            return;
          }

          if (this.policy === 'forbid-multiple' && emissionCount > 1) {
            const err: TaskError = {
              cause: new Error(`Observable emitted multiple values when policy was forbid-multiple.`),
              kind: 'application',
              message: `Observable emitted multiple values when policy was forbid-multiple.`,
              retryable: false,
            };
            execution.fail(err);
            subscription?.unsubscribe();
            return;
          }

          lastValue = value;
          execution.reportProgress({ current: emissionCount, message: `Emitted ${emissionCount} values` });
        },
        error: (error) => {
          execution.signal.removeEventListener('abort', onAbort);
          if (execution.isSettled || execution.signal.aborted) return;

          const taskError = this.classifyError(error);
          execution.fail(taskError);
        },
        complete: () => {
          execution.signal.removeEventListener('abort', onAbort);
          if (execution.isSettled || execution.signal.aborted) return;

          if (lastValue !== undefined) {
            execution.succeed(lastValue);
          } else {
            execution.succeed(undefined as any);
          }
        },
      });
    } catch (syncError) {
      execution.signal.removeEventListener('abort', onAbort);
      if (execution.isSettled || execution.signal.aborted) return;

      const taskError = this.classifyError(syncError);
      execution.fail(taskError);
    }
  }

  run(execution: ExecutionStateMachine<TArgs, TResult>): void {
    const context = execution.createContext();
    try {
      const observable = this.handler(execution.args, context);
      this.runWithObservable(execution, observable);
    } catch (syncError) {
      if (execution.isSettled || execution.signal.aborted) return;
      const taskError = this.classifyError(syncError);
      execution.fail(taskError);
    }
  }
}
