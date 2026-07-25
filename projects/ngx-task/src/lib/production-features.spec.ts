import { describe, it, expect } from 'vitest';
import { createTask } from './angular/create-task.js';
import { createDeferred } from './testing/deferred.js';
import type { TaskError } from './core/types.js';

describe('Phase 4 Advanced Production Features', () => {
  it('triggers timeout when execution exceeds configured timeout ms', async () => {
    const deferred = createDeferred<string>();
    const task = createTask(() => deferred.promise, {
      timeout: 50,
    });

    const exec = task.run(undefined);
    expect(exec.status()).toBe('running');

    // Wait for timeout to fire
    await new Promise(resolve => setTimeout(resolve, 80));

    expect(exec.status()).toBe('timed-out');
    expect(exec.error()?.kind).toBe('timeout');

    const outcome = await exec.done;
    expect(outcome.type).toBe('timed-out');

    deferred.resolve('late resolution after timeout');
  });

  it('classifies errors using custom classifyError hook', async () => {
    class CustomNetworkError extends Error {
      code = 503;
    }

    const task = createTask(() => {
      throw new CustomNetworkError('Service Unavailable');
    }, {
      classifyError: (err): TaskError => {
        if (err instanceof CustomNetworkError) {
          return {
            cause: err,
            kind: 'network',
            message: err.message,
            retryable: true,
            statusCode: err.code,
          };
        }
        return {
          cause: err,
          kind: 'unknown',
          message: 'Unknown',
          retryable: false,
        };
      },
    });

    const exec = task.run(undefined);
    await exec.done;

    expect(task.error()).toEqual({
      cause: expect.any(CustomNetworkError),
      kind: 'network',
      message: 'Service Unavailable',
      retryable: true,
      statusCode: 503,
    });
  });

  it('tracks progress via TaskContext.reportProgress', async () => {
    const deferred = createDeferred<void>();
    const task = createTask(async (_, ctx) => {
      ctx.reportProgress({ current: 25, total: 100, message: 'Downloading...' });
      ctx.reportProgress({ current: 75, total: 100, message: 'Extracting...' });
      await deferred.promise;
    });

    const exec = task.run(undefined);
    expect(exec.progress()).toEqual({ current: 75, total: 100, message: 'Extracting...' });
    expect(task.progress()).toEqual({ current: 75, total: 100, message: 'Extracting...' });

    deferred.resolve();
    await exec.done;
  });

  it('respects pendingDelay anti-flicker option for fast executions', async () => {
    // Fast execution completes in 10ms, but pendingDelay is 100ms
    const task = createTask(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'fast-result';
    }, {
      pendingDelay: 100,
    });

    const exec = task.run(undefined);
    expect(task.running()).toBe(true);
    expect(task.pending()).toBe(false); // Delayed!

    await exec.done;

    expect(task.running()).toBe(false);
    expect(task.pending()).toBe(false); // Never flashed true!
  });
});
