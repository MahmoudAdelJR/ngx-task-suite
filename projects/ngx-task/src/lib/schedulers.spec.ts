import { describe, it, expect } from 'vitest';
import { ExecutionStateMachine } from './core/execution-state-machine.js';
import { DropScheduler } from './schedulers/drop-scheduler.js';
import { RestartScheduler } from './schedulers/restart-scheduler.js';
import { EnqueueScheduler } from './schedulers/enqueue-scheduler.js';
import { LatestScheduler } from './schedulers/latest-scheduler.js';
import { ParallelScheduler } from './schedulers/parallel-scheduler.js';
import { PromiseOperationAdapter } from './adapters/promise-adapter.js';
import { createDeferred } from './testing/deferred.js';

describe('Phase 1 Core Engine & Concurrency Schedulers', () => {
  describe('ExecutionStateMachine', () => {
    it('handles successful execution lifecycle', async () => {
      const exec = new ExecutionStateMachine<string, number>('exec-1', 'test-arg');
      expect(exec.status).toBe('created');
      expect(exec.isSettled).toBe(false);

      exec.start();
      expect(exec.status).toBe('running');
      expect(exec.isRunning).toBe(true);

      exec.succeed(42);
      expect(exec.status).toBe('succeeded');
      expect(exec.isSettled).toBe(true);
      expect(exec.result).toBe(42);

      const outcome = await exec.done;
      expect(outcome).toEqual({ type: 'success', value: 42 });
      await expect(exec.resultOrThrow()).resolves.toBe(42);
    });

    it('ignores late resolution after cancellation', async () => {
      const exec = new ExecutionStateMachine<void, string>('exec-2', undefined);
      exec.start();
      exec.cancel('User cancelled');

      expect(exec.status).toBe('cancelled');

      // Attempt late resolution
      const res = exec.succeed('late-value');
      expect(res).toBe(false);
      expect(exec.result).toBeUndefined();

      const outcome = await exec.done;
      expect(outcome).toEqual({ type: 'cancelled', reason: 'User cancelled' });
      await expect(exec.resultOrThrow()).rejects.toThrow('User cancelled');
    });

    it('handles resultOrThrow on dropped/superseded/failed', async () => {
      const execDropped = new ExecutionStateMachine<void, void>('e-drop', undefined);
      execDropped.drop();
      await expect(execDropped.resultOrThrow()).rejects.toThrow('dropped');

      const execSuper = new ExecutionStateMachine<void, void>('e-super', undefined);
      execSuper.start();
      execSuper.supersede();
      await expect(execSuper.resultOrThrow()).rejects.toThrow('superseded');

      const execFail = new ExecutionStateMachine<void, void>('e-fail', undefined);
      execFail.start();
      execFail.fail({
        cause: new Error('Network crash'),
        kind: 'network',
        message: 'Network crash',
        retryable: true,
      });
      await expect(execFail.resultOrThrow()).rejects.toThrow('Network crash');
    });
  });

  describe('PromiseOperationAdapter', () => {
    it('catches synchronous exceptions before promise instantiation', async () => {
      const adapter = new PromiseOperationAdapter<void, string>(() => {
        throw new Error('Sync throw in handler');
      });
      const exec = new ExecutionStateMachine<void, string>('exec-sync-err', undefined);
      exec.start();
      adapter.run(exec);

      const outcome = await exec.done;
      expect(outcome.type).toBe('failure');
      if (outcome.type === 'failure') {
        expect(outcome.error.message).toBe('Sync throw in handler');
      }
    });

    it('passes AbortSignal to handler context', async () => {
      let receivedSignal: AbortSignal | undefined;
      const adapter = new PromiseOperationAdapter<void, string>(async (_, ctx) => {
        receivedSignal = ctx.signal;
        return 'ok';
      });
      const exec = new ExecutionStateMachine<void, string>('exec-sig', undefined);
      exec.start();
      adapter.run(exec);

      await exec.done;
      expect(receivedSignal).toBeDefined();
      expect(receivedSignal?.aborted).toBe(false);
    });
  });

  describe('DropScheduler', () => {
    it('drops invocations when active operation is running', async () => {
      const scheduler = new DropScheduler<number, number>();
      const deferred1 = createDeferred<number>();
      const deferred2 = createDeferred<number>();

      const adapter1 = new PromiseOperationAdapter<number, number>(() => deferred1.promise);
      const adapter2 = new PromiseOperationAdapter<number, number>(() => deferred2.promise);

      const exec1 = new ExecutionStateMachine<number, number>('exec-1', 1);
      const exec2 = new ExecutionStateMachine<number, number>('exec-2', 2);

      scheduler.schedule(exec1, e => adapter1.run(e));
      scheduler.schedule(exec2, e => adapter2.run(e));

      expect(exec1.status).toBe('running');
      expect(exec2.status).toBe('dropped');

      deferred1.resolve(100);
      const outcome1 = await exec1.done;
      const outcome2 = await exec2.done;

      expect(outcome1).toEqual({ type: 'success', value: 100 });
      expect(outcome2).toEqual({ type: 'dropped' });
    });

    it('cancels active execution on cancelAll', async () => {
      const scheduler = new DropScheduler<void, string>();
      const deferred = createDeferred<string>();
      const exec = new ExecutionStateMachine<void, string>('exec-c', undefined);

      scheduler.schedule(exec, e => new PromiseOperationAdapter<void, string>(() => deferred.promise).run(e));
      expect(scheduler.runningCount).toBe(1);

      scheduler.cancelAll('Stop all');
      expect(scheduler.runningCount).toBe(0);
      expect(exec.status).toBe('cancelled');
    });
  });

  describe('RestartScheduler', () => {
    it('supersedes active execution when a new execution starts', async () => {
      const scheduler = new RestartScheduler<string, string>();
      const deferred1 = createDeferred<string>();
      const deferred2 = createDeferred<string>();

      const adapter1 = new PromiseOperationAdapter<string, string>(() => deferred1.promise);
      const adapter2 = new PromiseOperationAdapter<string, string>(() => deferred2.promise);

      const exec1 = new ExecutionStateMachine<string, string>('exec-1', 'first');
      const exec2 = new ExecutionStateMachine<string, string>('exec-2', 'second');

      scheduler.schedule(exec1, e => adapter1.run(e));
      expect(exec1.status).toBe('running');

      scheduler.schedule(exec2, e => adapter2.run(e));
      expect(exec1.status).toBe('superseded');
      expect(exec2.status).toBe('running');

      deferred2.resolve('second-result');
      const outcome1 = await exec1.done;
      const outcome2 = await exec2.done;

      expect(outcome1).toEqual({ type: 'superseded' });
      expect(outcome2).toEqual({ type: 'success', value: 'second-result' });
    });
  });

  describe('EnqueueScheduler', () => {
    it('runs executions sequentially in FIFO order', async () => {
      const scheduler = new EnqueueScheduler<number, number>();
      const deferred1 = createDeferred<number>();
      const deferred2 = createDeferred<number>();

      const adapter1 = new PromiseOperationAdapter<number, number>(() => deferred1.promise);
      const adapter2 = new PromiseOperationAdapter<number, number>(() => deferred2.promise);

      const exec1 = new ExecutionStateMachine<number, number>('exec-1', 1);
      const exec2 = new ExecutionStateMachine<number, number>('exec-2', 2);

      scheduler.schedule(exec1, e => adapter1.run(e));
      scheduler.schedule(exec2, e => adapter2.run(e));

      expect(exec1.status).toBe('running');
      expect(exec2.status).toBe('queued');
      expect(scheduler.queuedCount).toBe(1);

      deferred1.resolve(10);
      await exec1.done;

      expect(exec2.status).toBe('running');
      expect(scheduler.queuedCount).toBe(0);

      deferred2.resolve(20);
      const outcome2 = await exec2.done;
      expect(outcome2).toEqual({ type: 'success', value: 20 });
    });

    it('handles queue overflow with drop-oldest policy', async () => {
      const scheduler = new EnqueueScheduler<number, number>({
        maxQueueSize: 1,
        overflowPolicy: 'drop-oldest',
      });

      const deferred1 = createDeferred<number>();
      const deferred2 = createDeferred<number>();
      const deferred3 = createDeferred<number>();

      const exec1 = new ExecutionStateMachine<number, number>('exec-1', 1);
      const exec2 = new ExecutionStateMachine<number, number>('exec-2', 2);
      const exec3 = new ExecutionStateMachine<number, number>('exec-3', 3);

      scheduler.schedule(exec1, e => new PromiseOperationAdapter<number, number>(() => deferred1.promise).run(e));
      scheduler.schedule(exec2, e => new PromiseOperationAdapter<number, number>(() => deferred2.promise).run(e));
      scheduler.schedule(exec3, e => new PromiseOperationAdapter<number, number>(() => deferred3.promise).run(e));

      expect(exec1.status).toBe('running');
      expect(exec2.status).toBe('superseded');
      expect(exec3.status).toBe('queued');
    });
  });

  describe('LatestScheduler', () => {
    it('completes active execution and runs only newest queued execution', async () => {
      const scheduler = new LatestScheduler<number, number>();
      const deferred1 = createDeferred<number>();
      const deferred2 = createDeferred<number>();
      const deferred3 = createDeferred<number>();

      const exec1 = new ExecutionStateMachine<number, number>('exec-1', 1);
      const exec2 = new ExecutionStateMachine<number, number>('exec-2', 2);
      const exec3 = new ExecutionStateMachine<number, number>('exec-3', 3);

      scheduler.schedule(exec1, e => new PromiseOperationAdapter<number, number>(() => deferred1.promise).run(e));
      scheduler.schedule(exec2, e => new PromiseOperationAdapter<number, number>(() => deferred2.promise).run(e));
      scheduler.schedule(exec3, e => new PromiseOperationAdapter<number, number>(() => deferred3.promise).run(e));

      expect(exec1.status).toBe('running');
      expect(exec2.status).toBe('superseded');
      expect(exec3.status).toBe('queued');

      deferred1.resolve(100);
      await exec1.done;

      expect(exec3.status).toBe('running');
      deferred3.resolve(300);
      const outcome3 = await exec3.done;
      expect(outcome3).toEqual({ type: 'success', value: 300 });
    });
  });

  describe('ParallelScheduler', () => {
    it('executes up to limit simultaneously and queues remaining', async () => {
      const scheduler = new ParallelScheduler<number, number>({ limit: 2 });
      const d1 = createDeferred<number>();
      const d2 = createDeferred<number>();
      const d3 = createDeferred<number>();

      const exec1 = new ExecutionStateMachine<number, number>('exec-1', 1);
      const exec2 = new ExecutionStateMachine<number, number>('exec-2', 2);
      const exec3 = new ExecutionStateMachine<number, number>('exec-3', 3);

      scheduler.schedule(exec1, e => new PromiseOperationAdapter<number, number>(() => d1.promise).run(e));
      scheduler.schedule(exec2, e => new PromiseOperationAdapter<number, number>(() => d2.promise).run(e));
      scheduler.schedule(exec3, e => new PromiseOperationAdapter<number, number>(() => d3.promise).run(e));

      expect(scheduler.runningCount).toBe(2);
      expect(scheduler.queuedCount).toBe(1);
      expect(exec1.status).toBe('running');
      expect(exec2.status).toBe('running');
      expect(exec3.status).toBe('queued');

      d1.resolve(10);
      await exec1.done;

      expect(scheduler.runningCount).toBe(2);
      expect(exec3.status).toBe('running');
    });
  });
});
