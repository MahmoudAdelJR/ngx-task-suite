import { describe, it, expect } from 'vitest';
import { Injector, DestroyRef } from '@angular/core';
import { createTask } from './angular/create-task.js';
import { createDeferred } from './testing/deferred.js';

class MockDestroyRef {
  private callbacks: (() => void)[] = [];

  onDestroy(callback: () => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx !== -1) this.callbacks.splice(idx, 1);
    };
  }

  destroy(): void {
    for (const cb of this.callbacks) {
      cb();
    }
  }
}

describe('Phase 2 Angular Signals Facade & Lifecycle Integration', () => {
  it('exposes signals and updates them when task is executed', async () => {
    const deferred = createDeferred<string>();
    const task = createTask(async (name: string) => {
      return await deferred.promise + ' ' + name;
    });

    expect(task.status()).toBe('idle');
    expect(task.pending()).toBe(false);
    expect(task.running()).toBe(false);
    expect(task.result()).toBeUndefined();
    expect(task.executionCount()).toBe(0);

    const exec = task.run('world');

    expect(task.status()).toBe('pending');
    expect(task.pending()).toBe(true);
    expect(task.running()).toBe(true);
    expect(task.runningCount()).toBe(1);
    expect(task.executionCount()).toBe(1);
    expect(task.lastExecution()?.id).toBe(exec.id);

    deferred.resolve('Hello');
    const outcome = await exec.done;

    expect(outcome).toEqual({ type: 'success', value: 'Hello world' });
    expect(task.status()).toBe('settled');
    expect(task.pending()).toBe(false);
    expect(task.running()).toBe(false);
    expect(task.result()).toBe('Hello world');
  });

  it('resets task state upon reset()', async () => {
    const task = createTask(async (x: number) => x * 2);
    const exec = task.run(5);
    await exec.done;

    expect(task.result()).toBe(10);
    expect(task.status()).toBe('settled');

    task.reset();

    expect(task.result()).toBeUndefined();
    expect(task.status()).toBe('idle');
  });

  it('retries last execution with retryLast()', async () => {
    let callCount = 0;
    const task = createTask(async (x: number) => {
      callCount++;
      return x + callCount;
    });

    const exec1 = task.run(10);
    await exec1.done;
    expect(task.result()).toBe(11);

    const exec2 = task.retryLast();
    expect(exec2).toBeDefined();
    await exec2?.done;

    expect(task.result()).toBe(12);
    expect(callCount).toBe(2);
  });

  it('cancels active executions when DestroyRef triggers onDestroy', async () => {
    const mockDestroyRef = new MockDestroyRef();
    const mockInjector = {
      get: (token: any, notFoundValue?: any) => {
        if (token === DestroyRef) return mockDestroyRef;
        return notFoundValue;
      },
    } as unknown as Injector;

    const deferred = createDeferred<string>();
    const task = createTask(async () => deferred.promise, {
      injector: mockInjector,
      destroyBehavior: 'cancel',
    });

    const exec = task.run(undefined);
    expect(task.running()).toBe(true);

    mockDestroyRef.destroy();

    expect(task.running()).toBe(false);
    expect(exec.status()).toBe('cancelled');
    const outcome = await exec.done;
    expect(outcome.type).toBe('cancelled');
  });
});
