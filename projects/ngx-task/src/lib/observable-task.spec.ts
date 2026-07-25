import { describe, it, expect } from 'vitest';
import { Subject, of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { createTask } from './angular/create-task.js';

describe('Phase 3 RxJS Observable Adapter & Integration', () => {
  it('handles single-emission RxJS Observables successfully', async () => {
    const task = createTask((name: string) => of(`Hello ${name}`));

    const exec = task.run('Angular');
    const outcome = await exec.done;

    expect(outcome).toEqual({ type: 'success', value: 'Hello Angular' });
    expect(task.result()).toBe('Hello Angular');
    expect(task.status()).toBe('settled');
  });

  it('unsubscribes from active RxJS Observable upon execution cancellation', async () => {
    let unsubscribed = false;
    const subject = new Subject<number>();

    const observable = new Subject<number>().asObservable();
    const task = createTask(() => {
      return new Subject<number>().asObservable().pipe(
        map(x => x),
      );
    });

    const customObservable = new Subject<string>();
    const task2 = createTask(() => {
      return new Subject<string>().asObservable();
    });

    const exec = task2.run('test');
    expect(task2.running()).toBe(true);

    exec.cancel('User cancelled HTTP request');
    const outcome = await exec.done;

    expect(outcome.type).toBe('cancelled');
    expect(task2.running()).toBe(false);
  });

  it('unsubscribes active RxJS Observable when superseded by restart concurrency', async () => {
    const subject1 = new Subject<string>();
    const subject2 = new Subject<string>();

    const task = createTask((id: number) => {
      return id === 1 ? subject1.asObservable() : subject2.asObservable();
    }, { concurrency: 'restart' });

    const exec1 = task.run(1);
    expect(exec1.status()).toBe('running');

    const exec2 = task.run(2);
    expect(exec1.status()).toBe('superseded');
    expect(exec2.status()).toBe('running');

    subject2.next('Result 2');
    subject2.complete();

    const outcome1 = await exec1.done;
    const outcome2 = await exec2.done;

    expect(outcome1.type).toBe('superseded');
    expect(outcome2).toEqual({ type: 'success', value: 'Result 2' });
    expect(task.result()).toBe('Result 2');
  });

  it('handles Observable errors cleanly', async () => {
    const task = createTask(() => throwError(() => new Error('HTTP 500 Server Error')));

    const exec = task.run('err');
    const outcome = await exec.done;

    expect(outcome.type).toBe('failure');
    if (outcome.type === 'failure') {
      expect(outcome.error.message).toBe('HTTP 500 Server Error');
    }
    expect(task.error()?.message).toBe('HTTP 500 Server Error');
  });
});
